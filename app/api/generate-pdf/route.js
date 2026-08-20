import { exec } from 'child_process';
import { readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, level, altar_day, anchor_months, active_months } = body;

    const outPath = path.join(tmpdir(), `journal_${Date.now()}.pdf`);
    const args = JSON.stringify({ name, level, altar_day, anchor_months, active_months });
    const scriptPath = path.join(process.cwd(), 'scripts', 'altar_year_pdf_v2.py');

    await new Promise((resolve, reject) => {
      exec(`python3 "${scriptPath}" '${args}' "${outPath}"`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const buf = await readFile(outPath);
    await unlink(outPath);

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KeepMeAtTheAltar_${name}.pdf"`,
      },
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
