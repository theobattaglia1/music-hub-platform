const STORAGE_PREFIX = "music-hub:calendar-connections:v1:";

const clone = (value) => JSON.parse(JSON.stringify(value));

export const createDefaultCalendarConnections = () => ({
  google: {
    connected: false,
    tokens: null,
    calendars: [],
    lastSyncedAt: "",
  },
  apple: {
    feeds: [],
  },
  ui: {
    sourceFilters: {
      google: true,
      apple: true,
    },
  },
});

const storageKeyForUser = (userId = "anonymous") => `${STORAGE_PREFIX}${userId}`;

export const loadCalendarConnections = (userId = "anonymous") => {
  if (typeof window === "undefined" || !window.localStorage) {
    return createDefaultCalendarConnections();
  }

  try {
    const raw = window.localStorage.getItem(storageKeyForUser(userId));
    if (!raw) return createDefaultCalendarConnections();

    const parsed = JSON.parse(raw);
    return {
      ...createDefaultCalendarConnections(),
      ...parsed,
      google: {
        ...createDefaultCalendarConnections().google,
        ...parsed?.google,
        calendars: Array.isArray(parsed?.google?.calendars) ? parsed.google.calendars : [],
      },
      apple: {
        ...createDefaultCalendarConnections().apple,
        ...parsed?.apple,
        feeds: Array.isArray(parsed?.apple?.feeds) ? parsed.apple.feeds : [],
      },
      ui: {
        ...createDefaultCalendarConnections().ui,
        ...parsed?.ui,
        sourceFilters: {
          ...createDefaultCalendarConnections().ui.sourceFilters,
          ...parsed?.ui?.sourceFilters,
        },
      },
    };
  } catch {
    return createDefaultCalendarConnections();
  }
};

export const saveCalendarConnections = (userId = "anonymous", state) => {
  const payload = {
    ...createDefaultCalendarConnections(),
    ...state,
    google: {
      ...createDefaultCalendarConnections().google,
      ...state?.google,
      calendars: Array.isArray(state?.google?.calendars) ? state.google.calendars : [],
    },
    apple: {
      ...createDefaultCalendarConnections().apple,
      ...state?.apple,
      feeds: Array.isArray(state?.apple?.feeds) ? state.apple.feeds : [],
    },
    ui: {
      ...createDefaultCalendarConnections().ui,
      ...state?.ui,
      sourceFilters: {
        ...createDefaultCalendarConnections().ui.sourceFilters,
        ...state?.ui?.sourceFilters,
      },
    },
  };

  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(storageKeyForUser(userId), JSON.stringify(payload));
  }

  return clone(payload);
};

export const clearGoogleCalendarConnection = (userId = "anonymous") => {
  const state = loadCalendarConnections(userId);
  state.google = createDefaultCalendarConnections().google;
  return saveCalendarConnections(userId, state);
};
