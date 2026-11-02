import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  Button,
  Flex,
  Modal,
  Popconfirm,
  Space,
  Table,
  TableColumnType,
  Tag,
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

// The note's first markdown heading - what stands in for a missing title
const headingOf = (content: string) =>
  content?.match(/^#+\s*(.+)$/m)?.[1]?.trim() || "";

export function GlobalKnowladgeList() {
  const { data, isLoading, isError } = useFetchGlobalKnowledge();

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IGlobalKnowledge | null>(
    null
  );
  const [infoModalData, setInfoModalData] = useState<{
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
  }>({
    title: "",
    content: "",
    tags: [],
    createdAt: "",
  });

  const handleMoreClick = (record: IGlobalKnowledge, createdAt: string) => {
    setIsInfoModalOpen(true);

    setInfoModalData({
      title: record.title || headingOf(record.content),
      content: record.content,
      tags: record.tags || [],
      createdAt,
    });
  };

  const handleCancel = () => {
    setIsInfoModalOpen(false);
    setInfoModalData({
      title: "",
      content: "",
      tags: [],
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
      title: "Title",
      dataIndex: "title",
      key: "title",
      // a note without its own title shows its first heading, greyed out
      render: (title: string, record: IGlobalKnowledge) =>
        title ? (
          title
        ) : (
          <Typography.Text type="secondary">
            {headingOf(record.content) || "-"}
          </Typography.Text>
        ),
      width: 250,
    },
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
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      render: (tags: string[]) =>
        tags?.length ? (
          <Flex gap={4} wrap="wrap">
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Flex>
        ) : (
          "-"
        ),
      width: 200,
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      // notes saved before "active" existed have no value - they're active
      render: (active?: boolean) =>
        active === false ? (
          <Tag>Inactive</Tag>
        ) : (
          <Tag color="green">Active</Tag>
        ),
      width: 100,
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
          <Typography.Title level={5}>Title</Typography.Title>
          <Typography.Paragraph>{infoModalData.title || "-"}</Typography.Paragraph>

          <Typography.Title level={5}>Content</Typography.Title>
          <Typography.Paragraph>{infoModalData.content}</Typography.Paragraph>

          <Typography.Title level={5}>Tags</Typography.Title>
          <Typography.Paragraph>
            {infoModalData.tags?.length ? infoModalData.tags.join(", ") : "-"}
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
