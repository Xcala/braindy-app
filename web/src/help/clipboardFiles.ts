/**
 * Files that come from a paste (Ctrl/Cmd+V, long-press › Paste) or a drop. Screenshots arrive as «image.png»,
 * so each one gets a readable name with the time, and two pasted at once never share a name.
 */
const ext = (type: string) => (type.split('/')[1] || 'bin').replace('jpeg', 'jpg').replace('quicktime', 'mov').replace(/[^a-z0-9]/gi, '').slice(0, 5);

export function filesFrom(data: DataTransfer | null, lang: 'es' | 'en'): File[] {
  if (!data) return [];
  const list = [...(data.files ?? [])];
  const fromItems = list.length ? list : [...(data.items ?? [])].filter((i) => i.kind === 'file').map((i) => i.getAsFile()).filter((f): f is File => !!f);
  const stamp = new Date().toTimeString().slice(0, 8).replace(/:/g, '.');
  return fromItems.map((f, i) => {
    const generic = !f.name || /^(image|video|blob)(\.\w+)?$/i.test(f.name);
    if (!generic) return f;
    const kind = f.type.startsWith('video/') ? (lang === 'es' ? 'Video' : 'Video') : (lang === 'es' ? 'Imagen' : 'Image');
    return new File([f], `${kind} ${stamp}${fromItems.length > 1 ? `-${i + 1}` : ''}.${ext(f.type)}`, { type: f.type, lastModified: f.lastModified });
  });
}

/** True when what is being dragged over the box carries files (not just text). */
export const hasFiles = (data: DataTransfer | null) => !!data && [...(data.types ?? [])].includes('Files');
