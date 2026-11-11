export type HighlightSegment = {
  text: string;
  highlighted: boolean;
};

const MARK_TAG = /<mark\b[^>]*>|<\/mark>/gi;

/** Split search snippets into text segments. Mark tags become highlights; every other character stays text. */
export function parseHighlight(value: string): HighlightSegment[] {
  if (!value) return [];

  const segments: HighlightSegment[] = [];
  let highlighted = false;
  let lastIndex = 0;
  MARK_TAG.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = MARK_TAG.exec(value)) !== null) {
    const chunk = value.slice(lastIndex, match.index);
    if (chunk) segments.push({ text: chunk, highlighted });
    highlighted = !match[0].toLowerCase().startsWith("</");
    lastIndex = match.index + match[0].length;
  }

  const rest = value.slice(lastIndex);
  if (rest) segments.push({ text: rest, highlighted });

  return segments.length > 0 ? segments : [{ text: value, highlighted: false }];
}
