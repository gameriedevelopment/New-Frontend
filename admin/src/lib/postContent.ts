const decodeEntities = (value: string): string => {
  if (typeof document === "undefined") return value;
  const el = document.createElement("textarea");
  el.innerHTML = value;
  return el.value;
};

export function readablePostText(content?: string | null): string {
  if (!content) return "";
  const withoutTags = content
    .replace(/<a\b[^>]*>(.*?)<\/a>/gis, "$1")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\\(\r?\n)/g, "$1")
    .replace(/\\(?=\s|$)/g, "");
  return decodeEntities(withoutTags)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
