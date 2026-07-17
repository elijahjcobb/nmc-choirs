import { Icon } from "../icons";
import type { IconName } from "../icons";

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: IconName;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <Icon name={icon} size={52} className="text-faint" />
      <div className="text-base font-semibold text-ink">{title}</div>
      <div className="max-w-[320px] text-[13.5px] text-subtle text-pretty">
        {message}
      </div>
    </div>
  );
}
