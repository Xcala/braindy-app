// A small streaming .zip writer (stored, no compression: brand files are mostly images, video and PDF that do not
// shrink). Each entry streams from its source and its CRC goes in a data descriptor, so nothing is held in memory.
// Plain zip, no zip64: callers keep the total under 4 GB.
import type { Readable } from 'node:stream';

const TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (crc: number, b: Uint8Array) => {
  let c = crc ^ 0xffffffff;
  for (let i = 0; i < b.length; i++) c = TABLE[(c ^ b[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

type Entry = { name: string; open: () => Readable };

export function zipStream(entries: Entry[]): ReadableStream<Uint8Array> {
  const central: Buffer[] = [];
  let offset = 0;
  return new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const push = (b: Buffer | Uint8Array) => { ctrl.enqueue(b instanceof Buffer ? new Uint8Array(b) : b); offset += b.length; };
      try {
        for (const e of entries) {
          const name = Buffer.from(e.name, 'utf8');
          const start = offset;
          const head = Buffer.alloc(30);
          head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0808, 6); // data descriptor + UTF-8 names
          head.writeUInt16LE(name.length, 26);
          push(head); push(name);
          let crc = 0, size = 0;
          for await (const chunk of e.open()) { const b = chunk as Buffer; crc = crc32(crc, b); size += b.length; push(b); }
          const desc = Buffer.alloc(16);
          desc.writeUInt32LE(0x08074b50, 0); desc.writeUInt32LE(crc, 4); desc.writeUInt32LE(size, 8); desc.writeUInt32LE(size, 12);
          push(desc);
          const cd = Buffer.alloc(46);
          cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(0x0808, 8);
          cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(size, 20); cd.writeUInt32LE(size, 24); cd.writeUInt16LE(name.length, 28);
          cd.writeUInt32LE(start, 42);
          central.push(cd, name);
        }
        const cdStart = offset;
        for (const b of central) push(b);
        const end = Buffer.alloc(22);
        end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
        end.writeUInt32LE(offset - cdStart, 12); end.writeUInt32LE(cdStart, 16);
        push(end);
        ctrl.close();
      } catch (err) {
        ctrl.error(err);
      }
    },
  });
}
