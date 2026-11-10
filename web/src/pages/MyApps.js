import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useBrands } from '../brands/BrandProvider';
import { useBrandVersions, versionAt } from '../brands/versions/useBrandVersions';
import { VersionBar } from '../brands/versions/VersionBar';
import { useVersionView } from '../brands/versions/versionView';
import { useI18n } from '../i18n/I18nProvider';
import { LinkGrid } from '../links/LinkGrid';
import { useBrandLinks } from '../links/useBrandLinks';
/** My apps: the brand's website and the web apps built for it. Each opens inside Braindy beside its own adjustments. */
export function MyApps() {
    const { current } = useBrands();
    const { t } = useI18n();
    const { links: all, loading } = useBrandLinks(current?.id, 'apps');
    const versions = useBrandVersions(current?.id).list;
    const [ver, setVer] = useVersionView(current?.id, versions.map((v) => v.id));
    // Rebranded brands: each app belongs to the version current when it was added.
    const links = versions.length ? all.filter((l) => (versionAt(versions, l.createdAt?.toMillis())?.id ?? null) === ver) : all;
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    return (_jsxs("div", { className: "col g32", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: current.name }), _jsxs("h1", { className: "h1", children: [_jsxs("span", { className: "w9", children: [t('nav.apps'), "."] }), " ", t('apps.tagline')] })] }), _jsx(VersionBar, { brand: current, versions: versions, viewing: ver, onView: setVer, work: true }), _jsx(LinkGrid, { brandId: current.id, section: "apps", links: links }), !loading && links.length === 0 && _jsx("div", { className: "card t-mute", children: t('apps.empty') })] }));
}
