const DESIGN = /^(ai|psd|indd|eps|fig|sketch|xd|afdesign|aep|prproj)$/i;
export function kindOf(f) {
    const ext = (f.ext || f.title.split('.').pop() || '').toLowerCase();
    if (DESIGN.test(ext))
        return 'design';
    if (f.contentType.startsWith('image/'))
        return 'image';
    if (f.contentType.startsWith('video/'))
        return 'video';
    if (f.contentType === 'application/pdf')
        return 'pdf';
    return 'other';
}
export const extLabel = (f) => (f.ext || f.title.split('.').pop() || 'file').toUpperCase().slice(0, 5);
export const thumbClass = {
    image: 'th-img', video: 'th-vid', pdf: 'th-pdf', design: 'th-design', other: 'th-html',
};
