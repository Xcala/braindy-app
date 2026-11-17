import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { HomeMeetings } from './HomeMeetings';
import { NextMeetingCard, useNextMeeting } from './NextMeeting';

/** Meetings row: the next meeting (unless the person moved it to the top or closed it) and the history with each meeting's notes. */
export function HomeMeetingsRow({ brandId, brandName }: { brandId: string; brandName: string }) {
  const { t } = useI18n();
  const admin = useAuth().profile?.role === 'admin';
  const { data, key, closed, prefs, setPrefs } = useNextMeeting(brandId);
  const here = !!data && !closed && !prefs.top;
  const history = <HomeMeetings brandId={brandId} admin={admin} />;

  return (
    <div className="col g8">
      {closed && <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => setPrefs({ closedFor: null })}>{t('nm.show')}</button>}
      {here ? (
        <div className={`grid grid-cols-1 gap-4 ${prefs.small ? '' : 'lg:grid-cols-4'}`}>
          <NextMeetingCard brandId={brandId} brandName={brandName} m={data.next} mkey={key} />
          <div className={`min-w-0 ${prefs.small ? '' : 'lg:col-span-3'}`}>{history}</div>
        </div>
      ) : history}
    </div>
  );
}

/** At the top of Home, when the person moved the card there. */
export function NextMeetingTop({ brandId, brandName }: { brandId: string; brandName: string }) {
  const { data, key, closed, prefs } = useNextMeeting(brandId);
  if (!data || closed || !prefs.top) return null;
  return <NextMeetingCard brandId={brandId} brandName={brandName} m={data.next} mkey={key} />;
}
