import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Flex,
  Row,
  Table,
  TableColumnType,
  Tabs,
  Typography,
} from "antd";
import { useFetchCorridors } from "../../hooks/corridors-hooks";
import {
  useDeletePlaceMutation,
  useFetchLivindexPlaces,
} from "../../hooks/livindex-places-hook";
import { useDevice } from "../../hooks/use-device";
import { ILivIndexPlaces } from "../../types";
import { ColumnSearch } from "../common/column-search";
import { DeletePopconfirm } from "../common/delete-popconfirm";
import { CorridorsList } from "../corridors/corridors-list";
import { EditLivIndexPlace } from "./edit-livindex-place";
import { EditPlaceDetails } from "./edit-place-details";

export function LivindexList() {
  const { isMobile } = useDevice();
  const { data, isLoading, isError } = useFetchLivindexPlaces({});

  const { data: corridorsData, isLoading: corridorLoading } =
    useFetchCorridors();

  const deletePlaceMutation = useDeletePlaceMutation();

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
      title: "Driver",
      dataIndex: "driver",
      key: "driver",
      ...ColumnSearch("driver"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      ...ColumnSearch("status"),
    },
    {
      title: "Corridors",
      dataIndex: "corridors",
      key: "corridors",
      width: "400px",
      render: (corridors: Array<{ corridorId: string }>) => {
        if (!corridors?.length || !corridorsData?.length) return "-";

        return (
          corridors
            .map((corridor) => {
              const corridorDetails = corridorsData.find(
                (c) => c._id === corridor.corridorId
              );
              return corridorDetails?.name;
            })
            .filter(Boolean)
            .join(", ") || "-"
        );
      },
    },
    {
      title: "",
      align: "right",
      dataIndex: "_id",
      key: "_id",

      render: (id: string, record) => {
        return (
          <Flex gap={isMobile ? 5 : 15} justify="end">
            <EditPlaceDetails selectedPlace={record} />

            <EditLivIndexPlace selectedPlace={record} />

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
          <EditLivIndexPlace />
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading || corridorLoading}
        rowKey="_id"
      />
    </>
  );
}
