import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const month = searchParams.get('month')

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (!user) return Response.json([])

    const { data } = await supabaseAdmin
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)

    return Response.json(data || [])

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { email, month, day_number, entry_type, field_key, content } = await request.json()

    let { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (!user) {
      const { data: newUser } = await supabaseAdmin
        .from('users')
        .insert({ email })
        .select('id')
        .single()
      user = newUser
    }

    const { error } = await supabaseAdmin
      .from('journal_entries')
      .upsert({
        user_id: user.id,
        month,
        day_number,
        entry_type,
        field_key,
        content,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,month,day_number,entry_type,field_key'
      })

    if (error) throw error

    return Response.json({ success: true })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}