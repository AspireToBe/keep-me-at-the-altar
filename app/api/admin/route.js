import { supabaseAdmin } from '@/lib/supabase'

const ADMINS = (process.env.ADMIN_EMAILS || '').split(',')

// GET — fetch pending testimonies
export async function GET(request) {
  try {
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

// PATCH — approve or reject a testimony
export async function PATCH(request) {
  try {
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