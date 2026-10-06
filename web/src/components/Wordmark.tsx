/** "Braindy" with the "ai" set in 900 lowercase, as the brand lockup requires. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-light tracking-tight ${className}`}>
      Br<span className="font-black">ai</span>ndy
    </span>
  );
}
