import { Component, type ReactNode } from 'react';
import { reportError } from '../lib/reportError';

/** Keeps one broken card from taking down the whole screen: the rest of the page keeps working. */
export class SafeBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { reportError(error); }
  render() { return this.state.failed ? (this.props.fallback ?? null) : this.props.children; }
}
