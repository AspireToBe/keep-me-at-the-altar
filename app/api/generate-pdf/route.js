import { exec } from 'child_process';
import { readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, level, altar_day, altar_days, anchor_months, active_months, day_intentions, altar_only } = body;

    const ts = Date.now();
    const outPath = path.join(tmpdir(), `journal_${ts}.pdf`);
    const scriptPath = path.join(process.cwd(), 'scripts', 'altar_year_pdf_v2.py');

    const config = JSON.stringify({
      name: name || 'Believer',
      level: level || 'Standard',
      altar_day: altar_day || 'Saturday',
      altar_days: altar_days || [],
      anchor_months: anchor_months || ['January', 'July', 'December'],
      active_months: active_months || [],
      day_intentions: day_intentions || {},
      altar_only: altar_only === true || altar_only === 'true'
    });

    console.log('Config:', config);

    await new Promise((resolve, reject) => {
      const child = exec(
        `python3 "${scriptPath}" - "${outPath}"`,
        { timeout: 120000 },
        (err, stdout, stderr) => {
          if (err) { console.error('Error:', stderr); reject(new Error(stderr || err.message)); }
          else resolve();
        }
      );
      child.stdin.write(config);
      child.stdin.end();
    });

    const buf = await readFile(outPath);
    await unlink(outPath).catch(() => {});

    const safeName = (name || 'Journal').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = (altar_only === true || altar_only === 'true')
      ? `KeepMeAtTheAltar_${safeName}_AltarDays.pdf`
      : `KeepMeAtTheAltar_${safeName}.pdf`;

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
