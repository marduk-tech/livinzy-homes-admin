import { GlobalOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Flex,
  Image,
  Input,
  message,
  Modal,
  Space,
  Spin,
  Typography,
} from "antd";
import React, { ReactNode, useState } from "react";
import {
  fetchWebsiteImages,
  proxiedImageUrl,
  uploadImagesFromUrls,
} from "../../libs/api/fetch-website-images";

interface ScrapedImage {
  url: string;
  checked: boolean;
}

interface FetchImagesUploadProps {
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

// Given a website URL, fetches the page server-side, lets the user pick
// which images to keep from what was found, then re-uploads the selected
// ones to our own storage (see image-process.controller.js) and reports
// them back the same way ImagePdfUpload does.
export const FetchImagesUpload: React.FC<FetchImagesUploadProps> = ({
  onUploadComplete,
  button = { label: "Fetch Images" },
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [images, setImages] = useState<ScrapedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const closeModal = () => {
    setModalOpen(false);
    setSiteUrl("");
    setImages([]);
    setFetched(false);
  };

  const handleFetch = async () => {
    const url = siteUrl.trim();
    if (!url) return;
    setFetching(true);
    setImages([]);
    try {
      const { imageUrls, errors, lowResCount } = await fetchWebsiteImages(url);
      setImages(imageUrls.map((imageUrl) => ({ url: imageUrl, checked: true })));
      setFetched(true);
      if (!imageUrls.length) {
        message.info("No images found on those page(s)");
      }
      if (lowResCount) {
        message.info(
          `Skipped ${lowResCount} low-res image${lowResCount === 1 ? "" : "s"} (icons/logos)`,
        );
      }
      if (errors?.length) {
        message.warning(
          `${errors.length} url${errors.length === 1 ? "" : "s"} could not be fetched`,
        );
        console.warn("fetchWebsiteImages errors:", errors);
      }
    } catch (e) {
      message.error("Failed to fetch images from that url");
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  const toggle = (idx: number) =>
    setImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, checked: !img.checked } : img)),
    );

  const setAll = (checked: boolean) =>
    setImages((prev) => prev.map((img) => ({ ...img, checked })));

  const selectedCount = images.filter((img) => img.checked).length;

  const confirmUpload = async () => {
    const selected = images.filter((img) => img.checked).map((img) => img.url);
    if (!selected.length) return;
    setUploading(true);
    try {
      const { results } = await uploadImagesFromUrls(selected);
      const succeeded = results.filter(
        (r): r is typeof r & { uploadedUrl: string } => !!r.uploadedUrl,
      );
      const failedCount = results.length - succeeded.length;

      if (succeeded.length) {
        onUploadComplete(
          succeeded.map((r) => r.uploadedUrl),
          succeeded.map((r) => r.sourceUrl.split("/").pop() || r.sourceUrl),
          succeeded.map(() => ""),
        );
      }
      if (failedCount) {
        message.warning(`${failedCount} image(s) failed to upload`);
      }
      closeModal();
    } catch (e) {
      message.error("Upload failed");
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button
        icon={<GlobalOutlined />}
        type={button.type}
        onClick={() => setModalOpen(true)}
      >
        {button.label}
      </Button>

      <Modal
        title="Fetch images from a website"
        open={modalOpen}
        onCancel={closeModal}
        onOk={confirmUpload}
        okText={`Upload ${selectedCount} image${selectedCount === 1 ? "" : "s"}`}
        okButtonProps={{ disabled: selectedCount === 0, loading: uploading }}
        width={900}
      >
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
          Separate multiple site urls with commas
        </Typography.Text>
        <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
          <Input
            placeholder="https://example.com/page1, https://example.com/page2"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            onPressEnter={handleFetch}
            disabled={fetching}
          />
          <Button type="primary" loading={fetching} onClick={handleFetch}>
            Fetch
          </Button>
        </Space.Compact>

        {fetching ? (
          <Flex justify="center" style={{ padding: 40 }}>
            <Spin />
          </Flex>
        ) : images.length > 0 ? (
          <>
            <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
              <Typography.Text type="secondary">
                {selectedCount} of {images.length} selected
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

            <Flex gap={16} wrap="wrap" style={{ maxHeight: 500, overflowY: "auto" }}>
              <Image.PreviewGroup>
                {images.map((img, idx) => (
                  <Flex
                    key={img.url}
                    vertical
                    align="center"
                    gap={4}
                    style={{
                      width: 140,
                      border: img.checked
                        ? "2px solid #1677ff"
                        : "2px solid transparent",
                      borderRadius: 6,
                      padding: 4,
                      cursor: "pointer",
                    }}
                    onClick={() => toggle(idx)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Image
                        src={proxiedImageUrl(img.url)}
                        width={130}
                        height={100}
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <Checkbox
                      checked={img.checked}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggle(idx)}
                    />
                  </Flex>
                ))}
              </Image.PreviewGroup>
            </Flex>
          </>
        ) : fetched ? (
          <Typography.Text type="secondary">
            No images found on that page.
          </Typography.Text>
        ) : null}
      </Modal>
    </>
  );
};
