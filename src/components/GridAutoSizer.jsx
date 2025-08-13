import React, { useCallback, useEffect, useRef } from "react";

/**
 * GridAutoSizer wraps a grid item and reports the content's scrollHeight
 * in grid rows to the parent via onRows(). Use it as the direct child
 * of ReactGridLayout so it can receive the key.
 */
export default function GridAutoSizer({
  className,
  children,
  rowHeight = 10,
  onRows,
  ...rest
}) {
  const ref = useRef(null);
  const roRef = useRef(null);
  const frameRef = useRef(0);

  const report = useCallback(() => {
    const el = ref.current;
    if (!el || !onRows) return;
    // Use scrollHeight to include all overflowing content
    const px = el.scrollHeight;
    const rows = Math.max(1, Math.ceil(px / Math.max(1, rowHeight)));
    onRows(rows);
  }, [onRows, rowHeight]);

  useEffect(() => {
    report();
    const el = ref.current;
    if (!el) return;
    // Observe size changes
    roRef.current = new ResizeObserver(() => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(report);
    });
    roRef.current.observe(el);
    return () => {
      if (roRef.current) roRef.current.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [report]);

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}
