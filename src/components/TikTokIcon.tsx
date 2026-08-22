/**
 * TikTok glyph.
 *
 * lucide-react carries no TikTok icon, so this mirrors the lucide icon API
 * (a `size` prop, currentColor, a 24x24 viewBox) to drop in beside the
 * Instagram icon it sits next to. The mark is a filled brand glyph rather than
 * a stroked outline, so it is set a touch smaller than its stroked neighbours
 * at the call sites to keep the optical weight even.
 */
export function TikTokIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16.5 3h-3.09v13.03a2.62 2.62 0 1 1-2.62-2.62c.2 0 .39.02.57.07v-3.13a5.9 5.9 0 0 0-.57-.03 5.75 5.75 0 1 0 5.75 5.75V9.4a7.5 7.5 0 0 0 4.34 1.39V7.7a4.36 4.36 0 0 1-3.2-1.36A4.36 4.36 0 0 1 16.5 3Z" />
    </svg>
  );
}
