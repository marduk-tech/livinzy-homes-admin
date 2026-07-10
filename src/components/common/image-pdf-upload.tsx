import { UploadOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Flex,
  Image,
  message,
  Modal,
  Space,
  Typography,
} from "antd";
import React, { ReactNode, useRef, useState } from "react";
import { axiosApiInstance } from "../../libs/axios-api-Instance";
import { PdfPageImage, renderPdfToImages } from "../../libs/pdf-to-images";

const MAX_FILE_SIZE_MB = 20;

interface UploadItem {
  blob: Blob;
  name: string;
  caption: string;
  dataUrl: string;
  checked: boolean;
}

interface ImagePdfUploadProps {
  onUploadComplete: (
    urls: string[],
    originalNames: string[],
    captions: string[],
  ) => void;
  button?: {
    label?: string | ReactNode;
    type?: "primary" | "link" | "text" | "default" | "dashed" | undefined;
  };
}

// Uploads selected blobs to the shared upload endpoint, returns the S3 urls.
async function uploadBlobs(items: UploadItem[]): Promise<string[]> {
  const formData = new FormData();
  items.forEach((item) => formData.append("files", item.blob, item.name));

  const { data } = await axiosApiInstance.post("upload/multiple", formData, {
    headers: { "client-type": "admin" },
  });

  return (data?.results || []).map((r: { Location: string }) => r.Location);
}

// "Upload Images" that also accepts PDFs, rasterizing pages for the user to pick.
export const ImagePdfUpload: React.FC<ImagePdfUploadProps> = ({
  onUploadComplete,
  button = { label: "Upload Images", type: "primary" },
}) => {
  const [pdfPages, setPdfPages] = useState<UploadItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doUpload = async (items: UploadItem[]) => {
    if (!items.length) return;
    setUploading(true);
    try {
      const urls = await uploadBlobs(items);
      onUploadComplete(
        urls,
        items.map((i) => i.name),
        items.map((i) => i.caption),
      );
    } catch (e) {
      message.error("Upload failed");
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = async (selected: File[]) => {
    const oversized = selected.filter(
      (f) => f.size / 1024 / 1024 >= MAX_FILE_SIZE_MB,
    );
    oversized.forEach((f) =>
      message.error(`${f.name} is larger than ${MAX_FILE_SIZE_MB}MB!`),
    );
    const files = selected.filter((f) => !oversized.includes(f));

    const images = files.filter((f) => f.type.startsWith("image/"));
    const pdfs = files.filter((f) => f.type === "application/pdf");

    // plain images upload straight through, no dialog
    if (images.length) {
      await doUpload(
        images.map((f) => ({
          blob: f,
          name: f.name,
          caption: "",
          dataUrl: "",
          checked: true,
        })),
      );
    }

    if (pdfs.length) {
      setRendering(true);
      const items: UploadItem[] = [];
      try {
        for (const pdf of pdfs) {
          const baseName = pdf.name.replace(/\.pdf$/i, "");
          const pages: PdfPageImage[] = await renderPdfToImages(pdf, {
            onProgress: (done, total) =>
              setRenderProgress(`${pdf.name}: page ${done}/${total}`),
          });
          pages.forEach((pg) =>
            items.push({
              blob: pg.blob,
              name: `${baseName}-p${pg.pageNumber}.jpg`,
              caption: `${pdf.name} - p${pg.pageNumber}`,
              dataUrl: pg.dataUrl,
              checked: true,
            }),
          );
        }
        setPdfPages(items);
        setModalOpen(true);
      } catch (e) {
        message.error("Failed to read PDF");
        console.error(e);
      } finally {
        setRendering(false);
        setRenderProgress("");
      }
    }
  };

  const toggle = (idx: number) =>
    setPdfPages((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, checked: !p.checked } : p)),
    );

  const setAll = (checked: boolean) =>
    setPdfPages((prev) => prev.map((p) => ({ ...p, checked })));

  const selectedCount = pdfPages.filter((p) => p.checked).length;

  const confirmSelection = async () => {
    await doUpload(pdfPages.filter((p) => p.checked));
    setModalOpen(false);
    setPdfPages([]);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = ""; // allow re-selecting the same file
          if (files.length) handleFiles(files);
        }}
      />
      <Button
        icon={<UploadOutlined />}
        loading={rendering || uploading}
        type={button.type}
        style={{ marginRight: 16 }}
        onClick={() => inputRef.current?.click()}
      >
        {rendering ? renderProgress || "Rendering..." : button.label}
      </Button>

      <Modal
        title="Select pages to upload"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setPdfPages([]);
        }}
        onOk={confirmSelection}
        okText={`Upload ${selectedCount} page${selectedCount === 1 ? "" : "s"}`}
        okButtonProps={{ disabled: selectedCount === 0, loading: uploading }}
        width={900}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <Typography.Text type="secondary">
            {selectedCount} of {pdfPages.length} selected
          </Typography.Text>
          <Space>
            <Button size="small" onClick={() => setAll(true)}>
              Select all
            </Button>
            <Button size="small" onClick={() => setAll(false)}>
              Select none
            </Button>
          </Space>
        </Flex>

        <Flex
          gap={16}
          wrap="wrap"
          style={{ maxHeight: 500, overflowY: "auto" }}
        >
          {pdfPages.map((page, idx) => (
            <Flex
              key={page.name}
              vertical
              align="center"
              gap={4}
              style={{
                border: page.checked
                  ? "2px solid #1677ff"
                  : "2px solid transparent",
                borderRadius: 6,
                padding: 4,
                cursor: "pointer",
              }}
              onClick={() => toggle(idx)}
            >
              <Image
                src={page.dataUrl}
                width={140}
                preview={false}
                style={{ objectFit: "contain" }}
              />
              <Checkbox
                checked={page.checked}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggle(idx)}
              >
                <Typography.Text
                  style={{ maxWidth: 130, fontSize: 12 }}
                  ellipsis={{ tooltip: page.caption }}
                >
                  {page.caption}
                </Typography.Text>
              </Checkbox>
            </Flex>
          ))}
        </Flex>
      </Modal>
    </>
  );
};
