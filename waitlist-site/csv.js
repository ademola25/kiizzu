const { pool } = require('./db')

const HEADER = ['position', 'name', 'email', 'phone', 'audience', 'referral_code',
  'referrals', 'referred_by', 'source', 'created_at']

// A phone number: optional +, then digits and formatting characters only.
// Exempted from the formula guard below because a value with no letters cannot
// carry a DDE/HYPERLINK payload, and +971… numbers are the common case here —
// quoting every one of them would put a stray apostrophe in front of the whole
// phone column when the operator opens the file.
const PHONE_LIKE = /^\+?[0-9][0-9 ()\-]*$/

function cell(value) {
  const s = value === null || value === undefined ? '' : String(value)
  // Guard against spreadsheet formula injection: a value beginning =, +, - or @
  // is executed by Excel/Sheets on open, and these come from a public form.
  const risky = /^[=+\-@\t\r]/.test(s) && !PHONE_LIKE.test(s)
  const safe = risky ? `'${s}` : s
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

async function buildCsv() {
  const [rows] = await pool.query(
    `SELECT s.name, s.email, s.phone, s.audience, s.referral_code,
            s.referral_count, r.referral_code AS referred_by, s.source, s.created_at
       FROM waitlist_signup s
       LEFT JOIN waitlist_signup r ON r.id = s.referred_by_id
      ORDER BY s.referral_count DESC, s.created_at ASC`,
  )
  const lines = rows.map((r, i) => [
    i + 1, r.name, r.email, r.phone, r.audience, r.referral_code,
    r.referral_count, r.referred_by, r.source, r.created_at,
  ].map(cell).join(','))
  return [HEADER.join(','), ...lines].join('\n')
}

module.exports = { buildCsv }
