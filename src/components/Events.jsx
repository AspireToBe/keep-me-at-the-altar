// src/components/Events.jsx
// Church events, gospel shows, live prayer sessions, conferences.
// Public — no sign-in required to view.
// Admin adds events via Supabase table editor.

import { useState, useEffect } from 'react'
import { getEvents, getPastEvents } from '../lib/supabase'

const CATEGORIES = [
  { id: 'all',            label: 'All events'      },
  { id: 'live-prayer',    label: 'Live prayer'     },
  { id: 'community-fast', label: 'Community fast'  },
  { id: 'church-service', label: 'Church service'  },
  { id: 'gospel-show',    label: 'Gospel show'     },
  { id: 'conference',     label: 'Conference'      },
  { id: 'other',          label: 'Other'           },
]

const CATEGORY_LABELS = {
  'live-prayer':    'Live prayer',
  'community-fast': 'Community fast',
  'church-service': 'Church service',
  'gospel-show':    'Gospel show',
  'conference':     'Conference',
  'other':          'Event',
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function daysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const event = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((event - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff <= 7)  return `In ${diff} days`
  return null
}

function EventCard({ event }) {
  const soon = daysUntil(event.event_date)
  const isOnline = !event.location || event.location.toLowerCase().includes('online') ||
                   event.location.toLowerCase().includes('zoom') ||
                   event.location.toLowerCase().includes('youtube')

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #D4C4A8',
      borderRadius: '3px',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* Date bar */}
      <div style={{
        background: '#1C1410',
        padding: '0.65rem 1.1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
      }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '0.88rem',
          color: '#F7F3EC',
        }}>
          {formatDate(event.event_date)}
          {event.event_time && (
            <span style={{ color: 'rgba(247,243,236,0.5)', marginLeft: '0.5rem' }}>
              · {event.event_time}
            </span>
          )}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {soon && (
            <span style={{
              fontSize: '0.58rem',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              background: '#C9A84C',
              color: '#1C1410',
              padding: '0.1rem 0.4rem',
              borderRadius: '2px',
              fontWeight: 600,
            }}>{soon}</span>
          )}
          <span style={{
            fontSize: '0.58rem',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            background: 'rgba(201,168,76,0.15)',
            color: '#C9A84C',
            padding: '0.1rem 0.4rem',
            borderRadius: '2px',
          }}>{CATEGORY_LABELS[event.category] || 'Event'}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1rem 1.1rem' }}>
        <h3 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '1.05rem',
          color: '#1C1410',
          marginBottom: '0.35rem',
          lineHeight: 1.3,
        }}>{event.title}</h3>

        {event.organiser && (
          <p style={{ fontSize: '0.72rem', color: '#8B7355', marginBottom: '0.5rem' }}>
            {event.organiser}
          </p>
        )}

        {event.description && (
          <p style={{
            fontSize: '0.8rem',
            color: '#6B5540',
            lineHeight: 1.7,
            marginBottom: '0.75rem',
          }}>{event.description}</p>
        )}

        {/* Location */}
        {event.location && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.4rem',
            marginBottom: '0.65rem',
            fontSize: '0.75rem',
            color: '#8B7355',
          }}>
            <span>{isOnline ? '🔗' : '📍'}</span>
            <span>{event.location}</span>
          </div>
        )}

        {/* CTA */}
        {event.link && (
          <a
            href={event.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: '#C9A84C',
              color: '#1C1410',
              padding: '0.42rem 1rem',
              fontSize: '0.76rem',
              fontWeight: 600,
              borderRadius: '2px',
              textDecoration: 'none',
              fontFamily: "'Inter', system-ui, sans-serif",
              transition: 'background 0.15s',
            }}
          >
            {isOnline ? 'Join online →' : 'More info →'}
          </a>
        )}
      </div>
    </div>
  )
}

export default function Events() {
  const [events,   setEvents]   = useState([])
  const [past,     setPast]     = useState([])
  const [filter,   setFilter]   = useState('all')
  const [loading,  setLoading]  = useState(true)
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [upcoming, previous] = await Promise.all([
          getEvents(),
          getPastEvents(),
        ])
        setEvents(upcoming)
        setPast(previous)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = filter === 'all'
    ? events
    : events.filter(e => e.category === filter)

  return (
    <div style={{ background: '#F7F3EC', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#1C1410', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <span style={{
          fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase',
          color: '#C9A84C', display: 'block', marginBottom: '0.65rem',
        }}>Community · Events</span>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(1.5rem,3vw,2.2rem)',
          fontWeight: 500, color: '#F7F3EC', marginBottom: '0.4rem',
        }}>What God is calling us to</h1>
        <p style={{
          fontSize: '0.78rem', color: 'rgba(247,243,236,0.4)',
          maxWidth: '380px', margin: '0 auto', lineHeight: 1.7,
        }}>
          Church services, gospel shows, live prayer sessions, and community fasts.
        </p>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Filter tabs */}
        <div style={{
          display: 'flex', gap: '0.35rem', flexWrap: 'wrap',
          marginBottom: '1.5rem', paddingBottom: '1.25rem',
          borderBottom: '1px solid #D4C4A8',
        }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              style={{
                border: '1px solid #D4C4A8',
                background: filter === c.id ? '#1C1410' : '#fff',
                color: filter === c.id ? '#C9A84C' : '#8B7355',
                borderColor: filter === c.id ? '#1C1410' : '#D4C4A8',
                padding: '0.28rem 0.65rem',
                fontSize: '0.72rem',
                borderRadius: '2px',
                cursor: 'pointer',
                fontFamily: "'Inter', system-ui, sans-serif",
                transition: 'all 0.15s',
              }}
            >{c.label}</button>
          ))}
        </div>

        {/* Events list */}
        {loading ? (
          <div style={{
            textAlign: 'center', padding: '3rem',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '0.95rem', color: '#8B7355', fontStyle: 'italic',
          }}>Loading events...</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}>
            <p style={{ fontSize: '1rem', color: '#8B7355', fontStyle: 'italic', marginBottom: '0.5rem' }}>
              No upcoming events in this category.
            </p>
            <p style={{ fontSize: '0.78rem', color: '#8B7355' }}>
              Check back soon — or{' '}
              <button
                onClick={() => setFilter('all')}
                style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit', textDecoration: 'underline' }}
              >view all events</button>.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <button
              onClick={() => setShowPast(v => !v)}
              style={{
                background: 'none', border: 'none',
                fontSize: '0.72rem', color: '#8B7355',
                cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif",
                padding: 0, letterSpacing: '0.04em',
              }}
            >
              {showPast ? '▲ Hide past events' : `▼ View ${past.length} past event${past.length !== 1 ? 's' : ''}`}
            </button>
            {showPast && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem', opacity: 0.6 }}>
                {past.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            )}
          </div>
        )}

        {/* Admin note */}
        <div style={{
          marginTop: '2.5rem',
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: '3px',
          padding: '0.85rem 1rem',
          fontSize: '0.75rem',
          color: '#8B7355',
          lineHeight: 1.7,
          fontStyle: 'italic',
          fontFamily: "'Cormorant Garamond', Georgia, serif",
        }}>
          To add an event: Supabase Dashboard → Table Editor → events → Insert row.
          Set status to 'published' to make it live immediately.
        </div>
      </div>
    </div>
  )
}
