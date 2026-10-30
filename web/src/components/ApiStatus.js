import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
/** Admin-only check that the browser → backend → Firestore path works with the user's token. */
export function ApiStatus() {
    const [state, setState] = useState('checking');
    useEffect(() => {
        api('/v1/me')
            .then((r) => setState(r.profile ? 'ok' : 'error'))
            .catch(() => setState('error'));
    }, []);
    const label = { checking: 'API…', ok: 'API ok', error: 'API error' }[state];
    const color = { checking: 'bg-black/30', ok: 'bg-emerald-500', error: 'bg-red-500' }[state];
    return (_jsxs("span", { className: "flex items-center gap-1.5 text-xs text-black/55", title: "Backend connection", children: [_jsx("span", { className: `h-2 w-2 rounded-full ${color}` }), label] }));
}
