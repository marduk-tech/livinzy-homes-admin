import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

export type PdfDocument = PDFDocumentProxy;

export interface PdfPagePreview {
  pageNumber: number;
  dataUrl: string;
}

export interface PdfPageRender {
  pageNumber: number;
  blob: Blob;
}

interface ProgressOptions {
  onProgress?: (done: number, total: number) => void;
}

const PREVIEW_SCALE = 0.5;
const PREVIEW_QUALITY = 0.6;
const FULL_SCALE = 2;
const FULL_QUALITY = 0.85;

export async function loadPdfDocument(file: File): Promise<PdfDocument> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  return loadingTask.promise;
}

async function renderPageToCanvas(
  pdf: PdfDocument,
  pageNumber: number,
  scale: number,
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({ canvas, viewport }).promise;
  page.cleanup();

  return canvas;
}

// Cheap low-res thumbnails for every page, used to populate the page picker.
export async function renderPdfPreviews(
  pdf: PdfDocument,
  { onProgress }: ProgressOptions = {},
): Promise<PdfPagePreview[]> {
  const total = pdf.numPages;
  const previews: PdfPagePreview[] = [];

  for (let p = 1; p <= total; p++) {
    const canvas = await renderPageToCanvas(pdf, p, PREVIEW_SCALE);
    previews.push({
      pageNumber: p,
      dataUrl: canvas.toDataURL("image/jpeg", PREVIEW_QUALITY),
    });
    onProgress?.(p, total);
  }

  return previews;
}

// Full-resolution rasterization, done only for the pages the user actually selects.
export async function renderPdfPage(
  pdf: PdfDocument,
  pageNumber: number,
  { scale = FULL_SCALE, quality = FULL_QUALITY } = {},
): Promise<PdfPageRender> {
  const canvas = await renderPageToCanvas(pdf, pageNumber, scale);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error(`toBlob failed on page ${pageNumber}`)),
      "image/jpeg",
      quality,
    ),
  );

  return { pageNumber, blob };
}
