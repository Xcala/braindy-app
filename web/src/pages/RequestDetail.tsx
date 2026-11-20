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
import { AddendaList, AddendumForm } from '../requests/Addenda';
import { RequestNav } from '../requests/RequestNav';
import { EditableTitle } from '../requests/EditableTitle';

export function RequestDetail() {
  const { id = '' } = useParams();
  const { current, brands, select } = useBrands();
  // A shared link can carry its brand (?brand=quimiolab), so it opens whatever brand is selected now.
  const linked = useSearchParams()[0].get('brand');
  useEffect(() => { if (linked && linked !== current?.id && brands.some((b) => b.id === linked)) select(linked); }, [linked, brands.length]);
  const { profile, user } = useAuth();
  const { t, lang } = useI18n();
  const r = useRequest(current?.id, id);
  const all = useVersions(current?.id, id);
  const allComments = useComments(current?.id, id);
  // Details added after sending live under the brief, not in the review thread.
  const addenda = allComments.filter((c) => c.kind === 'addendum');
  const comments = allComments.filter((c) => c.kind !== 'addendum');
  const canApprove = useCanApprove(current?.id);
  const isAdmin = profile?.role === 'admin';
  const versions = isAdmin ? all : all.filter((v) => v.published);
  const [versionId, setVersionId] = useState<string | undefined>();
  const [mark, setMark] = useState<Annotation | null>(null);
  const [comparing, setComparing] = useState(false);
  const [fileIndex, setFileIndex] = useState(0);
  const [seek, setSeek] = useState<{ t: number; n: number } | null>(null);

  useEffect(() => { setVersionId(r?.latestVersion ?? versions[versions.length - 1]?.id); setFileIndex(0); },[r?.latestVersion, versions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useTour('review', () => reviewSteps(lang), versions.length > 0, false);
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  if (r === undefined) return <div className="skel" style={{ height: '25rem' }} />;
  if (r === null) return <p className="t-mute">{t('req.notFound')}</p>;
  const v = versions.find((x) => x.id === versionId) ?? versions[versions.length - 1];
  const type = [findCategory(r.category)?.label[lang], findSub(r.category, r.subcategory)?.label[lang], r.formatType].filter(Boolean).join(' · ');

  return (
    <div className="col g20">
      <div className="req-top"><nav className="crumbs min-w-0" aria-label="Breadcrumb"><Link to="/requests">{t('nav.requests')}</Link><Icon name="chevronRight" size={14} /><span className="cur">{r.title}</span></nav><RequestNav brandId={current.id} id={r.id} /></div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="col g8 min-w-0" style={{ maxWidth: '100%' }}>
          <div className="row g12 wrap"><EditableTitle brandId={current.id} requestId={r.id} title={r.title} canEdit={isAdmin || canApprove || (!!user && r.createdBy === user.uid)} /><span className={`chip ${STATUS_CHIP[r.status]}`}>{t(`req.status.${r.status}`)}</span>{r.approvalLevel === 'nicolas' && <span className="chip c-sent">{t('ask.withNicolas')}</span>}</div>
          <span className="t-sm t-mute">{type}{r.dueDate ? ` · ${t('home.dueDay', { day: dayLabel(r.dueDate, lang) })}` : ''}</span>
        </div>
        <Progress r={r} />
      </div>

      {(r.status === 'in_production' || r.status === 'to_approve') && <TeamAtWork r={r} brandId={current.id} addenda={addenda} />}
      {isAdmin && r.quality?.checks?.length ? <QualityCard q={r.quality} /> : null}

      {versions.length > 0 && (
        <SafeBoundary>
        <div className="card rv-split grid grid-cols-1 overflow-hidden p-0 lg:grid-cols-[minmax(0,1fr)_400px]" style={{ padding: 0 }} data-tour="review-viewer">
          <VersionViewer brandId={current.id} requestId={r.id} versions={versions} current={v} onPick={setVersionId}
            fileIndex={fileIndex} onFile={(i) => { setFileIndex(i); setMark(null); }}
            comments={comments} onMark={setMark} onCompare={() => setComparing(true)} seek={seek} />
          <ReviewPanel brandId={current.id} r={r} v={v} comments={comments.filter((c) => !c.versionId || c.versionId === v?.id)} addenda={addenda}
            canApprove={canApprove} pendingMark={mark} clearMark={() => setMark(null)} onShowFile={setFileIndex}
            onSeek={(i, t) => { setFileIndex(i); setSeek((s) => ({ t, n: (s?.n ?? 0) + 1 })); }} />
        </div>
        </SafeBoundary>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_1.2fr]" data-tour="review-brief">
        <div className="col g12">
          <p className="label">{t('req.brief')}</p>
          <BriefSummary brandId={current.id} r={r} />
          {(addenda.length > 0 || r.status === 'in_production' || r.status === 'to_approve') && (
            <div className="card card-tight col g16"><AddendaList items={addenda} />{r.status !== 'approved' && r.status !== 'published' && <AddendumForm brandId={current.id} requestId={r.id} />}</div>
          )}
        </div>
        <div className="col g12">
          <p className="label">{t('req.plan')}</p>
          <SafeBoundary><PlanCard brandId={current.id} r={r} isAdmin={isAdmin} /></SafeBoundary>
          <LessonForRequest category={r.category} />
        </div>
      </div>

      {isAdmin && <AdminVersionPanel brandId={current.id} r={r} />}
      {comparing && <CompareView brandId={current.id} requestId={r.id} versions={versions} fileIndex={fileIndex} onClose={() => setComparing(false)} />}
    </div>
  );
}
