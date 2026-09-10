export class CalendarConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "CalendarConfigurationError";
  }
}

function requiredText(value, name) {
  if (typeof value !== "string" || !value.trim() || /\[[^\]]+\]/.test(value)) {
    throw new CalendarConfigurationError(`Set a confirmed ${name} in wedding-config.js.`);
  }
  return value.trim();
}

export function parseEventDate(value, name) {
  const text = requiredText(value, name);
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|([+-])(\d{2}):(\d{2}))$/.exec(text);
  if (!parts) {
    throw new CalendarConfigurationError(`${name} must include seconds and a UTC offset, e.g. YYYY-MM-DDTHH:mm:ss+03:00.`);
  }
  const [, year, month, day, hour, minute, second, offset, , offsetHour, offsetMinute] = parts;
  const localDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  const date = new Date(text);
  if (
    !Number.isFinite(date.getTime()) ||
    !Number.isFinite(localDate.getTime()) ||
    localDate.toISOString().slice(0, 19) !== text.slice(0, 19) ||
    (offset !== "Z" && (Number(offsetHour) > 14 || Number(offsetMinute) > 59 ||
      (Number(offsetHour) === 14 && Number(offsetMinute) !== 0)))
  ) {
    throw new CalendarConfigurationError(`${name} is not a valid date and time.`);
  }
  return date;
}

export function createCalendarEvent(config) {
  const title = requiredText(config.title, "event title");
  const location = requiredText(config.location, "wedding venue");
  const start = parseEventDate(config.start, "start date/time");
  const end = config.end === "" || config.end === undefined ? null : parseEventDate(config.end, "end date/time");
  if (end && end <= start) {
    throw new CalendarConfigurationError("The wedding end must be after the start (use the next date if it ends after midnight).");
  }
  const timeZone = validateTimeZone(config.timeZone);
  if (config.description !== undefined && typeof config.description !== "string") {
    throw new CalendarConfigurationError("The optional wedding message must be text.");
  }
  return { title, location, start, end, timeZone, description: config.description || "" };
}

export function validateTimeZone(value) {
  const timeZone = requiredText(value, "IANA timezone");
  try {
    new Intl.DateTimeFormat("en", { timeZone });
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    throw new CalendarConfigurationError(`Unknown timezone: ${timeZone}.`);
  }
  return timeZone;
}

function utcStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeText(value) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function foldLine(line) {
  // RFC 5545 limits content lines to 75 UTF-8 octets, not 75 characters.
  const encoder = new TextEncoder();
  let result = "";
  let octets = 0;
  for (const character of line) {
    const length = encoder.encode(character).length;
    if (octets + length > 75) {
      result += "\r\n ";
      octets = 1;
    }
    result += character;
    octets += length;
  }
  return result;
}

export function createIcs(event, now = new Date()) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Amel and Amer//Wedding Invitation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:amel-amer-wedding-20261004@wedding-invitation.local",
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(event.start)}`,
    ...(event.end ? [`DTEND:${utcStamp(event.end)}`] : []),
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(event.location)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
