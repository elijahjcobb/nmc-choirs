// Sharing helpers: build deep links (?t= for audio, ?page= for PDFs) and hand
// them to the native share sheet, falling back to the clipboard.
import { toast } from "sonner";

export function fileUrl(
  path: string[],
  params?: Record<string, string | number>,
): string {
  const base =
    (typeof location !== "undefined" ? location.origin : "") +
    "/" +
    path.map(encodeURIComponent).join("/");
  if (!params) return base;
  const q = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `${base}?${q}` : base;
}

export async function copyLink(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  } catch {
    toast.error("Couldn’t copy link");
  }
}

export async function shareLink(url: string, title: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, url });
    } catch {
      /* user cancelled — no toast */
    }
    return;
  }
  await copyLink(url);
}
