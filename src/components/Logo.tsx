/**
 * TapHabla brand logo — speech-bubble icon + stylised wordmark.
 * Uses the brand palette (#E4572E primary, #C84422 dark accent).
 */
export function Logo({ size = 28 }: { size?: number }) {
  /* Scale the icon proportionally with `size` */
  const iconSize = size;
  const fontSize = size * 0.72;

  return (
    <span className="inline-flex items-center gap-1.5 select-none" aria-label="TapHabla">
      {/* Icon mark — rounded speech bubble with a tap-ripple */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Speech bubble body */}
        <rect x="3" y="4" width="34" height="26" rx="8" fill="#E4572E" />
        {/* Bubble tail */}
        <path d="M12 30L8 38L18 30" fill="#E4572E" />

        {/* Soundwave lines inside the bubble */}
        <rect x="11" y="13" width="2.5" height="8" rx="1.25" fill="white" opacity="0.9" />
        <rect x="16" y="10" width="2.5" height="14" rx="1.25" fill="white" opacity="0.9" />
        <rect x="21" y="12" width="2.5" height="10" rx="1.25" fill="white" opacity="0.9" />
        <rect x="26" y="14" width="2.5" height="6" rx="1.25" fill="white" opacity="0.9" />
      </svg>

      {/* Wordmark */}
      <span
        className="font-extrabold leading-none tracking-tight"
        style={{ fontSize }}
      >
        <span style={{ color: '#E4572E' }}>Tap</span>
        <span className="text-stone-800 dark:text-stone-100">Habla</span>
      </span>
    </span>
  );
}
