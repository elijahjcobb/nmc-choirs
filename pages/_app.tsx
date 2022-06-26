import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'

function MyApp({ Component, pageProps }: AppProps) {
  return <>
    <Head>
      <title>NMC Music</title>
      <link rel="icon" href="/icon-16.png" sizes='16x16' />
      <link rel="icon" href="/icon-32.png" sizes='32x32' />
    </Head>
    <Component {...pageProps} />
  </>
}

export default MyApp
