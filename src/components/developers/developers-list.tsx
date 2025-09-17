import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Flex,
  Input,
  Row,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";

const { Search } = Input;
import {
  useDeleteDeveloperMutation,
  useGetAllDevelopers,
  useUpdateDeveloperMutation,
} from "../../hooks/developer-hooks";
import { Developer } from "../../types/developer";
import { ColumnSearch } from "../common/column-search";
import { DeletePopconfirm } from "../common/delete-popconfirm";
import { DeveloperForm } from "./developer-form";
import ProjectForm from "./project-form";
import { FONT_SIZES } from "../../theme/font-sizes";
import { COLORS } from "../../theme/colors";

export function DevelopersList() {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const { data, isLoading, isError } = useGetAllDevelopers({
    keyword: searchKeyword,
  });
  const [developerToEdit, setDeveloperToEdit] = useState<
    Developer | undefined
  >();
  const [selectedDeveloper, setSelectedDeveloper] = useState<
    Developer | undefined
  >();
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<
    number | undefined
  >();
  const deleteDeveloperMutation = useDeleteDeveloperMutation();
  const updateDeveloperMutation = useUpdateDeveloperMutation();

  const handleDelete = async (developerId: string): Promise<void> => {
    deleteDeveloperMutation.mutateAsync(developerId);
  };

  const projectColumns: TableColumnType<Developer["developerProjects"][0]>[] = [
    {
      title: "Project Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "RERA Number",
      dataIndex: "reraNumber",
      key: "reraNumber",
      render: (reraNumber: string) => reraNumber || "-",
    },
    {
      title: "Promoter",
      dataIndex: "promoterName",
      key: "promoterName",
      render: (promoterName: string) => promoterName || "-",
    },
    {
      title: "Primary Project",
      dataIndex: "primaryProject",
      key: "primaryProject",
      render: (primaryProject: string) => primaryProject || "-",
    },
    {
      title: "Actions",
      key: "projectActions",
      align: "right",
      render: (_, record, index) => (
        <>
          <Button
            type="default"
            shape="default"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedDeveloper(
                data?.find((dev) => dev.developerProjects.includes(record))
              );
              setSelectedProjectIndex(index);
            }}
          />

          <DeletePopconfirm
            handleOk={async () => {
              const parentDeveloper = data?.find((dev) =>
                dev.developerProjects.includes(record)
              );
              if (!parentDeveloper) return;
              const updatedProjects = parentDeveloper.developerProjects.filter(
                (_, i) => i !== index
              );
              return void updateDeveloperMutation.mutateAsync({
                developerId: parentDeveloper._id,
                developerData: {
                  developerProjects: updatedProjects,
                },
              });
            }}
            isLoading={updateDeveloperMutation.isPending}
            title="Delete Project"
            description="Are you sure you want to delete this project?"
          >
            <Button
              type="default"
              shape="default"
              icon={<DeleteOutlined />}
            ></Button>
          </DeletePopconfirm>
        </>
      ),
    },
  ];

  const columns: TableColumnType<Developer>[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ...ColumnSearch("name"),
    },
    {
      title: "Projects Count",
      key: "projectsCount",
      render: (_, record) => (
        <Tag color="blue">{record.developerProjects.length} Projects</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Flex gap={15} justify="end" align="center">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedDeveloper(record);
              setSelectedProjectIndex(undefined);
            }}
          >
            Add Project
          </Button>
          <Button
            type="default"
            shape="default"
            icon={<EditOutlined />}
            onClick={() => setDeveloperToEdit(record)}
          />

          <DeletePopconfirm
            handleOk={() => handleDelete(record._id)}
            isLoading={deleteDeveloperMutation.isPending}
            title="Delete Developer"
            description="Are you sure you want to delete this developer and all their projects?"
          >
            <Button type="default" shape="default" icon={<DeleteOutlined />} />
          </DeletePopconfirm>
        </Flex>
      ),
    },
  ];

  if (isError) return <div>Error fetching developers data</div>;

  return (
    <>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20, padding: "0 10px" }}
      >
        <Col>
          <Flex gap={8} align="flex-end">
            <Search
              loading={isLoading}
              placeholder="Search for a developer by name"
              onSearch={(value: string) => {
                setSearchKeyword(value);
              }}
              enterButton="Search"
              style={{ width: 400 }}
            />
            <Typography.Text
              style={{
                fontSize: FONT_SIZES.SUB_TEXT,
                color: COLORS.textColorLight,
              }}
            >
              Showing 10 recently updated items
            </Typography.Text>
          </Flex>
        </Col>
        <Col>
          <DeveloperForm developers={data || []} />
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
        expandable={{
          expandedRowRender: (record) => (
            <Table
              dataSource={record.developerProjects}
              columns={projectColumns}
              pagination={false}
              rowKey={(project, index) => `${record._id}-project-${index}`}
            />
          ),
        }}
      />

      {selectedDeveloper && (
        <ProjectForm
          isOpen={true}
          onClose={() => {
            setSelectedDeveloper(undefined);
            setSelectedProjectIndex(undefined);
          }}
          developer={selectedDeveloper}
          projectIndex={selectedProjectIndex}
        />
      )}

      {developerToEdit && (
        <DeveloperForm
          data={developerToEdit}
          developers={data || []}
          onClose={() => setDeveloperToEdit(undefined)}
        />
      )}
    </>
  );
}
