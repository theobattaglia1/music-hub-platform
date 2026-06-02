const DEFAULT_CLIENT_ID =
  "874000025146-0guq8ghng3crr9tucb6105emaarc7uvr.apps.googleusercontent.com";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const PKCE_SESSION_KEY = "music-hub:google-calendar:pkce";
const GOOGLE_SCOPE = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

const base64Url = (buffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const randomString = (length = 64) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
};

const sha256 = async (value) => {
  const data = new TextEncoder().encode(value);
  return window.crypto.subtle.digest("SHA-256", data);
};

const popupFeatures = () => {
  const width = 560;
  const height = 720;
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  return `popup=yes,width=${width},height=${height},left=${left},top=${top}`;
};

export const getGoogleCalendarClientId = () =>
  import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID || DEFAULT_CLIENT_ID;

export const getGoogleCalendarRedirectUri = () =>
  `${window.location.origin}/google-calendar-auth.html`;

const waitForAuthMessage = (expectedState, popup) =>
  new Promise((resolve, reject) => {
    let timeoutId = null;

    const cleanup = () => {
      window.removeEventListener("message", handleMessage);
      window.clearInterval(closePollId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== "music-hub-google-calendar-auth") return;

      cleanup();
      popup?.close();

      if (event.data.state !== expectedState) {
        reject(new Error("Google calendar sign-in state mismatch."));
        return;
      }

      if (event.data.error) {
        reject(new Error(event.data.error_description || event.data.error));
        return;
      }

      if (!event.data.code) {
        reject(new Error("Google calendar sign-in did not return an authorization code."));
        return;
      }

      resolve(event.data.code);
    };

    const closePollId = window.setInterval(() => {
      if (popup && popup.closed) {
        cleanup();
        reject(new Error("Google calendar sign-in was cancelled."));
      }
    }, 350);

    timeoutId = window.setTimeout(() => {
      cleanup();
      popup?.close();
      reject(new Error("Google calendar sign-in timed out."));
    }, 180000);

    window.addEventListener("message", handleMessage);
  });

const encodeBody = (params) => {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      body.set(key, value);
    }
  });
  return body;
};

const exchangeCodeForTokens = async (code, codeVerifier) => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encodeBody({
      client_id: getGoogleCalendarClientId(),
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: getGoogleCalendarRedirectUri(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  const token = await response.json();
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token || "",
    expiresAt: Date.now() + Math.max((token.expires_in || 3600) - 60, 60) * 1000,
    scope: token.scope || GOOGLE_SCOPE,
    tokenType: token.token_type || "Bearer",
  };
};

export const authenticateGoogleCalendar = async () => {
  const state = randomString(48);
  const codeVerifier = randomString(96);
  const codeChallenge = base64Url(await sha256(codeVerifier));

  window.sessionStorage.setItem(
    PKCE_SESSION_KEY,
    JSON.stringify({ state, codeVerifier, createdAt: Date.now() }),
  );

  const authUrl = new URL(AUTH_ENDPOINT);
  authUrl.searchParams.set("client_id", getGoogleCalendarClientId());
  authUrl.searchParams.set("redirect_uri", getGoogleCalendarRedirectUri());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GOOGLE_SCOPE);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  const popup = window.open(authUrl.toString(), "music-hub-google-calendar", popupFeatures());
  if (!popup) {
    throw new Error("Popup blocked. Please allow popups to connect Google Calendar.");
  }

  const code = await waitForAuthMessage(state, popup);
  return exchangeCodeForTokens(code, codeVerifier);
};

export const refreshGoogleCalendarTokens = async (refreshToken) => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encodeBody({
      client_id: getGoogleCalendarClientId(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token refresh failed: ${errorText}`);
  }

  const token = await response.json();
  return {
    accessToken: token.access_token,
    refreshToken,
    expiresAt: Date.now() + Math.max((token.expires_in || 3600) - 60, 60) * 1000,
    scope: token.scope || GOOGLE_SCOPE,
    tokenType: token.token_type || "Bearer",
  };
};

export const ensureGoogleCalendarAccessToken = async (tokens) => {
  if (!tokens?.accessToken) {
    throw new Error("Google Calendar is not connected.");
  }

  if (tokens.expiresAt && tokens.expiresAt > Date.now()) {
    return tokens;
  }

  if (!tokens.refreshToken) {
    throw new Error("Google Calendar token expired and no refresh token is available.");
  }

  return refreshGoogleCalendarTokens(tokens.refreshToken);
};

const requestGoogleCalendar = async (tokens, path, params = {}) => {
  const url = new URL(`${GOOGLE_CALENDAR_API}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Calendar request failed: ${errorText}`);
  }

  return response.json();
};

export const fetchGoogleCalendarList = async (tokens) => {
  const payload = await requestGoogleCalendar(tokens, "/users/me/calendarList", {
    minAccessRole: "reader",
    showDeleted: "false",
    showHidden: "false",
  });

  return Array.isArray(payload.items) ? payload.items : [];
};

const parseGoogleDate = (value) => {
  if (!value) return null;

  if (value.dateTime) {
    const parsed = new Date(value.dateTime);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (value.date) {
    const parsed = new Date(`${value.date}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

export const fetchGoogleCalendarEvents = async (tokens, calendars, { start, end }) => {
  const enabledCalendars = Array.isArray(calendars)
    ? calendars.filter((calendar) => calendar.enabled)
    : [];

  const eventGroups = await Promise.all(
    enabledCalendars.map(async (calendar) => {
      const payload = await requestGoogleCalendar(
        tokens,
        `/calendars/${encodeURIComponent(calendar.id)}/events`,
        {
          singleEvents: "true",
          orderBy: "startTime",
          showDeleted: "false",
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
        },
      );

      const items = Array.isArray(payload.items) ? payload.items : [];
      return items
        .map((event) => {
          const startDate = parseGoogleDate(event.start);
          const endDate = parseGoogleDate(event.end) || startDate;

          if (!startDate || !endDate) return null;

          return {
            id: `google:${calendar.id}:${event.id}`,
            title: event.summary || "Untitled event",
            description: event.description || "",
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            artist_id: calendar.artistId || "",
            source_provider: "google",
            source_label: calendar.summary || "Google Calendar",
            external: true,
            readonly: true,
            raw: event,
          };
        })
        .filter(Boolean);
    }),
  );

  return eventGroups.flat();
};
