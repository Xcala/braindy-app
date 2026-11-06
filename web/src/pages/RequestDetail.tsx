import { useTour } from '../tour/useTour';
import { reviewSteps } from '../tour/steps';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useComments, useRequest, useVersions } from '../requests/useRequests';
import { useCanApprove } from '../requests/useCanApprove';
import { findCategory, findSub } from '../requests/taxonomy';
import { Progress } from '../requests/Progress';
import { TeamAtWork } from '../requests/TeamAtWork';
import { QualityCard } from '../requests/QualityCard';
import { PlanCard } from '../requests/PlanCard';
import { VersionViewer } from '../requests/VersionViewer';
import { ReviewPanel } from '../requests/ReviewPanel';
import { CompareView } from '../requests/CompareView';
import { AdminVersionPanel } from '../requests/AdminVersionPanel';
import { STATUS_CHIP, type Annotation } from '../requests/types';
import { dayLabel } from '../lib/dates';
import { SafeBoundary } from '../components/SafeBoundary';
import { LessonForRequest } from '../criterio/LessonCards';
import { BriefSummary } from '../requests/BriefSummary';

export function RequestDetail() {
  const { id = '' } = useParams();
  const { current, brands, select } = useBrands();
  // A shared link can carry its brand (?brand=quimiolab), so it opens whatever brand is selected now.
  const linked = useSearchParams()[0].get('brand');
  useEffect(() => { if (linked && linked !== current?.id && brands.some((b) => b.id === linked)) select(linked); }, [linked, brands.length]);
  const { profile } = useAuth();
  const { t, lang } = useI18n();
  const r = useRequest(current?.id, id);
  const all = useVersions(current?.id, id);
  const comments = useComments(current?.id, id);
  const canApprove = useCanApprove(current?.id);
  const isAdmin = profile?.role === 'admin';
  const versions = isAdmin ? all : all.filter((v) => v.published);
  const [versionId, setVersionId] = useState<string | undefined>();
  const [mark, setMark] = useState<Annotation | null>(null);
  const [comparing, setComparing] = useState(false);
  const [fileIndex, setFileIndex] = useState(0);

  useEffect(() => { setVersionId(r?.latestVersion ?? versions[versions.length - 1]?.id); setFileIndex(0); },[r?.latestVersion, versions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useTour('review', () => reviewSteps(lang), versions.length > 0, false);
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  if (r === undefined) return <div className="skel" style={{ height: 400 }} />;
  if (r === null) return <p className="t-mute">{t('req.notFound')}</p>;
  const v = versions.find((x) => x.id === versionId) ?? versions[versions.length - 1];
  const type = [findCategory(r.category)?.label[lang], findSub(r.category, r.subcategory)?.label[lang], r.formatType].filter(Boolean).join(' · ');

  return (
    <div className="col g20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="col g8 min-w-0" style={{ maxWidth: '100%' }}>
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/requests">{t('nav.requests')}</Link><Icon name="chevronRight" size={14} /><span className="cur">{r.title}</span></nav>
          <div className="row g12 wrap"><h1 className="h2" style={{ overflowWrap: 'anywhere', minWidth: 0 }}>{r.title}</h1><span className={`chip ${STATUS_CHIP[r.status]}`}>{t(`req.status.${r.status}`)}</span>{r.approvalLevel === 'nicolas' && <span className="chip c-sent">{t('ask.withNicolas')}</span>}</div>
          <span className="t-sm t-mute">{type}{r.dueDate ? ` · ${t('home.dueDay', { day: dayLabel(r.dueDate, lang) })}` : ''}</span>
        </div>
        <Progress r={r} />
      </div>

      {r.status === 'in_production' && <TeamAtWork r={r} />}
      {isAdmin && r.quality?.checks?.length ? <QualityCard q={r.quality} /> : null}

      {versions.length > 0 && (
        <SafeBoundary>
        <div className="card grid grid-cols-1 overflow-hidden p-0 lg:grid-cols-[minmax(0,1fr)_400px]" style={{ padding: 0 }} data-tour="review-viewer">
          <VersionViewer brandId={current.id} requestId={r.id} versions={versions} current={v} onPick={setVersionId}
            fileIndex={fileIndex} onFile={(i) => { setFileIndex(i); setMark(null); }}
            comments={comments} onMark={setMark} onCompare={() => setComparing(true)} />
          <ReviewPanel brandId={current.id} r={r} v={v} comments={comments.filter((c) => !c.versionId || c.versionId === v?.id)}
            canApprove={canApprove} pendingMark={mark} clearMark={() => setMark(null)} onShowFile={setFileIndex} />
        </div>
        </SafeBoundary>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_1.2fr]" data-tour="review-brief">
        <div className="col g12">
          <p className="label">{t('req.brief')}</p>
          <BriefSummary brandId={current.id} r={r} />
        </div>
        <div className="col g12">
          <p className="label">{t('req.plan')}</p>
          <SafeBoundary><PlanCard brandId={current.id} r={r} isAdmin={isAdmin} /></SafeBoundary>
          <LessonForRequest category={r.category} />
        </div>
      </div>

      {isAdmin && <AdminVersionPanel brandId={current.id} r={r} />}
      {comparing && <CompareView brandId={current.id} requestId={r.id} versions={versions} onClose={() => setComparing(false)} />}
    </div>
  );
}
