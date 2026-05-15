import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { Table, TableColumnType, Tag, Tooltip } from "antd";
import { useFetchEmailReachouts } from "../../hooks/marketing-hooks";
import { IEmailReachout } from "../../types";
import { COLORS } from "../../theme/colors";

export function EmailReachoutList() {
  const { data, isLoading, isError } = useFetchEmailReachouts();

  const columns: TableColumnType<IEmailReachout>[] = [
    {
      title: "Success",
      dataIndex: ["content", "success"],
      key: "success",
      width: 90,
      render: (success: boolean) =>
        success ? (
          <CheckCircleFilled style={{ color:COLORS.greenIdentifier, fontSize: 18 }} />
        ) : (
          <CloseCircleFilled style={{ color: COLORS.redIdentifier, fontSize: 18 }} />
        ),
      filters: [
        { text: "Success", value: true },
        { text: "Failed", value: false },
      ],
      onFilter: (value, record) => record.content.success === value,
    },
    {
      title: "Template",
      dataIndex: ["content", "templateTitle"],
      key: "templateTitle",
      width: 200,
      render: (title: string) => title || "-",
    },
    {
      title: "Total Emails",
      key: "totalEligibleEmails",
      width: 120,
      render: (_: unknown, record: IEmailReachout) =>
        record.content.totalEligibleEmails ?? "-",
    },
    {
      title: "Total Success",
      key: "successEmails",
      width: 130,
      render: (_: unknown, record: IEmailReachout) => {
        const emails = record.content.successEmails;
        if (!emails) return "-";
        return (
          <Tooltip title={emails.join(", ")} placement="topLeft">
            <Tag>{emails.length}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Total Failure",
      key: "failureEmails",
      width: 130,
      render: (_: unknown, record: IEmailReachout) => {
        const emails = record.content.failureEmails;
        if (!emails) return "-";
        return (
          <Tooltip title={emails.join(", ")} placement="topLeft">
            <Tag>{emails.length}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Date Sent",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend",
      render: (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];

  if (isError) return <div>Error fetching email reachout data</div>;

  return (
    <Table
      dataSource={data}
      columns={columns}
      loading={isLoading}
      rowKey="_id"
      pagination={{ pageSize: 20 }}
      scroll={{ x: 850 }}
    />
  );
}
