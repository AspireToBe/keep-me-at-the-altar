import { exec } from 'child_process';
import { readFile, writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, level, altar_day, altar_days, anchor_months, active_months, day_intentions, altar_only } = body;

    const uid = randomUUID();
    const outPath = path.join(tmpdir(), `journal_${uid}.pdf`);
    const argsPath = path.join(tmpdir(), `args_${uid}.json`);
    const scriptPath = path.join(process.cwd(), 'scripts', 'altar_year_pdf_v2.py');

    await writeFile(argsPath, JSON.stringify({
      name, level, altar_day,
      altar_days: altar_days || [],
      anchor_months: anchor_months || ['January', 'July', 'December'],
      active_months: active_months || [],
      day_intentions: day_intentions || {},
      altar_only: altar_only || false
    }));

    await new Promise((resolve, reject) => {
      exec(`python3 "${scriptPath}" "@${argsPath}" "${outPath}"`, (err, stdout, stderr) => {
        if (err) { console.error('PDF error:', stderr); reject(new Error(stderr || err.message)); }
        else resolve();
      });
    });

    await unlink(argsPath).catch(() => {});
    const buf = await readFile(outPath);
    await unlink(outPath).catch(() => {});

    const filename = altar_only
      ? `KeepMeAtTheAltar_${name}_AltarDays.pdf`
      : `KeepMeAtTheAltar_${name}.pdf`;

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (err) {
    console.error('PDF route error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
