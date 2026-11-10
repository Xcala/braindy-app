import { dateLabel, dayLabel, isOverdue } from '../lib/dates';
import { findCategory, findSub } from './taxonomy';
/** The piece in a few words ("Tarjetas", "Carrusel"), not the long category. */
export function pieceLabel(r, lang) {
    if (r.formatType && r.formatType !== r.title && r.formatType.length <= 40)
        return r.formatType;
    return findSub(r.category, r.subcategory)?.label[lang] ?? findCategory(r.category)?.label[lang] ?? '';
}
/** One date that means something for where the request is: due (red when late) or delivered. */
export function smartDate(r, lang, t) {
    if (r.status === 'approved' || r.status === 'published') {
        const d = (r.approvedAt ?? r.updatedAt)?.toDate();
        return { text: d ? t('rr.deliveredOn', { day: dateLabel(d, lang) }) : '', late: false };
    }
    if (!r.dueDate)
        return { text: t('rr.noDate'), late: false };
    const late = r.status === 'in_production' && isOverdue(r.dueDate);
    return { text: t(late ? 'rr.lateWas' : 'rr.dueOn', { day: dayLabel(r.dueDate, lang) }), late };
}
/**
 * What an open request still lacks to be clear: a date, where it will be used, material to work from. Read from what
 * the client sent; shown to NickMark only, with a button to ask.
 */
export function missingOf(r) {
    if (r.status !== 'in_production')
        return [];
    const p = r.cards?.product;
    const all = `${p?.text ?? ''} ${r.cards?.application?.text ?? ''}`.toLowerCase();
    const out = [];
    if (!r.dueDate && !/sin afán|sin prisa|no rush/.test(all))
        out.push('when');
    if (!r.cards?.application?.text && !r.subcategory && !WHERE.test(all))
        out.push('where');
    if (!p?.files?.length && !p?.links?.length && !/adjunt|attach|no tengo material|no material/.test(all))
        out.push('material');
    return out;
}
export const WHERE = /instagram|facebook|linkedin|tiktok|youtube|whatsapp|redes|social|web|p[aá]gina|landing|correo|email|mail|impres|print|evento|feria|reuni[oó]n|presentar|valla|empaque|etiqueta/i;
