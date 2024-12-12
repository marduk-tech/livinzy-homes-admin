import { Button, Modal, Table, TableColumnType, Typography } from "antd";
import { useState } from "react";
import { useFetchGlobalKnowledge } from "../../hooks/global-knowledge-hooks";

import { IGlobalKnowledge } from "../../types";

export function GlobalKnowladgeList() {
  const { data, isLoading, isError } = useFetchGlobalKnowledge();

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoModalData, setInfoModalData] = useState({
    content: "",
    createdAt: "",
  });

  const handleMoreClick = (content: string, createdAt: string) => {
    setIsInfoModalOpen(true);

    setInfoModalData({
      content,
      createdAt,
    });
  };

  const handleCancel = () => {
    setIsInfoModalOpen(false);
    setInfoModalData({
      content: "",
      createdAt: "",
    });
  };

  const columns: TableColumnType<IGlobalKnowledge>[] = [
    {
      title: "Content",
      dataIndex: "content",
      key: "content",
      render: (content: string, record) => {
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
              onExpand: (_, info) => handleMoreClick(record.content, createdAt),
            }}
          >
            {content}
          </Typography.Paragraph>
        );
      },
      width: 700,
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
        <Typography.Paragraph
          style={{
            maxHeight: 500,
            overflow: "auto",
          }}
        >
          {infoModalData.content}
        </Typography.Paragraph>
      </Modal>
    </>
  );
}
