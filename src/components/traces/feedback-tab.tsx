import { EditOutlined } from "@ant-design/icons";
import {
  Button,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
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
import { ThreadIdLink } from "./thread-id-link";

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

const getColumns = (
  onEdit: (record: BrickchatFeedback) => void,
): TableColumnType<BrickchatFeedback>[] => [
  {
    title: "Thread ID",
    dataIndex: "threadId",
    key: "threadId",
    width: 260,
    render: (threadId: string) => <ThreadIdLink threadId={threadId} />,
  },
  {
    title: "User ID",
    dataIndex: "userId",
    key: "userId",
    width: 220,
  },
  {
    title: "Text",
    dataIndex: "text",
    key: "text",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 130,
    render: (status: BrickchatFeedbackStatus = "new") => (
      <Tag color={STATUS_COLORS[status]}>{statusLabel(status)}</Tag>
    ),
  },
  {
    title: "Image URLs",
    dataIndex: "imageUrls",
    key: "imageUrls",
    render: (imageUrls: string[] | undefined) =>
      imageUrls?.length ? (
        <Flex vertical gap={2}>
          {imageUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: FONT_SIZES.SUB_TEXT }}
            >
              {url}
            </a>
          ))}
        </Flex>
      ) : (
        <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
          None
        </Typography.Text>
      ),
  },
  {
    title: "Actions",
    key: "actions",
    width: 90,
    render: (_, record) => (
      <Button
        type="link"
        icon={<EditOutlined />}
        onClick={() => onEdit(record)}
      >
        Edit
      </Button>
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
