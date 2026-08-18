'use client'

import { useEffect, useState } from 'react'

interface Testimony {
  id: string
  month: string
  content: string
  name: string | null
  status: string
  created_at: string
}

const ADMIN_EMAIL = 'ninaantwi@gmail.com'

export default function AdminPage() {
  const [email, setEmail] = useState('')
  const [authed, setAuthed] = useState(false)
  const [testimonies, setTestimonies] = useState<Testimony[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [filter, setFilter] = useState<'pending'|'approved'|'rejected'>('pending')
  const [actionMsg, setActionMsg] = useState('')

  const gold = '#A67C2E'
  const ink = '#1E1B16'
  const muted = '#5A5347'
  const bg = '#F7F4EF'
  const surface = '#EDE9E1'
  const border = '#CEC8BC'

  useEffect(() => {
    const saved = localStorage.getItem('kmata_admin_email')
    if (saved === ADMIN_EMAIL) { setEmail(saved); setAuthed(true) }
  }, [])

  useEffect(() => {
    if (authed) loadTestimonies()
  }, [authed, filter])

  async function loadTestimonies() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin?email=${encodeURIComponent(email)}&status=${filter}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setTestimonies(data)
        // Load stats
        const [p, a, r] = await Promise.all([
          fetch(`/api/admin?email=${encodeURIComponent(email)}&status=pending`).then(r => r.json()),
          fetch(`/api/admin?email=${encodeURIComponent(email)}&status=approved`).then(r => r.json()),
          fetch(`/api/admin?email=${encodeURIComponent(email)}&status=rejected`).then(r => r.json()),
        ])
        setStats({
          total: (p.length || 0) + (a.length || 0) + (r.length || 0),
          pending: p.length || 0,
          approved: a.length || 0,
          rejected: r.length || 0,
        })
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function moderate(id: string, status: 'approved' | 'rejected') {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, id, status })
      })
      const data = await res.json()
      if (data.success) {
        setTestimonies(prev => prev.filter(t => t.id !== id))
        setActionMsg(`Testimony ${status} ✓`)
        setTimeout(() => setActionMsg(''), 2000)
        setStats(prev => ({
          ...prev,
          pending: status === 'approved' ? prev.pending - 1 : prev.pending - 1,
          approved: status === 'approved' ? prev.approved + 1 : prev.approved,
          rejected: status === 'rejected' ? prev.rejected + 1 : prev.rejected,
        }))
      }
    } catch (e) {
      setActionMsg('Error — try again')
      setTimeout(() => setActionMsg(''), 2000)
    }
  }

  function login() {
    if (email === ADMIN_EMAIL) {
      localStorage.setItem('kmata_admin_email', email)
      setAuthed(true)
    } else {
      alert('Unauthorised. This dashboard is restricted.')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: `1px solid ${border}`, background: 'white',
    fontSize: '14px', color: ink, fontFamily: 'sans-serif',
    boxSizing: 'border-box'
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '360px', width: '100%' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🕯</div>
          <h1 style={{ color: gold, fontSize: '1.1rem', marginBottom: '0.25rem', fontWeight: 600 }}>Keep Me At The Altar™</h1>
          <p style={{ color: muted, fontSize: '13px', marginBottom: '1.5rem' }}>Admin Dashboard — restricted access</p>
          <input type="email" placeholder="Admin email address" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ ...inputStyle, marginBottom: '0.75rem' }} />
          <button onClick={login}
            style={{ width: '100%', background: gold, color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
            Enter dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ background: ink, padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: gold, fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em' }}>KEEP ME AT THE ALTAR™</span>
          <span style={{ color: muted, fontSize: '12px', marginLeft: '12px' }}>Admin Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {actionMsg && <span style={{ color: actionMsg.includes('✓') ? '#6BCB77' : '#FFD166', fontSize: '12px' }}>{actionMsg}</span>}
          <a href="/" style={{ color: muted, fontSize: '12px', textDecoration: 'none' }}>← Platform</a>
          <button onClick={() => { localStorage.removeItem('kmata_admin_email'); setAuthed(false) }}
            style={{ background: 'transparent', border: `1px solid ${muted}`, color: muted, padding: '3px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '2rem' }}>
          {[
            { label: 'Total', value: stats.total, color: ink },
            { label: 'Pending', value: stats.pending, color: '#E8A020' },
            { label: 'Approved', value: stats.approved, color: '#3DAA6E' },
            { label: 'Rejected', value: stats.rejected, color: '#C94040' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', border: `1px solid ${border}`, borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: muted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem' }}>
          {(['pending', 'approved', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 16px', borderRadius: '20px', border: `1px solid ${filter === f ? gold : border}`,
                background: filter === f ? gold : 'transparent', color: filter === f ? 'white' : muted,
                cursor: 'pointer', fontSize: '12px', textTransform: 'capitalize' }}>
              {f} {f === 'pending' ? `(${stats.pending})` : f === 'approved' ? `(${stats.approved})` : `(${stats.rejected})`}
            </button>
          ))}
          <button onClick={loadTestimonies}
            style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '20px', border: `1px solid ${border}`,
              background: 'transparent', color: muted, cursor: 'pointer', fontSize: '12px' }}>
            ↻ Refresh
          </button>
        </div>

        {/* Testimonies list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: muted }}>Loading...</div>
        ) : testimonies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: muted }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No {filter} testimonies</p>
            <p style={{ fontSize: '13px' }}>{filter === 'pending' ? 'All caught up.' : `No ${filter} testimonies yet.`}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {testimonies.map(t => (
              <div key={t.id} style={{ background: 'white', border: `1px solid ${border}`, borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ background: `${gold}22`, color: gold, fontSize: '10px', padding: '2px 10px', borderRadius: '20px', fontWeight: 500 }}>{t.month}</span>
                    <span style={{ color: muted, fontSize: '11px' }}>{t.name || 'Anonymous'}</span>
                  </div>
                  <span style={{ color: muted, fontSize: '11px' }}>{new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <p style={{ color: ink, fontSize: '14px', lineHeight: '1.7', marginBottom: '1rem', fontFamily: 'Georgia, serif' }}>{t.content}</p>
                {filter === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => moderate(t.id, 'approved')}
                      style={{ padding: '7px 20px', borderRadius: '6px', border: 'none', background: '#3DAA6E', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                      ✓ Approve
                    </button>
                    <button onClick={() => moderate(t.id, 'rejected')}
                      style={{ padding: '7px 20px', borderRadius: '6px', border: `1px solid ${border}`, background: 'transparent', color: '#C94040', cursor: 'pointer', fontSize: '13px' }}>
                      ✕ Reject
                    </button>
                  </div>
                )}
                {filter !== 'pending' && (
                  <span style={{ fontSize: '11px', color: filter === 'approved' ? '#3DAA6E' : '#C94040', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {filter === 'approved' ? '✓ Approved' : '✕ Rejected'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
