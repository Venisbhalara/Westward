'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Native programmatic helper to scroll smoothly using standard browser APIs.
 */
export function scrollToTarget(
  target: string | number | HTMLElement,
  options?: { offset?: number; immediate?: boolean; duration?: number }
) {
  if (typeof window === 'undefined') return;

  const behavior: ScrollBehavior = options?.immediate ? ('instant' as ScrollBehavior) : 'smooth';

  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior });
  } else if (typeof target === 'string') {
    const el = document.querySelector(target);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY + (options?.offset || 0);
      window.scrollTo({ top, behavior });
    }
  } else if (target instanceof HTMLElement) {
    const top = target.getBoundingClientRect().top + window.scrollY + (options?.offset || 0);
    window.scrollTo({ top, behavior });
  }
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // On page change: instantly reset scroll to top (or smooth scroll to hash if present)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.location.hash) {
      const hash = window.location.hash;
      const timer = setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [pathname]);

  // Intercept pure in-page hash links natively
  useEffect(() => {
    function handleAnchorClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      if (href.startsWith('#') && href.length > 1) {
        const el = document.querySelector(href);
        if (el) {
          e.preventDefault();
          const top = el.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      } else if (href.startsWith('/#') && window.location.pathname === '/') {
        const hash = href.slice(1);
        const el = document.querySelector(hash);
        if (el) {
          e.preventDefault();
          const top = el.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    }

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => document.removeEventListener('click', handleAnchorClick, { capture: true });
  }, []);

  return <>{children}</>;
}
