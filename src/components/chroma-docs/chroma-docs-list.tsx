import { Table, TableColumnType } from "antd";
import { useFetchChromaDocs } from "../../hooks/chroma-docs-hooks";
import { IChromaDoc } from "../../types";
import { ColumnSearch } from "../common/column-search";

export function ChromaDocsList({ collectionName }: { collectionName: string }) {
  const { data: docs, isLoading } = useFetchChromaDocs({
    collectionName: collectionName,
  });

  const columns: TableColumnType<IChromaDoc>[] = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      ...ColumnSearch("id"),
      //   render: (document) => <div style={{ maxWidth: "800px" }}>{document}</div>,
    },
    {
      title: "Document",
      dataIndex: "document",
      key: "document",
      ...ColumnSearch("document"),
      render: (document) => <div style={{ maxWidth: "800px" }}>{document}</div>,
    },
    {
      title: "Meta Data",
      dataIndex: "metadata",
      key: "metadata",
      render: (metadata) => {
        return (
          <div style={{ maxWidth: "400px" }}>
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key}>
                {key}: {value as any}
              </div>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Table
        dataSource={docs}
        columns={columns}
        loading={isLoading}
        rowKey="id"
      />
    </>
  );
}
