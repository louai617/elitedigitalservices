/**
 * Server-side validation for lead submissions.
 *
 * The browser does its own checks for UX, but this is the boundary that
 * actually decides what reaches Telegram — never trust the client copy.
 */

const MAX = { name: 120, company: 160, email: 200, phone: 40, service: 80, address: 300, message: 4000 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Digits, spaces and the usual separators; 7–20 digits once stripped. */
const PHONE_RE = /^[+]?[\d\s().-]{7,25}$/;

const ALLOWED_SERVICES = [
  'Web Development',
  'Mobile App Development',
  'Design & Branding',
  'Video Production',
  'Web3 & Blockchain',
  'Automation & Tools',
  'Social Media Management',
  'Paid Advertising',
  'SEO & Lead Generation',
  'Consultation',
  'Other',
];

function clean(value, max) {
  if (typeof value !== 'string') return '';
  // Strip control characters, collapse runaway whitespace, then bound length.
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * @returns {{ok: true, lead: object} | {ok: false, errors: Record<string,string>}}
 */
export function validateLead(input) {
  const raw = input && typeof input === 'object' ? input : {};
  const errors = {};

  const type = raw.type === 'company' ? 'company' : 'individual';

  const name = clean(raw.name, MAX.name);
  const company = clean(raw.company, MAX.company);
  const email = clean(raw.email, MAX.email).toLowerCase();
  const phone = clean(raw.phone, MAX.phone);
  const service = clean(raw.service, MAX.service);
  const address = clean(raw.address, MAX.address);
  const message = clean(raw.message, MAX.message);

  // An individual must give a name; a company must give a company name.
  if (type === 'individual') {
    if (name.length < 2) errors.name = 'Please enter your name.';
  } else if (company.length < 2) {
    errors.company = 'Please enter your company name.';
  }

  if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';
  if (!PHONE_RE.test(phone) || (phone.match(/\d/g) || []).length < 7) {
    errors.phone = 'Please enter a valid phone number.';
  }
  if (message.length < 10) errors.message = 'Please tell us a little more (at least 10 characters).';
  if (service && !ALLOWED_SERVICES.includes(service)) errors.service = 'Please choose a listed service.';

  // Honeypot: a real user never fills a hidden field.
  if (clean(raw.website, 100)) return { ok: false, errors: { message: 'Submission rejected.' }, spam: true };

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    lead: { type, name, company, email, phone, service, address, message },
  };
}

export { ALLOWED_SERVICES };
