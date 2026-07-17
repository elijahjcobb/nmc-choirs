import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  cwd: string[];
  onFiles: (files: File[]) => void;
  children: React.ReactNode;
}

/** Wraps the file list; shows a drop overlay for OS files dragged in from the desktop. */
export function UploadZone({ cwd, onFiles, children }: Props) {
  const [active, setActive] = useState(false);
  const depth = useRef(0);
  const location = cwd.length ? cwd.join(" / ") : "All Files";

  const isFileDrag = (e: React.DragEvent) => e.dataTransfer.types.includes("Files");

  return (
    <div
      className="relative flex-1 overflow-auto"
      onDragEnter={(e) => {
        if (!isFileDrag(e)) return;
        e.preventDefault();
        depth.current += 1;
        setActive(true);
      }}
      onDragOver={(e) => {
        if (!isFileDrag(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        if (!isFileDrag(e)) return;
        depth.current -= 1;
        if (depth.current <= 0) {
          depth.current = 0;
          setActive(false);
        }
      }}
      onDrop={(e) => {
        if (!isFileDrag(e)) return;
        e.preventDefault();
        depth.current = 0;
        setActive(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(files);
      }}
    >
      {children}
      {active && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2",
            "border-2 border-dashed border-ring bg-background/85 text-sm font-medium",
          )}
        >
          <UploadCloud className="size-8" />
          Drop to upload to {location}
        </div>
      )}
    </div>
  );
}
