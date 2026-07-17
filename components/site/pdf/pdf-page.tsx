// One PDF page rendered to a canvas at device-pixel resolution, only when it
// scrolls near the viewport. Reports its visibility ratio so the parent can show
// a page indicator.
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "@/lib/pdf/pdf";

export function PdfPage({
  doc,
  pageNumber,
  width,
  onVisible,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  onVisible: (page: number, ratio: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aspect, setAspect] = useState(11 / 8.5);
  const renderedWidth = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;

    const render = async () => {
      if (!canvasRef.current || renderedWidth.current === width) return;
      const page = await doc.getPage(pageNumber);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      setAspect(base.height / base.width);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: (width / base.width) * dpr });
      const canvas = canvasRef.current;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      renderTask = page.render({ canvas, canvasContext: ctx, viewport });
      try {
        await renderTask.promise;
        renderedWidth.current = width;
      } catch {
        /* cancelled */
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) void render();
          onVisible(pageNumber, e.intersectionRatio);
        }
      },
      { rootMargin: "150% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    if (wrapRef.current) io.observe(wrapRef.current);

    return () => {
      cancelled = true;
      renderTask?.cancel();
      io.disconnect();
    };
  }, [doc, pageNumber, width, onVisible]);

  return (
    <div
      ref={wrapRef}
      data-page={pageNumber}
      className="w-full overflow-hidden rounded-[4px] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
      style={{ aspectRatio: `1 / ${aspect}` }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
