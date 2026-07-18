// Plain-text (monospace card) and Markdown (rich prose) rendering. Content is
// fetched from the blob URL. Markdown is admin-authored (trusted), but raw
// <script>/event-handler attributes are stripped as cheap hardening.
import { useEffect, useState } from "react";
import { marked } from "marked";
import type { TreeFileNode } from "@/lib/tree-types";

function sanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/ on[a-z]+="[^"]*"/gi, "")
    .replace(/ on[a-z]+='[^']*'/gi, "");
}

export function TextViewer({ file }: { file: TreeFileNode; path: string[] }) {
  const [content, setContent] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setContent(null);
    setFailed(false);
    fetch(file.url)
      .then((r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.text();
      })
      .then((t) => active && setContent(t))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [file.url]);

  const cardClass =
    "rounded-[18px] border border-line bg-surface p-[clamp(18px,3vw,26px)]";

  if (failed) {
    return <div className={`${cardClass} text-sm text-subtle`}>Couldn’t load this file.</div>;
  }
  if (content === null) {
    return (
      <div className={cardClass}>
        <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-line" />
        <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-line" />
      </div>
    );
  }

  if (file.ext === "md") {
    const html = sanitize(marked.parse(content, { async: false }) as string);
    return (
      <div
        className={`prose-nmc rounded-[18px] border border-line bg-surface p-[clamp(20px,4vw,30px)]`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className={cardClass}>
      <pre className="m-0 whitespace-pre-wrap font-mono text-[13px] leading-[1.75] text-ink/85">
        {content}
      </pre>
    </div>
  );
}
