import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { FileExplorer } from '../assets/FileExplorer';
import { UploadButton } from '../assets/UploadButton';
import { useBrandVersions } from '../brands/versions/useBrandVersions';
import { VersionBar } from '../brands/versions/VersionBar';
import { useVersionView } from '../brands/versions/versionView';
import { useI18n } from '../i18n/I18nProvider';
import { ShareLinks } from '../share/ShareLinks';
export function MyAssets() {
    const { current } = useBrands();
    const { t } = useI18n();
    const [params] = useSearchParams();
    const versions = useBrandVersions(current?.id).list;
    const [ver, setVer] = useVersionView(current?.id, versions.map((v) => v.id));
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    return (_jsxs("div", { className: "col g32", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: current.name }), _jsxs("h1", { className: "h1", children: [_jsxs("span", { className: "w9", children: [t('files.title'), "."] }), " ", t('assets.tagline')] })] }), _jsxs("div", { className: "row g8 wrap", children: [_jsx(ShareLinks, { brandId: current.id }), _jsx(UploadButton, { brandId: current.id })] })] }), _jsx(VersionBar, { brand: current, versions: versions, viewing: ver, onView: setVer, work: true }), _jsx(FileExplorer, { brandId: current.id, brandName: current.name, startPath: params.get('folder') ?? '', openId: params.get('file') ?? undefined })] }));
}
