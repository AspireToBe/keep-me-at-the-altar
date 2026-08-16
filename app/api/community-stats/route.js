import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const currentMonth = new Date().toLocaleString('default', { month: 'long' })

    // Total users
    const { count: total_users } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Fasting this month — users whose anchor_months or active_months include current month
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('anchor_months, active_months')

    const fasting_this_month = (users || []).filter(u => {
      const anchors = u.anchor_months || []
      const active = u.active_months || []
      return anchors.includes(currentMonth) || active.includes(currentMonth)
    }).length

    // Countries — placeholder until we collect location data
    const countries = 1

    return Response.json({
      fasting_this_month,
      total_users: total_users || 0,
      countries,
      month: currentMonth
    })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
