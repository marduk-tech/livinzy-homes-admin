import {
  DeleteOutlined,
  DownloadOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import {
  Button,
  Flex,
  Form,
  Input,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import { IMedia } from "../types/Project";
import { FileUpload } from "./common/img-upload";

interface DocumentsListProps {
  project: any;
  onUploadComplete: (
    urls: string[],
    originalNames: string[],
    index?: number,
    mediaType?: "image" | "document" | "video"
  ) => void;
  handleDeleteMedia: (index: number) => void;
}

export const DocumentsList = ({
  project,
  onUploadComplete,
  handleDeleteMedia,
}: DocumentsListProps) => {
  return (
    <>
      <Flex justify="end" style={{ marginBottom: 16, gap: 20 }}>
        <FileUpload
          onUploadComplete={(urls: string[], originalNames: string[]) =>
            onUploadComplete(urls, originalNames, undefined, "document")
          }
          fileType="document"
          button={{
            label: "Upload Documents",
            type: "primary",
          }}
        />
      </Flex>

      <Table
        dataSource={project?.media?.filter(
          (item: IMedia) => item.type === "document"
        )}
        rowKey="_id"
        pagination={false}
        columns={[
          {
            title: "Document",
            key: "document",
            render: (_, record: IMedia, index) => (
              <Flex align="center" gap={16}>
                <Button
                  type="text"
                  href={record.document?.url}
                  target="_blank"
                  icon={<FilePdfOutlined style={{ fontSize: "24px" }} />}
                  style={{ padding: 0 }}
                />
                <div>
                  <Typography.Text strong style={{ display: "block" }}>
                    {record.document?.name || `Document ${index + 1}`}
                  </Typography.Text>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: "12px" }}
                  >
                    {new URL(record.document?.url || "").pathname
                      .split("/")
                      .pop()}
                  </Typography.Text>
                </div>
              </Flex>
            ),
          },
          {
            title: "Document Type",
            key: "documentType",
            render: (_, record: IMedia, index) => (
              <Form.Item
                name={["media", index, "document", "documentType"]}
                style={{ margin: 0, minWidth: 200 }}
              >
                <Select
                  placeholder="Select document type"
                  options={[
                    { value: "brochure", label: "Brochure" },
                    {
                      value: "project-specs",
                      label: "Project Specification",
                    },
                  ]}
                />
              </Form.Item>
            ),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_, record: IMedia, index) => (
              <>
                <Space>
                  <Button
                    type="primary"
                    href={record.document?.url}
                    target="_blank"
                    icon={<DownloadOutlined />}
                  >
                    Download
                  </Button>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteMedia(index)}
                  />
                </Space>
                <Form.Item name={["media", index, "document", "url"]} hidden>
                  <Input />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </>
  );
};
