export type FileKind = 'image' | 'video' | 'pdf' | 'design' | 'other';

export interface FileItem {
  id: string;
  title: string;
  contentType: string;
  size: number;
  ext?: string;
  mtimeMs?: number;
}

const DESIGN = /^(ai|psd|indd|eps|fig|sketch|xd|afdesign|aep|prproj)$/i;

export function kindOf(f: Pick<FileItem, 'contentType' | 'ext' | 'title'>): FileKind {
  const ext = (f.ext || f.title.split('.').pop() || '').toLowerCase();
  if (DESIGN.test(ext)) return 'design';
  if (f.contentType.startsWith('image/')) return 'image';
  if (f.contentType.startsWith('video/')) return 'video';
  if (f.contentType === 'application/pdf') return 'pdf';
  return 'other';
}

export const extLabel = (f: Pick<FileItem, 'ext' | 'title'>) =>
  (f.ext || f.title.split('.').pop() || 'file').toUpperCase().slice(0, 5);

export const thumbClass: Record<FileKind, string> = {
  image: 'th-img', video: 'th-vid', pdf: 'th-pdf', design: 'th-design', other: 'th-html',
};
