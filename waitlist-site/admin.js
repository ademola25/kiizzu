const crypto = require('crypto')
const { pool } = require('./db')
const { buildCsv } = require('./csv')

// Everything rendered below comes from a public form, so every interpolation
// goes through this. Names and emails are attacker-controlled input.
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

function tokenMatches(supplied) {
  const expected = process.env.ADMIN_TOKEN
  if (!expected || !supplied) return false
  const a = Buffer.from(String(supplied))
  const b = Buffer.from(expected)
  // Compare a fixed-size digest so timingSafeEqual never sees mismatched
  // lengths (it throws) and the length itself doesn't leak.
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(a).digest(),
                                crypto.createHash('sha256').update(b).digest())
}

function readCookie(req, name) {
  const raw = req.headers.cookie || ''
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_TOKEN) {
    return res.status(404).send('Not found.')
  }
  if (tokenMatches(readCookie(req, 'tentzu_admin'))) return next()
  return res.status(401).send(loginPage(req.query.bad === '1'))
}

const SHELL = (title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(title)}</title>
<style>
  :root{--bg:#f7f1e8;--ink:#17231b;--green:#263b2d;--line:#dfd4c4;--card:#fffdf9;--muted:#6b6459}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
       font:15px/1.5 ui-sans-serif,-apple-system,"Segoe UI",Roboto,sans-serif}
  .wrap{max-width:1100px;margin:0 auto;padding:32px 20px 64px}
  h1{font-size:26px;margin:0 0 4px;letter-spacing:-.02em}
  .sub{color:var(--muted);margin:0 0 28px}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px}
  .stat b{display:block;font-size:28px;letter-spacing:-.03em}
  .stat span{color:var(--muted);font-size:11px;letter-spacing:.09em;text-transform:uppercase}
  .bar{display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap}
  .btn{display:inline-block;background:var(--green);color:var(--bg);text-decoration:none;
       border:0;border-radius:999px;padding:9px 18px;font-size:14px;font-weight:600;cursor:pointer}
  .btn.ghost{background:transparent;color:var(--green);border:1px solid var(--line)}
  input[type=search],input[type=password]{border:1px solid var(--line);border-radius:10px;
       padding:9px 12px;font-size:14px;background:var(--card);color:var(--ink);min-width:220px}
  .tablewrap{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow-x:auto}
  table{border-collapse:collapse;width:100%;font-size:14px}
  th,td{text-align:left;padding:11px 14px;border-bottom:1px solid var(--line);white-space:nowrap}
  th{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);
     background:#f2ebe0;position:sticky;top:0}
  tr:last-child td{border-bottom:0}
  .pos{color:var(--muted);font-variant-numeric:tabular-nums}
  .pill{font-size:11px;padding:2px 9px;border-radius:999px;background:#e8e0d2;color:var(--green)}
  .pill.gold{background:var(--green);color:var(--bg)}
  .empty{padding:56px 20px;text-align:center;color:var(--muted)}
  .del{padding:4px 12px;font-size:12px;font-weight:500;color:#a2402f;border-color:#e4d3cc}
  td form{margin:0}
  .login{max-width:340px;margin:14vh auto;background:var(--card);border:1px solid var(--line);
         border-radius:16px;padding:26px}
  .err{color:#a2402f;font-size:13px;margin-top:10px}
  a{color:var(--green)}
</style></head><body>${body}</body></html>`

const loginPage = (bad) => SHELL('Tentzu — waitlist admin', `
  <form class="login" method="post" action="/admin/login">
    <h1>Waitlist admin</h1>
    <p class="sub">Enter the admin token to view signups.</p>
    <input type="password" name="token" placeholder="Admin token" autofocus required
           style="width:100%;margin-bottom:12px">
    <button class="btn" type="submit" style="width:100%">Sign in</button>
    ${bad ? '<p class="err">That token was not accepted.</p>' : ''}
  </form>`)

async function dashboard(req, res) {
  const q = String(req.query.q || '').trim().toLowerCase()

  const [rows] = await pool.query(
    `SELECT s.id, s.name, s.email, s.phone, s.audience, s.referral_code,
            s.referral_count, s.source, s.created_at,
            r.referral_code AS referred_by
       FROM waitlist_signup s
       LEFT JOIN waitlist_signup r ON r.id = s.referred_by_id
      ORDER BY s.referral_count DESC, s.created_at ASC`,
  )

  // Founding status is positional, so it has to be decided over the full
  // ranked set before any search filter narrows it.
  const ordered = [...rows].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
  const founding = new Set(ordered.slice(0, 100).map((r) => r.id))

  const shown = q
    ? rows.filter((r) => `${r.name} ${r.email} ${r.phone} ${r.audience}`.toLowerCase().includes(q))
    : rows

  const withPhone = rows.filter((r) => r.phone).length
  const referred = rows.filter((r) => r.referred_by).length

  const stats = [
    ['Signups', rows.length],
    ['Founding slots left', Math.max(0, 100 - rows.length)],
    ['Gave a phone', withPhone],
    ['Came via referral', referred],
  ].map(([label, value]) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`).join('')

  const body = shown.length
    ? shown.map((r, i) => `<tr>
        <td class="pos">${q ? '' : i + 1}</td>
        <td>${esc(r.name)} ${founding.has(r.id) ? '<span class="pill gold">founding</span>' : ''}</td>
        <td><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td>
        <td>${r.phone ? `<a href="https://wa.me/${esc(String(r.phone).replace(/[^0-9]/g, ''))}">${esc(r.phone)}</a>` : '<span class="pos">—</span>'}</td>
        <td><span class="pill">${esc(r.audience)}</span></td>
        <td class="pos">${r.referral_count}</td>
        <td class="pos">${r.referred_by ? esc(r.referred_by) : '—'}</td>
        <td class="pos">${esc(String(r.created_at).slice(0, 16))}</td>
        <td><form method="post" action="/admin/delete" onsubmit="return confirm('Remove ${esc(r.email)} from the waitlist?')">
          <input type="hidden" name="id" value="${r.id}">
          <button class="btn ghost del" type="submit" title="Remove">Remove</button>
        </form></td>
      </tr>`).join('')
    : `<tr><td colspan="9" class="empty">${rows.length ? 'Nothing matches that search.' : 'No signups yet. Share the link and they will appear here.'}</td></tr>`

  res.send(SHELL('Tentzu — waitlist admin', `<div class="wrap">
    <h1>Waitlist</h1>
    <p class="sub">Ranked by referrals, then by who signed up first.</p>
    <div class="stats">${stats}</div>
    <div class="bar">
      <form method="get" style="display:flex;gap:8px">
        <input type="search" name="q" value="${esc(q)}" placeholder="Search name, email, phone…">
        <button class="btn ghost" type="submit">Search</button>
      </form>
      <a class="btn" href="/admin/export.csv">Download CSV</a>
      <form method="post" action="/admin/logout"><button class="btn ghost" type="submit">Sign out</button></form>
    </div>
    <div class="tablewrap"><table>
      <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>I am a</th>
        <th>Refs</th><th>Via</th><th>Joined</th><th></th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>
  </div>`))
}

// Same reason as in server.js: an async handler that rejects must not leave
// the request hanging.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

function mount(app) {
  app.post('/admin/login', require('express').urlencoded({ extended: false }), (req, res) => {
    if (!process.env.ADMIN_TOKEN) return res.status(404).send('Not found.')
    if (!tokenMatches(req.body.token)) return res.redirect('/admin?bad=1')
    res.cookie('tentzu_admin', process.env.ADMIN_TOKEN, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.protocol === 'https' || req.get('x-forwarded-proto') === 'https',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    res.redirect('/admin')
  })

  app.post('/admin/logout', (req, res) => {
    res.clearCookie('tentzu_admin')
    res.redirect('/admin')
  })

  // Removing a signup is an operator necessity, not a nice-to-have: public
  // forms attract spam, and someone who asks to be taken off the list has to
  // be removable. POST + admin cookie so it can't be triggered by a link.
  app.post('/admin/delete', requireAdmin, require('express').urlencoded({ extended: false }),
    wrap(async (req, res) => {
      const id = Number(req.body.id)
      if (!Number.isInteger(id) || id <= 0) return res.redirect('/admin')
      const conn = await pool.getConnection()
      try {
        await conn.beginTransaction()
        const [[row]] = await conn.query(
          'SELECT referred_by_id FROM waitlist_signup WHERE id = ?', [id],
        )
        if (row) {
          // Give the referrer their count back, otherwise deleting a referred
          // signup leaves the referrer permanently ranked above where they earned.
          if (row.referred_by_id) {
            await conn.query(
              `UPDATE waitlist_signup SET referral_count = GREATEST(referral_count - 1, 0)
               WHERE id = ?`, [row.referred_by_id],
            )
          }
          await conn.query('DELETE FROM waitlist_signup WHERE id = ?', [id])
        }
        await conn.commit()
      } catch (err) {
        await conn.rollback()
        throw err
      } finally {
        conn.release()
      }
      res.redirect('/admin')
    }))

  app.get('/admin', requireAdmin, wrap(dashboard))

  // Connection diagnostics. Admin-gated because the MySQL error text names the
  // user and host it tried, which is exactly what makes it useful and exactly
  // why it must not be public. Never reports the password itself.
  app.get('/admin/diag', requireAdmin, wrap(async (_req, res) => {
    const { config } = require('./db')
    const out = {
      db_host: config.host,
      db_port: config.port,
      db_user: config.user,
      db_name: config.database,
      db_password_length: (config.password || '').length,
      node_version: process.version,
    }
    try {
      const [[r]] = await pool.query('SELECT CURRENT_USER() AS who, DATABASE() AS db')
      out.connected = true
      out.current_user = r.who
      out.current_db = r.db
    } catch (err) {
      out.connected = false
      out.error_code = err.code
      out.error_message = err.sqlMessage || err.message
    }
    res.type('application/json').send(JSON.stringify(out, null, 2))
  }))
  // Served directly rather than redirected to the token-in-query export route,
  // so the admin token never lands in browser history or a Referer header.
  app.get('/admin/export.csv', requireAdmin, wrap(async (_req, res) => {
    res.type('text/csv').attachment('tentzu-waitlist.csv').send(await buildCsv())
  }))
}

module.exports = { mount }
