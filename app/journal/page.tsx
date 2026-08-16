'use client'

import { useEffect, useState } from 'react'

export default function JournalPage() {
  const [email, setEmail] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [entries, setEntries] = useState([])
  const [currentMonth, setCurrentMonth] = useState('January')

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December']

  useEffect(() => {
    // Check for magic link token in URL
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      // Extract email from token (Supabase sets this)
      const params = new URLSearchParams(hash.substring(1))
      const savedEmail = localStorage.getItem('kmata_email')
      if (savedEmail) {
        setEmail(savedEmail)
        setLoggedIn(true)
      }
    }
    // Check if already logged in
    const savedEmail = localStorage.getItem('kmata_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    if (loggedIn && email) {
      fetch(`/api/journal?email=${encodeURIComponent(email)}&month=${currentMonth}`)
        .then(r => r.json())
        .then(data => setEntries(data))
    }
  }, [loggedIn, email, currentMonth])

  function saveEntry(field_key, content) {
    fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        month: currentMonth,
        day_number: 1,
        entry_type: 'fasting_day',
        field_key,
        content
      })
    })
  }

  function getEntry(key) {
    const entry = entries.find(e => e.field_key === key)
    return entry ? entry.content : ''
  }

  if (!loggedIn) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#F7F4EF',
        fontFamily: 'Georgia, serif'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ color: '#A67C2E', marginBottom: '1rem' }}>Keep Me At The Altar™</h1>
          <p style={{ color: '#5A5347', marginBottom: '1.5rem' }}>Enter your email to access your journal</p>
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              padding: '10px 16px', borderRadius: '6px', border: '1px solid #CEC8BC',
              background: '#fff', fontSize: '14px', width: '280px', display: 'block',
              margin: '0 auto 1rem'
            }}
          />
          <button
            onClick={() => {
              localStorage.setItem('kmata_email', email)
              fetch('/api/auth/magic-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
              }).then(() => alert('Check your email for your journal link!'))
            }}
            style={{
              background: '#A67C2E', color: 'white', border: 'none',
              padding: '10px 24px', borderRadius: '6px', cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Send my journal link
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4EF', fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div style={{
        background: '#1E1B16', padding: '1rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h1 style={{ color: '#A67C2E', margin: 0, fontSize: '1.1rem' }}>Keep Me At The Altar™</h1>
        <span style={{ color: '#5A5347', fontSize: '13px' }}>{email}</span>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {/* Month selector */}
        <div style={{ marginBottom: '2rem' }}>
          <select
            value={currentMonth}
            onChange={e => setCurrentMonth(e.target.value)}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: '1px solid #CEC8BC',
              background: '#fff', fontSize: '14px', color: '#1E1B16'
            }}
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <h2 style={{ color: '#1E1B16', marginBottom: '0.5rem' }}>{currentMonth}</h2>
        <p style={{ color: '#5A5347', marginBottom: '2rem', fontSize: '14px' }}>
          Your journal entries for this month. They save automatically.
        </p>

        {/* Journal fields */}
        {['My prayer focus this month', 'What God is saying', 'What I am believing for', 'Gratitude'].map(label => (
          <div key={label} style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#A67C2E', fontSize: '12px',
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {label}
            </label>
            <textarea
              defaultValue={getEntry(label)}
              onBlur={e => saveEntry(label, e.target.value)}
              rows={4}
              style={{
                width: '100%', padding: '12px', borderRadius: '6px',
                border: '1px solid #CEC8BC', background: '#EDE9E1',
                fontSize: '14px', color: '#1E1B16', resize: 'vertical',
                fontFamily: 'Georgia, serif', boxSizing: 'border-box'
              }}
              placeholder="Write here — saves automatically when you click away"
            />
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <a href="/" style={{ color: '#A67C2E', fontSize: '13px' }}>← Back to Keep Me At The Altar</a>
        </div>
      </div>
    </div>
  )
}