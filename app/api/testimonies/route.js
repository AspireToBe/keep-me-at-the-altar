import { supabaseAdmin } from '@/lib/supabase'

// GET — fetch approved testimonies
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    let query = supabaseAdmin
      .from('testimonies')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (month && month !== 'all') {
      query = query.eq('month', month)
    }

    const { data } = await query
    return Response.json(data || [])

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// POST — submit a testimony
export async function POST(request) {
  try {
    const { email, month, content, name, anonymous } = await request.json()

    let user_id = null

    if (!anonymous && email) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single()
      if (user) user_id = user.id
    }

    const { error } = await supabaseAdmin
      .from('testimonies')
      .insert({
        user_id,
        month,
        content: content.slice(0, 600),
        name: anonymous ? null : name,
        status: 'pending'
      })

    if (error) throw error

    return Response.json({ success: true })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}