// Instant in-app navigation. Every public URL renders through the single
// `[[...path]]` page, so shallow routing changes the URL without re-running
// getStaticProps or remounting the shell — which is what keeps audio playing
// across navigation. Wrapped in a View Transition for a native-feeling morph.
import { useCallback, useMemo } from "react";
import { useRouter } from "next/router";

type DocumentWithVT = Document & {
  startViewTransition?: (cb: () => void) => unknown;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useShallowNav() {
  const router = useRouter();
  return useCallback(
    (href: string, opts?: { replace?: boolean }) => {
      const run = () => {
        const method = opts?.replace ? router.replace : router.push;
        void method(href, undefined, { shallow: true, scroll: false });
      };
      const doc =
        typeof document !== "undefined" ? (document as DocumentWithVT) : null;
      if (doc?.startViewTransition && !prefersReducedMotion()) {
        doc.startViewTransition(run);
      } else {
        run();
      }
    },
    [router],
  );
}

/**
 * Current decoded path segments, derived from the live URL (asPath), so it stays
 * correct across shallow navigations where router.query can briefly lag.
 */
export function useCurrentPath(): string[] {
  const router = useRouter();
  return useMemo(() => {
    const clean = router.asPath.split(/[?#]/)[0];
    return clean
      .split("/")
      .filter(Boolean)
      .map((seg) => {
        try {
          return decodeURIComponent(seg);
        } catch {
          return seg;
        }
      });
  }, [router.asPath]);
}
