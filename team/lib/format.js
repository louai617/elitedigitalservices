// Display labels and date helpers shared by server and client components.

export const SERVICE_LABELS = {
  PROGRAMMING: "Programming",
  PHOTOGRAPHY: "Photography",
  VIDEOGRAPHY: "Videography",
  DESIGN: "Design",
  BRANDING: "Branding",
  MARKETING: "Marketing",
  OTHER: "Other",
};

export const PROJECT_STATUS = {
  LEAD: { label: "Lead", tone: "slate" },
  PLANNING: { label: "Planning", tone: "blue" },
  IN_PROGRESS: { label: "In progress", tone: "gold" },
  REVIEW: { label: "In review", tone: "violet" },
  DELIVERED: { label: "Delivered", tone: "green" },
  ON_HOLD: { label: "On hold", tone: "red" },
};

export const TASK_STATUS = {
  TODO: { label: "To do", tone: "slate" },
  IN_PROGRESS: { label: "In progress", tone: "gold" },
  REVIEW: { label: "Review", tone: "violet" },
  DONE: { label: "Done", tone: "green" },
};

export const PRIORITY = {
  LOW: { label: "Low", tone: "slate" },
  MEDIUM: { label: "Medium", tone: "blue" },
  HIGH: { label: "High", tone: "gold" },
  URGENT: { label: "Urgent", tone: "red" },
};

export const EVENT_TYPES = {
  MEETING: { label: "Meeting", tone: "blue" },
  SHOOT: { label: "Shoot", tone: "gold" },
  DEADLINE: { label: "Deadline", tone: "red" },
  OTHER: { label: "Other", tone: "slate" },
};

export const EQUIPMENT_CATEGORIES = {
  CAMERA: "Camera",
  LENS: "Lens",
  LIGHTING: "Lighting",
  AUDIO: "Audio",
  DRONE: "Drone",
  GRIP: "Grip & support",
  COMPUTER: "Computer",
  OTHER: "Other",
};

export const FILE_STATUS = {
  DRAFT: { label: "Draft", tone: "slate" },
  IN_REVIEW: { label: "In review", tone: "violet" },
  APPROVED: { label: "Approved", tone: "green" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "red" },
};

export const CLIENT_DECISION = {
  PENDING: { label: "Awaiting client", tone: "gold" },
  APPROVED: { label: "Client approved", tone: "green" },
  CHANGES_REQUESTED: { label: "Client wants changes", tone: "red" },
};

export const LEAVE_TYPES = { ANNUAL: "Annual leave", SICK: "Sick leave", UNPAID: "Unpaid leave", OTHER: "Other" };
export const LEAVE_STATUS = {
  PENDING: { label: "Pending", tone: "gold" },
  APPROVED: { label: "Approved", tone: "green" },
  REJECTED: { label: "Rejected", tone: "red" },
};

// The agency works in Doha time; dates are shown and entered in it.
export const TZ = "Asia/Qatar";

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }) : "—";
export const fmtShort = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: TZ }) : "—";
export const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
export const fmtDateTime = (d) => `${fmtShort(d)}, ${fmtTime(d)}`;
export const fmtHours = (minutes) => {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};
export const fmtBytes = (n) =>
  n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : n < 1073741824 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1073741824).toFixed(2)} GB`;

/** Doha calendar date (YYYY-MM-DD) of an instant. */
export const dohaDay = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });

/** "YYYY-MM-DDTHH:mm" in Doha time, for <input type="datetime-local">. */
export const toLocalInput = (d) => {
  if (!d) return "";
  const s = new Date(d).toLocaleString("sv-SE", { timeZone: TZ });
  return s.slice(0, 16).replace(" ", "T");
};
