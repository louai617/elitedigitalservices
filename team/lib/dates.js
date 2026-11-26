// Parsing form input. Qatar is UTC+3 with no daylight saving, so a fixed
// offset is exact.
const OFFSET = "+03:00";

/** "YYYY-MM-DDTHH:mm" entered in Doha time → Date. */
export const parseLocalDateTime = (s) => (s ? new Date(`${s}:00${OFFSET}`) : null);

/** "YYYY-MM-DD" → Date at UTC midnight (for @db.Date columns). */
export const parseDay = (s) => (s ? new Date(`${s}T00:00:00Z`) : null);

/** "YYYY-MM-DD" → the instant that day starts in Doha. */
export const dohaDayStart = (s) => new Date(`${s}T00:00:00${OFFSET}`);
