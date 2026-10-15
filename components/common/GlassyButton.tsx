"use client";

import {
  useRef,
  type ButtonHTMLAttributes,
  type PointerEvent as ReactPointerEvent,
} from "react";
import styles from "./GlassyButton.module.css";

export type GlassyButtonSize = "sm" | "md" | "lg" | "demo";

const SIZE_CLASS: Record<GlassyButtonSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  demo: styles.sizeDemo,
};

export interface GlassyButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual scale. `sm` fits inline controls (nav / toolbars), `md` and `lg`
   * are roomier, and `demo` reproduces the ~400 x 154 reference button.
   */
  size?: GlassyButtonSize;
  /**
   * Nav-style responsive square: a compact icon-sized control on phones and
   * tablets that grows into its label from the `md` breakpoint up. Use it for
   * buttons whose text is hidden on small screens (e.g. the navbar
   * "New estimate" control that collapses to a "+").
   */
  iconOnly?: boolean;
}

/**
 * Glassmorphism button with a premium lavender hover glow.
 *
 * - Draws its whole appearance in CSS (no images): a translucent glass
 *   surface, glossy rims, a wide gray shadow and a violet hover glow.
 * - The gray-to-lavender change cross-fades two stacked layers, so nothing
 *   snaps; the shadow-to-glow change interpolates smoothly.
 * - A restrained highlight follows the pointer inside the glass.
 * - Presses down ~2px and scales to 0.985; returns smoothly on release.
 * - Real <button> element: keyboard operable, with a subtle focus ring and
 *   the same lavender state on keyboard focus. Honours reduced motion.
 *
 * Pass `onClick` (and any other button prop) straight through — behaviour is
 * left entirely to the call site.
 */
export function GlassyButton({
  size = "md",
  className = "",
  iconOnly = false,
  children,
  type = "button",
  onPointerMove,
  ...rest
}: GlassyButtonProps) {
  const pointerRef = useRef<HTMLSpanElement>(null);

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const layer = pointerRef.current;
    if (layer) {
      const rect = event.currentTarget.getBoundingClientRect();
      layer.style.setProperty(
        "--px",
        `${event.clientX - rect.left - rect.width / 2}px`,
      );
      layer.style.setProperty(
        "--py",
        `${event.clientY - rect.top - rect.height / 2}px`,
      );
    }
    onPointerMove?.(event);
  };

  return (
    <button
      type={type}
      className={`${styles.btn} ${SIZE_CLASS[size]} ${
        iconOnly ? styles.iconOnly : ""
      } ${className}`.trim()}
      onPointerMove={handlePointerMove}
      {...rest}
    >
      <span className={styles.layerBase} aria-hidden />
      <span className={styles.layerHover} aria-hidden />
      <span className={styles.rim} aria-hidden />
      <span ref={pointerRef} className={styles.pointer} aria-hidden />
      <span className={styles.content}>{children}</span>
    </button>
  );
}
