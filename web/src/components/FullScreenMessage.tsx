import type { ReactNode } from 'react';
import { Wordmark } from './Wordmark';

export function FullScreenMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 px-4 text-center">
      <Wordmark className="text-4xl" />
      <h1 className="text-lg font-medium">{title}</h1>
      {children}
    </main>
  );
}
