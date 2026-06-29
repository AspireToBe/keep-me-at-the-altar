// src/App.jsx
// Keep Me At The Altar — full React + Supabase app
import { useState, useEffect, useCallback, useRef } from 'react'
import FoundationGuide from './components/FoundationGuide'
import {
  supabase,
  sendMagicLink, signOut, onAuthChange, getCurrentUser,
  getProfile, updateProfile,
  incrementDownloads, incrementAltarDays, getPlatformStats, setFastStatus,
  getAltarEntry, saveAltarEntry,
  getMonthlyReflection, saveMonthlyReflection,
  getTestimonies, submitTestimony, updateTestimonyStatus, getPendingTestimonies,
  getUserReactions, toggleReaction,
  getComments, addComment,
} from './lib/supabase'

// ── Replace with your own Supabase user UUID ──────────────────
// Supabase Dashboard > Authentication > Users > copy your UUID
const ADMIN_USER_ID = 'YOUR_ADMIN_USER_ID'

const MONTHS = [
  { m: 'January',   theme: 'New Year Consecration',        fast: 'Daniel Fast — 14 days',        verse: 'Isaiah 43:19',         anchor: true  },
  { m: 'February',  theme: 'Love & Devotion',              fast: 'Daily Intermittent Fast',       verse: 'Song of Solomon 2:4',  anchor: false },
  { m: 'March',     theme: 'Lent — Desert Season',         fast: 'Normal Fast 3×/week',           verse: 'Psalm 51:10',          anchor: false },
  { m: 'April',     theme: 'Easter — Resurrection',        fast: 'Total Fast + Intermittent',     verse: '1 Corinthians 15:55',  anchor: false },
  { m: 'May',       theme: 'Pentecost — Holy Spirit',      fast: 'Corporate + Media Fast',        verse: 'Acts 2:1–4',           anchor: false },
  { m: 'June',      theme: 'Kingdom Harvest',              fast: 'Partial Fast 3×/week',          verse: 'Matthew 9:37–38',      anchor: false },
  { m: 'July',      theme: 'Midpoint Consecration',        fast: '7-Day Daniel Fast',             verse: 'Habakkuk 2:3',         anchor: true  },
  { m: 'August',    theme: 'Sabbath Rest & Renewal',       fast: 'Sensory / Media Fast',          verse: 'Psalm 46:10',          anchor: false },
  { m: 'September', theme: 'Wisdom & Learning',            fast: 'Intermittent 3×/week',          verse: 'Proverbs 9:10',        anchor: false },
  { m: 'October',   theme: 'Spiritual Warfare',            fast: 'Normal Fast 3×/week',           verse: 'Ephesians 6:12',       anchor: false },
  { m: 'November',  theme: 'Gratitude & Generosity',       fast: 'Partial + Generosity Fast',     verse: 'Isaiah 58:7',          anchor: false },
  { m: 'December',  theme: 'Advent — Endings & Eternity',  fast: 'Advent Fast — 4 Sundays',       verse: 'Isaiah 9:6',           anchor: true  },
]

const FEELINGS  = ['Peaceful', 'Convicted', 'Renewed', 'Expectant', 'Surrendered', 'On Fire']
const TEMPS     = ['Cold', 'Warming', 'Steady', 'Hot', 'On Fire']
const CATEGORIES = ['breakthrough', 'healing', 'provision', 'direction', 'restoration', 'other']

// ── Small reusable components ──────────────────────────────────

function Toast({ message }) {
  if (!message) return null
  return (
    <div style={{
      position: 'fixed', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)',
      background: '#1C1410', color: '#C9A84C', padding: '0.55rem 1.25rem',
      borderRadius: '2px', fontSize: '0.8rem', zIndex: 500, whiteSpace: 'nowrap',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {message}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#8B7355', fontSize: '0.85rem' }}>
      Loading...
    </div>
  )
}

// ── AUTH GATE ──────────────────────────────────────────────────

function AuthModal({ onClose }) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  async function handleSend() {
    if (!name.trim() || !email.trim()) { setErr('Please fill in both fields.'); return }
    setLoading(true)
    try {
      await sendMagicLink(email.trim(), name.trim())
      setSent(true)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,20,16,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '3px', width: '100%', maxWidth: '420px', padding: '2rem', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#8B7355' }}>✕</button>
        {sent ? (
          <>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.4rem', marginBottom: '0.75rem', color: '#1C1410' }}>Check your email</h2>
            <p style={{ fontSize: '0.85rem', color: '#6B5540', lineHeight: 1.7 }}>
              We've sent a magic link to <strong>{email}</strong>. Click the link to sign in — no password needed.
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.4rem', marginBottom: '0.25rem', color: '#1C1410' }}>Join the community</h2>
            <p style={{ fontSize: '0.78rem', color: '#8B7355', marginBottom: '1.25rem' }}>No password — we'll email you a magic sign-in link.</p>
            <label style={labelStyle}>Your name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Grace Mensah" style={inputStyle} />
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="grace@example.com" style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleSend()} />
            {err && <p style={{ fontSize: '0.75rem', color: '#A32D2D', marginBottom: '0.75rem' }}>{err}</p>}
            <button onClick={handleSend} disabled={loading} style={goldBtnStyle}>
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── MONTH CHOOSER ──────────────────────────────────────────────

function MonthChooser({ selectedMonths, onToggle, onDownload }) {
  const count = selectedMonths.length
  return (
    <section style={{ padding: '2.5rem 1.5rem', maxWidth: '860px', margin: '0 auto' }}>
      <p style={eyebrowStyle}>Your fasting year</p>
      <h2 style={secTitleStyle}>Choose your months</h2>
      <p style={secBodyStyle}>
        January, July, and December are your anchor months — always included. Select any additional months the Spirit is leading you to fast this year.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.6rem', marginTop: '1.25rem' }}>
        {MONTHS.map(m => {
          const selected = selectedMonths.includes(m.m)
          return (
            <div
              key={m.m}
              onClick={() => !m.anchor && onToggle(m.m)}
              style={{
                background: selected ? 'rgba(201,168,76,0.08)' : '#fff',
                border: selected ? '1px solid #C9A84C' : '1px solid #D4C4A8',
                borderLeft: m.anchor ? '3px solid #C9A84C' : (selected ? '1px solid #C9A84C' : '1px solid #D4C4A8'),
                borderRadius: '3px', padding: '1rem',
                cursor: m.anchor ? 'default' : 'pointer',
                transition: 'all 0.15s', position: 'relative',
              }}
            >
              {m.anchor && <span style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', width: '5px', height: '5px', borderRadius: '50%', background: '#C9A84C', display: 'block' }} />}
              <div style={{ fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8B6E2A', marginBottom: '0.35rem' }}>{m.m}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.95rem', color: '#1C1410', marginBottom: '0.25rem', lineHeight: 1.3 }}>{m.theme}</div>
              <div style={{ fontSize: '0.72rem', color: '#8B7355' }}>{m.fast}</div>
              <div style={{ fontSize: '0.68rem', color: '#8B7355', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', Georgia, serif", marginTop: '0.3rem' }}>{m.verse}</div>
              {m.anchor && <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.62rem', color: '#8B6E2A' }}>Anchor month — always included</span>}
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: '0.78rem', color: '#6B5540', marginTop: '1rem' }}>
        {count} month{count !== 1 ? 's' : ''} selected — {count} journal sections included
      </p>
      <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={onDownload} style={goldBtnStyle}>Download my personalised journal</button>
        <span style={{ fontSize: '0.75rem', color: '#8B7355' }}>PDF · Free · All 12 months included</span>
      </div>
    </section>
  )
}

// ── ALTAR DAY JOURNAL ──────────────────────────────────────────

function AltarDay({ user }) {
  const [month,   setMonth]   = useState('January')
  const [week,    setWeek]    = useState(1)
  const [entry,   setEntry]   = useState({})
  const [refl,    setRefl]    = useState({})
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const saveTimer = useRef(null)

  // Load entry when month/week changes
  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      getAltarEntry(user.id, month, week),
      getMonthlyReflection(user.id, month),
    ]).then(([altarData, reflData]) => {
      setEntry(altarData || {})
      setRefl(reflData  || {})
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [user, month, week])

  // Auto-save altar entry after 1.5s of inactivity
  function handleAltarChange(field, value) {
    const updated = { ...entry, [field]: value }
    setEntry(updated)
    setSaved(false)
    clearTimeout(saveTimer.current)
    if (!user) return
    saveTimer.current = setTimeout(async () => {
      try {
        await saveAltarEntry(user.id, month, week, {
          morning:   updated.morning,
          midday:    updated.midday,
          evening:   updated.evening,
          one_word:  updated.one_word,
          feeling:   updated.feeling,
        })
        setSaved(true)
      } catch (e) { console.error(e) }
    }, 1500)
  }

  // Auto-save reflection
  function handleReflChange(field, value) {
    const updated = { ...refl, [field]: value }
    setRefl(updated)
    if (!user) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await saveMonthlyReflection(user.id, month, {
          what_changed:            updated.what_changed,
          clearest_thing_god_said: updated.clearest_thing_god_said,
          prayer_answered:         updated.prayer_answered,
          still_in_progress:       updated.still_in_progress,
          carry_forward:           updated.carry_forward,
          spiritual_temperature:   updated.spiritual_temperature,
        })
      } catch (e) { console.error(e) }
    }, 1500)
  }

  const ta = (id, field, placeholder, rows = 3) => (
    <textarea
      key={`${month}-${week}-${field}`}
      defaultValue={entry[field] || ''}
      onBlur={e => handleAltarChange(field, e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ width: '100%', border: '1px solid #D4C4A8', borderRadius: '2px', padding: '0.6rem 0.75rem', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.95rem', color: '#1C1410', background: '#F7F3EC', outline: 'none', resize: 'none' }}
    />
  )

  const rtarea = (field, label, placeholder) => (
    <div style={{ marginBottom: '1rem' }} key={field}>
      <label style={{ display: 'block', fontSize: '0.72rem', color: '#8B6E2A', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>{label}</label>
      <textarea
        key={`${month}-${field}`}
        defaultValue={refl[field] || ''}
        onBlur={e => handleReflChange(field, e.target.value)}
        placeholder={placeholder}
        rows={2}
        style={{ width: '100%', border: '1px solid #D4C4A8', borderRadius: '2px', padding: '0.5rem 0.7rem', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.9rem', color: '#1C1410', background: '#F7F3EC', outline: 'none', resize: 'none' }}
      />
    </div>
  )

  return (
    <div style={{ background: '#EDE6D8', borderTop: '1px solid #D4C4A8', borderBottom: '1px solid #D4C4A8', padding: '2.5rem 1.5rem' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <p style={eyebrowStyle}>Weekly practice · Every Saturday</p>
        <h2 style={secTitleStyle}>Your Saturday Altar Day</h2>
        <p style={secBodyStyle}>One day each week set apart — not just to fast, but to return. Bring your week to God before it takes you somewhere you did not intend to go.</p>

        {!user && (
          <div style={{ background: '#fff', border: '1px solid #D4C4A8', borderRadius: '3px', padding: '1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#6B5540' }}>
            Sign in to save your altar day entries across devices.
          </div>
        )}

        {/* ALTAR ENTRY CARD */}
        <div style={{ background: '#fff', border: '1px solid #D4C4A8', borderRadius: '3px' }}>
          {/* Header */}
          <div style={{ background: '#1C1410', padding: '1rem 1.5rem', borderRadius: '3px 3px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.1rem', color: '#F7F3EC' }}>Saturday — Weekly Journal</h3>
            <span style={{ fontSize: '0.7rem', color: 'rgba(247,243,236,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Week {week} · {month}</span>
          </div>

          {/* Week / Month nav */}
          <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #D4C4A8', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: '#8B7355', marginRight: '0.25rem' }}>Week:</span>
            {[1,2,3,4].map(w => (
              <button key={w} onClick={() => setWeek(w)} style={{ border: '1px solid #D4C4A8', background: week === w ? '#1C1410' : 'none', color: week === w ? '#C9A84C' : '#8B7355', padding: '0.25rem 0.65rem', fontSize: '0.72rem', borderRadius: '2px', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>{w}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#8B7355' }}>Month:</span>
            <select value={month} onChange={e => setMonth(e.target.value)} style={{ border: '1px solid #D4C4A8', padding: '0.2rem 0.4rem', fontSize: '0.72rem', borderRadius: '2px', color: '#2E2018', background: '#fff', outline: 'none' }}>
              {MONTHS.map(m => <option key={m.m} value={m.m}>{m.m}</option>)}
            </select>
          </div>

          {loading ? <Spinner /> : (
            <>
              {/* Morning */}
              <div style={slotStyle}>
                <div style={slotLabelStyle}>Morning — Surrender</div>
                <div style={slotPromptStyle}>15–30 min · No phone. Open hands. "Lord, I return to You. I lay down this week."</div>
                {ta('a-morning', 'morning', 'Today I return to God by laying down...')}
              </div>
              {/* Midday */}
              <div style={slotStyle}>
                <div style={slotLabelStyle}>Midday — Listening</div>
                <div style={slotPromptStyle}>15–20 min · Sit in silence. "What are You saying to me right now?" Don't fill the silence — receive it.</div>
                {ta('a-midday', 'midday', 'In the silence, I heard God say...')}
              </div>
              {/* Evening */}
              <div style={slotStyle}>
                <div style={slotLabelStyle}>Evening — Alignment</div>
                <div style={slotPromptStyle}>20–30 min · Review your week ahead. Pray over each day. Declare God's word over your responsibilities.</div>
                {ta('a-evening', 'evening', 'As I review my week ahead, I am praying over...')}
              </div>
              {/* One word */}
              <div style={slotStyle}>
                <div style={slotLabelStyle}>One word God gave me today</div>
                <input
                  key={`${month}-${week}-word`}
                  defaultValue={entry.one_word || ''}
                  onBlur={e => handleAltarChange('one_word', e.target.value)}
                  placeholder="Write the one word..."
                  style={{ width: '100%', border: '1px solid #D4C4A8', borderRadius: '2px', padding: '0.5rem 0.75rem', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.95rem', color: '#1C1410', background: '#F7F3EC', outline: 'none' }}
                />
              </div>
              {/* Feeling */}
              <div style={{ ...slotStyle, borderBottom: 'none' }}>
                <div style={slotLabelStyle}>How I feel leaving the altar today</div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {FEELINGS.map(f => (
                    <button key={f} onClick={() => handleAltarChange('feeling', f)}
                      style={{ border: '1px solid #D4C4A8', background: entry.feeling === f ? 'rgba(201,168,76,0.1)' : 'none', color: entry.feeling === f ? '#8B6E2A' : '#8B7355', borderColor: entry.feeling === f ? '#C9A84C' : '#D4C4A8', padding: '0.3rem 0.7rem', fontSize: '0.75rem', borderRadius: '2px', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', transition: 'all 0.15s' }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save row */}
              <div style={{ padding: '0.85rem 1.5rem', background: '#F7F3EC', borderTop: '1px solid #D4C4A8', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: saved ? '#3B6D11' : '#8B7355' }}>
                  {user ? (saved ? 'Saved ✓' : 'Entries auto-save as you type') : 'Sign in to save across devices'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* MONTHLY REFLECTION */}
        <div style={{ background: '#fff', border: '1px solid #D4C4A8', borderRadius: '3px', marginTop: '1.5rem' }}>
          <div style={{ background: '#2E2018', padding: '0.85rem 1.25rem', borderRadius: '3px 3px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#F7F3EC', fontSize: '1rem' }}>{month} — Monthly Reflection</span>
            <small style={{ fontSize: '0.65rem', color: 'rgba(247,243,236,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>End of month</small>
          </div>
          <div style={{ padding: '1.25rem' }}>
            {loading ? <Spinner /> : (
              <>
                {rtarea('what_changed',            'What changed this month?',                     'Write what shifted — in your heart, your circumstances, your faith...')}
                {rtarea('clearest_thing_god_said', 'The clearest thing God said:',                 'The clearest thing I heard this month was...')}
                {rtarea('prayer_answered',          'A prayer He answered:',                        'I prayed for... and God...')}
                {rtarea('still_in_progress',        'Something still in progress — I am trusting Him for:', "I haven't seen it yet, but I believe...")}
                {rtarea('carry_forward',            'What I carry forward into next month:',        'Going into next month, I am carrying...')}
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#8B6E2A', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>My spiritual temperature at the end of this month:</div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {TEMPS.map(t => (
                      <button key={t} onClick={() => handleReflChange('spiritual_temperature', t)}
                        style={{ border: '1px solid #D4C4A8', background: refl.spiritual_temperature === t ? '#1C1410' : 'none', color: refl.spiritual_temperature === t ? '#C9A84C' : '#8B7355', padding: '0.3rem 0.6rem', fontSize: '0.72rem', borderRadius: '2px', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', transition: 'all 0.15s' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TESTIMONY FEED ─────────────────────────────────────────────

function TestimonyCard({ testimony, user, userReactions, onReact, onComment, isAdmin, onAdminAction }) {
  const [comments,    setComments]    = useState(null)
  const [showCmts,    setShowCmts]    = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  async function loadComments() {
    if (comments !== null) return
    const data = await getComments(testimony.id)
    setComments(data)
  }

  async function toggleComments() {
    if (!showCmts) await loadComments()
    setShowCmts(v => !v)
  }

  async function handleComment() {
    if (!user || !commentText.trim()) return
    setSubmitting(true)
    try {
      const profile = await getProfile(user.id)
      await addComment(user.id, testimony.id, profile.display_name || user.email, commentText.trim())
      const data = await getComments(testimony.id)
      setComments(data)
      setCommentText('')
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  const myReactions = userReactions || new Set()
  const initials    = testimony.display_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div style={{ background: '#fff', border: '1px solid #D4C4A8', borderRadius: '3px', padding: '1.25rem', marginBottom: '0.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#2E2018', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.85rem', color: '#C9A84C', flexShrink: 0 }}>{initials}</div>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#1C1410' }}>{testimony.display_name}</div>
          <div style={{ fontSize: '0.7rem', color: '#8B7355' }}>{testimony.month && `${testimony.month} · `}{new Date(testimony.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
        </div>
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(201,168,76,0.12)', color: '#8B6E2A', padding: '0.18rem 0.45rem', borderRadius: '2px', marginLeft: 'auto' }}>{testimony.category}</span>
        {isAdmin && (
          <button onClick={() => onAdminAction(testimony.id, 'rejected')} style={{ background: 'none', border: '1px solid #E24B4A', color: '#A32D2D', padding: '0.2rem 0.5rem', fontSize: '0.68rem', borderRadius: '2px', cursor: 'pointer' }}>Remove</button>
        )}
      </div>

      {/* Body */}
      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1rem', lineHeight: 1.75, color: '#2E2018', marginBottom: '1rem' }}>{testimony.body}</p>

      {/* Reactions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        {[
          { type: 'amen',       label: 'Amen',      count: testimony.amen_count      },
          { type: 'praying',    label: 'Praying',   count: testimony.praying_count   },
          { type: 'encouraged', label: 'Encouraged', count: testimony.encouraged_count },
        ].map(({ type, label, count }) => {
          const active = myReactions.has(type)
          return (
            <button key={type} onClick={() => onReact(testimony.id, type)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.55rem', border: `1px solid ${active ? '#C9A84C' : '#D4C4A8'}`, borderRadius: '2px', fontSize: '0.75rem', color: active ? '#8B6E2A' : '#6B5540', background: active ? 'rgba(201,168,76,0.1)' : 'none', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', transition: 'all 0.15s' }}>
              {label} <b>{Number(count) || 0}</b>
            </button>
          )
        })}
        <button onClick={toggleComments} style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#8B7355', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {testimony.comment_count || 0} comment{testimony.comment_count !== 1 ? 's' : ''} {showCmts ? '▲' : '▼'}
        </button>
      </div>

      {/* Comments */}
      {showCmts && (
        <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #D4C4A8' }}>
          {(comments || []).map(c => (
            <div key={c.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#EDE6D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#8B7355', flexShrink: 0, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{c.display_name?.[0]}</div>
              <div style={{ background: '#F7F3EC', borderRadius: '2px', padding: '0.4rem 0.65rem', flex: 1 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 500, color: '#1C1410', marginBottom: '0.15rem' }}>{c.display_name}</div>
                <div style={{ fontSize: '0.78rem', color: '#6B5540', lineHeight: 1.45 }}>{c.body}</div>
              </div>
            </div>
          ))}
          {user ? (
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
              <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Encourage them..." onKeyDown={e => e.key === 'Enter' && handleComment()}
                style={{ flex: 1, padding: '0.35rem 0.6rem', border: '1px solid #D4C4A8', borderRadius: '2px', fontSize: '0.78rem', background: '#fff', color: '#2E2018', outline: 'none', fontFamily: 'Inter, system-ui, sans-serif' }} />
              <button onClick={handleComment} disabled={submitting} style={{ background: '#1C1410', color: '#C9A84C', border: 'none', padding: '0.35rem 0.7rem', fontSize: '0.72rem', borderRadius: '2px', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {submitting ? '…' : 'Send'}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: '0.75rem', color: '#8B7355', marginTop: '0.5rem' }}>Sign in to leave a comment.</p>
          )}
        </div>
      )}
    </div>
  )
}

function TestimonyFeed({ user, onOpenAuth, isAdmin }) {
  const [testimonies, setTestimonies] = useState([])
  const [filter,      setFilter]      = useState('all')
  const [loading,     setLoading]     = useState(true)
  const [userReacts,  setUserReacts]  = useState({})
  const [showModal,   setShowModal]   = useState(false)
  const [pending,     setPending]     = useState([])
  const [showPending, setShowPending] = useState(false)

  async function load(cat) {
    setLoading(true)
    try {
      const data = await getTestimonies(cat)
      setTestimonies(data)
      if (user && data.length) {
        const reacts = await getUserReactions(user.id, data.map(t => t.id))
        setUserReacts(reacts)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(filter) }, [filter, user])

  async function loadPending() {
    try { setPending(await getPendingTestimonies()) } catch (e) { console.error(e) }
  }

  useEffect(() => { if (isAdmin) loadPending() }, [isAdmin])

  async function handleReact(testimonyId, type) {
    if (!user) { onOpenAuth(); return }
    try {
      const nowActive = await toggleReaction(user.id, testimonyId, type)
      await load(filter)
    } catch (e) { console.error(e) }
  }

  async function handleAdminAction(id, status) {
    try {
      await updateTestimonyStatus(id, status)
      await load(filter)
      await loadPending()
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      {/* Feed hero */}
      <div style={{ background: '#1C1410', padding: '2.5rem 1.5rem 2rem', textAlign: 'center' }}>
        <p style={eyebrowStyle}>Community</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 500, color: '#F7F3EC', marginBottom: '0.5rem' }}>What God has done</h1>
        <p style={{ fontSize: '0.82rem', color: 'rgba(247,243,236,0.5)', maxWidth: '380px', margin: '0 auto' }}>Every testimony here is evidence. Post yours and build someone else's faith.</p>
      </div>

      <div style={{ padding: '0 1.5rem 4rem', maxWidth: '860px', margin: '0 auto' }}>
        {/* Admin pending queue */}
        {isAdmin && pending.length > 0 && (
          <div style={{ background: '#2E2018', borderRadius: '3px', padding: '1rem 1.25rem', marginTop: '1.5rem', marginBottom: '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#C9A84C', fontSize: '0.8rem', fontWeight: 500 }}>Admin: {pending.length} pending testimonies</span>
              <button onClick={() => setShowPending(v => !v)} style={{ background: 'none', border: '1px solid rgba(247,243,236,0.2)', color: 'rgba(247,243,236,0.7)', padding: '0.2rem 0.6rem', fontSize: '0.72rem', borderRadius: '2px', cursor: 'pointer' }}>{showPending ? 'Hide' : 'Review'}</button>
            </div>
            {showPending && pending.map(t => (
              <div key={t.id} style={{ marginTop: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.78rem', color: '#F7F3EC', marginBottom: '0.4rem' }}><strong style={{ color: '#C9A84C' }}>{t.display_name}</strong> · {t.category} · {t.month}</div>
                <p style={{ fontSize: '0.82rem', color: 'rgba(247,243,236,0.7)', lineHeight: 1.6, marginBottom: '0.6rem' }}>{t.body.slice(0, 200)}{t.body.length > 200 ? '…' : ''}</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleAdminAction(t.id, 'published')} style={{ background: '#C9A84C', color: '#1C1410', border: 'none', padding: '0.3rem 0.75rem', fontSize: '0.75rem', borderRadius: '2px', cursor: 'pointer', fontWeight: 500 }}>Publish</button>
                  <button onClick={() => handleAdminAction(t.id, 'rejected')}  style={{ background: 'none', border: '1px solid #E24B4A', color: '#F09595', padding: '0.3rem 0.75rem', fontSize: '0.75rem', borderRadius: '2px', cursor: 'pointer' }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs + share button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #D4C4A8', flexWrap: 'wrap' }}>
            {['all', ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.72rem', letterSpacing: '0.04em', color: filter === cat ? '#8B6E2A' : '#8B7355', cursor: 'pointer', border: 'none', borderBottom: `2px solid ${filter === cat ? '#C9A84C' : 'transparent'}`, marginBottom: '-1px', background: 'none', fontFamily: 'Inter, system-ui, sans-serif', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
          <button onClick={() => user ? setShowModal(true) : onOpenAuth()} style={{ ...goldBtnStyle, padding: '0.45rem 1rem', fontSize: '0.78rem' }}>+ Share yours</button>
        </div>
        <div style={{ borderBottom: '1px solid #D4C4A8', marginBottom: '1.5rem' }} />

        {loading ? <Spinner /> : testimonies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem', color: '#8B7355', fontStyle: 'italic' }}>Be the first to share a testimony in this season.</p>
          </div>
        ) : testimonies.map(t => (
          <TestimonyCard key={t.id} testimony={t} user={user} userReactions={userReacts[t.id]} onReact={handleReact} isAdmin={isAdmin} onAdminAction={handleAdminAction} />
        ))}
      </div>

      {/* Share modal */}
      {showModal && <ShareModal user={user} onClose={() => setShowModal(false)} onSubmitted={() => { setShowModal(false); load(filter) }} />}
    </div>
  )
}

// ── SHARE MODAL ────────────────────────────────────────────────

function ShareModal({ user, onClose, onSubmitted }) {
  const [form,      setForm]      = useState({ name: '', email: '', body: '', category: 'breakthrough', month: '' })
  const [loading,   setLoading]   = useState(false)
  const [err,       setErr]       = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    if (!form.body.trim()) { setErr('Please write your testimony.'); return }
    const displayName = user ? (form.name || user.email) : form.name
    if (!displayName) { setErr('Please enter your name.'); return }
    setLoading(true)
    try {
      await submitTestimony(user?.id || null, displayName, form.body, form.category, form.month)
      setSubmitted(true)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,20,16,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '3px', width: '100%', maxWidth: '500px', padding: '1.75rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#8B7355' }}>✕</button>
        {submitted ? (
          <>
            <h2 style={modalTitleStyle}>Testimony received</h2>
            <p style={{ fontSize: '0.85rem', color: '#6B5540', lineHeight: 1.7 }}>Thank you for sharing what God has done. Your testimony will be reviewed and published to the community soon.</p>
            <button onClick={onSubmitted} style={{ ...goldBtnStyle, marginTop: '1.25rem' }}>Done</button>
          </>
        ) : (
          <>
            <h2 style={modalTitleStyle}>Share your testimony</h2>
            <p style={{ fontSize: '0.78rem', color: '#8B7355', marginBottom: '1.25rem' }}>What has God done during this fasting season? Let it encourage someone else.</p>
            {!user && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={labelStyle}>Your name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Grace Mensah" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="grace@example.com" style={inputStyle} />
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={labelStyle}>Month</label>
                <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} style={inputStyle}>
                  <option value="">Any month</option>
                  {MONTHS.map(m => <option key={m.m} value={m.m}>{m.m}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={labelStyle}>Your testimony</label>
              <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="During my Daniel Fast in January, God spoke clearly about..." rows={5}
                style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #D4C4A8', borderRadius: '2px', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.92rem', color: '#2E2018', background: '#fff', outline: 'none', resize: 'vertical', lineHeight: 1.65 }} />
            </div>
            {err && <p style={{ fontSize: '0.75rem', color: '#A32D2D', marginBottom: '0.75rem' }}>{err}</p>}
            <button onClick={handleSubmit} disabled={loading} style={goldBtnStyle}>{loading ? 'Submitting…' : 'Submit testimony'}</button>
            <p style={{ fontSize: '0.7rem', color: '#8B7355', textAlign: 'center', marginTop: '0.6rem' }}>Testimonies are reviewed before publishing. Usually within 24 hours.</p>
          </>
        )}
      </div>
    </div>
  )
}

// ── ROOT APP ───────────────────────────────────────────────────

export default function App() {
  const [page,           setPage]          = useState('home')
  const [user,           setUser]          = useState(null)
  const [profile,        setProfile]       = useState(null)
  const [showAuth,       setShowAuth]      = useState(false)
  const [toast,          setToast]         = useState('')
  const [selectedMonths, setSelectedMonths] = useState(['January','July','December'])
  const [stats, setStats] = useState({
    downloads: 0,
    fasting_now: 0,
    testimonies: 0,
    altar_days: 0,
  })

  const isAdmin = user?.id === ADMIN_USER_ID

  // Auth listener
  useEffect(() => {
    const { data: { subscription } } = onAuthChange(async (u) => {
      setUser(u)
      setShowAuth(false)
      if (u) {
        try {
          const p = await getProfile(u.id)
          setProfile(p)
          if (p?.selected_months) setSelectedMonths(p.selected_months)
        } catch (e) { console.error(e) }
      } else {
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load platform stats on mount and refresh every 60s
  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getPlatformStats()
        setStats({
          downloads:   data.downloads   || 0,
          fasting_now: data.fasting_now  || 0,
          testimonies: data.testimonies || 0,
          altar_days:  data.altar_days  || 0,
        })
      } catch (e) {
        // Keep defaults if stats fail — never break the page
        console.error('Stats load error:', e)
      }
    }
    loadStats()
    const t = setInterval(loadStats, 60000)
    return () => clearInterval(t)
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function toggleMonth(m) {
    const anchors = ['January', 'July', 'December']
    if (anchors.includes(m)) return
    const next = selectedMonths.includes(m)
      ? selectedMonths.filter(x => x !== m)
      : [...selectedMonths, m]
    setSelectedMonths(next)
    if (user) {
      try { await updateProfile(user.id, { selected_months: next }) } catch (e) { console.error(e) }
    }
  }

  async function downloadJournal() {
    // Increment anonymous counter — no email, no auth
    try { await incrementDownloads() } catch (e) { console.error(e) }
    // Update local count immediately for instant feedback
    setStats(s => ({ ...s, downloads: s.downloads + 1 }))
    // Trigger PDF download
    window.location.href = '/TheAltarYear_Journal_Filled.pdf'
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#F7F3EC', minHeight: '100vh', color: '#2E2018' }}>
      {/* NAV */}
      <nav style={{ background: '#1C1410', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', position: 'sticky', top: 0, zIndex: 100 }}>
        <span onClick={() => setPage('home')} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1rem', color: '#C9A84C', letterSpacing: '0.04em', cursor: 'pointer' }}>Keep Me At The Altar™</span>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {[
            { id: 'home',  label: 'Journal'     },
            { id: 'guide', label: 'The guide'   },
            { id: 'feed',  label: 'Testimonies' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setPage(id)} style={{ background: 'none', border: 'none', color: page === id ? '#C9A84C' : 'rgba(255,255,255,0.6)', fontSize: '0.75rem', letterSpacing: '0.06em', cursor: 'pointer', padding: '0.35rem 0.7rem', borderRadius: '2px', fontFamily: 'Inter, system-ui, sans-serif', transition: 'color 0.15s' }}>
              {label}
            </button>
          ))}
          {user ? (
            <button onClick={() => { signOut(); showToast('Signed out') }} style={{ background: 'none', border: '1px solid rgba(201,168,76,0.4)', color: '#C9A84C', padding: '0.3rem 0.7rem', fontSize: '0.72rem', borderRadius: '2px', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>Sign out</button>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: '#C9A84C', color: '#1C1410', border: 'none', padding: '0.35rem 0.9rem', fontSize: '0.75rem', fontWeight: 500, borderRadius: '2px', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>Sign in</button>
          )}
        </div>
      </nav>

      {/* HOME */}
      {page === 'home' && (
        <>
          {/* Hero */}
          <div style={{ background: '#1C1410', padding: '4rem 1.5rem 3rem', textAlign: 'center', position: 'relative' }}>
            <p style={eyebrowStyle}>Keep Me At The Altar™</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(2rem,4.5vw,3.2rem)', fontWeight: 500, color: '#F7F3EC', lineHeight: 1.15, maxWidth: '620px', margin: '0 auto 1.25rem' }}>
              The altar is not just a place.<br /><em style={{ fontStyle: 'italic', color: '#C9A84C' }}>It is a posture.</em>
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'rgba(247,243,236,0.55)', maxWidth: '440px', margin: '0 auto 2rem', lineHeight: 1.7 }}>A free guided journal for intentional fasting, prayer, and spiritual encounter — month by month, all year long.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={downloadJournal} style={goldBtnStyle}>Download the journal — free</button>
              <button onClick={() => setPage('feed')} style={{ background: 'transparent', color: '#F7F3EC', border: '1px solid rgba(247,243,236,0.25)', padding: '0.65rem 1.5rem', fontSize: '0.8rem', borderRadius: '2px', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>Read testimonies</button>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.75rem', fontSize: '0.75rem', color: 'rgba(247,243,236,0.4)' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9A84C', animation: 'pulse 2.5s ease-in-out infinite', display: 'inline-block' }} />
              {stats.fasting_now.toLocaleString()} people fasting with you this month
            </div>
          </div>

          {/* Anchor months */}
          <div style={{ background: '#1C1410', padding: '0 1.5rem 2rem' }}>
            <div style={{ maxWidth: '860px', margin: '0 auto' }}>
              <p style={{ ...eyebrowStyle, paddingTop: '2rem' }}>The three anchor months</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.5rem', fontWeight: 500, color: '#F7F3EC', marginBottom: '0.5rem' }}>Non-negotiable spiritual gates</h2>
              <p style={{ fontSize: '0.8rem', color: 'rgba(247,243,236,0.5)', lineHeight: 1.6, maxWidth: '480px', marginBottom: '1.5rem' }}>These three months carry particular weight. If you fast nothing else all year, fast these three.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.08)' }}>
                {[
                  { label: 'January · The Gate', month: 'Open the Year', role: '"See, I am doing a new thing!" — Isaiah 43:19', desc: 'What you consecrate in January sets the spiritual atmosphere for the twelve months ahead.', fast: '21-Day Daniel Fast' },
                  { label: 'July · The Midpoint', month: 'Review & Recommit', role: '"The vision is for an appointed time." — Hab. 2:3', desc: 'A divine halftime — pause to review your progress and recalibrate your heart for the second half.', fast: '7-Day Daniel Fast' },
                  { label: 'December · The Closing', month: 'End with Honour', role: '"You do not drift into a new year." — Isaiah 9:6', desc: 'The spiritual closing of the year — reflection, worship, surrender. Close it with purpose.', fast: 'Advent Fast — 4 Sundays' },
                ].map(a => (
                  <div key={a.label} style={{ background: '#2E2018', padding: '1.25rem', position: 'relative', borderTop: '2px solid #C9A84C' }}>
                    <div style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '0.5rem' }}>{a.label}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.2rem', color: '#F7F3EC', marginBottom: '0.3rem' }}>{a.month}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(247,243,236,0.45)', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', Georgia, serif", marginBottom: '0.75rem' }}>{a.role}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(247,243,236,0.4)', lineHeight: 1.5 }}>{a.desc}</div>
                    <span style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(201,168,76,0.15)', color: '#C9A84C', padding: '0.2rem 0.5rem', borderRadius: '2px' }}>{a.fast}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Month chooser */}
          <MonthChooser selectedMonths={selectedMonths} onToggle={toggleMonth} onDownload={downloadJournal} />

          {/* Altar Day journal */}
          <AltarDay user={user} />
        </>
      )}

      {/* GUIDE */}
      {page === 'guide' && <FoundationGuide />}

      {/* FEED */}
      {page === 'feed' && (
        <TestimonyFeed user={user} onOpenAuth={() => setShowAuth(true)} isAdmin={isAdmin} />
      )}

      {/* Auth modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Toast */}
      <Toast message={toast} />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

// ── Shared style constants ─────────────────────────────────────
const eyebrowStyle   = { fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '0.75rem', display: 'block' }
const secTitleStyle  = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.5rem,2.5vw,2rem)', fontWeight: 500, color: '#1C1410', marginBottom: '0.5rem' }
const secBodyStyle   = { fontSize: '0.85rem', color: '#6B5540', lineHeight: 1.75, maxWidth: '520px', marginBottom: '1.75rem' }
const labelStyle     = { display: 'block', fontSize: '0.68rem', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8B7355', marginBottom: '0.35rem' }
const inputStyle     = { width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #D4C4A8', borderRadius: '2px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: '#2E2018', background: '#fff', outline: 'none', marginBottom: '0.85rem' }
const goldBtnStyle   = { background: '#C9A84C', color: '#1C1410', border: 'none', padding: '0.65rem 1.5rem', fontSize: '0.8rem', fontWeight: 500, borderRadius: '2px', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', transition: 'background 0.15s' }
const slotStyle      = { padding: '1.25rem 1.5rem', borderBottom: '1px solid #D4C4A8' }
const slotLabelStyle = { fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8B6E2A', marginBottom: '0.25rem' }
const slotPromptStyle = { fontSize: '0.8rem', color: '#6B5540', marginBottom: '0.6rem', lineHeight: 1.5, fontStyle: 'italic' }
const modalTitleStyle = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.4rem', fontWeight: 500, color: '#1C1410', marginBottom: '0.2rem' }
