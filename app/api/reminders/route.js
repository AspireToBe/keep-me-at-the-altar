import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { email, name, anchor_months, active_months, altar_day } = await request.json()

    // Save reminder preferences to user record
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (user) {
      await supabaseAdmin
        .from('users')
        .update({
          name,
          anchor_months,
          active_months,
          altar_day,
          email_reminders: true
        })
        .eq('id', user.id)
    } else {
      await supabaseAdmin
        .from('users')
        .insert({
          email,
          name,
          anchor_months,
          active_months,
          altar_day,
          email_reminders: true
        })
    }

    return Response.json({ success: true })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
