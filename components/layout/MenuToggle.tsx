import styles from "./MenuToggle.module.css";

/**
 * Animated hamburger for the mobile / tablet navbar.
 *
 * Three bars that fold into the close (X) shape when `open` is true and unfold
 * back to three lines on the next tap. Purely presentational — the parent
 * button owns the click, the `aria-expanded` state and the label.
 */
export function MenuToggle({ open }: { open: boolean }) {
  return (
    <span
      className={`${styles.toggle} ${open ? styles.open : ""}`}
      aria-hidden="true"
    >
      <span className={`${styles.bar} ${styles.bar1}`} />
      <span className={`${styles.bar} ${styles.bar2}`} />
      <span className={`${styles.bar} ${styles.bar3}`} />
    </span>
  );
}
