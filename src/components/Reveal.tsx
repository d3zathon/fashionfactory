"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades content up as it enters the viewport. Uses IntersectionObserver rather
 * than scroll listeners so it costs nothing while idle, and unobserves after
 * firing — the animation is a first-impression detail, not a permanent effect.
 *
 * Content is visible by default and only hidden once JS confirms the observer
 * is available, so it can never leave the page blank.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  as?: "div" | "section" | "article" | "li";
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    // Respect reduced motion: skip the animation entirely.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    setArmed(true);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const classes = [armed ? "reveal" : "", visible ? "is-visible" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag ref={ref as never} className={classes} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}
