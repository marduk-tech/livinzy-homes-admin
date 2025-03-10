import { Button, Modal, Table, TableColumnType, Typography } from "antd";
import { useState } from "react";
import { useFetchGlobalKnowledge } from "../../hooks/global-knowledge-hooks";

import { IGlobalKnowledge } from "../../types";

export function GlobalKnowladgeList() {
  const { data, isLoading, isError } = useFetchGlobalKnowledge();

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoModalData, setInfoModalData] = useState<{
    content: string;
    sources: string;
    corridors: Array<{ _id: string; name: string }>;
    createdAt: string;
  }>({
    content: "",
    sources: "",
    corridors: [],
    createdAt: "",
  });

  const handleMoreClick = (record: IGlobalKnowledge, createdAt: string) => {
    setIsInfoModalOpen(true);

    setInfoModalData({
      content: record.content,
      sources: record.sources || "",
      corridors: record.corridors || [],
      createdAt,
    });
  };

  const handleCancel = () => {
    setIsInfoModalOpen(false);
    setInfoModalData({
      content: "",
      sources: "",
      corridors: [],
      createdAt: "",
    });
  };

  const columns: TableColumnType<IGlobalKnowledge>[] = [
    {
      title: "Content",
      dataIndex: "content",
      key: "content",
      render: (content: string, record: IGlobalKnowledge) => {
        const createdAt = new Date(record.createdAt).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        );

        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
              expanded: false,
              onExpand: (_, info) => handleMoreClick(record, createdAt),
            }}
          >
            {content}
          </Typography.Paragraph>
        );
      },
      width: 400,
    },
    {
      title: "Sources",
      dataIndex: "sources",
      key: "sources",
      render: (sources: string) =>
        sources ? (
          <Typography.Paragraph ellipsis={{ rows: 2 }}>
            {sources}
          </Typography.Paragraph>
        ) : (
          "-"
        ),
      width: 200,
    },
    {
      title: "Corridors",
      dataIndex: "corridors",
      key: "corridors",
      render: (corridors: Array<{ _id: string; name: string }>) =>
        corridors?.length ? corridors.map((c) => c.name).join(", ") : "-",
      width: 200,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      width: 500,
    },
  ];

  if (isError) return <div>Error fetching data</div>;

  return (
    <>
      <Table
        dataSource={data?.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
        pagination={{
          pageSize: 5,
        }}
      />

      <Modal
        title={`Created At ${infoModalData.createdAt}`}
        open={isInfoModalOpen}
        onOk={handleCancel}
        onCancel={handleCancel}
        footer={[
          <Button type="primary" key="back" onClick={handleCancel}>
            Okay
          </Button>,
        ]}
      >
        <div style={{ maxHeight: 500, overflow: "auto" }}>
          <Typography.Title level={5}>Content</Typography.Title>
          <Typography.Paragraph>{infoModalData.content}</Typography.Paragraph>

          <Typography.Title level={5}>Sources</Typography.Title>
          <Typography.Paragraph>
            {infoModalData.sources || "-"}
          </Typography.Paragraph>

          <Typography.Title level={5}>Corridors</Typography.Title>
          <Typography.Paragraph>
            {infoModalData.corridors?.length
              ? infoModalData.corridors.map((c) => c.name).join(", ")
              : "-"}
          </Typography.Paragraph>
        </div>
      </Modal>
    </>
  );
}
