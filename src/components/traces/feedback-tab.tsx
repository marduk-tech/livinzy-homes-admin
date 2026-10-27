import {
  EditOutlined,
  ExportOutlined,
  EyeOutlined,
  FileSearchOutlined,
  LinkOutlined,
  MessageOutlined,
  ProfileOutlined,
  UserOutlined,
} from "@ant-design/icons";
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
  Spin,
  Table,
  TableColumnType,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetBrickchatFeedback,
  useUpdateBrickchatFeedbackMutation,
} from "../../hooks/brickchat-hooks";
import { errorMessage } from "../../libs/api-error";
import { brickfiAppUrl } from "../../libs/constants";
import { FONT_SIZES } from "../../theme/font-sizes";
import {
  BRICKCHAT_FEEDBACK_CATEGORY_OPTIONS,
  BRICKCHAT_FEEDBACK_RATING_OPTIONS,
  BRICKCHAT_FEEDBACK_ROOT_CAUSE_OPTIONS,
  BRICKCHAT_FEEDBACK_STATUS_OPTIONS,
  BrickchatFeedback,
  BrickchatFeedbackCategory,
  BrickchatFeedbackRating,
  BrickchatFeedbackStatus,
  RESOLVED_BRICKCHAT_FEEDBACK_STATUSES,
} from "../../types/brickchat-feedback";
import { BRICKFI_LOGGER_PATHS } from "./brickfi-logger-paths";
import { FeedbackAssessmentDrawer } from "./feedback-assessment-drawer";
import { langsmithThreadUrl, ThreadLinksButton } from "./thread-id-link";

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

const RATING_COLORS: Record<BrickchatFeedbackRating, string> = {
  1: "red",
  2: "volcano",
  3: "gold",
  4: "green",
  5: "cyan",
};

const ratingLabel = (rating: BrickchatFeedbackRating) =>
  BRICKCHAT_FEEDBACK_RATING_OPTIONS.find((o) => o.value === rating)?.label ??
  String(rating);

const categoryLabel = (category: BrickchatFeedbackCategory) =>
  BRICKCHAT_FEEDBACK_CATEGORY_OPTIONS.find((o) => o.value === category)
    ?.label ?? category;

const noneText = (
  <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
    None
  </Typography.Text>
);

type AssessmentState = "none" | "draft" | "confirmed";

const assessmentState = (record: BrickchatFeedback): AssessmentState =>
  !record.assessment
    ? "none"
    : record.assessment.confirmedAt
      ? "confirmed"
      : "draft";

const rootCauseLabel = (record: BrickchatFeedback) =>
  BRICKCHAT_FEEDBACK_ROOT_CAUSE_OPTIONS.find(
    (o) => o.value === record.assessment?.rootCause,
  )?.label;

const formatCreatedAt = (createdAt: string) =>
  // @ant-design/pro-chat sets dayjs's global locale to zh-cn, so pin English here.
  dayjs(createdAt).locale("en").format("DD MMM YYYY, hh:mm A");

const copyEntryLink = async (feedbackId: string) => {
  try {
    await navigator.clipboard.writeText(
      `${window.location.origin}${BRICKFI_LOGGER_PATHS.feedbackEntry(feedbackId)}`,
    );
    message.success("Link copied");
  } catch {
    message.error("Failed to copy link");
  }
};

// Single feedback entry, opened from a direct link (?id=<feedbackId>) or the
// row's view button.
function FeedbackEntryModal({
  feedbackId,
  feedback,
  isLoading,
  onClose,
}: {
  feedbackId: string | null;
  feedback: BrickchatFeedback | null;
  isLoading: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const updateFeedback = useUpdateBrickchatFeedbackMutation();

  const renderBody = () => {
    if (isLoading) {
      return (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      );
    }
    if (!feedback) {
      return <Empty description="Feedback entry not found" />;
    }
    const { threadId } = feedback;
    return (
      <Flex vertical gap={12}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {feedback.text || noneText}
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
          {formatCreatedAt(feedback.createdAt)}
        </Typography.Text>
        <Flex wrap gap={4}>
          {feedback.category && <Tag>{categoryLabel(feedback.category)}</Tag>}
          {feedback.rating && (
            <Tag color={RATING_COLORS[feedback.rating]}>
              {feedback.rating} - {ratingLabel(feedback.rating)}
            </Tag>
          )}
        </Flex>
        <Flex align="center" gap={8}>
          <Typography.Text type="secondary">Status</Typography.Text>
          <Select
            value={feedback.status ?? "new"}
            options={BRICKCHAT_FEEDBACK_STATUS_OPTIONS}
            loading={updateFeedback.isPending}
            disabled={updateFeedback.isPending}
            style={{ width: 160 }}
            // API errors are toasted by the mutation
            onChange={(status) =>
              updateFeedback
                .mutateAsync({ id: feedback._id, updates: { status } })
                .catch(() => {})
            }
          />
        </Flex>
        <Flex wrap gap={8}>
          <Button
            icon={<ExportOutlined />}
            href={langsmithThreadUrl(threadId)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in LangSmith
          </Button>
          <Button
            icon={<ProfileOutlined />}
            href={BRICKFI_LOGGER_PATHS.thread(threadId)}
            onClick={(e) => {
              // ctrl/cmd-click still opens a new tab via the href
              if (e.metaKey || e.ctrlKey) return;
              e.preventDefault();
              navigate(BRICKFI_LOGGER_PATHS.thread(threadId));
            }}
          >
            Open in Brickfi Logger
          </Button>
          <Button
            icon={<MessageOutlined />}
            href={`${brickfiAppUrl}/app/brickchat/${encodeURIComponent(threadId)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            See conversation
          </Button>
        </Flex>
        {!!feedback.imageUrls?.length && (
          <Image.PreviewGroup>
            <Flex wrap gap={8}>
              {feedback.imageUrls.map((url) => (
                <Image
                  key={url}
                  src={url}
                  width={160}
                  height={160}
                  style={{ objectFit: "cover" }}
                  preview={{ mask: <EyeOutlined /> }}
                />
              ))}
            </Flex>
          </Image.PreviewGroup>
        )}
      </Flex>
    );
  };

  return (
    <Modal
      title={
        <Flex align="center" gap={8}>
          Feedback
          {feedbackId && (
            <Tooltip title="Copy link">
              <Button
                type="text"
                size="small"
                icon={<LinkOutlined />}
                onClick={() => copyEntryLink(feedbackId)}
              />
            </Tooltip>
          )}
        </Flex>
      }
      open={!!feedbackId}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnClose
    >
      {renderBody()}
    </Modal>
  );
}

const getColumns = (
  onEdit: (record: BrickchatFeedback) => void,
  onAssess: (record: BrickchatFeedback) => void,
  onView: (record: BrickchatFeedback) => void,
): TableColumnType<BrickchatFeedback>[] => [
  {
    title: "Title",
    dataIndex: "text",
    key: "text",
    // text is optional - rating/category-only feedback has none
    render: (text: string | undefined) => text || noneText,
  },
  {
    title: "Rating",
    dataIndex: "rating",
    key: "rating",
    width: 140,
    filters: BRICKCHAT_FEEDBACK_RATING_OPTIONS.map((o) => ({
      text: `${o.value} - ${o.label}`,
      value: o.value,
    })),
    onFilter: (value, record) => record.rating === value,
    sorter: (a, b) => (a.rating ?? 0) - (b.rating ?? 0),
    render: (rating: BrickchatFeedbackRating | undefined) =>
      rating ? (
        <Tag color={RATING_COLORS[rating]}>
          {rating} - {ratingLabel(rating)}
        </Tag>
      ) : (
        noneText
      ),
  },
  {
    title: "Category",
    dataIndex: "category",
    key: "category",
    width: 150,
    filters: BRICKCHAT_FEEDBACK_CATEGORY_OPTIONS.map((o) => ({
      text: o.label,
      value: o.value,
    })),
    onFilter: (value, record) => record.category === value,
    render: (category: BrickchatFeedbackCategory | undefined) =>
      category ? <Tag>{categoryLabel(category)}</Tag> : noneText,
  },
  {
    title: "Assessment",
    key: "assessment",
    width: 170,
    filters: [
      { text: "Not assessed", value: "none" },
      { text: "Draft", value: "draft" },
      { text: "Confirmed", value: "confirmed" },
    ],
    onFilter: (value, record) => assessmentState(record) === value,
    render: (_, record) => {
      const state = assessmentState(record);
      if (state === "none") return noneText;
      return (
        <Tag color={state === "confirmed" ? "green" : "orange"}>
          {state === "confirmed" ? "Confirmed" : "Draft"} ·{" "}
          {rootCauseLabel(record)}
        </Tag>
      );
    },
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
    render: formatCreatedAt,
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
        noneText
      ),
  },
  {
    title: "Actions",
    key: "actions",
    width: 220,
    render: (_, record) => (
      <Flex align="center" gap={4}>
        <Tooltip title="View entry">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
          />
        </Tooltip>
        <Tooltip title="Copy user ID">
          <Button
            type="text"
            size="small"
            icon={<UserOutlined />}
            onClick={() => copyUserId(record.userId)}
          />
        </Tooltip>
        <ThreadLinksButton threadId={record.threadId} />
        <Tooltip title="Assessment">
          <Button
            type="text"
            size="small"
            icon={<FileSearchOutlined />}
            onClick={() => onAssess(record)}
          />
        </Tooltip>
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
  // by id, so the drawer shows the refetched entry after each assess/save
  const [assessingId, setAssessingId] = useState<string | null>(null);
  const assessing = data?.find((f) => f._id === assessingId) ?? null;
  // ?id=<feedbackId> opens that entry's modal, so an entry can be linked to
  const [searchParams, setSearchParams] = useSearchParams();
  const viewingId = searchParams.get("id");
  const viewing = data?.find((f) => f._id === viewingId) ?? null;
  const setViewingId = (id: string | null) =>
    setSearchParams(
      (params) => {
        if (id) params.set("id", id);
        else params.delete("id");
        return params;
      },
      { replace: true },
    );
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
      // text is optional now, but the API rejects an empty string - omit it
      // instead (leaves any existing text as it was)
      const text = values.text?.trim() || undefined;
      await updateFeedback.mutateAsync({
        id: editing._id,
        updates: { ...values, text },
      });
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
        columns={getColumns(
          openEdit,
          (record) => setAssessingId(record._id),
          (record) => setViewingId(record._id),
        )}
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
          <Form.Item name="text" label="Text">
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
      <FeedbackAssessmentDrawer
        feedback={assessing}
        onClose={() => setAssessingId(null)}
      />
      <FeedbackEntryModal
        feedbackId={viewingId}
        feedback={viewing}
        isLoading={isLoading}
        onClose={() => setViewingId(null)}
      />
    </>
  );
}
