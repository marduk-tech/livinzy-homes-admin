import * as pdfjsLib from "pdfjs-dist";
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

export interface PdfPageImage {
  pageNumber: number;
  blob: Blob;
  dataUrl: string;
}

interface RenderOptions {
  scale?: number;
  quality?: number;
  onProgress?: (done: number, total: number) => void;
}

// Rasterize each PDF page to a JPEG blob (+ dataUrl for previews). Runs in the browser.
export async function renderPdfToImages(
  file: File,
  { scale = 2, quality = 0.85, onProgress }: RenderOptions = {},
): Promise<PdfPageImage[]> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const total = pdf.numPages;
  const pages: PdfPageImage[] = [];

  try {
    // Render sequentially to keep memory in check on large PDFs
    for (let p = 1; p <= total; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      await page.render({ canvas, viewport }).promise;

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error(`toBlob failed on page ${p}`))),
          "image/jpeg",
          quality,
        ),
      );
      const dataUrl = canvas.toDataURL("image/jpeg", quality);

      pages.push({ pageNumber: p, blob, dataUrl });
      page.cleanup();
      onProgress?.(p, total);
    }
  } finally {
    await loadingTask.destroy();
  }

  return pages;
}
