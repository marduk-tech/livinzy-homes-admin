import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Flex, Input, Modal, Space } from "antd";
import React, { useState } from "react";

interface MultiUrlEditorProps {
  initialValue?: string;
  onChange: (value: string) => void;
  title?: string;
}

const parseUrls = (value?: string): string[] => {
  const urls = (value || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  return urls.length ? urls : [""];
};

export const MultiUrlEditor: React.FC<MultiUrlEditorProps> = ({
  initialValue,
  onChange,
  title,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urls, setUrls] = useState<string[]>([""]);

  const handleOpen = () => {
    setUrls(parseUrls(initialValue));
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleOk = () => {
    const cleanedUrls = urls.map((url) => url.trim()).filter(Boolean);
    onChange(cleanedUrls.join(", "));
    setIsModalOpen(false);
  };

  const handleUrlChange = (index: number, value: string) => {
    setUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
  };

  const handleRemoveUrl = (index: number) => {
    setUrls((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length ? updated : [""];
    });
  };

  const handleAddUrl = () => {
    setUrls((prev) => [...prev, ""]);
  };

  return (
    <>
      <Button
        type="link"
        icon={<EditOutlined />}
        onClick={handleOpen}
        style={{ padding: 0 }}
      >
        Edit
      </Button>
      <Modal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        title={title}
        okText="Save"
        cancelText="Cancel"
      >
        <Flex vertical gap={8} style={{ marginTop: 20 }}>
          {urls.map((url, index) => (
            <Space.Compact key={index} style={{ width: "100%" }}>
              <Input
                value={url}
                placeholder="https://example.com"
                onChange={(e) => handleUrlChange(index, e.target.value)}
              />
              <Button
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveUrl(index)}
              />
            </Space.Compact>
          ))}
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddUrl}>
            Add Website
          </Button>
        </Flex>
      </Modal>
    </>
  );
};
