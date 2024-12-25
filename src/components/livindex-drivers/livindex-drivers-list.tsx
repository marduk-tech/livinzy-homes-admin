import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Col, Flex, Row, Table, TableColumnType } from "antd";
import {
  useDeleteLivindexDriverMutation,
  useFetchLivindexDrivers,
} from "../../hooks/livindex-drivers-hooks";
import { useDevice } from "../../hooks/use-device";
import { ILivIndexDriver } from "../../types";
import { ColumnSearch } from "../common/column-search";
import { DeletePopconfirm } from "../common/delete-popconfirm";
import { EditLivIndexDriver } from "./edit-livindex-driver";

export function LivindexDriversList() {
  const { isMobile } = useDevice();
  const { data, isLoading, isError } = useFetchLivindexDrivers();

  const deleteDriverMutation = useDeleteLivindexDriverMutation();

  const handleDelete = async ({
    driverId,
  }: {
    driverId: string;
  }): Promise<void> => {
    deleteDriverMutation.mutate({ driverId: driverId });
  };

  const columns: TableColumnType<ILivIndexDriver>[] = [
    {
      title: "Driver",
      dataIndex: "driverName",
      key: "driverName",
      ...ColumnSearch("driverName"),
    },
    {
      title: "Mega Driver",
      dataIndex: "megaDriver",
      key: "megaDriver",
      ...ColumnSearch("megaDriver"),
    },
    {
      title: "Default Proximity Coefficient",
      dataIndex: "defaultProximityCoefficient",
      key: "defaultProximityCoefficient",
      ...ColumnSearch("defaultProximityCoefficient"),
    },
    {
      title: "Default Trigger Coefficient",
      dataIndex: "defaultTriggerCoefficient",
      key: "defaultTriggerCoefficient",
      ...ColumnSearch("defaultTriggerCoefficient"),
    },

    {
      title: "",
      align: "right",
      dataIndex: "_id",
      key: "_id",

      render: (id: string, record) => {
        return (
          <Flex gap={isMobile ? 5 : 15} justify="end">
            <EditLivIndexDriver selectedDriver={record} />

            <DeletePopconfirm
              handleOk={() => handleDelete({ driverId: id })}
              isLoading={deleteDriverMutation.isPending}
              title="Delete"
              description="Are you sure you want to delete this driver"
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
          <EditLivIndexDriver />
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
