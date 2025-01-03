import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Flex,
  Row,
  Table,
  TableColumnType,
  Typography,
} from "antd";
import {
  useDeletePlaceMutation,
  useFetchLivindexPlaces,
} from "../../hooks/livindex-places-hook";
import { useDevice } from "../../hooks/use-device";
import { ILivIndexPlaces } from "../../types";
import { ColumnSearch } from "../common/column-search";
import { DeletePopconfirm } from "../common/delete-popconfirm";
import { EditLivIndexPlace } from "./edit-livindex-place";

export function LivindexSchoolList() {
  const { isMobile } = useDevice();
  const { data, isLoading, isError } = useFetchLivindexPlaces({
    type: "school",
  });

  const deletePlaceMutation = useDeletePlaceMutation({ type: "school" });

  const handleDelete = async ({
    placeId,
  }: {
    placeId: string;
  }): Promise<void> => {
    deletePlaceMutation.mutate({ placeId: placeId });
  };

  const columns: TableColumnType<ILivIndexPlaces>[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ...ColumnSearch("name"),
    },

    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ...ColumnSearch("description"),
    },

    {
      title: "",
      align: "right",
      dataIndex: "_id",
      key: "_id",

      render: (id: string, record) => {
        return (
          <Flex gap={isMobile ? 5 : 15} justify="end">
            <EditLivIndexPlace selectedPlace={record} type="school" />

            <DeletePopconfirm
              handleOk={() => handleDelete({ placeId: id })}
              isLoading={deletePlaceMutation.isPending}
              title="Delete"
              description="Are you sure you want to delete this place"
            >
              <Button
                type="default"
                shape="default"
                icon={<DeleteOutlined />}
              ></Button>
            </DeletePopconfirm>
          </Flex>
        );
      },
    },
  ];

  if (isError) return <div>Error fetching data</div>;

  return (
    <>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20, padding: "0 10px" }}
      >
        <Col>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Schools
          </Typography.Title>
        </Col>

        <Col>
          <EditLivIndexPlace type="school" />
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
      />
    </>
  );
}
