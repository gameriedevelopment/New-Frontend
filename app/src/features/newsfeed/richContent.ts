import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import MarkdownIt from "markdown-it";
import { full as emoji } from "markdown-it-emoji";
import footnote from "markdown-it-footnote";
import sub from "markdown-it-sub";
import sup from "markdown-it-sup";
import taskLists from "markdown-it-task-lists";

type RenderRule = NonNullable<MarkdownIt["renderer"]["rules"]["text"]>;

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);

const markdown: MarkdownIt = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: true,
  highlight(code: string, language: string): string {
    if (language && hljs.getLanguage(language)) return `<pre class="hljs"><code>${hljs.highlight(code, { language }).value}</code></pre>`;
    return `<pre class="hljs"><code>${markdown.utils.escapeHtml(code)}</code></pre>`;
  },
}).use(emoji).use(taskLists).use(footnote).use(sub).use(sup);

const defaultLinkOpen: RenderRule = markdown.renderer.rules.link_open ?? ((tokens, index, options, _environment, renderer) => renderer.renderToken(tokens, index, options));
markdown.renderer.rules.link_open = (tokens, index, options, environment, renderer) => {
  const token = tokens[index];
  const href = token.attrGet("href") ?? "";
  if (/^https?:\/\//i.test(href)) {
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer");
  }
  return defaultLinkOpen(tokens, index, options, environment, renderer);
};

const defaultText: RenderRule = markdown.renderer.rules.text ?? ((tokens, index) => markdown.utils.escapeHtml(tokens[index].content));
markdown.renderer.rules.text = (tokens, index, options, environment, renderer) => {
  let linkDepth = 0;
  for (let tokenIndex = 0; tokenIndex < index; tokenIndex += 1) {
    if (tokens[tokenIndex].type === "link_open") linkDepth += 1;
    if (tokens[tokenIndex].type === "link_close") linkDepth -= 1;
  }
  if (linkDepth > 0) return defaultText(tokens, index, options, environment, renderer);
  return markdown.utils.escapeHtml(tokens[index].content).replace(/(^|\s)#([\p{L}\p{N}_-]+)/gu, (_match: string, spacing: string, tag: string) => `${spacing}<a href="/search?tag=${encodeURIComponent(tag)}" class="rich-content__tag">#${tag}</a>`);
};

export function renderRichContent(content: unknown) {
  const source = String(content ?? "").replace(/\u2028|\u2029/g, "\n").trim();
  if (!source) return "";
  return DOMPurify.sanitize(markdown.render(source), {
    ADD_ATTR: ["checked", "target"],
    FORBID_TAGS: ["form", "style"],
  });
}

export function firstContentUrl(content: string) {
  const match = content.match(/https?:\/\/[^\s<>"']+/i)?.[0];
  return match?.replace(/[.,!?\])]+$/, "") ?? null;
}
