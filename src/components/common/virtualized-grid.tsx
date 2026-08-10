import { Key, ReactNode, useEffect, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";

interface VirtualizedGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  gap?: number;
  maxHeight: number;
  getKey: (item: T, index: number) => Key;
  renderItem: (item: T, index: number) => ReactNode;
}

// Renders `items` as a wrapping grid but only mounts the rows within (and
// just around) the visible scroll window, via react-window. Chunks items
// into fixed-column rows based on measured container width rather than
// relying on browser flex-wrap, since react-window needs a known row count
// up front.
export function VirtualizedGrid<T>({
  items,
  itemWidth,
  itemHeight,
  gap = 16,
  maxHeight,
  getKey,
  renderItem,
}: VirtualizedGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columnsPerRow = Math.max(
    1,
    Math.floor((containerWidth + gap) / (itemWidth + gap))
  );
  const rowCount = Math.ceil(items.length / columnsPerRow);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      {containerWidth > 0 && (
        <List
          height={maxHeight}
          width={containerWidth}
          itemCount={rowCount}
          itemSize={itemHeight + gap}
          overscanCount={2}
        >
          {({ index, style }) => {
            const start = index * columnsPerRow;
            const rowItems = items.slice(start, start + columnsPerRow);
            return (
              <div style={{ ...style, display: "flex", gap }}>
                {rowItems.map((item, i) => (
                  <div key={getKey(item, start + i)} style={{ flexShrink: 0 }}>
                    {renderItem(item, start + i)}
                  </div>
                ))}
              </div>
            );
          }}
        </List>
      )}
    </div>
  );
}
