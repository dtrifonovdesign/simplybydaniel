// Shrinks the textures inside a .glb (the Briks plank was ~4 MB). Run: node tools/optimize-glb.mjs <in.glb> <out.glb> [maxSize]
import sharp from 'sharp';
import fs from 'node:fs';

const [inp, out, max = '1024'] = process.argv.slice(2);
const buf = fs.readFileSync(inp);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
const binStart = 20 + jsonLen + 8;
const bin = buf.slice(binStart, binStart + buf.readUInt32LE(20 + jsonLen));

// which textures are colour (keep as JPEG) and which are data (normal / roughness, keep lossless)
const baseColor = new Set();
json.materials.forEach((m) => { const t = m.pbrMetallicRoughness?.baseColorTexture; if (t) baseColor.add(json.textures[t.index].source); });

const views = json.bufferViews.map((v) => ({ ...v }));
const chunks = [];
let offset = 0;
const keep = new Map();                       // bufferView index -> new bytes
for (let i = 0; i < json.images.length; i++) {
  const im = json.images[i], v = json.bufferViews[im.bufferView];
  const src = bin.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
  const s = sharp(src).resize(+max, +max, { fit: 'inside', withoutEnlargement: true });
  const asJpeg = baseColor.has(i);
  keep.set(im.bufferView, await (asJpeg ? s.jpeg({ quality: 88 }) : s.png({ compressionLevel: 9 })).toBuffer());
  im.mimeType = asJpeg ? 'image/jpeg' : 'image/png';
}
json.bufferViews.forEach((v, i) => {
  const data = keep.get(i) ?? bin.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
  const pad = (4 - (data.length % 4)) % 4;
  views[i].byteOffset = offset; views[i].byteLength = data.length;
  chunks.push(data, Buffer.alloc(pad)); offset += data.length + pad;
});
json.bufferViews = views;
json.buffers[0].byteLength = offset;

const newBin = Buffer.concat(chunks);
let jb = Buffer.from(JSON.stringify(json), 'utf8');
jb = Buffer.concat([jb, Buffer.alloc((4 - (jb.length % 4)) % 4, 0x20)]);
const total = 12 + 8 + jb.length + 8 + newBin.length;
const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(total, 8);
const jh = Buffer.alloc(8); jh.writeUInt32LE(jb.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
const bh = Buffer.alloc(8); bh.writeUInt32LE(newBin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
fs.writeFileSync(out, Buffer.concat([head, jh, jb, bh, newBin]));
console.log(`${(buf.length / 1e6).toFixed(2)} MB -> ${(total / 1e6).toFixed(2)} MB`);
