import { Col, Row, Table, TableColumnType, Typography } from "antd";
import { useFetchLivindexPlaces } from "../../hooks/livindex-places-hook";
import { ILivIndexPlaces } from "../../types";
import { ColumnSearch } from "../common/column-search";

export function LivindexFutureInfraList() {
  const { data, isLoading, isError } = useFetchLivindexPlaces({
    type: "futureInfra",
  });

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
            Future Infra
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
