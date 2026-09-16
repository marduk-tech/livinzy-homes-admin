import {
  Button,
  Flex,
  Input,
  Modal,
  Segmented,
  Slider,
  Space,
  Typography,
  message,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  ScissorOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import React, { useEffect, useRef, useState } from "react";
import { useAnnotateImage } from "../../hooks/annotate-hooks";

const { Text } = Typography;

type Tool = "rect" | "ellipse" | "arrow" | "pen" | "text" | "crop";

type Rect = { x: number; y: number; w: number; h: number };

type Shape =
  | { id: number; type: "rect"; x: number; y: number; w: number; h: number; color: string; strokeWidth: number }
  | { id: number; type: "ellipse"; cx: number; cy: number; rx: number; ry: number; color: string; strokeWidth: number }
  | { id: number; type: "arrow"; x1: number; y1: number; x2: number; y2: number; color: string; strokeWidth: number }
  | { id: number; type: "pen"; points: { x: number; y: number }[]; color: string; strokeWidth: number }
  | { id: number; type: "text"; x: number; y: number; text: string; color: string; fontSize: number };

const COLORS = ["#ff3b30", "#ffcc00", "#34c759", "#0a84ff", "#ffffff", "#000000"];

const MAX_DISPLAY_WIDTH = 800;
const MAX_DISPLAY_HEIGHT = 520;

const arrowHead = (x1: number, y1: number, x2: number, y2: number, strokeWidth: number) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = Math.max(10, strokeWidth * 4);
  const spread = 0.45;
  const p2 = { x: x2 - headLen * Math.cos(angle - spread), y: y2 - headLen * Math.sin(angle - spread) };
  const p3 = { x: x2 - headLen * Math.cos(angle + spread), y: y2 - headLen * Math.sin(angle + spread) };
  return { p2, p3 };
};

const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
  ctx.strokeStyle = shape.type === "text" ? "transparent" : shape.color;
  ctx.fillStyle = shape.color;

  if (shape.type === "rect") {
    ctx.lineWidth = shape.strokeWidth;
    ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
  } else if (shape.type === "ellipse") {
    ctx.lineWidth = shape.strokeWidth;
    ctx.beginPath();
    ctx.ellipse(shape.cx, shape.cy, Math.abs(shape.rx), Math.abs(shape.ry), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (shape.type === "arrow") {
    ctx.lineWidth = shape.strokeWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(shape.x1, shape.y1);
    ctx.lineTo(shape.x2, shape.y2);
    ctx.stroke();
    const { p2, p3 } = arrowHead(shape.x1, shape.y1, shape.x2, shape.y2, shape.strokeWidth);
    ctx.beginPath();
    ctx.moveTo(shape.x2, shape.y2);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === "pen") {
    if (shape.points.length < 2) return;
    ctx.lineWidth = shape.strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    shape.points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  } else if (shape.type === "text") {
    ctx.font = `600 ${shape.fontSize}px sans-serif`;
    ctx.lineWidth = Math.max(2, shape.fontSize / 8);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.strokeText(shape.text, shape.x, shape.y);
    ctx.fillText(shape.text, shape.x, shape.y);
  }
};

const normalizeRect = (r: Rect): Rect => ({
  x: Math.min(r.x, r.x + r.w),
  y: Math.min(r.y, r.y + r.h),
  w: Math.abs(r.w),
  h: Math.abs(r.h),
});

// Dims everything outside the crop rect and outlines it, without touching
// the pixels inside (which may include annotation shapes already drawn).
const drawCropMask = (
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  canvasW: number,
  canvasH: number,
) => {
  const { x, y, w, h } = rect;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, canvasW, y);
  ctx.fillRect(0, y + h, canvasW, canvasH - (y + h));
  ctx.fillRect(0, y, x, h);
  ctx.fillRect(x + w, y, canvasW - (x + w), h);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#1677ff";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
};

interface ImageAnnotateModalProps {
  visible: boolean;
  imageUrl: string;
  onCancel: () => void;
  onSave: (newUrl: string) => void;
}

export const ImageAnnotateModal: React.FC<ImageAnnotateModalProps> = ({
  visible,
  imageUrl,
  onCancel,
  onSave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drawingRef = useRef<Shape | null>(null);
  const cropDraftRef = useRef<Rect | null>(null);
  const nextId = useRef(0);
  const suppressBlurCommit = useRef(false);

  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [tool, setTool] = useState<Tool>("rect");
  const [color, setColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [textDraft, setTextDraft] = useState<{ x: number; y: number; value: string } | null>(null);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [, forceRedraw] = useState(0);

  const annotateMutation = useAnnotateImage();

  useEffect(() => {
    if (!visible) return;
    setShapes([]);
    setNaturalSize(null);
    setDisplaySize(null);
    setTextDraft(null);
    setCropRect(null);
    setTool("rect");
  }, [visible, imageUrl]);

  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const scale = Math.min(1, MAX_DISPLAY_WIDTH / w, MAX_DISPLAY_HEIGHT / h);
    setNaturalSize({ w, h });
    setDisplaySize({ w: Math.round(w * scale), h: Math.round(h * scale) });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const cropCanvas = cropCanvasRef.current;
    if (!canvas || !cropCanvas || !naturalSize) return;

    canvas.width = naturalSize.w;
    canvas.height = naturalSize.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach((s) => drawShape(ctx, s));
    if (drawingRef.current) drawShape(ctx, drawingRef.current);

    // Kept on its own canvas, layered above the shapes canvas, so the crop
    // guide never ends up baked into the exported annotation overlay.
    cropCanvas.width = naturalSize.w;
    cropCanvas.height = naturalSize.h;
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) return;
    cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    const activeCrop = cropDraftRef.current
      ? normalizeRect(cropDraftRef.current)
      : cropRect;
    if (activeCrop) {
      drawCropMask(cropCtx, activeCrop, cropCanvas.width, cropCanvas.height);
    }
  });

  const scaleFactor = naturalSize && displaySize ? naturalSize.w / displaySize.w : 1;

  const getPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };

  const isDrawingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Canvas isn't focusable, so the browser's default mousedown handling
    // would otherwise shift focus to the nearest focusable ancestor (the
    // Modal's own content wrapper) right after we focus the text input
    // below, silently stealing it back. Suppressing the default action
    // prevents that fight.
    e.preventDefault();
    if (!naturalSize) return;
    const { x, y } = getPos(e);
    const sw = strokeWidth * scaleFactor;

    if (tool === "text") {
      setTextDraft({ x, y, value: "" });
      return;
    }

    if (tool === "crop") {
      isDrawingRef.current = true;
      cropDraftRef.current = { x, y, w: 0, h: 0 };
      forceRedraw((n) => n + 1);
      return;
    }

    isDrawingRef.current = true;
    const id = nextId.current++;
    if (tool === "rect") {
      drawingRef.current = { id, type: "rect", x, y, w: 0, h: 0, color, strokeWidth: sw };
    } else if (tool === "ellipse") {
      drawingRef.current = { id, type: "ellipse", cx: x, cy: y, rx: 0, ry: 0, color, strokeWidth: sw };
    } else if (tool === "arrow") {
      drawingRef.current = { id, type: "arrow", x1: x, y1: y, x2: x, y2: y, color, strokeWidth: sw };
    } else if (tool === "pen") {
      drawingRef.current = { id, type: "pen", points: [{ x, y }], color, strokeWidth: sw };
    }
    forceRedraw((n) => n + 1);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tool === "crop") {
      if (!isDrawingRef.current || !cropDraftRef.current) return;
      const { x, y } = getPos(e);
      cropDraftRef.current.w = x - cropDraftRef.current.x;
      cropDraftRef.current.h = y - cropDraftRef.current.y;
      forceRedraw((n) => n + 1);
      return;
    }

    if (!isDrawingRef.current || !drawingRef.current) return;
    const { x, y } = getPos(e);
    const shape = drawingRef.current;

    if (shape.type === "rect") {
      shape.w = x - shape.x;
      shape.h = y - shape.y;
    } else if (shape.type === "ellipse") {
      shape.rx = x - shape.cx;
      shape.ry = y - shape.cy;
    } else if (shape.type === "arrow") {
      shape.x2 = x;
      shape.y2 = y;
    } else if (shape.type === "pen") {
      shape.points.push({ x, y });
    }
    forceRedraw((n) => n + 1);
  };

  const handleMouseUp = () => {
    if (tool === "crop") {
      if (!isDrawingRef.current || !cropDraftRef.current) return;
      isDrawingRef.current = false;
      const draft = normalizeRect(cropDraftRef.current);
      cropDraftRef.current = null;

      if (draft.w >= 4 && draft.h >= 4 && naturalSize) {
        setCropRect({
          x: Math.max(0, draft.x),
          y: Math.max(0, draft.y),
          w: Math.min(draft.w, naturalSize.w - Math.max(0, draft.x)),
          h: Math.min(draft.h, naturalSize.h - Math.max(0, draft.y)),
        });
      }
      forceRedraw((n) => n + 1);
      return;
    }

    if (!isDrawingRef.current || !drawingRef.current) return;
    isDrawingRef.current = false;
    const shape = drawingRef.current;
    drawingRef.current = null;

    const isTrivial =
      (shape.type === "rect" && Math.abs(shape.w) < 2 && Math.abs(shape.h) < 2) ||
      (shape.type === "ellipse" && Math.abs(shape.rx) < 2 && Math.abs(shape.ry) < 2) ||
      (shape.type === "arrow" && Math.abs(shape.x2 - shape.x1) < 2 && Math.abs(shape.y2 - shape.y1) < 2) ||
      (shape.type === "pen" && shape.points.length < 2);

    if (!isTrivial) setShapes((prev) => [...prev, shape]);
    forceRedraw((n) => n + 1);
  };

  const commitTextDraft = () => {
    if (textDraft && textDraft.value.trim()) {
      setShapes((prev) => [
        ...prev,
        {
          id: nextId.current++,
          type: "text",
          x: textDraft.x,
          y: textDraft.y,
          text: textDraft.value.trim(),
          color,
          fontSize: 18 * scaleFactor,
        },
      ]);
    }
    setTextDraft(null);
  };

  const handleUndo = () => setShapes((prev) => prev.slice(0, -1));
  const handleClear = () => setShapes([]);
  const handleClearCrop = () => setCropRect(null);

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!naturalSize || !canvas) return;
    if (shapes.length === 0 && !cropRect) {
      message.info("Draw an annotation or select a crop area before saving");
      return;
    }

    // Rasterize the annotation layer in the browser (which reliably has
    // fonts) rather than shipping SVG <text> for the server to render —
    // server-side SVG text rendering depends on fonts being installed on
    // that host, which isn't guaranteed. The crop mask itself is UI-only
    // and isn't part of this overlay.
    const overlayImage = shapes.length > 0 ? canvas.toDataURL("image/png") : undefined;

    try {
      const result = await annotateMutation.mutateAsync({
        imageUrl,
        overlayImage,
        cropRect: cropRect ?? undefined,
      });
      message.success(cropRect ? "Image saved" : "Annotated image saved");
      onSave(result.annotatedImageUrl);
    } catch {
      // handled by hook's onError
    }
  };

  return (
    <Modal
      open={visible}
      title="Annotate Image"
      onCancel={onCancel}
      width={Math.min(920, (displaySize?.w || 800) + 100)}
      destroyOnClose
      footer={
        <Flex justify="space-between" align="center">
          <Space>
            <Button icon={<UndoOutlined />} onClick={handleUndo} disabled={shapes.length === 0}>
              Undo
            </Button>
            <Button icon={<DeleteOutlined />} onClick={handleClear} disabled={shapes.length === 0}>
              Clear
            </Button>
          </Space>
          <Space>
            <Button icon={<CloseOutlined />} onClick={onCancel} disabled={annotateMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSave}
              loading={annotateMutation.isPending}
            >
              Save &amp; Replace
            </Button>
          </Space>
        </Flex>
      }
    >
      <Flex vertical gap={12}>
        <Flex gap={16} wrap="wrap" align="center">
          <Segmented
            value={tool}
            onChange={(v) => setTool(v as Tool)}
            options={[
              { label: "Rectangle", value: "rect" },
              { label: "Ellipse", value: "ellipse" },
              { label: "Arrow", value: "arrow" },
              { label: "Pen", value: "pen" },
              { label: "Text", value: "text" },
              { label: "Crop", value: "crop", icon: <ScissorOutlined /> },
            ]}
          />
          {cropRect && (
            <Button size="small" icon={<UndoOutlined />} onClick={handleClearCrop}>
              Reset Crop
            </Button>
          )}
          <Space>
            {COLORS.map((c) => (
              <div
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "2px solid #1677ff" : "1px solid #d9d9d9",
                  cursor: "pointer",
                }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: 24, height: 24, padding: 0, border: "none", background: "none", cursor: "pointer" }}
            />
          </Space>
          <Flex align="center" gap={8} style={{ minWidth: 160 }}>
            <Text style={{ fontSize: 12 }}>Thickness</Text>
            <Slider min={1} max={12} value={strokeWidth} onChange={setStrokeWidth} style={{ width: 100 }} />
          </Flex>
        </Flex>

        <div
          ref={containerRef}
          style={{
            position: "relative",
            width: displaySize?.w || "100%",
            height: displaySize?.h || 300,
            margin: "0 auto",
            background: "#f5f5f5",
            overflow: "hidden",
          }}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Annotate target"
            onLoad={handleImgLoad}
            style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              cursor: tool === "text" ? "text" : "crosshair",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <canvas
            ref={cropCanvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          />
          {textDraft && displaySize && naturalSize && (() => {
            const INPUT_WIDTH = 160;
            const INPUT_HEIGHT = 32;
            const left = Math.min(
              Math.max(textDraft.x / scaleFactor, 0),
              Math.max(0, displaySize.w - INPUT_WIDTH),
            );
            const top = Math.min(
              Math.max(textDraft.y / scaleFactor - 12, 0),
              Math.max(0, displaySize.h - INPUT_HEIGHT),
            );
            return (
              <Input
                autoFocus
                size="small"
                value={textDraft.value}
                placeholder="Type text, press Enter"
                onChange={(e) => setTextDraft({ ...textDraft, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    suppressBlurCommit.current = true;
                    commitTextDraft();
                  } else if (e.key === "Escape") {
                    suppressBlurCommit.current = true;
                    setTextDraft(null);
                  }
                }}
                onBlur={() => {
                  if (suppressBlurCommit.current) {
                    suppressBlurCommit.current = false;
                    return;
                  }
                  commitTextDraft();
                }}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: INPUT_WIDTH,
                  zIndex: 10,
                }}
              />
            );
          })()}
        </div>
      </Flex>
    </Modal>
  );
};

export default ImageAnnotateModal;
