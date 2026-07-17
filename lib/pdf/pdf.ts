// pdf.js loader. Uses the LEGACY build so older iPhones (pre-Safari-17.4, no
// Promise.withResolvers) still render scores. The worker is bundled (not a CDN)
// via `new URL(..., import.meta.url)`, which both webpack and Turbopack support.
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

if (typeof window !== "undefined" && !GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
}

export type { PDFDocumentProxy, PDFPageProxy };

export function loadPdf(url: string): Promise<PDFDocumentProxy> {
  return getDocument({ url }).promise;
}
