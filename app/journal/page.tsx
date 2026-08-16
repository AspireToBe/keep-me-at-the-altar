'use client'

import { useEffect, useState, useCallback } from 'react'

interface JournalEntry {
  field_key: string
  content: string
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

const ALTAR_DAY_FIELDS = [
  { key: 'morning', label: 'Morning — Surrender', prompt: 'Today I return to God by laying down:' },
  { key: 'midday', label: 'Midday — Listening', prompt: 'In the silence, I heard God say:' },
  { key: 'evening', label: 'Evening — Alignment', prompt: 'Declaration I am speaking over this week:' },
  { key: 'one_word', label: 'One Word God Gave Me Today', prompt: '' },
]

const MONTHLY_FIELDS = [
  { key: 'prayer_focus', label: 'My Prayer Focus This Month' },
  { key: 'revelations', label: 'Dreams / Revelations Received' },
  { key: 'hs_teaching', label: 'What the Holy Spirit Is Teaching Me' },
  { key: 'scriptures', label: 'Scriptures That Stood Out' },
]

const REFLECTION_FIELDS = [
  { key: 'what_changed', label: 'What changed this month?' },
  { key: 'god_said', label: 'The clearest thing God said:' },
  { key: 'answered', label: 'A prayer He answered:' },
  { key: 'trusting', label: 'Something still in progress — I am trusting Him for:' },
  { key: 'carry_forward', label: 'What I carry forward into next month:' },
]

export default function JournalPage() {
  const [email, setEmail] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [currentMonth, setCurrentMonth] = useState('January')
  const [view, setView] = useState<'monthly'|'altar1'|'altar2'|'reflection'>('monthly')
  const [saveStatus, setSaveStatus] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('kmata_email')
    if (saved) { setEmail(saved); setLoggedIn(true) }
  }, [])

  useEffect(() => {
    if (loggedIn && email) {
      fetch(`/api/journal?email=${encodeURIComponent(email)}&month=${currentMonth}`)
        .then(r => r.json())
        .then(data => Array.isArray(data) && setEntries(data))
    }
  }, [loggedIn, email, currentMonth])

  function getEntry(key: string) {
    return entries.find(e => e.field_key === key)?.content || ''
  }

  function saveEntry(field_key: string, content: string) {
    setSaveStatus('Saving...')
    fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, month: currentMonth, day_number: 0, entry_type: view, field_key, content })
    })
    .then(r => r.json())
    .then(() => {
      setSaveStatus('Saved ✓')
      setTimeout(() => setSaveStatus(''), 2000)
      setEntries(prev => {
        const existing = prev.find(e => e.field_key === field_key)
        if (existing) return prev.map(e => e.field_key === field_key ? {...e, content} : e)
        return [...prev, { field_key, content }]
      })
    })
    .catch(() => setSaveStatus('Error saving'))
  }

  function sendLink() {
    setSending(true)
    localStorage.setItem('kmata_email', email)
    fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    .then(() => { setSending(false); alert('Check your email — your journal link has been sent!') })
    .catch(() => { setSending(false); alert('Something went wrong. Please try again.') })
  }

  const gold = '#A67C2E'
  const ink = '#1E1B16'
  const muted = '#5A5347'
  const bg = '#F7F4EF'
  const surface = '#EDE9E1'
  const border = '#CEC8BC'

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px', borderRadius: '8px',
    border: `1px solid ${border}`, background: surface,
    fontSize: '15px', color: ink, resize: 'vertical' as const,
    fontFamily: 'Georgia, serif', boxSizing: 'border-box' as const,
    lineHeight: '1.6'
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', color: gold, fontSize: '11px',
    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    marginBottom: '6px', fontFamily: 'sans-serif'
  }

  const navBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: '20px', border: `1px solid ${active ? gold : border}`,
    background: active ? gold : 'transparent', color: active ? 'white' : muted,
    cursor: 'pointer', fontSize: '13px', fontFamily: 'sans-serif'
  })

  if (!loggedIn) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background: bg, fontFamily:'Georgia,serif' }}>
        <div style={{ textAlign:'center', padding:'2rem', maxWidth:'400px' }}>
          <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🕯</div>
          <h1 style={{ color: gold, fontSize:'1.4rem', marginBottom:'0.5rem' }}>Keep Me At The Altar™</h1>
          <p style={{ color: muted, marginBottom:'1.5rem', fontSize:'14px', lineHeight:'1.6' }}>
            Enter your email to access your personal journal. We will send you a secure link.
          </p>
          <input type="email" placeholder="Your email address" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendLink()}
            style={{ ...inputStyle, marginBottom:'1rem', textAlign:'center' }} />
          <button onClick={sendLink} disabled={sending || !email}
            style={{ background: gold, color:'white', border:'none', padding:'12px 28px', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontFamily:'sans-serif', width:'100%', opacity: (!email || sending) ? 0.6 : 1 }}>
            {sending ? 'Sending...' : 'Send my journal link'}
          </button>
          <p style={{ color: border, fontSize:'12px', marginTop:'1rem' }}>
            No password needed. The link expires in 24 hours.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background: bg, fontFamily:'Georgia,serif' }}>

      {/* Header */}
      <div style={{ background: ink, padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
        <h1 style={{ color: gold, margin:0, fontSize:'1rem', fontFamily:'sans-serif', letterSpacing:'0.05em' }}>KEEP ME AT THE ALTAR™</h1>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          {saveStatus && <span style={{ color: saveStatus.includes('✓') ? '#6BCB77' : '#FFD166', fontSize:'12px', fontFamily:'sans-serif' }}>{saveStatus}</span>}
          <span style={{ color: muted, fontSize:'12px', fontFamily:'sans-serif' }}>{email}</span>
          <button onClick={() => { localStorage.removeItem('kmata_email'); setLoggedIn(false); setEmail('') }}
            style={{ background:'transparent', border:`1px solid ${muted}`, color: muted, padding:'4px 12px', borderRadius:'4px', cursor:'pointer', fontSize:'12px', fontFamily:'sans-serif' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Month selector */}
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          <select value={currentMonth} onChange={e => { setCurrentMonth(e.target.value); setView('monthly') }}
            style={{ padding:'8px 16px', borderRadius:'8px', border:`1px solid ${border}`, background:'white', fontSize:'14px', color: ink, fontFamily:'sans-serif' }}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <a href="/" style={{ color: gold, fontSize:'13px', fontFamily:'sans-serif', textDecoration:'none' }}>← Back to platform</a>
        </div>

        {/* View tabs */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'2rem', flexWrap:'wrap' }}>
          <button style={navBtnStyle(view === 'monthly')} onClick={() => setView('monthly')}>Monthly Journal</button>
          <button style={navBtnStyle(view === 'altar1')} onClick={() => setView('altar1')}>Altar Day — Week 1</button>
          <button style={navBtnStyle(view === 'altar2')} onClick={() => setView('altar2')}>Altar Day — Week 2</button>
          <button style={navBtnStyle(view === 'reflection')} onClick={() => setView('reflection')}>Month Reflection</button>
        </div>

        {/* Monthly journal view */}
        {view === 'monthly' && (
          <div>
            <h2 style={{ color: ink, fontSize:'1.6rem', marginBottom:'0.25rem' }}>{currentMonth}</h2>
            <p style={{ color: muted, fontSize:'13px', marginBottom:'2rem', fontFamily:'sans-serif' }}>
              Your monthly journal space. Entries save automatically as you type.
            </p>
            {MONTHLY_FIELDS.map(f => (
              <div key={f.key} style={{ marginBottom:'1.5rem' }}>
                <label style={labelStyle}>{f.label}</label>
                <textarea rows={4} defaultValue={getEntry(f.key)}
                  onBlur={e => saveEntry(f.key, e.target.value)}
                  style={inputStyle}
                  placeholder="Write here..." />
              </div>
            ))}
          </div>
        )}

        {/* Altar Day views */}
        {(view === 'altar1' || view === 'altar2') && (
          <div>
            <h2 style={{ color: ink, fontSize:'1.6rem', marginBottom:'0.25rem' }}>
              {currentMonth} — {view === 'altar1' ? 'Week 1' : 'Week 2'} Altar Day
            </h2>
            <p style={{ color: muted, fontSize:'13px', marginBottom:'2rem', fontFamily:'sans-serif' }}>
              Your weekly reset. One day set apart to fast, listen, and align.
            </p>
            {ALTAR_DAY_FIELDS.map(f => (
              <div key={`${view}_${f.key}`} style={{ marginBottom:'1.5rem' }}>
                <label style={labelStyle}>{f.label}</label>
                {f.prompt && <p style={{ color: muted, fontSize:'13px', marginBottom:'6px', fontStyle:'italic' }}>{f.prompt}</p>}
                <textarea rows={f.key === 'one_word' ? 2 : 4}
                  defaultValue={getEntry(`${view}_${f.key}`)}
                  onBlur={e => saveEntry(`${view}_${f.key}`, e.target.value)}
                  style={inputStyle}
                  placeholder="Write here..." />
              </div>
            ))}
            <div style={{ marginTop:'1.5rem' }}>
              <label style={labelStyle}>How I feel leaving the altar today</label>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {['Peaceful','Convicted','Renewed','Expectant','Surrendered','On Fire'].map(f => (
                  <button key={f}
                    onClick={() => saveEntry(`${view}_feeling`, f)}
                    style={{ padding:'6px 14px', borderRadius:'20px', border:`1px solid ${getEntry(`${view}_feeling`) === f ? gold : border}`,
                      background: getEntry(`${view}_feeling`) === f ? gold : 'transparent',
                      color: getEntry(`${view}_feeling`) === f ? 'white' : muted,
                      cursor:'pointer', fontSize:'13px', fontFamily:'sans-serif' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Month reflection view */}
        {view === 'reflection' && (
          <div>
            <h2 style={{ color: ink, fontSize:'1.6rem', marginBottom:'0.25rem' }}>{currentMonth} — End of Month</h2>
            <p style={{ color: muted, fontSize:'13px', marginBottom:'2rem', fontFamily:'sans-serif' }}>
              Review the month. What did God do? What do you carry forward?
            </p>
            {REFLECTION_FIELDS.map(f => (
              <div key={f.key} style={{ marginBottom:'1.5rem' }}>
                <label style={labelStyle}>{f.label}</label>
                <textarea rows={4} defaultValue={getEntry(f.key)}
                  onBlur={e => saveEntry(f.key, e.target.value)}
                  style={inputStyle}
                  placeholder="Write here..." />
              </div>
            ))}
            <div style={{ marginTop:'1.5rem' }}>
              <label style={labelStyle}>My spiritual temperature this month</label>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {['Cold','Warming','Steady','Hot','On Fire'].map(t => (
                  <button key={t}
                    onClick={() => saveEntry('temperature', t)}
                    style={{ padding:'6px 14px', borderRadius:'20px', border:`1px solid ${getEntry('temperature') === t ? gold : border}`,
                      background: getEntry('temperature') === t ? gold : 'transparent',
                      color: getEntry('temperature') === t ? 'white' : muted,
                      cursor:'pointer', fontSize:'13px', fontFamily:'sans-serif' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Next month button */}
        <div style={{ marginTop:'3rem', paddingTop:'2rem', borderTop:`1px solid ${border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={() => { const i = MONTHS.indexOf(currentMonth); if(i > 0) setCurrentMonth(MONTHS[i-1]); setView('monthly') }}
            disabled={currentMonth === 'January'}
            style={{ background:'transparent', border:`1px solid ${border}`, color: muted, padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontFamily:'sans-serif', opacity: currentMonth === 'January' ? 0.4 : 1 }}>
            ← Previous month
          </button>
          <span style={{ color: muted, fontSize:'12px', fontFamily:'sans-serif' }}>
            {MONTHS.indexOf(currentMonth) + 1} of 12
          </span>
          <button onClick={() => { const i = MONTHS.indexOf(currentMonth); if(i < 11) setCurrentMonth(MONTHS[i+1]); setView('monthly') }}
            disabled={currentMonth === 'December'}
            style={{ background: gold, border:'none', color:'white', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontFamily:'sans-serif', opacity: currentMonth === 'December' ? 0.4 : 1 }}>
            Next month →
          </button>
        </div>

      </div>
    </div>
  )
}
