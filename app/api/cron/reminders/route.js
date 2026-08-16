import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

// Vercel Cron — runs daily at 6am UTC
// Add to vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 6 * * *" }] }

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabaseAdmin = getSupabaseAdmin()

  const today = new Date()
  const currentMonth = today.toLocaleString('default', { month: 'long' })
  const dayName = today.toLocaleString('default', { weekday: 'long' })

  // Get all users with email reminders enabled
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email_reminders', true)

  if (!users || users.length === 0) {
    return Response.json({ sent: 0 })
  }

  let sent = 0

  for (const user of users) {
    const anchors = user.anchor_months || []
    const active = user.active_months || []
    const allMonths = [...anchors, ...active]
    const isAltarDay = user.altar_day === dayName
    const isFastingMonth = allMonths.includes(currentMonth)

    if (!isFastingMonth && !isAltarDay) continue

    const subject = isAltarDay
      ? `Your ${dayName} Altar Day — Keep Me At The Altar`
      : `Fasting day reminder — ${currentMonth}`

    const bodyText = isAltarDay
      ? `Today is your ${dayName} Altar Day — your weekly reset. Set aside time this morning to fast, listen, and align with God. Open your journal at keepmeatthealtar.org/journal`
      : `You are fasting this month in ${currentMonth}. Open your journal to record what God is saying to you today. keepmeatthealtar.org/journal`

    try {
      await resend.emails.send({
        from: 'Keep Me At The Altar <journal@keepmeatthealtar.org>',
        to: user.email,
        subject,
        html: `
          <div style="font-family:Georgia,serif;max-width:500px;margin:0 auto;padding:2rem;background:#F7F4EF">
            <p style="color:#A67C2E;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-family:sans-serif;margin-bottom:0.5rem">KEEP ME AT THE ALTAR™</p>
            <h1 style="color:#1E1B16;font-size:1.4rem;margin-bottom:1rem">${subject}</h1>
            <p style="color:#5A5347;line-height:1.7;margin-bottom:1.5rem">${bodyText}</p>
            <a href="https://keepmeatthealtar.org/journal"
               style="background:#A67C2E;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-family:sans-serif;font-size:14px">
              Open my journal →
            </a>
            <p style="color:#BFB49A;font-size:11px;margin-top:2rem;font-family:sans-serif">
              You are receiving this because you set up fasting reminders at keepmeatthealtar.org.<br>
              <a href="https://keepmeatthealtar.org" style="color:#A67C2E">Manage reminders</a>
            </p>
          </div>
        `
      })
      sent++
    } catch (e) {
      console.error('Email failed for', user.email, e.message)
    }
  }

  return Response.json({ sent, month: currentMonth, day: dayName })
}
