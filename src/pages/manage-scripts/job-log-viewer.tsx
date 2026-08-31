import { useEffect, useRef } from "react";

const TAIL_THRESHOLD_PX = 40;

interface JobLogViewerProps {
  logs: string[];
  height?: number;
}

export function JobLogViewer({ logs, height = 420 }: JobLogViewerProps) {
  const ref = useRef<HTMLPreElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance <= TAIL_THRESHOLD_PX;
  };

  return (
    <pre
      ref={ref}
      onScroll={handleScroll}
      style={{
        height,
        overflow: "auto",
        margin: 0,
        padding: 12,
        background: "#0f1115",
        color: "#d7dbe0",
        borderRadius: 6,
        fontSize: 12,
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {logs.length ? logs.join("\n") : "(no output yet)"}
    </pre>
  );
}
