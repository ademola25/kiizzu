const path = require('path')
const express = require('express')
const { init, pool } = require('./db')
const { signUp, ValidationError } = require('./waitlist')
const { buildCsv } = require('./csv')
const admin = require('./admin')

const app = express()
const PORT = process.env.PORT || 3000

// Express 4 does not catch rejections from async handlers — without this an
// async route that throws leaves the request hanging until the client times
// out, instead of returning a 500.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// The landing page must keep serving even when MySQL is unreachable: the
// deploy sets environment variables *after* the first boot, and a database
// blip should never take the marketing page down with it.
let dbReady = false

// Hostinger fronts the app with a proxy, so req.ip is only meaningful once we
// trust the forwarding header. The rate limiter below depends on it.
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(express.json({ limit: '16kb' }))

// Hostinger fronts the app with a CDN (server: hcdn) that caches by URL. Without
// this, the admin dashboard and the CSV export get served stale — a live signup
// list that silently lags is worse than no list at all. Static assets are
// content-hashed by the build, so they keep their long cache below.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/admin' || req.path.startsWith('/admin/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
  }
  next()
})

// Small in-memory limiter: this is a single-process app on one host, so a Map
// is enough and saves a dependency. Signup is the only writable route.
const hits = new Map()
const WINDOW_MS = Number(process.env.RATE_WINDOW_MS || 10 * 60 * 1000)
// Deliberately generous: mobile carriers put a lot of real users behind one
// NAT address, and the endpoint is idempotent per email, so a low cap blocks
// genuine signups long before it inconveniences an abuser.
const MAX_PER_WINDOW = Number(process.env.RATE_MAX || 30)

function rateLimit(req, res, next) {
  const now = Date.now()
  const key = req.ip || 'unknown'
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS)

  if (recent.length >= MAX_PER_WINDOW) {
    return res.status(429).json({ detail: 'Too many attempts. Please try again shortly.' })
  }

  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k)
  }
  return next()
}

app.post('/api/v1/waitlist/', rateLimit, async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ detail: 'Signups are briefly unavailable. Please try again in a moment.' })
  }
  try {
    const signup = await signUp(req.body || {}, {
      source: String(req.query.source || '').slice(0, 120),
      userAgent: String(req.get('user-agent') || '').slice(0, 500),
    })
    res.status(201).json(signup)
  } catch (err) {
    if (err instanceof ValidationError) {
      // Shape matches DRF's {field: [message]} so the existing React error
      // handler picks it up without a frontend change.
      return res.status(400).json({ [err.field]: [err.message], detail: err.message })
    }
    console.error('waitlist signup failed:', err)
    res.status(500).json({ detail: 'We could not add you right now. Please try again.' })
  }
})

// Operator-only export. Guarded by a shared secret in the environment; if it is
// unset the route stays off rather than defaulting to open.
app.get('/api/v1/waitlist/export', wrap(async (req, res) => {
  const expected = process.env.ADMIN_TOKEN
  if (!expected) return res.status(404).json({ detail: 'Not found.' })
  if (req.query.token !== expected) return res.status(403).json({ detail: 'Forbidden.' })
  res.type('text/csv').attachment('tentzu-waitlist.csv').send(await buildCsv())
}))

app.get('/api/v1/health/', async (_req, res) => {
  try {
    const [[{ signups }]] = await pool.query('SELECT COUNT(*) AS signups FROM waitlist_signup')
    res.json({ status: 'ok', database: 'connected', signups })
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: err.code || 'unavailable' })
  }
})

admin.mount(app)

// Static landing page, then the SPA fallback so /waitlist?ref=CODE resolves.
const PUBLIC_DIR = path.join(__dirname, 'public')
app.use(express.static(PUBLIC_DIR, { maxAge: '1h', index: false }))
app.get(/^\/(?!api\/|admin(\/|$)).*/, (req, res) => {
  // A path with a file extension that reached here is a genuinely missing
  // asset. Serving the SPA shell with a 200 turns every dead link into a soft
  // 404 and hands JSON/XML clients an HTML document instead.
  if (/\.[a-zA-Z0-9]{1,8}$/.test(req.path)) {
    return res.status(404).type('text/plain').send('Not found')
  }
  // No-cache on the shell only: its asset URLs change every build, so a cached
  // index.html would keep pointing at bundles that no longer exist.
  res.set('Cache-Control', 'no-cache, must-revalidate')
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'))
})

// Catch-all so a thrown handler returns JSON/500 rather than an empty socket.
app.use((err, _req, res, _next) => {
  console.error('unhandled error:', err)
  if (res.headersSent) return
  res.status(500).json({ detail: 'Something went wrong.' })
})

async function prepareDatabase(attempt = 1) {
  try {
    await init()
    dbReady = true
    console.log('database ready')
  } catch (err) {
    dbReady = false
    const wait = Math.min(60000, 5000 * attempt)
    console.error(`database not ready (attempt ${attempt}): ${err.code || err.message} — retrying in ${wait / 1000}s`)
    setTimeout(() => prepareDatabase(attempt + 1), wait).unref()
  }
}

// Listen first, connect second: the site answers immediately and the database
// attaches when it can.
app.listen(PORT, () => console.log(`tentzu waitlist listening on ${PORT}`))
prepareDatabase()
