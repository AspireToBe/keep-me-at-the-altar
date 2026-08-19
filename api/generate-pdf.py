import sys
import os
import json
import tempfile

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)

            name = data.get('name', 'Believer')
            level = data.get('level', 'Standard')
            altar_day = data.get('altar_day', 'Saturday')
            anchor_months = data.get('anchor_months', ['January', 'July', 'December'])
            active_months = data.get('active_months', [])

            # Generate PDF to temp file
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
                output_path = f.name

            # Import and run the generator
            import altar_year_pdf_v2 as gen
            gen.build_pdf(
                output_path=output_path,
                user_name=name,
                fasting_level=level,
                altar_day=altar_day,
                anchor_months=anchor_months,
            )

            with open(output_path, 'rb') as f:
                pdf_bytes = f.read()

            os.unlink(output_path)

            filename = f"KeepMeAtTheAltar_{name.replace(' ', '_')}.pdf"

            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', str(len(pdf_bytes)))
            self.end_headers()
            self.wfile.write(pdf_bytes)

        except Exception as e:
            error = json.dumps({'error': str(e)}).encode()
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(error)))
            self.end_headers()
            self.wfile.write(error)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
