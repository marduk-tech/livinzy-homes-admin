import { DeleteOutlined } from "@ant-design/icons";
import { Button, Col, Flex, Row, Table, TableColumnType } from "antd";
import {
  useDeleteCorridorMutation,
  useFetchCorridors,
} from "../../hooks/corridors-hooks";
import { useDevice } from "../../hooks/use-device";
import { ICorridor } from "../../types/corridor";
import { ColumnSearch } from "../common/column-search";
import { DeletePopconfirm } from "../common/delete-popconfirm";
import { EditCorridor } from "./edit-corridor";

export function CorridorsList() {
  const { isMobile } = useDevice();
  const { data, isLoading, isError } = useFetchCorridors();

  const deleteCorridorMutation = useDeleteCorridorMutation();

  const handleDelete = async ({
    corridorId,
  }: {
    corridorId: string;
  }): Promise<void> => {
    deleteCorridorMutation.mutate({ corridorId });
  };

  const columns: TableColumnType<ICorridor>[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ...ColumnSearch("name"),
    },
    {
      title: "Aliases",
      dataIndex: "aliases",
      key: "aliases",
      render: (aliases: string[]) => aliases?.join(", "),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      render: (location: { lat: number; lng: number }) =>
        `${location?.lat}, ${location?.lng}`,
    },
    {
      title: "",
      align: "right",
      dataIndex: "_id",
      key: "_id",
      render: (id: string, record) => {
        return (
          <Flex gap={isMobile ? 5 : 15} justify="end">
            <EditCorridor selectedCorridor={record} />

            <DeletePopconfirm
              handleOk={() => handleDelete({ corridorId: id })}
              isLoading={deleteCorridorMutation.isPending}
              title="Delete"
              description="Are you sure you want to delete this corridor?"
            >
              <Button
                type="default"
                shape="default"
                icon={<DeleteOutlined />}
              />
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
          <EditCorridor />
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
