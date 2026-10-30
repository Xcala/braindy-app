import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { FileExplorer } from '../assets/FileExplorer';
import { BrandDocs } from '../assets/BrandDocs';
import { useLegacyAssets } from '../assets/useLegacyAssets';
import { UploadButton } from '../assets/UploadButton';
import { useI18n } from '../i18n/I18nProvider';
export function MyAssets() {
    const { current } = useBrands();
    const { t, lang } = useI18n();
    const legacy = useLegacyAssets(current?.id);
    const index = useBrandDoc(current?.id, 'context/fileIndex');
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    const updated = index.data?.updatedAt?.toDate?.();
    return (_jsxs("div", { className: "col g32", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: current.name }), _jsxs("h1", { className: "h1", children: [_jsxs("span", { className: "w9", children: [t('nav.assets'), "."] }), " ", t('assets.tagline')] }), updated && (_jsx("p", { className: "t-mute", children: t('assets.synced', { date: updated.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) }) }))] }), _jsx(UploadButton, { brandId: current.id })] }), _jsx(BrandDocs, { assets: legacy.filter((a) => a.type !== 'logodeck' && a.type !== 'marketmap') }), _jsx(FileExplorer, { brandId: current.id, brandName: current.name })] }));
}
