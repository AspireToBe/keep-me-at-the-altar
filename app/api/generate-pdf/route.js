export async function POST(request) {
  try {
    const body = await request.json()
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/generate-pdf-py`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error('PDF generation failed')
    const buf = await res.arrayBuffer()
    const name = body.name || 'Journal'
    return new Response(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KeepMeAtTheAltar_${name}.pdf"`,
      },
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
