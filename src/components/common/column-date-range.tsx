import { FilterOutlined } from "@ant-design/icons";
import { Button, DatePicker, Space } from "antd";
import { FilterDropdownProps } from "antd/es/table/interface";
import dayjs from "dayjs";
import { nestedPropertyAccessor } from "../../libs/lvnzy-helper";
import { handleReset } from "./column-search";

const DAY_FORMAT = "YYYY-MM-DD";
const RANGE_SEPARATOR = "|";

// Date range filter for a table column. The range lives in the column's own
// filter value as one "start|end" key - antd keeps a row matching any key, so
// the two ends can't be separate keys - which means it resets with the table
// like any other column filter. Both ends are inclusive, in local time.
export const ColumnDateRange = (dataIndex: any) => ({
  filterDropdown: ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
  }: FilterDropdownProps) => {
    const [start, end] = selectedKeys[0]
      ? String(selectedKeys[0]).split(RANGE_SEPARATOR)
      : [];
    return (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <DatePicker.RangePicker
          value={start && end ? [dayjs(start), dayjs(end)] : null}
          onChange={(dates) =>
            setSelectedKeys(
              dates?.[0] && dates[1]
                ? [
                    `${dates[0].format(DAY_FORMAT)}${RANGE_SEPARATOR}${dates[1].format(DAY_FORMAT)}`,
                  ]
                : [],
            )
          }
          style={{ marginBottom: 8, display: "flex" }}
        />
        <Space>
          <Button type="primary" size="small" onClick={() => confirm()}>
            Filter
          </Button>
          <Button
            size="small"
            onClick={() =>
              clearFilters &&
              handleReset(clearFilters, setSelectedKeys, confirm)
            }
          >
            Reset
          </Button>
        </Space>
      </div>
    );
  },
  filterIcon: (filtered: boolean) => (
    <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
  ),
  onFilter: (value: any, record: any) => {
    const date = nestedPropertyAccessor(record, dataIndex);
    if (!date) return false;
    const [start, end] = String(value).split(RANGE_SEPARATOR);
    // YYYY-MM-DD strings sort chronologically
    const day = dayjs(date).format(DAY_FORMAT);
    return day >= start && day <= end;
  },
});
