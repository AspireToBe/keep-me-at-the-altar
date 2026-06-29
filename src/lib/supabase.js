// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────
// Replace these two values with your own from:
// Supabase Dashboard > Project Settings > API
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = 'https://YOUR_PROJECT_REF.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── AUTH ──────────────────────────────────────────────────────

// Send magic link. Supabase emails the user a sign-in link.
// No password ever set or stored.
export async function sendMagicLink(email, displayName) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
      data: { display_name: displayName },  // stored in profile on first sign-in
    },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── PROFILE ───────────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  if (error) throw error
}

// ── ALTAR ENTRIES ─────────────────────────────────────────────

export async function getAltarEntry(userId, month, weekNumber) {
  const { data, error } = await supabase
    .from('altar_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('week_number', weekNumber)
    .maybeSingle()
  if (error) throw error
  return data
}

// Upsert — creates if not exists, updates if it does
export async function saveAltarEntry(userId, month, weekNumber, fields) {
  const { error } = await supabase
    .from('altar_entries')
    .upsert({
      user_id: userId,
      month,
      week_number: weekNumber,
      ...fields,
      saved_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,month,week_number',
    })
  if (error) throw error
}

// ── MONTHLY REFLECTIONS ───────────────────────────────────────

export async function getMonthlyReflection(userId, month) {
  const { data, error } = await supabase
    .from('monthly_reflections')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveMonthlyReflection(userId, month, fields) {
  const { error } = await supabase
    .from('monthly_reflections')
    .upsert({
      user_id: userId,
      month,
      ...fields,
      saved_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,month',
    })
  if (error) throw error
}

// ── TESTIMONIES ───────────────────────────────────────────────

// Fetch published testimonies, with reaction counts
export async function getTestimonies(category = null) {
  let query = supabase
    .from('testimony_feed')   // uses our view
    .select('*')
    .order('created_at', { ascending: false })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// Submit a new testimony (starts as 'pending')
export async function submitTestimony(userId, displayName, body, category, month) {
  const { error } = await supabase
    .from('testimonies')
    .insert({
      user_id: userId,
      display_name: displayName,
      body,
      category,
      month,
      status: 'pending',
    })
  if (error) throw error
}

// Admin only — update testimony status
export async function updateTestimonyStatus(testimonyId, status) {
  const { error } = await supabase
    .from('testimonies')
    .update({ status })
    .eq('id', testimonyId)
  if (error) throw error
}

// Admin: fetch all pending testimonies
export async function getPendingTestimonies() {
  const { data, error } = await supabase
    .from('testimonies')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ── REACTIONS ─────────────────────────────────────────────────

// Get all reaction types the current user has made on a set of testimonies
export async function getUserReactions(userId, testimonyIds) {
  if (!userId || !testimonyIds.length) return {}
  const { data, error } = await supabase
    .from('reactions')
    .select('testimony_id, type')
    .eq('user_id', userId)
    .in('testimony_id', testimonyIds)
  if (error) throw error
  // Return as { testimonyId: Set<type> }
  const map = {}
  for (const r of (data ?? [])) {
    if (!map[r.testimony_id]) map[r.testimony_id] = new Set()
    map[r.testimony_id].add(r.type)
  }
  return map
}

// Toggle a reaction on/off
export async function toggleReaction(userId, testimonyId, type) {
  // Check if reaction already exists
  const { data } = await supabase
    .from('reactions')
    .select('id')
    .eq('user_id', userId)
    .eq('testimony_id', testimonyId)
    .eq('type', type)
    .maybeSingle()

  if (data) {
    // Remove it
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', data.id)
    if (error) throw error
    return false // now inactive
  } else {
    // Add it
    const { error } = await supabase
      .from('reactions')
      .insert({ user_id: userId, testimony_id: testimonyId, type })
    if (error) throw error
    return true // now active
  }
}

// ── COMMENTS ─────────────────────────────────────────────────

export async function getComments(testimonyId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('testimony_id', testimonyId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addComment(userId, testimonyId, displayName, body) {
  const { error } = await supabase
    .from('comments')
    .insert({ user_id: userId, testimony_id: testimonyId, display_name: displayName, body })
  if (error) throw error
}

// ── COUNTERS & STATS ──────────────────────────────────────────

// Increment download counter — no auth needed
export async function incrementDownloads() {
  const { error } = await supabase.rpc('increment_counter', {
    counter_key: 'downloads',
  })
  if (error) console.error('Counter error:', error)
}

// Increment altar day counter when a user saves a night entry
export async function incrementAltarDays() {
  const { error } = await supabase.rpc('increment_counter', {
    counter_key: 'altar_days',
  })
  if (error) console.error('Counter error:', error)
}

// Get all platform stats in one query — public, no auth needed
// Returns: { downloads, altar_days, fasting_now, testimonies }
export async function getPlatformStats() {
  const { data, error } = await supabase
    .from('platform_stats')
    .select('*')
    .single()
  if (error) throw error
  return data
}

// Update fast status on profile — used when user toggles fast on/off
export async function setFastStatus(userId, onFast, fastType = null, fastDay = 1) {
  const { error } = await supabase
    .from('profiles')
    .update({
      on_fast:   onFast,
      fast_type: fastType,
      fast_day:  fastDay,
    })
    .eq('id', userId)
  if (error) throw error
}

// ── EVENTS ────────────────────────────────────────────────────

// Get all upcoming published events, newest first
export async function getEvents(category = null) {
  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('event_date', new Date().toISOString().split('T')[0]) // today or future
    .order('event_date', { ascending: true })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// Get past events (for archive)
export async function getPastEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .lt('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: false })
    .limit(20)
  if (error) throw error
  return data ?? []
}
