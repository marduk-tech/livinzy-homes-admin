import { Col, Row, Table, TableColumnType, Typography } from "antd";
import { useFetchLivindexPlaces } from "../../hooks/livindex-places-hook";
import { ILivIndexPlaces } from "../../types";
import { ColumnSearch } from "../common/column-search";

export function LivindexRoadsList() {
  const { data, isLoading, isError } = useFetchLivindexPlaces({ type: "road" });

  const columns: TableColumnType<ILivIndexPlaces>[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ...ColumnSearch("name"),

      render: (_, record) => <span>{record.name.replace(/^en:/, "")}</span>,
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
            Roads
          </Typography.Title>
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
