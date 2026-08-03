/**
 * The "this leaves the page" affordance. Decorative — every link that uses it
 * carries its own aria-label naming the destination.
 *
 * Leans out on hover, driven by a `group` class on the anchor.
 */
export default function ExternalArrow({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-3 w-3 shrink-0 text-[var(--faint)] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--acc)] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}
