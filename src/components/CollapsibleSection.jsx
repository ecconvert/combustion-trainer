import React, { useState, useId } from "react";

/**
 * A reusable collapsible wrapper that keeps its contents mounted while hidden.
 * Uses height/overflow CSS to visually hide content and provides accessible
 * toggling via button with aria attributes and keyboard support.
 */
export default function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  const toggle = () => setOpen((o) => !o);

  return (
    <section className="mb-4">
      <h2 className="text-lg font-semibold">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={toggle}
          className="w-full text-left flex items-center justify-between focus:outline-none"
        >
          {title}
          <span className="ml-2">{open ? "−" : "+"}</span>
        </button>
      </h2>
      <div
        id={contentId}
        style={{
          height: open ? "auto" : 0,
          overflow: "hidden",
        }}
        className="transition-[height] duration-300"
      >
        <div className="mt-2">{children}</div>
      </div>
    </section>
  );
}
