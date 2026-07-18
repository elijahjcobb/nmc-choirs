// Instant in-app navigation. Every public URL renders through the single
// `[[...path]]` page, so shallow routing changes the URL without re-running
// getStaticProps or remounting the shell — which is what keeps audio playing
// across navigation. (No View Transition wrapper — its cross-fade caused a gray
// flash on every tap in the iOS standalone PWA.)
import { useCallback, useMemo } from "react";
import { useRouter } from "next/router";

export function useShallowNav() {
  const router = useRouter();
  return useCallback(
    (href: string, opts?: { replace?: boolean }) => {
      const method = opts?.replace ? router.replace : router.push;
      void method(href, undefined, { shallow: true, scroll: false });
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
