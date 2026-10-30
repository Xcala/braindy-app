import { Component } from 'react';
import { reportError } from '../lib/reportError';
/** Keeps one broken card from taking down the whole screen: the rest of the page keeps working. */
export class SafeBoundary extends Component {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(error) { reportError(error); }
    render() { return this.state.failed ? (this.props.fallback ?? null) : this.props.children; }
}
