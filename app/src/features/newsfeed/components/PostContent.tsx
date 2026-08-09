import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { RichText } from "./RichText";

export function PostContent({ content, single = false }: { content: string; single?: boolean }) {
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(single);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => setExpanded(single), [content, single]);
  useEffect(() => {
    const node = contentRef.current;
    if (!node || single) { setOverflowing(false); return; }
    const measure = () => setOverflowing(node.scrollHeight > node.clientHeight + 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [content, expanded, single]);

  return <div className="post-content" data-expanded={expanded} data-overflowing={overflowing && !expanded}>
    <div id={contentId} ref={contentRef} className="post-content__viewport"><RichText content={content} /></div>
    {overflowing || expanded && !single ? <button type="button" className="post-content__toggle" onClick={() => setExpanded((value) => !value)} aria-controls={contentId} aria-expanded={expanded}>{expanded ? <>Show less<ChevronUp size={14} /></> : <>Show more<ChevronDown size={14} /></>}</button> : null}
  </div>;
}
