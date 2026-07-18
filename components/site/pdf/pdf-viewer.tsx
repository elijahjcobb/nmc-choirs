// Scrollable pdf.js score viewer: paper-card pages rendered lazily, a page
// indicator, remembered scroll page per file, and a ?page= deep link. Loaded via
// next/dynamic(ssr:false) so pdf.js never touches the server bundle.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { loadPdf, type PDFDocumentProxy } from "@/lib/pdf/pdf";
import { PdfPage } from "./pdf-page";
import { readMapEntry, writeMapEntry } from "@/lib/storage/storage";
import { pathKey } from "@/lib/paths";
import { Icon } from "../icons";
import type { TreeFileNode } from "@/lib/tree-types";

const PDF_POS = "pdf.positions";
const PDF_META = "pdf.meta";

export default function PdfViewer({ file, path }: { file: TreeFileNode; path: string[] }) {
  const router = useRouter();
  const key = pathKey(path);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState(600);
  const [current, setCurrent] = useState(1);
  const ratios = useRef<Map<number, number>>(new Map());
  const restored = useRef(false);

  // Load the document.
  useEffect(() => {
    let cancelled = false;
    setDoc(null);
    setFailed(false);
    restored.current = false;
    loadPdf(file.url)
      .then((d) => {
        if (cancelled) return;
        setDoc(d);
        writeMapEntry(PDF_META, key, { pages: d.numPages, at: Date.now() }, 300);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [file.url, key]);

  // Track container width (page render resolution).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.min(el.clientWidth, 900));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [doc]);

  const onVisible = useCallback((page: number, ratio: number) => {
    ratios.current.set(page, ratio);
    let best = 1;
    let max = -1;
    for (const [p, r] of ratios.current) {
      if (r > max) {
        max = r;
        best = p;
      }
    }
    setCurrent(best);
  }, []);

  // Persist the dominant page (throttled by change).
  useEffect(() => {
    if (!doc || !restored.current) return;
    writeMapEntry(PDF_POS, key, { page: current, at: Date.now() }, 200);
  }, [current, doc, key]);

  // Restore saved page / ?page= once the doc and layout are ready.
  useEffect(() => {
    if (!doc || restored.current || width === 0) return;
    const qp = Number(
      Array.isArray(router.query.page) ? router.query.page[0] : router.query.page,
    );
    const saved = readMapEntry<{ page: number }>(PDF_POS, key)?.page;
    const target = Number.isFinite(qp) && qp >= 1 ? qp : saved;
    restored.current = true;
    if (target && target > 1) {
      // Wait a frame for placeholders to lay out, then jump.
      requestAnimationFrame(() => {
        const node = scrollRef.current?.querySelector(`[data-page="${target}"]`);
        node?.scrollIntoView({ block: "start" });
      });
    }
  }, [doc, width, key, router.query.page]);

  const pages = useMemo(
    () => (doc ? Array.from({ length: doc.numPages }, (_, i) => i + 1) : []),
    [doc],
  );

  if (failed) {
    return (
      <div className="rounded-[18px] border border-line bg-surface p-8 text-center">
        <div className="text-sm font-semibold text-ink">Couldn’t display this score</div>
        <div className="mt-1 text-[13px] text-subtle">
          Use Download or Open original above to view it.
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex max-h-[85vh] flex-col items-center gap-3 overflow-y-auto rounded-[18px] border border-line bg-canvas p-[clamp(10px,2vw,20px)]"
      >
        {!doc ? (
          <div
            className="w-full animate-pulse rounded-[4px] bg-line"
            style={{ aspectRatio: "1 / 1.294" }}
          />
        ) : (
          pages.map((p) => (
            <div key={p} className="w-full">
              <PdfPage doc={doc} pageNumber={p} width={width} onVisible={onVisible} />
            </div>
          ))
        )}
      </div>
      {doc && (
        <div
          className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold shadow-lg"
          style={{ background: "var(--toast-bg)", color: "var(--toast-ink)" }}
        >
          <Icon name="picture_as_pdf" size={14} />
          {current} / {doc.numPages}
        </div>
      )}
    </div>
  );
}
