import { parseHighlight } from "@/lib/search/highlight";

export function HighlightedText({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const segments = parseHighlight(value);

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <mark
            key={index}
            className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-medium px-0.5 rounded"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
