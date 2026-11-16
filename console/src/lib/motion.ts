/** Shared motion switch. The Rail writes the OS-independent preference to
 * <html data-motion>, and dispatches this event so running tweens snap. */
export const MOTION_CHANGE = "apsis:motionchange";

export function motionAllowed(): boolean {
  if (document.documentElement.dataset.motion === "off") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
