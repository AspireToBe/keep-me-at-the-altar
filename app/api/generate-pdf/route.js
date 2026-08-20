import { exec } from 'child_process';
import { readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, level, altar_day, altar_days, anchor_months, active_months, day_intentions, altar_only } = body;

    const outPath = path.join(tmpdir(), `journal_${Date.now()}.pdf`);
    const args = JSON.stringify({ name, level, altar_day, altar_days, anchor_months, active_months, day_intentions, altar_only });
    const scriptPath = path.join(process.cwd(), 'scripts', 'altar_year_pdf_v2.py');

    await new Promise((resolve, reject) => {
      exec(`python3 "${scriptPath}" '${args}' "${outPath}"`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const buf = await readFile(outPath);
    await unlink(outPath);

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
    return Response.json({ error: err.message }, { status: 500 });
  }
}
