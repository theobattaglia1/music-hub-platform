const unfoldIcsLines = (text) =>
  text
    .replace(/\r\n/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split("\n")
    .map((line) => line.trimEnd());

const parseIcsDate = (rawValue) => {
  if (!rawValue) return null;

  if (/^\d{8}$/.test(rawValue)) {
    const year = Number(rawValue.slice(0, 4));
    const month = Number(rawValue.slice(4, 6)) - 1;
    const day = Number(rawValue.slice(6, 8));
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  if (/^\d{8}T\d{6}Z$/.test(rawValue)) {
    const normalized = `${rawValue.slice(0, 4)}-${rawValue.slice(4, 6)}-${rawValue.slice(6, 8)}T${rawValue.slice(9, 11)}:${rawValue.slice(11, 13)}:${rawValue.slice(13, 15)}Z`;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{8}T\d{6}$/.test(rawValue)) {
    const normalized = `${rawValue.slice(0, 4)}-${rawValue.slice(4, 6)}-${rawValue.slice(6, 8)}T${rawValue.slice(9, 11)}:${rawValue.slice(11, 13)}:${rawValue.slice(13, 15)}`;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(rawValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseIcsCalendar = (text) => {
  const lines = unfoldIcsLines(text);
  const events = [];
  let currentEvent = null;
  let calendarName = "";

  for (const line of lines) {
    if (!line) continue;

    if (line === "BEGIN:VEVENT") {
      currentEvent = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (currentEvent) {
        events.push(currentEvent);
      }
      currentEvent = null;
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) continue;

    const descriptor = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    const [key] = descriptor.split(";");

    if (key === "X-WR-CALNAME") {
      calendarName = value || calendarName;
    }

    if (!currentEvent) continue;

    currentEvent[key] = value;
  }

  return { calendarName, events };
};

export const normalizeIcsFeedUrl = (value) => {
  const trimmed = String(value || "").trim();
  if (trimmed.startsWith("webcal://")) {
    return `https://${trimmed.slice("webcal://".length)}`;
  }
  return trimmed;
};

export const fetchIcsFeedPreview = async (rawUrl) => {
  const url = normalizeIcsFeedUrl(rawUrl);
  if (!url) throw new Error("Paste an iCloud or ICS feed URL first.");

  const response = await fetch(url, {
    method: "GET",
    mode: "cors",
    headers: {
      Accept: "text/calendar,text/plain;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Calendar feed request failed with status ${response.status}.`);
  }

  const text = await response.text();
  const parsed = parseIcsCalendar(text);
  return {
    url,
    calendarName: parsed.calendarName || "",
    eventCount: parsed.events.length,
  };
};

export const fetchIcsFeedEvents = async (feed, { start, end }) => {
  const url = normalizeIcsFeedUrl(feed.url);
  if (!url) return [];

  const response = await fetch(url, {
    method: "GET",
    mode: "cors",
    headers: {
      Accept: "text/calendar,text/plain;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Calendar feed request failed with status ${response.status}.`);
  }

  const text = await response.text();
  const parsed = parseIcsCalendar(text);

  return parsed.events
    .map((event) => {
      const startDate = parseIcsDate(event.DTSTART);
      const endDate = parseIcsDate(event.DTEND) || startDate;
      if (!startDate || !endDate) return null;

      if (startDate >= end || endDate < start) return null;

      return {
        id: `ics:${feed.id}:${event.UID || event.SUMMARY || startDate.toISOString()}`,
        title: event.SUMMARY || feed.label || parsed.calendarName || "Calendar event",
        description: event.DESCRIPTION || "",
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        artist_id: feed.artistId || "",
        source_provider: "icloud",
        source_label: feed.label || parsed.calendarName || "iCloud Calendar",
        external: true,
        readonly: true,
        raw: event,
      };
    })
    .filter(Boolean);
};
