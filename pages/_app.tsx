// Site-first import order: the public entry loads first, the admin entry last so
// admin keeps its "last stylesheet wins" position exactly as before. The two
// Tailwind entries share no token names and admin's `dark:` variant stays pinned
// to `.dark` (never rendered), so system dark mode can't touch the admin UI.
import "../styles/site.css";
import "../styles/admin.css";

import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { Analytics } from "@vercel/analytics/react";
import { Poppins, Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { MiniPlayer } from "@/components/site/player/mini-player";

// Admin keeps Poppins byte-for-byte; the public site uses Space Grotesk.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["200", "400", "500", "600", "700", "800"],
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-site",
});

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAdmin = router.pathname.startsWith("/admin");

  // The old PWA shipped a workbox service worker that is now gone. Devices that
  // installed it still have it serving stale caches — proactively unregister.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations?.()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
    }
  }, []);

  return (
    <>
      <Head>
        <title>NMC Music</title>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#f2f5f2"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#0d1210"
        />
        <meta
          name="description"
          content="Scores, rehearsal tracks, and notes for the NMC Music Department choirs."
        />
        <link rel="icon" href="/icon-16.png" sizes="16x16" />
        <link rel="icon" href="/icon-32.png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="NMC Music" />
        {/* Apple launch (splash) screens, light + dark, for common iPhones. */}
        <link rel="apple-touch-startup-image" media="(prefers-color-scheme: light) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" href="/splash-828x1792.png" />
        <link rel="apple-touch-startup-image" media="(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" href="/splash-828x1792-dark.png" />
        <link rel="apple-touch-startup-image" media="(prefers-color-scheme: light) and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1170x2532.png" />
        <link rel="apple-touch-startup-image" media="(prefers-color-scheme: dark) and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1170x2532-dark.png" />
        <link rel="apple-touch-startup-image" media="(prefers-color-scheme: light) and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1179x2556.png" />
        <link rel="apple-touch-startup-image" media="(prefers-color-scheme: dark) and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1179x2556-dark.png" />
        <link rel="apple-touch-startup-image" media="(prefers-color-scheme: light) and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1290x2796.png" />
        <link rel="apple-touch-startup-image" media="(prefers-color-scheme: dark) and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1290x2796-dark.png" />
      </Head>
      {isAdmin ? (
        <div className={cn(poppins.className, "admin-root")}>
          <Component {...pageProps} />
        </div>
      ) : (
        <div
          className={cn(
            spaceGrotesk.variable,
            spaceGrotesk.className,
            "site-root",
          )}
        >
          <Component {...pageProps} />
          <MiniPlayer />
          <Toaster
            position="bottom-center"
            offset={90}
            toastOptions={{
              className: cn(spaceGrotesk.className, "nmc-toast"),
            }}
          />
        </div>
      )}
      <Analytics />
    </>
  );
}
