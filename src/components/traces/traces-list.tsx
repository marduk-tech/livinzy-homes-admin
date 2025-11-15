import { LinkOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Row,
  Table,
  TableColumnType,
  Typography,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { useGetAllTraces } from "../../hooks/traces-hooks";
import { Trace } from "../../types/trace";
import { ColumnSearch } from "../common/column-search";

interface ExpandableHTMLProps {
  content: string;
  maxLines: number;
  isHTML?: boolean;
}

function ExpandableHTML({ content, maxLines, isHTML = false }: ExpandableHTMLProps) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current;
      setIsTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [content]);

  return (
    <div>
      {isHTML ? (
        <div
          ref={contentRef}
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            marginBottom: 0,
            display: '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : maxLines,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        />
      ) : (
        <div
          ref={contentRef}
          style={{
            marginBottom: 0,
            display: '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : maxLines,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {content}
        </div>
      )}
      {isTruncated && !expanded && (
        <Typography.Link
          onClick={() => setExpanded(true)}
          style={{ marginTop: 4 }}
        >
          Expand
        </Typography.Link>
      )}
      {expanded && (
        <Typography.Link
          onClick={() => setExpanded(false)}
          style={{ marginTop: 4 }}
        >
          Collapse
        </Typography.Link>
      )}
    </div>
  );
}

export function TracesList() {
  const { data, isLoading, isError } = useGetAllTraces();

  const columns: TableColumnType<Trace>[] = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 180,
      sorter: (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
      render: (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
    },
    {
      title: "Input",
      dataIndex: "input",
      key: "input",
      ...ColumnSearch("input"),
      width: 300,
      render: (input: string) => (
        <div
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {input}
        </div>
      ),
    },
    {
      title: "Output",
      dataIndex: "output",
      key: "output",
      width: 400,
      render: (output: string) => (
        <ExpandableHTML content={output} maxLines={3} isHTML={true} />
      ),
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
      ...ColumnSearch("userId"),
      width: 150,
    },
    {
      title: "Project ID",
      dataIndex: "projectId",
      key: "projectId",
      ...ColumnSearch("projectId"),
      width: 150,
    },
    {
      title: "Trace Link",
      dataIndex: "traceLink",
      key: "traceLink",
      width: 120,
      render: (traceLink: string) => (
        <Button
          type="link"
          icon={<LinkOutlined />}
          href={traceLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          View
        </Button>
      ),
    },
  ];

  if (isError) return <div>Error fetching traces data</div>;

  return (
    <>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20, padding: "0 10px" }}
      >
        <Col>
          <Typography.Title level={4}>All Traces</Typography.Title>
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: 1400 }}
      />
    </>
  );
}
