import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Flex,
  Input,
  Modal,
  Row,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import {
  useDeleteGlossaryMutation,
  useFetchGlossary,
} from "../../hooks/marketing-hooks";
import { IGlossary } from "../../types";
import { ColumnSearch } from "../common/column-search";
import { DeletePopconfirm } from "../common/delete-popconfirm";
import { GlossaryForm } from "./glossary-form";

const { Search } = Input;

export function GlossaryList() {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const { data, isLoading, isError } = useFetchGlossary();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IGlossary | null>(null);

  const handleEdit = (record: IGlossary) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const deleteGlossary = useDeleteGlossaryMutation();

  const handleDelete = async ({ id }: { id: string }): Promise<void> => {
    await deleteGlossary.mutateAsync(id);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedRecord(null);
  };

  // Filter data based on search keyword
  const filteredData = data?.filter((item) => {
    const searchLower = searchKeyword.toLowerCase();
    return (
      item.content.title?.toLowerCase().includes(searchLower) ||
      item.content.description?.toLowerCase().includes(searchLower)
    );
  });

  const columns: TableColumnType<IGlossary>[] = [
    {
      title: "Title",
      dataIndex: ["content", "title"],
      key: "title",
      sorter: (a, b) => (a.content.title || "").localeCompare(b.content.title || ""),
      sortDirections: ["ascend", "descend"],
      showSorterTooltip: false,
      render: (title: string) => (
        <Typography.Text strong>{title || "-"}</Typography.Text>
      ),
      width: 200,
      ...ColumnSearch(["content", "title"]),
    },
    {
      title: "Description",
      dataIndex: ["content", "description"],
      key: "description",
      render: (description: string) => (
        <Typography.Paragraph
          ellipsis={{ rows: 2, expandable: false }}
          style={{ margin: 0 }}
        >
          {description || "-"}
        </Typography.Paragraph>
      ),
      width: 300,
      ...ColumnSearch(["content", "description"]),
    },
    {
      title: "Page Link",
      dataIndex: ["content", "pageLink"],
      key: "pageLink",
      render: (pageLink: string) =>
        pageLink ? (
          <a
            href={`https://learn.brickfi.in/${pageLink}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {pageLink}
          </a>
        ) : (
          <Tag color="default">No Link</Tag>
        ),
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
      width: 200,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend",
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
            isLoading={deleteGlossary.isPending}
            title="Delete Glossary Term"
            description="Are you sure you want to delete this glossary term?"
          >
            <Button type="default" shape="default" icon={<DeleteOutlined />} />
          </DeletePopconfirm>
        </Flex>
      ),
      width: 120,
      fixed: "right",
    },
  ];

  if (isError) return <div>Error fetching glossary data</div>;

  return (
    <>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20, padding: "0 10px" }}
      >
        <Col>
          <Search
            loading={isLoading}
            placeholder="Search by title or description"
            onSearch={(value: string) => {
              setSearchKeyword(value);
            }}
            onChange={(e) => {
              if (e.target.value === "") setSearchKeyword("");
            }}
            enterButton="Search"
            style={{ width: 400 }}
          />
        </Col>
      </Row>

      <Table
        dataSource={filteredData}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
        pagination={{
          pageSize: 10,
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="Edit Glossary Term"
        open={isEditModalOpen}
        onCancel={handleEditModalClose}
        footer={null}
        width={800}
      >
        <GlossaryForm
          initialData={selectedRecord}
          onSuccess={handleEditModalClose}
        />
      </Modal>
    </>
  );
}
