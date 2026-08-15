import { readFileSync } from 'fs';
import path from 'path';

export default function Home() {
  const html = readFileSync(path.join(process.cwd(), 'public', 'index.html'), 'utf8');
  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}
