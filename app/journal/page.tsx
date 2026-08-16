'use client'

import { useEffect, useState } from 'react'

interface JournalEntry {
  field_key: string
  content: string
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

const PRAYER_SLOTS = [
  { key: 'prayer_9am',  label: '9am — 3rd Hour',   prompt: 'Morning prayer — surrender and consecration' },
  { key: 'prayer_12pm', label: '12pm — 6th Hour',  prompt: 'Midday prayer — listening and stillness' },
  { key: 'prayer_3pm',  label: '3pm — 9th Hour',   prompt: 'Afternoon prayer — intercession' },
  { key: 'prayer_6pm',  label: '6pm — 12th Hour',  prompt: 'Evening prayer — alignment and declaration' },
]

const ALTAR_DAY_FIELDS = [
  { key: 'morning',  label: 'Morning — Surrender', prompt: 'Today I return to God by laying down:' },
  { key: 'midday',   label: 'Midday — Listening',  prompt: 'In the silence, I heard God say:' },
  { key: 'evening',  label: 'Evening — Alignment', prompt: 'Declaration I am speaking over this week:' },
  { key: 'one_word', label: 'One Word God Gave Me Today', prompt: '' },
]

const MONTHLY_FIELDS = [
  { key: 'prayer_focus', label: 'My Prayer Focus This Month' },
  { key: 'revelations',  label: 'Dreams / Revelations Received' },
  { key: 'hs_teaching',  label: 'What the Holy Spirit Is Teaching Me' },
  { key: 'scriptures',   label: 'Scriptures That Stood Out' },
]

const REFLECTION_FIELDS = [
  { key: 'what_changed',  label: 'What changed this month?' },
  { key: 'god_said',      label: 'The clearest thing God said:' },
  { key: 'answered',      label: 'A prayer He answered:' },
  { key: 'trusting',      label: 'Something still in progress — I am trusting Him for:' },
  { key: 'carry_forward', label: 'What I carry forward into next month:' },
]

const FASTING_DAYS: Record<string, { title: string; ref: string; prayer: string; teaching: string; prompts: string[] }[]> = {
  January: [
    { title: 'Opening the Gate', ref: 'Isaiah 22:22', prayer: 'Lord, I open this year to You. What You open, no man can shut.', teaching: 'The key of the house of David — what God opens, no one can shut, and what He shuts, no one can open. As you begin this year, you are not just starting fresh. You are standing at a spiritual gate. What you bring to God now becomes the foundation of everything that follows. Open your hands. Open your year.', prompts: ['What do you want God to open for you this year?', 'What gates have felt closed? Lay them before God now.'] },
    { title: 'Consecration', ref: 'Romans 12:1', prayer: 'I present my body, my plans, and my year as a living sacrifice.', teaching: 'Consecration is not about being perfect — it is about being surrendered. Your body, your schedule, your ambitions, your relationships — all of it laid on the altar. Not destroyed, but offered. And what God receives, He transforms.', prompts: ['What area of your life needs to be fully surrendered this year?', 'What are you holding back from God — and why?'] },
    { title: 'Hearing His Voice', ref: 'John 10:27', prayer: 'Speak, Lord. Quiet every other voice so I can hear You clearly.', teaching: 'Jesus says His sheep hear His voice. Fasting is one of the most powerful ways to turn down the volume of everything else — appetite, noise, distraction — so that the still small voice becomes audible again.', prompts: ['What has God been trying to say to you that you have not stopped to hear?', 'What distractions have been drowning Him out? Name them and release them.'] },
    { title: 'Breaking Old Patterns', ref: 'Isaiah 43:18-19', prayer: 'God, I release the old. I receive the new thing You are doing.', teaching: 'God says do not dwell on the former things. Old patterns, old mindsets, old wounds — they do not belong in this new season. The new thing God is doing requires new wineskins. What needs to die in you so the new thing can live?', prompts: ['What old pattern or mindset needs to die in this new year?', 'What does the new thing look like in your specific life?'] },
    { title: 'Praying for Family', ref: 'Joshua 24:15', prayer: 'As for me and my house, we will serve the Lord.', teaching: 'This declaration from Joshua was not wishful thinking — it was a covenant. Intercession for family is one of the highest and most costly forms of prayer. Who in your family needs you to fast and stand in the gap for them right now?', prompts: ['Who in your family needs prayer most urgently right now?', 'Write a specific prayer for them — not general, but targeted and faith-filled.'] },
  ],
  February: [
    { title: 'Loving God First', ref: 'Matthew 22:37', prayer: 'Lord, recalibrate my love. Let my first love be You above all else.', teaching: 'When love for God is first, everything else falls into its right place. When it slips, everything drifts. February asks: where has your love drifted? Not to shame you — to call you back.', prompts: ['How has your love for God grown or cooled in the past season?', 'What would loving God with your whole heart look like practically this week?'] },
    { title: 'Loving Yourself Well', ref: 'Psalm 139:14', prayer: 'I receive Your love for me. I am fearfully and wonderfully made.', teaching: 'You cannot love your neighbour as yourself if you do not love yourself. He did not make a mistake when He made you. The works of His hands are wonderful. That includes you — your body, your mind, your story, your personality. Receive it.', prompts: ['Where do you struggle most to love yourself?', 'Write 5 things God says about you that you need to believe more deeply.'] },
    { title: 'Forgiving Deeply', ref: 'Colossians 3:13', prayer: 'I choose to forgive as You have forgiven me. Release me from every root of bitterness.', teaching: 'Unforgiveness is a prison you build for someone else and then live in yourself. Full forgiveness looks like wishing them well and meaning it.', prompts: ['Who do you need to forgive? Write their name and what happened.', 'What would full forgiveness look like — and what would it free you from?'] },
    { title: 'Receiving God\'s Love', ref: 'Romans 8:38-39', prayer: 'Nothing can separate me from Your love. I receive it fully today.', teaching: 'Nothing — not height or depth, life or death, angels or demons, present or future. You are not loved because you are good. You are loved because He is. This is not a reward you earn — it is a foundation you build on.', prompts: ['Do you truly believe God loves you unconditionally? What makes it hard to receive?', 'How would your life look different if you lived fully convinced of His love?'] },
    { title: 'Love in Action', ref: '1 Corinthians 13:4-7', prayer: 'God, make me a vessel of Your love in my closest relationships.', teaching: 'The love described in 1 Corinthians 13 is not romantic feeling — it is a choice, a discipline, a daily practice. Patient. Kind. Not easily angered. Keeps no record of wrongs. This is the love that builds marriages and restores relationships.', prompts: ['Which quality from 1 Corinthians 13 do you most need to grow in — and why?', 'How can you love those closest to you more intentionally this month?'] },
  ],
}

// Fill remaining months with placeholder days
const placeholder = (month: string) => Array.from({length: 5}, (_, i) => ({
  title: `Fasting Day ${i+1}`,
  ref: 'Coming soon',
  prayer: 'Lord, I come before You today in fasting and prayer.',
  teaching: `This is your guided fasting day for ${month}. Use this space to write what God is speaking to you today.`,
  prompts: ['What is God highlighting to you today?', 'Write your prayer and declaration for this day.']
}))

MONTHS.forEach(m => { if (!FASTING_DAYS[m]) FASTING_DAYS[m] = placeholder(m) })

export default function JournalPage() {
  const [email, setEmail] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [currentMonth, setCurrentMonth] = useState('January')
  const [view, setView] = useState<'monthly'|'altar1'|'altar2'|'reflection'|'fasting'>('monthly')
  const [fastingDay, setFastingDay] = useState(0)
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
      body: JSON.stringify({ email, month: currentMonth, day_number: fastingDay, entry_type: view, field_key, content })
    })
    .then(r => r.json())
    .then(() => {
      setSaveStatus('Saved ✓')
      setTimeout(() => setSaveStatus(''), 2500)
      setEntries(prev => {
        const exists = prev.find(e => e.field_key === field_key)
        if (exists) return prev.map(e => e.field_key === field_key ? {...e, content} : e)
        return [...prev, { field_key, content }]
      })
    })
    .catch(() => setSaveStatus('Error saving'))
  }

  const gold = '#A67C2E'; const ink = '#1E1B16'; const muted = '#5A5347'
  const bg = '#F7F4EF'; const surface = '#EDE9E1'; const border = '#CEC8BC'

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'12px', borderRadius:'8px', border:`1px solid ${border}`,
    background: surface, fontSize:'15px', color: ink, resize:'vertical',
    fontFamily:'Georgia,serif', boxSizing:'border-box', lineHeight:'1.6'
  }

  const labelStyle: React.CSSProperties = {
    display:'block', color: gold, fontSize:'11px', letterSpacing:'0.1em',
    textTransform:'uppercase', marginBottom:'6px', fontFamily:'sans-serif', fontWeight: 500
  }

  const navBtn = (active: boolean): React.CSSProperties => ({
    padding:'7px 14px', borderRadius:'20px', border:`1px solid ${active ? gold : border}`,
    background: active ? gold : 'transparent', color: active ? 'white' : muted,
    cursor:'pointer', fontSize:'12px', fontFamily:'sans-serif'
  })

  const prayerSection = (prefix: string) => (
    <div style={{ marginTop:'2rem', padding:'1.25rem', background:'white', borderRadius:'10px', border:`1px solid ${border}` }}>
      <p style={{ color: gold, fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'sans-serif', fontWeight:500, marginBottom:'1.25rem' }}>
        Prayer Time Appointments
      </p>
      {PRAYER_SLOTS.map(slot => (
        <div key={`${prefix}_${slot.key}`} style={{ marginBottom:'1.25rem' }}>
          <label style={labelStyle}>{slot.label}</label>
          <p style={{ color: muted, fontSize:'12px', marginBottom:'6px', fontStyle:'italic' }}>{slot.prompt}</p>
          <textarea rows={3} defaultValue={getEntry(`${prefix}_${slot.key}`)}
            onBlur={e => saveEntry(`${prefix}_${slot.key}`, e.target.value)}
            style={inputStyle} placeholder="Write your prayer here..." />
        </div>
      ))}
    </div>
  )

  if (!loggedIn) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background: bg, fontFamily:'Georgia,serif' }}>
        <div style={{ textAlign:'center', padding:'2rem', maxWidth:'400px' }}>
          <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🕯</div>
          <h1 style={{ color: gold, fontSize:'1.4rem', marginBottom:'0.5rem' }}>Keep Me At The Altar™</h1>
          <p style={{ color: muted, marginBottom:'1.5rem', fontSize:'14px', lineHeight:'1.6' }}>Enter your email to access your personal journal.</p>
          <input type="email" placeholder="Your email address" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && email && sendLink()}
            style={{ ...inputStyle, marginBottom:'1rem', textAlign:'center' }} />
          <button onClick={sendLink} disabled={sending || !email}
            style={{ background: gold, color:'white', border:'none', padding:'12px 28px', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontFamily:'sans-serif', width:'100%', opacity:(!email||sending)?0.6:1 }}>
            {sending ? 'Sending...' : 'Send my journal link'}
          </button>
          <p style={{ color: border, fontSize:'12px', marginTop:'1rem' }}>No password needed. Link expires in 24 hours.</p>
        </div>
      </div>
    )
  }

  function sendLink() {
    setSending(true)
    localStorage.setItem('kmata_email', email)
    fetch('/api/auth/magic-link', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) })
      .then(() => { setSending(false); alert('Check your email — your journal link has been sent!') })
      .catch(() => { setSending(false); alert('Something went wrong. Please try again.') })
  }

  const days = FASTING_DAYS[currentMonth] || []

  return (
    <div style={{ minHeight:'100vh', background: bg, fontFamily:'Georgia,serif' }}>

      {/* Header */}
      <div style={{ background: ink, padding:'0.85rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
        <h1 style={{ color: gold, margin:0, fontSize:'0.9rem', fontFamily:'sans-serif', letterSpacing:'0.08em' }}>KEEP ME AT THE ALTAR™</h1>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          {saveStatus && <span style={{ color: saveStatus.includes('✓') ? '#6BCB77' : '#FFD166', fontSize:'11px', fontFamily:'sans-serif' }}>{saveStatus}</span>}
          <span style={{ color: muted, fontSize:'11px', fontFamily:'sans-serif' }}>{email}</span>
          <button onClick={() => { localStorage.removeItem('kmata_email'); setLoggedIn(false); setEmail('') }}
            style={{ background:'transparent', border:`1px solid ${muted}`, color: muted, padding:'3px 10px', borderRadius:'4px', cursor:'pointer', fontSize:'11px', fontFamily:'sans-serif' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Month + back */}
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          <select value={currentMonth} onChange={e => { setCurrentMonth(e.target.value); setView('monthly'); setFastingDay(0) }}
            style={{ padding:'8px 14px', borderRadius:'8px', border:`1px solid ${border}`, background:'white', fontSize:'14px', color: ink, fontFamily:'sans-serif' }}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <a href="/" style={{ color: gold, fontSize:'13px', fontFamily:'sans-serif', textDecoration:'none' }}>← Back to platform</a>
        </div>

        {/* View tabs */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'2rem', flexWrap:'wrap' }}>
          <button style={navBtn(view==='monthly')} onClick={() => setView('monthly')}>Monthly Journal</button>
          <button style={navBtn(view==='fasting')} onClick={() => { setView('fasting'); setFastingDay(0) }}>Fasting Days</button>
          <button style={navBtn(view==='altar1')} onClick={() => setView('altar1')}>Altar Day — Week 1</button>
          <button style={navBtn(view==='altar2')} onClick={() => setView('altar2')}>Altar Day — Week 2</button>
          <button style={navBtn(view==='reflection')} onClick={() => setView('reflection')}>Month Reflection</button>
        </div>

        {/* MONTHLY VIEW */}
        {view === 'monthly' && (
          <div>
            <h2 style={{ color: ink, fontSize:'1.6rem', marginBottom:'0.25rem' }}>{currentMonth}</h2>
            <p style={{ color: muted, fontSize:'13px', marginBottom:'2rem', fontFamily:'sans-serif' }}>Your monthly journal space. Entries save automatically.</p>
            {MONTHLY_FIELDS.map(f => (
              <div key={f.key} style={{ marginBottom:'1.5rem' }}>
                <label style={labelStyle}>{f.label}</label>
                <textarea rows={4} defaultValue={getEntry(f.key)}
                  onBlur={e => saveEntry(f.key, e.target.value)}
                  style={inputStyle} placeholder="Write here..." />
              </div>
            ))}
          </div>
        )}

        {/* FASTING DAYS VIEW */}
        {view === 'fasting' && (
          <div>
            <h2 style={{ color: ink, fontSize:'1.6rem', marginBottom:'0.25rem' }}>{currentMonth} — Fasting Days</h2>

            {/* Day selector */}
            <div style={{ display:'flex', gap:'6px', marginBottom:'1.5rem', flexWrap:'wrap' }}>
              {days.map((d, i) => (
                <button key={i} onClick={() => setFastingDay(i)}
                  style={{ padding:'6px 14px', borderRadius:'20px', border:`1px solid ${fastingDay===i ? gold : border}`,
                    background: fastingDay===i ? gold : 'transparent', color: fastingDay===i ? 'white' : muted,
                    cursor:'pointer', fontSize:'12px', fontFamily:'sans-serif' }}>
                  Day {i+1}
                </button>
              ))}
            </div>

            {days[fastingDay] && (() => {
              const day = days[fastingDay]
              const prefix = `fd${fastingDay}`
              return (
                <div>
                  {/* Day header */}
                  <div style={{ background:'white', borderRadius:'10px', padding:'1.25rem', marginBottom:'1.5rem', border:`1px solid ${border}` }}>
                    <p style={{ color: gold, fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'sans-serif', marginBottom:'4px' }}>
                      {currentMonth} · Fasting Day {fastingDay+1}
                    </p>
                    <h3 style={{ color: ink, fontSize:'1.2rem', margin:'0 0 4px' }}>{day.title}</h3>
                    <p style={{ color: muted, fontSize:'12px', margin:0, fontFamily:'sans-serif' }}>Scripture: {day.ref}</p>
                  </div>

                  {/* Appointment with God */}
                  <div style={{ background:'#EAE6DE', borderRadius:'10px', padding:'1.25rem', marginBottom:'1.5rem', borderLeft:`3px solid ${gold}` }}>
                    <p style={{ color: gold, fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'sans-serif', fontWeight:500, marginBottom:'8px' }}>Appointment with God</p>
                    <p style={{ color: ink, fontStyle:'italic', fontSize:'14px', margin:0, lineHeight:'1.6' }}>"{day.prayer}"</p>
                  </div>

                  {/* Reflection */}
                  <div style={{ background:'white', borderRadius:'10px', padding:'1.25rem', marginBottom:'1.5rem', border:`1px solid ${border}` }}>
                    <p style={{ color: gold, fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'sans-serif', fontWeight:500, marginBottom:'8px' }}>Reflection</p>
                    <p style={{ color: muted, fontSize:'14px', lineHeight:'1.7', margin:0 }}>{day.teaching}</p>
                  </div>

                  {/* Today's reflection field */}
                  <div style={{ marginBottom:'1.5rem' }}>
                    <label style={labelStyle}>Today's Reflection</label>
                    <textarea rows={5} defaultValue={getEntry(`${prefix}_reflection`)}
                      onBlur={e => saveEntry(`${prefix}_reflection`, e.target.value)}
                      style={inputStyle} placeholder="Write freely — what is God saying to you today?" />
                  </div>

                  {/* Journal prompts */}
                  {day.prompts.map((prompt, pi) => (
                    <div key={pi} style={{ marginBottom:'1.5rem' }}>
                      <label style={labelStyle}>{pi+1}. {prompt}</label>
                      <textarea rows={4} defaultValue={getEntry(`${prefix}_q${pi+1}`)}
                        onBlur={e => saveEntry(`${prefix}_q${pi+1}`, e.target.value)}
                        style={inputStyle} placeholder="Write here..." />
                    </div>
                  ))}

                  {/* Prayer time slots */}
                  {prayerSection(prefix)}
                </div>
              )
            })()}
          </div>
        )}

        {/* ALTAR DAY VIEWS */}
        {(view === 'altar1' || view === 'altar2') && (
          <div>
            <h2 style={{ color: ink, fontSize:'1.6rem', marginBottom:'0.25rem' }}>
              {currentMonth} — {view==='altar1' ? 'Week 1' : 'Week 2'} Altar Day
            </h2>
            <p style={{ color: muted, fontSize:'13px', marginBottom:'2rem', fontFamily:'sans-serif' }}>
              Your weekly reset. One day set apart to fast, listen, and align.
            </p>
            {ALTAR_DAY_FIELDS.map(f => (
              <div key={`${view}_${f.key}`} style={{ marginBottom:'1.5rem' }}>
                <label style={labelStyle}>{f.label}</label>
                {f.prompt && <p style={{ color: muted, fontSize:'13px', marginBottom:'6px', fontStyle:'italic' }}>{f.prompt}</p>}
                <textarea rows={f.key==='one_word' ? 2 : 4}
                  defaultValue={getEntry(`${view}_${f.key}`)}
                  onBlur={e => saveEntry(`${view}_${f.key}`, e.target.value)}
                  style={inputStyle} placeholder="Write here..." />
              </div>
            ))}
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={labelStyle}>How I feel leaving the altar today</label>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {['Peaceful','Convicted','Renewed','Expectant','Surrendered','On Fire'].map(f => (
                  <button key={f} onClick={() => saveEntry(`${view}_feeling`, f)}
                    style={{ padding:'6px 14px', borderRadius:'20px',
                      border:`1px solid ${getEntry(`${view}_feeling`)===f ? gold : border}`,
                      background: getEntry(`${view}_feeling`)===f ? gold : 'transparent',
                      color: getEntry(`${view}_feeling`)===f ? 'white' : muted,
                      cursor:'pointer', fontSize:'13px', fontFamily:'sans-serif' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {prayerSection(view)}
          </div>
        )}

        {/* MONTH REFLECTION VIEW */}
        {view === 'reflection' && (
          <div>
            <h2 style={{ color: ink, fontSize:'1.6rem', marginBottom:'0.25rem' }}>{currentMonth} — End of Month</h2>
            <p style={{ color: muted, fontSize:'13px', marginBottom:'2rem', fontFamily:'sans-serif' }}>What did God do this month? What do you carry forward?</p>
            {REFLECTION_FIELDS.map(f => (
              <div key={f.key} style={{ marginBottom:'1.5rem' }}>
                <label style={labelStyle}>{f.label}</label>
                <textarea rows={4} defaultValue={getEntry(f.key)}
                  onBlur={e => saveEntry(f.key, e.target.value)}
                  style={inputStyle} placeholder="Write here..." />
              </div>
            ))}
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={labelStyle}>My spiritual temperature this month</label>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {['Cold','Warming','Steady','Hot','On Fire'].map(t => (
                  <button key={t} onClick={() => saveEntry('temperature', t)}
                    style={{ padding:'6px 14px', borderRadius:'20px',
                      border:`1px solid ${getEntry('temperature')===t ? gold : border}`,
                      background: getEntry('temperature')===t ? gold : 'transparent',
                      color: getEntry('temperature')===t ? 'white' : muted,
                      cursor:'pointer', fontSize:'13px', fontFamily:'sans-serif' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ marginTop:'3rem', paddingTop:'2rem', borderTop:`1px solid ${border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={() => { const i=MONTHS.indexOf(currentMonth); if(i>0){setCurrentMonth(MONTHS[i-1]); setView('monthly')} }}
            disabled={currentMonth==='January'}
            style={{ background:'transparent', border:`1px solid ${border}`, color: muted, padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontFamily:'sans-serif', opacity:currentMonth==='January'?0.4:1 }}>
            ← Previous month
          </button>
          <span style={{ color: muted, fontSize:'12px', fontFamily:'sans-serif' }}>{MONTHS.indexOf(currentMonth)+1} of 12</span>
          <button onClick={() => { const i=MONTHS.indexOf(currentMonth); if(i<11){setCurrentMonth(MONTHS[i+1]); setView('monthly')} }}
            disabled={currentMonth==='December'}
            style={{ background: gold, border:'none', color:'white', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontFamily:'sans-serif', opacity:currentMonth==='December'?0.4:1 }}>
            Next month →
          </button>
        </div>

      </div>
    </div>
  )
}
