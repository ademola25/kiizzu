const crypto = require('crypto')
const { pool } = require('./db')

// Same unambiguous alphabet as the Django model: no I/L/O/0/1, because people
// read these codes off a screen and type them back in.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8

const AUDIENCES = new Set([
  'tenant', 'expat', 'family', 'first_time_renter', 'property_manager', 'other',
])

const FOUNDING_MEMBER_CUTOFF = 100

function makeReferralCode() {
  // rejection-free: crypto.randomInt is uniform over [0, n), so no modulo bias
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]
  }
  return code
}

function nowUtc() {
  // DATETIME(6) literal in UTC, microseconds padded from JS millisecond precision.
  return new Date().toISOString().replace('T', ' ').replace('Z', '') + '000'
}

class ValidationError extends Error {
  constructor(field, message) {
    super(message)
    this.field = field
  }
}

function cleanInput(body) {
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const phone = String(body.phone ?? '').trim()
  const audience = String(body.audience ?? 'tenant').trim()
  const referral = String(body.referral ?? '').trim().toUpperCase()

  if (!name) throw new ValidationError('name', 'Please tell us your name.')
  if (name.length > 120) throw new ValidationError('name', 'That name is too long.')
  if (!email) throw new ValidationError('email', 'Please enter your email address.')
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError('email', 'Enter a valid email address.')
  }
  // Phone is optional, but if given it must be E.164 — the admin list turns it
  // into a wa.me link, and a local-format number produces a link that silently
  // dials nobody. Shape only: per-country length rules vary by carrier and
  // change over time, and guessing wrong locks real users out.
  if (phone && !/^\+[1-9]\d{7,14}$/.test(phone.replace(/[\s\-().]/g, ''))) {
    throw new ValidationError('phone', 'Enter a phone number including its country code, e.g. +971 50 123 4567.')
  }
  if (phone.length > 32) throw new ValidationError('phone', 'That phone number is too long.')
  if (!AUDIENCES.has(audience)) throw new ValidationError('audience', 'Pick one of the listed options.')

  return { name, email, phone: phone.replace(/[\s\-().]/g, ''), audience, referral }
}

// Position mirrors the Django ordering: most referrals first, earliest signup
// breaking ties. Computed on read rather than stored, so it stays correct as
// other people's referral counts move.
async function describe(conn, row) {
  const [[{ better }]] = await conn.query(
    'SELECT COUNT(*) AS better FROM waitlist_signup WHERE referral_count > ?',
    [row.referral_count],
  )
  const [[{ earlier }]] = await conn.query(
    'SELECT COUNT(*) AS earlier FROM waitlist_signup WHERE referral_count = ? AND created_at < ?',
    [row.referral_count, row.created_at],
  )
  const [[{ ahead }]] = await conn.query(
    'SELECT COUNT(*) AS ahead FROM waitlist_signup WHERE created_at <= ?',
    [row.created_at],
  )

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    audience: row.audience,
    referral_code: row.referral_code,
    position: better + earlier + 1,
    referrals: row.referral_count,
    founding_member: ahead <= FOUNDING_MEMBER_CUTOFF,
    created_at: row.created_at,
  }
}

async function signUp(body, meta) {
  const { name, email, phone, audience, referral } = cleanInput(body)
  const conn = await pool.getConnection()

  try {
    const [existing] = await conn.query('SELECT * FROM waitlist_signup WHERE email = ?', [email])

    if (existing.length) {
      // Idempotent by email, matching the Django get_or_create: a repeat submit
      // refreshes the details and returns the original place in line rather
      // than erroring or pushing the person to the back.
      const row = existing[0]
      const changed = {}
      if (name && name !== row.name) changed.name = name
      if (phone && phone !== row.phone) changed.phone = phone
      if (audience && audience !== row.audience) changed.audience = audience

      if (Object.keys(changed).length) {
        const sets = Object.keys(changed).map((k) => `${k} = ?`).join(', ')
        await conn.query(
          `UPDATE waitlist_signup SET ${sets}, updated_at = ? WHERE id = ?`,
          [...Object.values(changed), nowUtc(), row.id],
        )
        Object.assign(row, changed)
      }
      return describe(conn, row)
    }

    // Retry only on referral_code collisions; a duplicate email means someone
    // signed up between our SELECT and this INSERT, so re-read and return theirs.
    let inserted = null
    for (let attempt = 0; attempt < 5 && !inserted; attempt += 1) {
      const stamp = nowUtc()
      try {
        const [result] = await conn.query(
          `INSERT INTO waitlist_signup
             (name, email, phone, audience, referral_code, source, user_agent, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, email, phone, audience, makeReferralCode(), meta.source, meta.userAgent, stamp, stamp],
        )
        inserted = result.insertId
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') throw err
        if (err.message.includes('uniq_waitlist_email')) {
          const [[row]] = await conn.query('SELECT * FROM waitlist_signup WHERE email = ?', [email])
          return describe(conn, row)
        }
        // else: referral_code clash — loop and draw a new one
      }
    }
    if (!inserted) throw new Error('Could not allocate a referral code')

    if (referral) {
      const [referrers] = await conn.query(
        'SELECT id FROM waitlist_signup WHERE referral_code = ? AND id <> ?',
        [referral, inserted],
      )
      if (referrers.length) {
        await conn.query(
          'UPDATE waitlist_signup SET referred_by_id = ?, updated_at = ? WHERE id = ?',
          [referrers[0].id, nowUtc(), inserted],
        )
        await conn.query(
          'UPDATE waitlist_signup SET referral_count = referral_count + 1, updated_at = ? WHERE id = ?',
          [nowUtc(), referrers[0].id],
        )
      }
    }

    const [[row]] = await conn.query('SELECT * FROM waitlist_signup WHERE id = ?', [inserted])
    return describe(conn, row)
  } finally {
    conn.release()
  }
}

module.exports = { signUp, ValidationError, describe }
