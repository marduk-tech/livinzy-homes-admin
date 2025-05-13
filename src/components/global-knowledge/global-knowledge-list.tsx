import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  Button,
  Flex,
  Modal,
  Popconfirm,
  Space,
  Table,
  TableColumnType,
  Typography,
} from "antd";
import { useState } from "react";
import {
  useDeleteGlobalKnowledgeMutation,
  useFetchGlobalKnowledge,
} from "../../hooks/global-knowledge-hooks";
import { IGlobalKnowledge } from "../../types";
import { DeletePopconfirm } from "../common/delete-popconfirm";
import { CreateGlobalKnowladgeForm } from "./create-global-knowledge-form";

export function GlobalKnowladgeList() {
  const { data, isLoading, isError } = useFetchGlobalKnowledge();

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IGlobalKnowledge | null>(
    null
  );
  const [infoModalData, setInfoModalData] = useState<{
    content: string;
    corridors: Array<{ _id: string; name: string }>;
    createdAt: string;
  }>({
    content: "",
    corridors: [],
    createdAt: "",
  });

  const handleMoreClick = (record: IGlobalKnowledge, createdAt: string) => {
    setIsInfoModalOpen(true);

    setInfoModalData({
      content: record.content,
      corridors: record.corridors || [],
      createdAt,
    });
  };

  const handleCancel = () => {
    setIsInfoModalOpen(false);
    setInfoModalData({
      content: "",
      corridors: [],
      createdAt: "",
    });
  };

  const handleEdit = (record: IGlobalKnowledge) => {
    setSelectedRecord(record);

    setIsEditModalOpen(true);
  };

  const deleteGlobalKnowledge = useDeleteGlobalKnowledgeMutation();

  const handleDelete = async ({ id }: { id: string }): Promise<void> => {
    await deleteGlobalKnowledge.mutateAsync(id);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedRecord(null);
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
      width: 400,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Flex gap={15} justify="end">
          <Button
            type="default"
            shape="default"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <DeletePopconfirm
            handleOk={() => handleDelete({ id: record._id })}
            isLoading={deleteGlobalKnowledge.isPending}
            title="Delete Knowledge"
            description="Are you sure you want to delete this knowledge?"
          >
            <Button type="default" shape="default" icon={<DeleteOutlined />} />
          </DeletePopconfirm>
        </Flex>
      ),
      width: 100,
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

          <Typography.Title level={5}>Corridors</Typography.Title>
          <Typography.Paragraph>
            {infoModalData.corridors?.length
              ? infoModalData.corridors.map((c) => c.name).join(", ")
              : "-"}
          </Typography.Paragraph>
        </div>
      </Modal>

      <Modal
        title="Edit Knowledge"
        open={isEditModalOpen}
        onCancel={handleEditModalClose}
        footer={null}
        width={800}
      >
        <CreateGlobalKnowladgeForm
          initialData={selectedRecord}
          onSuccess={handleEditModalClose}
        />
      </Modal>
    </>
  );
}
