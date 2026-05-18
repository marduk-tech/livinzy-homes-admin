import { Card, Flex, Statistic, Table, TableColumnType, Tag, Tooltip } from "antd";
import { useFetchFeedbacks } from "../../hooks/marketing-hooks";
import { IFeedback } from "../../types";

const COL_WIDTH = 200;

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

function FeedbackSummary({ data }: { data: IFeedback[] }) {
  const ratings: number[] = [];
  const sourceCounts: Record<string, number> = {};

  data.forEach((r) => {
    r.content.feedback.forEach(({ question, answer }) => {
      if (/scale|1\s*to\s*10|rate/i.test(question)) {
        const n = parseFloat(answer);
        if (!isNaN(n)) ratings.push(n);
      }
      if (/hear about|referr|source/i.test(question) && answer) {
        sourceCounts[answer] = (sourceCounts[answer] ?? 0) + 1;
      }
    });
  });

  const medianRating = median(ratings);

  return (
    <Flex gap={16} style={{ marginBottom: 20 }} wrap="wrap">
      <Card size="small" style={{ minWidth: 140 }}>
        <Statistic
          title="Total Responses"
          value={data.length}
        />
      </Card>
      {medianRating !== null && (
        <Card size="small" style={{ minWidth: 140 }}>
          <Statistic
            title="Median Rating (1–10)"
            value={medianRating}
            precision={1}
          />
        </Card>
      )}
      {Object.keys(sourceCounts).length > 0 && (
        <Card size="small" style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
            How they heard about us
          </div>
          <Flex gap={8} wrap="wrap">
            {Object.entries(sourceCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => (
                <Tooltip key={source} title={source}>
                  <Tag>
                    {source.length > 20 ? source.slice(0, 20) + "…" : source}: {count}
                  </Tag>
                </Tooltip>
              ))}
          </Flex>
        </Card>
      )}
    </Flex>
  );
}

export function UserFeedbackList() {
  const { data, isLoading, isError } = useFetchFeedbacks();

  const allQuestions: string[] = Array.from(
    new Set(
      (data ?? []).flatMap((r) => r.content.feedback.map((f) => f.question))
    )
  );

  const questionColumns: TableColumnType<IFeedback>[] = allQuestions.map(
    (question) => {
      const isRating = /scale|1\s*to\s*10|rate/i.test(question);
      return {
      title: (
        <Tooltip title={question}>
          <span>{question.length > 25 ? question.slice(0, 25) + "…" : question}</span>
        </Tooltip>
      ),
      key: question,
      width: COL_WIDTH,
      ellipsis: true,
      ...(isRating && {
        filters: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
          text: String(n),
          value: n,
        })),
        onFilter: (value: unknown, record: IFeedback) => {
          const answer = record.content.feedback.find(
            (f) => f.question === question
          )?.answer;
          return parseFloat(answer ?? "") === (value as number);
        },
      }),
      render: (_: unknown, record: IFeedback) => {
        const answer =
          record.content.feedback.find((f) => f.question === question)
            ?.answer ?? "-";
        return (
          <Tooltip title={answer} placement="topLeft">
            <span
              style={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: COL_WIDTH - 16,
              }}
            >
              {answer}
            </span>
          </Tooltip>
        );
      },
    };
  });

  const columns: TableColumnType<IFeedback>[] = [
    {
      title: <Tooltip title="Name"><span>Name</span></Tooltip>,
      key: "name",
      width: 160,
      ellipsis: true,
      render: (_: unknown, record: IFeedback) => {
        const c = record.content.contact;
        const tooltipContent = (
          <div>
            {(c?.mobile) && <div>Mobile: {c.mobile}</div>}
            {c?.email && <div>Email: {c.email}</div>}
            <div>ID/Mobile:<br></br>{record.content.contact.contact}</div>
          </div>
        );
        return (
          <Tooltip title={tooltipContent} placement="topLeft">
            <span>{c?.name ?? "-"}</span>
          </Tooltip>
        );
      },
    },
    ...questionColumns,
    {
      title: <Tooltip title="Submitted"><span>Submitted</span></Tooltip>,
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend",
      render: (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
  ];

  if (isError) return <div>Error fetching feedback data</div>;

  return (
    <>
      {data && <FeedbackSummary data={data} />}
      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
        pagination={{ pageSize: 20 }}
        scroll={{ x: "max-content" }}
      />
    </>
  );
}
