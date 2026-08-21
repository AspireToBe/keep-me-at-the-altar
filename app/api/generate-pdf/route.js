import { exec } from 'child_process';
import { readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json();
    const name = body.name || 'Believer';
    const level = body.level || 'Standard';
    const altar_day = body.altar_day || 'Saturday';
    const altar_days = body.altar_days || [];
    const anchor_months = body.anchor_months || ['January', 'July', 'December'];
    const active_months = body.active_months || [];
    const day_intentions = body.day_intentions || {};
    const altar_only = body.altar_only === true || body.altar_only === 'true';

    console.log('altar_only received:', body.altar_only, '-> parsed:', altar_only);

    const ts = Date.now();
    const outPath = path.join(tmpdir(), `journal_${ts}.pdf`);
    const scriptPath = path.join(process.cwd(), 'scripts', 'altar_year_pdf_v2.py');

    const config = JSON.stringify({
      name, level, altar_day, altar_days,
      anchor_months, active_months, day_intentions,
      altar_only
    });

    console.log('Sending config:', config);

    await new Promise((resolve, reject) => {
      const child = exec(
        `python3 "${scriptPath}" - "${outPath}"`,
        { timeout: 120000 },
        (err, stdout, stderr) => {
          if (err) { console.error('Python error:', stderr); reject(new Error(stderr || err.message)); }
          else { console.log('Python done'); resolve(); }
        }
      );
      child.stdin.write(config);
      child.stdin.end();
    });

    const buf = await readFile(outPath);
    await unlink(outPath).catch(() => {});

    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = altar_only
      ? `KeepMeAtTheAltar_${safeName}_AltarDays.pdf`
      : `KeepMeAtTheAltar_${safeName}.pdf`;

    console.log('Sending filename:', filename, 'altar_only:', altar_only);

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (err) {
    console.error('PDF route error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
