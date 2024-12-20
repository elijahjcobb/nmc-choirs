import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { Analytics } from '@vercel/analytics/react';
import styles from "../styles/container.module.css";
import { Poppins as Font } from "@next/font/google";
import classnames from "classnames";

const font = Font({ subsets: ['latin'], weight: ["200", "400", "800"] })

function MyApp({ Component, pageProps }: AppProps) {
  return <>
    <Head>
      <title>NMC Music</title>
      <link rel="icon" href="/icon-16.png" sizes='16x16' />
      <link rel="icon" href="/icon-32.png" sizes='32x32' />
      <meta charSet="utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no" />
      <meta name="description" content="description of your project" />
      <meta name="theme-color" content="var(--nmc)" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="shortcut icon" href="/icon.png" />
      <link rel="apple-touch-icon" href="/icon.png"></link>
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Head>
    <div className={classnames(styles.container, font.className)}>
      <div className={styles.child}>
        <Component {...pageProps} />
      </div>
    </div>
    <Analytics />
  </>
}

export default MyApp
