// src/components/FoundationGuide.jsx
// Section 1 — Foundation: Why fast, Types of fasting, When to fast
import { useState } from 'react'

const S = {
  serif: "'Cormorant Garamond', Georgia, serif",
  sans:  'Inter, system-ui, sans-serif',
  gold:     '#C9A84C',
  goldDim:  '#8B6E2A',
  goldPale: 'rgba(201,168,76,0.1)',
  altar:    '#1C1410',
  warmDark: '#2E2018',
  warmSub:  '#6B5540',
  warmMuted:'#8B7355',
  warmBorder:'#D4C4A8',
  parchment:'#F7F3EC',
}

const FAST_TYPES = [
  {
    tag: 'Extreme urgency',
    name: 'Absolute fast',
    short: 'No food or water. Reserved for extreme spiritual urgency.',
    detail: 'Based on Esther 4:16 and Acts 9:9. Limit to 1–3 days maximum. Always seek medical counsel. Not recommended without strong spiritual prompting and pastoral covering.',
    when: 'Crisis intercession, life-or-death situations, extreme spiritual urgency. Never routine.',
  },
  {
    tag: 'Most common',
    name: 'Normal / total fast',
    short: 'Water only, no food. The most common biblical fast.',
    detail: 'Ideal for 1, 3, 7, or 21 days. Focuses the mind and body entirely on spiritual seeking. Jesus fasted this way for forty days (Matthew 4:2).',
    when: 'Major decisions, breakthrough seasons, consecration, and serious spiritual seeking.',
  },
  {
    tag: 'Extended seasons',
    name: 'Daniel fast',
    short: 'Vegetables, fruits, water, and wholegrains only.',
    detail: 'No meat, sweets, or processed foods (Daniel 1:12, 10:3). Ideal for extended fasts of 21 days. Accessible, sustainable, and deeply transformational for prayer and study.',
    when: 'Extended fasting seasons (7–21 days), sustained prayer and study, accessible long-term consecration.',
  },
  {
    tag: 'Daily rhythm',
    name: 'Intermittent / partial fast',
    short: 'Eating only during set windows — e.g. 6am–12pm or breaking fast at 3pm.',
    detail: 'Excellent for daily fasting practice, busy seasons, or building consistency alongside other disciplines. Breaking at 3pm (the hour of prayer) is a powerful anchor.',
    when: 'Daily spiritual rhythm, busy seasons, building fasting consistency over time.',
  },
  {
    tag: 'Mental space',
    name: 'Media / sensory fast',
    short: 'Abstain from social media, television, entertainment, or noise.',
    detail: 'Often paired with food fasting. Reclaims time and mental space for God\'s voice. Especially powerful in distracted cultural seasons — when the noise is loud and the signal is quiet.',
    when: 'Mental recalibration, hearing God\'s voice, breaking distraction and digital dependency.',
  },
  {
    tag: 'Community',
    name: 'Corporate / congregational fast',
    short: 'Fasting in unity with a church body or prayer group.',
    detail: 'Multiplies spiritual authority (Joel 2:15–16). Powerfully effective for community breakthroughs, revival, and intercession for nations. The disciples fasted together before Pentecost.',
    when: 'Church-wide breakthrough, united intercession, revival, and community-level spiritual authority.',
  },
]

const DECISIONS = [
  { title: 'Marriage',               desc: 'Before saying yes, before proposing, or before committing your life to another person. Fast and pray until you have peace, not just excitement.' },
  { title: 'Career and job',         desc: 'Before accepting a new role, resigning from a position, or launching a business venture. What looks like opportunity may be distraction.' },
  { title: 'Housing and relocation', desc: 'Before signing leases, purchasing property, or making a significant move. Your dwelling impacts your divine assignment.' },
  { title: 'Finances and investment',desc: 'Before major financial decisions, substantial purchases, or entering into business partnerships. Ensure stewardship aligned with God\'s principles.' },
  { title: 'Ministry and calling',   desc: 'Before stepping into leadership, accepting a ministry role, or launching a new work for the Kingdom. Confirm His clear call and anointing.' },
  { title: 'Family and relationships',desc:'Before major family decisions, pursuing reconciliation, or discerning whether to cut ties. Fast when relationships are at a crossroads.' },
]

const BREAKTHROUGHS = [
  { title: 'Healing',           desc: 'When you or a loved one faces illness — whether physical, emotional, or spiritual. The focused prayer of a fasting believer carries unusual authority and can unlock divine healing.' },
  { title: 'Deliverance',       desc: 'Some things, as scripture teaches, only come out by prayer and fasting (Matthew 17:21). When someone is bound by destructive patterns, addictions, or spiritual strongholds.' },
  { title: 'Spiritual dryness', desc: 'When you feel distant from God, disconnected, or spiritually cold, fast your way back into His presence. The act of denying your flesh reignites a hunger for God.' },
  { title: 'Waiting seasons',   desc: 'When you are in a prolonged season of waiting for a promise, breakthrough, or divine intervention — fast to sustain your faith and keep your spirit alert.' },
]

function Blockquote({ text, cite }) {
  return (
    <div style={{ borderLeft: `2px solid ${S.gold}`, padding: '1rem 1.25rem', background: '#fff', borderRadius: '0 3px 3px 0', margin: '1.5rem 0' }}>
      <p style={{ fontFamily: S.serif, fontSize: '1rem', color: S.warmDark, lineHeight: 1.75, fontStyle: 'italic' }}>{text}</p>
      {cite && <cite style={{ fontSize: '0.75rem', color: S.warmMuted, display: 'block', marginTop: '0.5rem', fontStyle: 'normal' }}>{cite}</cite>}
    </div>
  )
}

function TabWhy() {
  return (
    <div style={{ padding: '2rem 1.5rem' }}>
      <span style={eyebrow}>The ancient discipline</span>
      <h2 style={secTitle}>Why fast? The ancient discipline that changes everything</h2>
      <p style={secBody}>
        At its core, biblical fasting is far more than abstaining from food. It is a spiritual discipline — a deliberate, temporary denial of something physical for intensified prayer, spiritual clarity, and deeper encounter with God. Fasting is <em>not</em> a diet plan, and it is not a way to earn God's favour or control His will. It is an act of humble worship, a declaration of earnest seeking, and a direct expression of longing for Him above all else.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: S.warmBorder, border: `1px solid ${S.warmBorder}`, borderRadius: '3px', overflow: 'hidden', margin: '1.5rem 0' }}>
        {[
          { title: 'Fasting humbles',  body: 'It cultivates humility and reminds us of our dependence on God and His boundless provision. When we fast, we acknowledge that we need Him more than we need food.' },
          { title: 'Fasting focuses',  body: 'It removes distractions, sharpens spiritual discernment, and helps us tune into God\'s voice with greater clarity. The noise quiets. His voice becomes clearer.' },
          { title: 'Fasting releases', body: 'It becomes a catalyst for spiritual freedom, breaking strongholds and unlocking God\'s power in our lives in ways that prayer alone sometimes does not.' },
        ].map(c => (
          <div key={c.title} style={{ background: S.parchment, padding: '1.25rem' }}>
            <div style={{ fontFamily: S.serif, fontSize: '1.05rem', color: S.altar, marginBottom: '0.4rem', fontWeight: 500 }}>{c.title}</div>
            <div style={{ fontSize: '0.8rem', color: S.warmSub, lineHeight: 1.65 }}>{c.body}</div>
          </div>
        ))}
      </div>

      <p style={secBody}>
        Scriptures like Isaiah 58, Matthew 6:16–18, and Joel 2:12 reveal a God who sees and rewards those who seek Him through fasting and prayer. When we fast, we make room for the Holy Spirit to move, hear His voice with greater clarity, and align our hearts with His purposes. It sharpens spiritual sensitivity, breaks strongholds, and aligns our will with God's perfect plan, producing real breakthrough in our faith journey.
      </p>

      <Blockquote
        text='"But when you fast, anoint your head and wash your face, that your fasting may not be seen by others but by your Father who is in secret. And your Father who sees in secret will reward you."'
        cite="— Matthew 6:17–18 (ESV)"
      />
    </div>
  )
}

function TabTypes() {
  const [expanded, setExpanded] = useState(null)

  function toggle(i) {
    setExpanded(expanded === i ? null : i)
  }

  return (
    <div style={{ padding: '2rem 1.5rem' }}>
      <span style={eyebrow}>Choosing wisely</span>
      <h2 style={secTitle}>Understanding the types of fasting</h2>
      <p style={secBody}>
        Scripture and Christian tradition offer a range of approaches, each suited to different seasons, spiritual goals, and physical capacities. Choosing the right type of fast is not a legalistic exercise — it is a prayerful act of wisdom and discernment. Each fast serves a different season. Match the fast to the moment, not the other way around.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem', margin: '1.25rem 0' }}>
        {FAST_TYPES.map((f, i) => {
          const open = expanded === i
          return (
            <div
              key={f.name}
              onClick={() => toggle(i)}
              style={{
                background: open ? S.goldPale : '#fff',
                border: `1px solid ${open ? S.gold : S.warmBorder}`,
                borderRadius: '3px', padding: '1.1rem',
                cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
              }}
            >
              <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', fontSize: '0.68rem', color: S.warmMuted }}>
                {open ? '— close' : '+ expand'}
              </span>
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: S.goldDim, background: S.goldPale, padding: '0.18rem 0.45rem', borderRadius: '2px', display: 'inline-block', marginBottom: '0.5rem' }}>{f.tag}</span>
              <div style={{ fontFamily: S.serif, fontSize: '1.05rem', color: S.altar, marginBottom: '0.3rem', fontWeight: 500 }}>{f.name}</div>
              <div style={{ fontSize: '0.78rem', color: S.warmMuted, lineHeight: 1.5 }}>{f.short}</div>
              {open && (
                <div style={{ fontSize: '0.8rem', color: S.warmSub, lineHeight: 1.65, marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${S.warmBorder}` }}>
                  {f.detail}
                  <div style={{ marginTop: '0.5rem', fontSize: '0.72rem' }}>
                    <span style={{ color: S.goldDim, fontWeight: 500 }}>When to use it: </span>
                    <span style={{ color: S.warmSub }}>{f.when}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '3px', padding: '0.85rem 1rem', fontSize: '0.78rem', color: S.warmSub, lineHeight: 1.6, marginTop: '1.25rem' }}>
        Always consult your physician before beginning any extended fast, especially if you have underlying health conditions. Fasting is a spiritual discipline, not a form of self-punishment. Honour the temple of the Holy Spirit with wisdom.
      </div>
    </div>
  )
}

function TabWhen() {
  return (
    <div style={{ padding: '2rem 1.5rem' }}>
      <span style={eyebrow}>Spirit-led · Any time of year</span>
      <h2 style={secTitle}>When to fast: situational and special occasion fasting</h2>
      <p style={secBody}>
        Beyond the monthly fasting calendar are moments that call for a set-apart fast. These are not scheduled — they are Spirit-led responses to specific seasons, decisions, and needs. This approach is not legalism; it is a deeper, responsive walk with God, allowing the Holy Spirit to lead you into intensified seeking.
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontFamily: S.serif, fontSize: '1.1rem', color: S.altar, fontWeight: 500, marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${S.warmBorder}` }}>
          Fast when you face a major decision
        </h3>
        <p style={{ ...secBody, marginBottom: '1rem' }}>
          Crucial crossroads in life demand dedicated prayer and fasting. These moments call for spiritual discernment and clarity about God's will. By setting aside physical comforts, we show our earnest desire to hear from Him, trusting His wisdom above our own understanding or worldly advice.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {DECISIONS.map(d => (
            <div key={d.title} style={{ background: '#fff', border: `1px solid ${S.warmBorder}`, borderRadius: '3px', padding: '1rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 500, color: S.altar, marginBottom: '0.3rem' }}>{d.title}</div>
              <div style={{ fontSize: '0.76rem', color: S.warmSub, lineHeight: 1.55 }}>{d.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ fontFamily: S.serif, fontSize: '1.1rem', color: S.altar, fontWeight: 500, marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${S.warmBorder}` }}>
          Fast when you need a breakthrough
        </h3>
        <p style={{ ...secBody, marginBottom: '1rem' }}>
          There are moments when circumstances seem insurmountable, or spiritual oppression feels heavy. Fasting in these seasons can shift the spiritual atmosphere, inviting God's intervention and releasing His power in tangible ways, leading to profound breakthroughs.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
          {BREAKTHROUGHS.map(b => (
            <div key={b.title} style={{ background: '#fff', border: `1px solid ${S.warmBorder}`, borderLeft: `3px solid ${S.gold}`, borderRadius: '0 3px 3px 0', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 500, color: S.altar, marginBottom: '0.25rem' }}>{b.title}</div>
              <div style={{ fontSize: '0.75rem', color: S.warmSub, lineHeight: 1.5 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <Blockquote text='"You don\'t need a calendar date to call a fast. When heaven feels silent and the decision feels heavy — that is your invitation to the altar. It\'s in these moments of surrendered seeking that God often reveals His deepest truths and delivers His most powerful interventions."' />
    </div>
  )
}

const eyebrow  = { fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: S.gold, display: 'block', marginBottom: '0.75rem' }
const secTitle = { fontFamily: S.serif, fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 500, color: S.altar, marginBottom: '0.6rem', lineHeight: 1.2 }
const secBody  = { fontSize: '0.85rem', color: S.warmSub, lineHeight: 1.8, maxWidth: '580px', marginBottom: '0' }

const TABS = [
  { id: 'why',   label: 'Why fast?',          Component: TabWhy   },
  { id: 'types', label: 'Types of fasting',   Component: TabTypes },
  { id: 'when',  label: 'When to fast',       Component: TabWhen  },
]

export default function FoundationGuide() {
  const [activeTab, setActiveTab] = useState('why')
  const ActiveComponent = TABS.find(t => t.id === activeTab).Component

  return (
    <div>
      {/* Section header */}
      <div style={{ background: S.altar, padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <span style={{ ...eyebrow, color: S.gold }}>Section 1 — Foundation</span>
          <h2 style={{ fontFamily: S.serif, fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 500, color: '#F7F3EC', marginBottom: '0.5rem' }}>
            Before you begin
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(247,243,236,0.55)', maxWidth: '500px', lineHeight: 1.7 }}>
            Everything you need to understand about biblical fasting before you open the journal — why, when, and how.
          </p>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${S.warmBorder}` }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '0.6rem 1.1rem',
                fontSize: '0.75rem',
                letterSpacing: '0.04em',
                color: activeTab === t.id ? S.goldDim : S.warmMuted,
                cursor: 'pointer',
                border: 'none',
                borderBottom: `2px solid ${activeTab === t.id ? S.gold : 'transparent'}`,
                marginBottom: '-1px',
                background: 'none',
                fontFamily: S.sans,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active tab content */}
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <ActiveComponent />
      </div>
    </div>
  )
}
