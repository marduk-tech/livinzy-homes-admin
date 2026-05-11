import axios from "axios";
import { Button, DatePicker, Input, Modal, Space, Spin, Table, TableColumnType, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import type { FilterDropdownProps } from "antd/es/table/interface";
import type { InputRef } from "antd";
import dayjs from "dayjs";
import { User } from "../../types/user";

const POSTHOG_HOST = "https://us.posthog.com";
const POSTHOG_PROJECT_ID = import.meta.env.VITE_POSTHOG_PROJECT_ID;
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;

interface UserJourneyModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}


export function UserJourneyModal({ user, open, onClose }: UserJourneyModalProps) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;

    setLoading(true);
    setError(null);
    setRows([]);

    const query = {
      kind: "HogQLQuery",
      query: `SELECT * FROM user_journey WHERE userid = '${user._id}' ORDER BY time`,
    };

    axios
      .post(
        `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`,
        { query },
        {
          headers: {
            Authorization: `Bearer ${POSTHOG_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      )
      .then((response) => {
        const columns: string[] = response.data.columns || [];
        const results: any[][] = response.data.results || [];
        const mapped = results.map((row, i) => {
          const obj: Record<string, any> = { key: i };
          columns.forEach((col, j) => {
            obj[col] = row[j];
          });
          return obj;
        });
        setRows(mapped);
      })
      .catch((err) => {
        setError(
          err.response?.data?.detail || err.message || "Failed to fetch journey data",
        );
      })
      .finally(() => setLoading(false));
  }, [open, user?._id]);

  const searchInputRef = useRef<InputRef>(null);

  const textFilterProps = (col: string): Partial<TableColumnType<Record<string, any>>> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={col === "action" ? searchInputRef : undefined}
          placeholder={`Search ${col}`}
          value={selectedKeys[0] as string}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small">
            Search
          </Button>
          <Button onClick={() => { clearFilters?.(); confirm(); }} size="small">
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      String(record[col] ?? "").toLowerCase().includes(String(value).toLowerCase()),
  });

  const tableColumns: TableColumnType<Record<string, any>>[] = [
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      ...textFilterProps("action"),
      render: (val: any) => val ?? "-",
    },
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
        <div style={{ padding: 8 }}>
          <DatePicker.RangePicker
            value={
              selectedKeys[0]
                ? (JSON.parse(selectedKeys[0] as string) as [string, string]).map((d) =>
                    dayjs(d),
                  ) as [dayjs.Dayjs, dayjs.Dayjs]
                : null
            }
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setSelectedKeys([JSON.stringify([dates[0].toISOString(), dates[1].toISOString()])]);
              } else {
                setSelectedKeys([]);
              }
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small">
              Filter
            </Button>
            <Button onClick={() => { clearFilters?.(); confirm(); }} size="small">
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value, record) => {
        if (!record.time || !value) return true;
        const [start, end] = JSON.parse(value as string) as [string, string];
        const t = new Date(record.time).getTime();
        return t >= new Date(start).getTime() && t <= new Date(end).getTime();
      },
      render: (val: any) =>
        val
          ? new Date(val).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "-",
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
      ...textFilterProps("details"),
      render: (val: any) => {
        if (typeof val === "object" && val !== null) {
          return <Typography.Text code>{JSON.stringify(val)}</Typography.Text>;
        }
        return val ?? "-";
      },
    },
  ];

  return (
    <Modal
      title={
        user
          ? `User Journey — ${user.profile?.name || user.mobile || user._id}`
          : "User Journey"
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="80%"
    >
      {loading ? (
        <Spin style={{ display: "block", margin: "40px auto" }} />
      ) : error ? (
        <Typography.Text type="danger">{error}</Typography.Text>
      ) : (
        <Table
          dataSource={rows}
          columns={tableColumns}
          pagination={{ pageSize: 20 }}
          scroll={{ x: true }}
          size="small"
        />
      )}
    </Modal>
  );
}
