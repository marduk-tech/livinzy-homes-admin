import { DownloadOutlined, FilePdfOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Empty, Flex, Radio, Spin, Table, Typography } from "antd";
import { useState } from "react";

import { getReraProjectById } from "../../libs/api/rera-project";
import { ReraDocument, ReraProject } from "../../types/rera-project";

interface ReraDocumentsListProps {
  reraProjectId?: string | ReraProject;
}

export const ReraDocumentsList = ({
  reraProjectId,
}: ReraDocumentsListProps) => {
  const [documentFilter, setDocumentFilter] = useState<"available" | "all">(
    "available"
  );

  // if reraProjectId is a string (ID) or object (populated)
  const isPopulated =
    typeof reraProjectId === "object" && reraProjectId !== null;
  const reraId = isPopulated
    ? (reraProjectId as ReraProject)._id
    : (reraProjectId as string | undefined);

  const { data: fetchedReraProject, isLoading } = useQuery({
    queryKey: ["reraProject", reraId],
    queryFn: () => getReraProjectById(reraId!),
    enabled: !!reraId && !isPopulated,
  });

  const reraProject = isPopulated
    ? (reraProjectId as ReraProject)
    : fetchedReraProject;

  if (!reraProjectId) {
    return (
      <Empty
        description="No RERA project linked to this project"
        style={{ marginTop: 40 }}
      />
    );
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ marginTop: 40 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  const allDocuments = reraProject?.documents || [];

  const documents =
    documentFilter === "available"
      ? allDocuments.filter((doc) => doc.url && doc.url.trim() !== "")
      : allDocuments;

  if (!documents || documents.length === 0) {
    const emptyDescription =
      documentFilter === "available"
        ? "No RERA documents with valid URLs available"
        : "No RERA documents available for this project";

    return (
      <>
        <Flex justify="start" style={{ marginBottom: 16 }}>
          <Radio.Group
            value={documentFilter}
            onChange={(e) => setDocumentFilter(e.target.value)}
          >
            <Radio.Button value="available">Available Documents</Radio.Button>
            <Radio.Button value="all">All Documents</Radio.Button>
          </Radio.Group>
        </Flex>
        <Empty description={emptyDescription} style={{ marginTop: 40 }} />
      </>
    );
  }

  return (
    <>
      <Flex justify="start" style={{ marginBottom: 16 }}>
        <Radio.Group
          value={documentFilter}
          onChange={(e) => setDocumentFilter(e.target.value)}
        >
          <Radio.Button value="available">Available Documents</Radio.Button>
          <Radio.Button value="all">All Documents</Radio.Button>
        </Radio.Group>
      </Flex>

      <Table<ReraDocument>
        style={{ marginBottom: 24 }}
        dataSource={documents}
        rowKey={(record, index) => `${record.name}-${index}`}
        pagination={false}
        columns={[
          {
            title: "Document Name",
            key: "name",
            render: (_, record: ReraDocument) => {
              return (
                <Flex align="center" gap={16}>
                  <FilePdfOutlined style={{ fontSize: "24px" }} />
                  <div>
                    <Typography.Text strong style={{ display: "block" }}>
                      {record.name || "Unnamed Document"}
                    </Typography.Text>
                    {record.urlText && (
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: "12px" }}
                      >
                        {record.urlText}
                      </Typography.Text>
                    )}
                  </div>
                </Flex>
              );
            },
          },
          {
            title: "Document Link",
            key: "url",
            render: (_, record: ReraDocument) => (
              <Typography.Text
                type="secondary"
                style={{ fontSize: "12px", wordBreak: "break-all" }}
              >
                {record.url}
              </Typography.Text>
            ),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_, record: ReraDocument) => (
              <Flex gap={8}>
                {record.url ? (
                  <Button
                    type="primary"
                    href={record.url}
                    target="_blank"
                    icon={<DownloadOutlined />}
                  >
                    Download
                  </Button>
                ) : (
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: "12px" }}
                  >
                    No URL available
                  </Typography.Text>
                )}
              </Flex>
            ),
          },
        ]}
      />
    </>
  );
};
