import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const supabaseAdmin = getSupabaseAdmin()
    const { email } = await request.json()

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: 'https://keepmeatthealtar.org/journal'
      }
    })

    if (error) throw error

    const link = data?.properties?.action_link
    if (!link) throw new Error('Could not generate magic link')

    await resend.emails.send({
      from: 'Keep Me At The Altar <journal@keepmeatthealtar.org>',
      to: email,
      subject: 'Your journal link — Keep Me At The Altar',
      html: `
        <div style="font-family:Georgia,serif;max-width:500px;margin:0 auto;padding:2rem;background:#F7F4EF">
          <h1 style="color:#A67C2E;font-size:1.5rem;margin-bottom:0.5rem">Keep Me At The Altar™</h1>
          <p style="color:#5A5347;margin-bottom:1.5rem">Click the link below to open your journal. The link expires in 24 hours.</p>
          <a href="${link}" 
             style="background:#A67C2E;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">
            Open my journal →
          </a>
          <p style="color:#BFB49A;font-size:12px;margin-top:2rem">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `
    })

    return Response.json({ success: true })

  } catch (err) {
    console.error('Magic link error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}