import { isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink } from 'firebase/auth';
import { auth } from '../lib/firebase';

// Passwordless sign-in for any inbox (Outlook, corporate, Gmail): Firebase emails a one-time link to the address.
const KEY = 'braindy.linkEmail';
const LOGIN = 'https://app.braindy.co/login';

/** Emails a sign-in link. Used by the person on the sign-in page and by NickMark when he invites someone. */
export async function sendAccessLink(email: string, lang: 'es' | 'en', remember = true) {
  auth.languageCode = lang;
  const local = location.origin.startsWith('http://localhost') || location.origin.includes('staging');
  await sendSignInLinkToEmail(auth, email, { url: local ? `${location.origin}/login` : LOGIN, handleCodeInApp: true });
  if (remember) try { localStorage.setItem(KEY, email); } catch { /* storage unavailable */ }
}

export const isAccessLink = () => isSignInWithEmailLink(auth, location.href);
export const rememberedEmail = () => { try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; } };

/** Finishes the sign-in from the link (the email must match the one the link was sent to). */
export async function completeAccessLink(email: string) {
  await signInWithEmailLink(auth, email, location.href);
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  history.replaceState(null, '', '/login');
}
