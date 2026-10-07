import { removeBackground } from '@imgly/background-removal-node';
import fs from 'fs';
const IMG = 'C:/Users/Owner/AppData/Local/Temp/claude/C--Users-Owner--claude/59b7a229-95ca-4dfa-aaba-feb2f5c0794f/images';
const OUT = 'C:/Users/Owner/AppData/Local/Temp/claude/C--Users-Owner--claude/59b7a229-95ca-4dfa-aaba-feb2f5c0794f/scratchpad';
for (const n of ['2', '1']) {
  const buf = fs.readFileSync(`${IMG}/${n}.jpg`);
  const blob = new Blob([buf], { type: 'image/jpeg' });
  const t = Date.now();
  const res = await removeBackground(blob, { model: 'medium', output: { format: 'image/png' } });
  fs.writeFileSync(`${OUT}/cut-${n}.png`, Buffer.from(await res.arrayBuffer()));
  console.log('done', n, Date.now() - t, 'ms');
}
