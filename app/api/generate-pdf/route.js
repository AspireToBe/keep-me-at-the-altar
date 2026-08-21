import { exec } from 'child_process';
import { readFile, writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, level, altar_day, altar_days, anchor_months, active_months, day_intentions, altar_only } = body;

    const ts = Date.now();
    const outPath = path.join(tmpdir(), `journal_${ts}.pdf`);
    const argsPath = path.join(tmpdir(), `args_${ts}.json`);
    const scriptPath = path.join(process.cwd(), 'scripts', 'altar_year_pdf_v2.py');

    const config = {
      name: name || 'Believer',
      level: level || 'Standard',
      altar_day: altar_day || 'Saturday',
      altar_days: altar_days || [],
      anchor_months: anchor_months || ['January', 'July', 'December'],
      active_months: active_months || [],
      day_intentions: day_intentions || {},
      altar_only: altar_only === true || altar_only === 'true'
    };

    console.log('PDF config:', JSON.stringify(config));

    await writeFile(argsPath, JSON.stringify(config), 'utf8');

    // Try multiple python paths
    const pythonCmds = ['python3', '/usr/bin/python3', 'python'];
    let lastErr = null;

    for (const python of pythonCmds) {
      try {
        await new Promise((resolve, reject) => {
          const cmd = `${python} "${scriptPath}" "@${argsPath}" "${outPath}"`;
          console.log('Running:', cmd);
          exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
            if (err) {
              console.error(`${python} failed:`, stderr);
              reject(new Error(stderr || err.message));
            } else {
              console.log('Success with', python);
              resolve();
            }
          });
        });
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        continue;
      }
    }

    if (lastErr) throw lastErr;

    await unlink(argsPath).catch(() => {});
    const buf = await readFile(outPath);
    await unlink(outPath).catch(() => {});

    const safeName = (name || 'Journal').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = config.altar_only
      ? `KeepMeAtTheAltar_${safeName}_AltarDays.pdf`
      : `KeepMeAtTheAltar_${safeName}.pdf`;

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (err) {
    console.error('PDF error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
