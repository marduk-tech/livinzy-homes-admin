import { BarChartOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Col, Flex, Row, Table, TableColumnType } from "antd";
import { Link } from "react-router-dom";
import {
  useDeleteMicroPocketMutation,
  useFetchMicroPockets,
} from "../../hooks/micro-pockets-hooks";
import { useDevice } from "../../hooks/use-device";
import { IMicroPocket } from "../../types/micro-pocket";
import { ColumnSearch } from "../common/column-search";
import { DeletePopconfirm } from "../common/delete-popconfirm";
import { EditMicroPocket } from "./edit-micro-pocket";

export function MicroPocketsList() {
  const { isMobile } = useDevice();
  const { data, isLoading, isError } = useFetchMicroPockets();

  const deleteMicroPocketMutation = useDeleteMicroPocketMutation();

  const handleDelete = async ({
    microPocketId,
  }: {
    microPocketId: string;
  }): Promise<void> => {
    deleteMicroPocketMutation.mutate({ microPocketId });
  };

  const columns: TableColumnType<IMicroPocket>[] = [
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
            <Link to={`/micro-pockets/${id}`} target="_blank">
              <Button
                type="default"
                shape="default"
                icon={<BarChartOutlined />}
              />
            </Link>

            <EditMicroPocket selectedMicroPocket={record} />

            <DeletePopconfirm
              handleOk={() => handleDelete({ microPocketId: id })}
              isLoading={deleteMicroPocketMutation.isPending}
              title="Delete"
              description="Are you sure you want to delete this micro pocket?"
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
          <EditMicroPocket />
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
