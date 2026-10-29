import { useTour } from '../tour/useTour';
import { reviewSteps } from '../tour/steps';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useComments, useRequest, useVersions } from '../requests/useRequests';
import { useCanApprove } from '../requests/useCanApprove';
import { findCategory, findSub } from '../requests/taxonomy';
import { Progress } from '../requests/Progress';
import { PlanCard } from '../requests/PlanCard';
import { VersionViewer } from '../requests/VersionViewer';
import { ReviewPanel } from '../requests/ReviewPanel';
import { CompareView } from '../requests/CompareView';
import { AdminVersionPanel } from '../requests/AdminVersionPanel';
import { STATUS_CHIP, type Annotation } from '../requests/types';
import { dayLabel } from '../lib/dates';
import { SafeBoundary } from '../components/SafeBoundary';
import { LessonForRequest } from '../criterio/LessonCards';
import { AttachedFiles } from '../requests/AttachedFiles';

export function RequestDetail() {
  const { id = '' } = useParams();
  const { current } = useBrands();
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

  useEffect(() => { setVersionId(r?.latestVersion ?? versions[versions.length - 1]?.id); }, [r?.latestVersion, versions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useTour('review', () => reviewSteps(lang), versions.length > 0, false);
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  if (r === undefined) return <div className="skel" style={{ height: 400 }} />;
  if (r === null) return <p className="t-mute">{t('req.notFound')}</p>;
  const v = versions.find((x) => x.id === versionId) ?? versions[versions.length - 1];
  const type = [findCategory(r.category)?.label[lang], findSub(r.category, r.subcategory)?.label[lang], r.formatType].filter(Boolean).join(' · ');

  return (
    <div className="col g20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="col g8">
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/requests">{t('nav.requests')}</Link><Icon name="chevronRight" size={14} /><span className="cur">{r.title}</span></nav>
          <div className="row g12 wrap"><h1 className="h2">{r.title}</h1><span className={`chip ${STATUS_CHIP[r.status]}`}>{t(`req.status.${r.status}`)}</span>{r.approvalLevel === 'nicolas' && <span className="chip c-sent">{t('ask.withNicolas')}</span>}</div>
          <span className="t-sm t-mute">{type}{r.dueDate ? ` · ${t('home.dueDay', { day: dayLabel(r.dueDate, lang) })}` : ''}</span>
        </div>
        <Progress r={r} />
      </div>

      {versions.length > 0 && (
        <SafeBoundary>
        <div className="card grid grid-cols-1 overflow-hidden p-0 lg:grid-cols-[minmax(0,1fr)_400px]" style={{ padding: 0 }} data-tour="review-viewer">
          <VersionViewer brandId={current.id} requestId={r.id} versions={versions} current={v} onPick={setVersionId}
            comments={comments} onMark={setMark} onCompare={() => setComparing(true)} />
          <ReviewPanel brandId={current.id} r={r} v={v} comments={comments.filter((c) => !c.versionId || c.versionId === v?.id)}
            canApprove={canApprove} pendingMark={mark} clearMark={() => setMark(null)} />
        </div>
        </SafeBoundary>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_1.2fr]" data-tour="review-brief">
        <div className="col g12">
          <p className="label">{t('req.brief')}</p>
          {(['product', 'application', 'scene'] as const).filter((k) => k === 'product' || r.cards?.[k]?.text || r.cards?.[k]?.links?.length).map((k) => (
            <div key={k} className="card card-tight col g8">
              <span className={`kind ${k === 'scene' ? '' : 'kind-logodeck'}`}>{t(`ask.card.${k}`)}</span>
              <p className={`t-sm ${r.cards?.[k]?.text ? '' : 't-mute'}`} style={{ whiteSpace: 'pre-line' }}>{r.cards?.[k]?.text || t(`req.emptyCard.${k}`)}</p>
              {(r.cards?.[k]?.links ?? []).map((l) => <a key={l} href={l} target="_blank" rel="noreferrer" className="t-sm truncate">{l}</a>)}
              {k === 'product' && <AttachedFiles brandId={current.id} files={r.cards?.product?.files} />}
            </div>
          ))}
          {(r.format || r.language) && <p className="t-sm t-mute">{[r.format, r.language].filter(Boolean).join(' · ')}</p>}
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
