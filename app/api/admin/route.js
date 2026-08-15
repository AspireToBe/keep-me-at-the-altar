import { getSupabaseAdmin } from '@/lib/supabase'

const ADMINS = (process.env.ADMIN_EMAILS || '').split(',')

export async function GET(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!ADMINS.includes(email)) {
      return Response.json({ error: 'Unauthorised' }, { status: 403 })
    }

    const { data } = await supabaseAdmin
      .from('testimonies')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    return Response.json(data || [])

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { email, id, status } = await request.json()

    if (!ADMINS.includes(email)) {
      return Response.json({ error: 'Unauthorised' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('testimonies')
      .update({
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', id)

    if (error) throw error

    return Response.json({ success: true })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}