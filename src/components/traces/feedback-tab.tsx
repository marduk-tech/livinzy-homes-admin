import { EditOutlined, EyeOutlined, UserOutlined } from "@ant-design/icons";
import {
  Button,
  Empty,
  Flex,
  Form,
  Image,
  Input,
  message,
  Modal,
  Select,
  Table,
  TableColumnType,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import {
  useGetBrickchatFeedback,
  useUpdateBrickchatFeedbackMutation,
} from "../../hooks/brickchat-hooks";
import { errorMessage } from "../../libs/api-error";
import { FONT_SIZES } from "../../theme/font-sizes";
import {
  BRICKCHAT_FEEDBACK_STATUS_OPTIONS,
  BrickchatFeedback,
  BrickchatFeedbackStatus,
  RESOLVED_BRICKCHAT_FEEDBACK_STATUSES,
} from "../../types/brickchat-feedback";
import { ThreadLinksButton } from "./thread-id-link";

const STATUS_COLORS: Record<BrickchatFeedbackStatus, string> = {
  new: "blue",
  "in-progress": "orange",
  completed: "green",
  verified: "purple",
  "wont-fix": "default",
};

const statusLabel = (status: BrickchatFeedbackStatus) =>
  BRICKCHAT_FEEDBACK_STATUS_OPTIONS.find((o) => o.value === status)?.label ??
  status;

const copyUserId = async (userId: string) => {
  try {
    await navigator.clipboard.writeText(userId);
    message.success("User ID copied");
  } catch {
    message.error("Failed to copy user ID");
  }
};

const statusOrder = (status: BrickchatFeedbackStatus = "new") =>
  BRICKCHAT_FEEDBACK_STATUS_OPTIONS.findIndex((o) => o.value === status);

const getColumns = (
  onEdit: (record: BrickchatFeedback) => void,
): TableColumnType<BrickchatFeedback>[] => [
  {
    title: "Title",
    dataIndex: "text",
    key: "text",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 130,
    filters: BRICKCHAT_FEEDBACK_STATUS_OPTIONS.map((o) => ({
      text: o.label,
      value: o.value,
    })),
    onFilter: (value, record) => (record.status ?? "new") === value,
    // Sort by workflow order (New → Wont Fix) rather than alphabetically.
    sorter: (a, b) => statusOrder(a.status) - statusOrder(b.status),
    render: (status: BrickchatFeedbackStatus = "new") => (
      <Tag color={STATUS_COLORS[status]}>{statusLabel(status)}</Tag>
    ),
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 170,
    defaultSortOrder: "descend",
    sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    sortDirections: ["descend", "ascend"],
    // @ant-design/pro-chat sets dayjs's global locale to zh-cn, so pin English here.
    render: (createdAt: string) =>
      dayjs(createdAt).locale("en").format("DD MMM YYYY, hh:mm A"),
  },
  {
    title: "Images",
    dataIndex: "imageUrls",
    key: "imageUrls",
    render: (imageUrls: string[] | undefined) =>
      imageUrls?.length ? (
        <Image.PreviewGroup>
          <Flex wrap gap={4}>
            {imageUrls.map((url) => (
              <Image
                key={url}
                src={url}
                width={48}
                height={48}
                style={{ objectFit: "cover" }}
                preview={{ mask: <EyeOutlined /> }}
              />
            ))}
          </Flex>
        </Image.PreviewGroup>
      ) : (
        <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
          None
        </Typography.Text>
      ),
  },
  {
    title: "Actions",
    key: "actions",
    width: 160,
    render: (_, record) => (
      <Flex align="center" gap={4}>
        <Tooltip title="Copy user ID">
          <Button
            type="text"
            size="small"
            icon={<UserOutlined />}
            onClick={() => copyUserId(record.userId)}
          />
        </Tooltip>
        <ThreadLinksButton threadId={record.threadId} />
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => onEdit(record)}
        >
          Edit
        </Button>
      </Flex>
    ),
  },
];

type EditFormValues = Pick<BrickchatFeedback, "text" | "resolutionComment"> & {
  status: BrickchatFeedbackStatus;
};

export function FeedbackTab() {
  const { data, isLoading, isError, error } = useGetBrickchatFeedback();
  const updateFeedback = useUpdateBrickchatFeedbackMutation();
  const [editing, setEditing] = useState<BrickchatFeedback | null>(null);
  const [form] = Form.useForm<EditFormValues>();
  const editStatus = Form.useWatch("status", form);
  const showResolutionComment =
    !!editStatus && RESOLVED_BRICKCHAT_FEEDBACK_STATUSES.includes(editStatus);

  const openEdit = (record: BrickchatFeedback) => {
    setEditing(record);
    form.setFieldsValue({
      text: record.text,
      status: record.status ?? "new",
      resolutionComment: record.resolutionComment,
    });
  };

  const closeEdit = () => {
    setEditing(null);
    form.resetFields();
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      const values = await form.validateFields();
      await updateFeedback.mutateAsync({ id: editing._id, updates: values });
      closeEdit();
    } catch {
      // validation errors render inline; API errors are toasted by the mutation
    }
  };

  if (isError) {
    return <Empty description={errorMessage(error, "Failed to fetch brickchat feedback")} />;
  }

  return (
    <>
      <Table
        dataSource={data}
        columns={getColumns(openEdit)}
        loading={isLoading}
        rowKey="_id"
      />
      <Modal
        title="Edit Feedback"
        open={!!editing}
        onOk={handleSave}
        onCancel={closeEdit}
        okText="Save"
        confirmLoading={updateFeedback.isPending}
        forceRender
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="text"
            label="Text"
            rules={[{ required: true, whitespace: true, message: "Text is required" }]}
          >
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={BRICKCHAT_FEEDBACK_STATUS_OPTIONS} />
          </Form.Item>
          {showResolutionComment && (
            <Form.Item name="resolutionComment" label="Resolution Comment">
              <Input.TextArea rows={3} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
