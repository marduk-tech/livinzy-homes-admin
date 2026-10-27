import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  Segmented,
  Select,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  useCreateBrickfiOfferingMutation,
  useGetBrickfiOfferings,
  useUpdateBrickfiOfferingMutation,
} from "../../hooks/brickfi-offering-hooks";
import { errorMessage } from "../../libs/api-error";
import {
  BRICKFI_OFFERING_STATUSES,
  BrickfiOffering,
  BrickfiOfferingCta,
  BrickfiOfferingInput,
  BrickfiOfferingStatus,
} from "../../types/brickfi-offering";
import DynamicReactIcon, { IconSetKey } from "../common/dynamic-react-icon";
import { markdownBox, markdownComponents } from "./prompt-text-styles";

const STATUS_COLORS: Record<BrickfiOfferingStatus, string> = {
  active: "green",
  draft: "orange",
  archived: "default",
};

const STATUS_OPTIONS = BRICKFI_OFFERING_STATUSES.map((s) => ({
  label: <Tag color={STATUS_COLORS[s]}>{s}</Tag>,
  value: s,
}));

// same slug rule for offering keys and CTA ids
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// react-icons sets a CTA icon can come from - the ones this app's
// DynamicReactIcon can preview, all of which brickfi-app renders too
const CTA_ICON_SETS: IconSetKey[] = [
  "ai",
  "bi",
  "bs",
  "fa",
  "fa6",
  "fc",
  "fi",
  "gi",
  "hi",
  "io",
  "io5",
  "md",
  "pi",
  "ri",
  "si",
  "tb",
];

const formatDate = (date?: string) =>
  // @ant-design/pro-chat sets dayjs's global locale to zh-cn, so pin English
  date ? dayjs(date).locale("en").format("DD MMM YYYY, hh:mm A") : "";

const EMPTY_OFFERING: BrickfiOfferingInput = {
  key: "",
  title: "",
  summary: "",
  details: "",
  showWhen: [""],
  excludeWhen: "",
  ctas: [],
  status: "draft",
};

// trims everything and drops blank scenarios / empty CTA descriptions, so
// stray whitespace from the form never reaches the matcher's prompt
const cleanValues = (values: BrickfiOfferingInput): BrickfiOfferingInput => ({
  key: values.key?.trim(),
  title: values.title.trim(),
  summary: values.summary.trim(),
  details: values.details?.trim() ?? "",
  showWhen: (values.showWhen ?? []).map((s) => s?.trim()).filter(Boolean),
  excludeWhen: values.excludeWhen?.trim() ?? "",
  ctas: (values.ctas ?? []).map((cta) => ({
    ctaId: cta.ctaId.trim(),
    label: cta.label.trim(),
    flowKey: cta.flowKey.trim(),
    ...(cta.description?.trim() ? { description: cta.description.trim() } : {}),
    // only a complete icon is kept - a cleared one is dropped
    ...(cta.icon?.iconSet && cta.icon?.iconName?.trim()
      ? { icon: { iconSet: cta.icon.iconSet, iconName: cta.icon.iconName.trim() } }
      : {}),
  })),
  status: values.status,
});

const getColumns = (
  onEdit: (offering: BrickfiOffering) => void,
  onStatusChange: (offering: BrickfiOffering, status: BrickfiOfferingStatus) => void,
  updatingId: string | null,
): TableColumnType<BrickfiOffering>[] => [
  {
    title: "Offering",
    key: "title",
    sorter: (a, b) => a.title.localeCompare(b.title),
    render: (_, record) => (
      <Flex vertical>
        <Typography.Link onClick={() => onEdit(record)}>
          {record.title}
        </Typography.Link>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {record.key}
        </Typography.Text>
      </Flex>
    ),
  },
  {
    title: "Summary",
    dataIndex: "summary",
    key: "summary",
    ellipsis: true,
  },
  {
    title: "Show when",
    key: "showWhen",
    width: 110,
    render: (_, record) => (
      <Typography.Text type="secondary">
        {record.showWhen.length} scenario{record.showWhen.length === 1 ? "" : "s"}
      </Typography.Text>
    ),
  },
  {
    title: "CTAs",
    key: "ctas",
    width: 260,
    render: (_, record) =>
      record.ctas.length ? (
        <Flex gap={4} wrap>
          {record.ctas.map((cta) => (
            <Tag key={cta.ctaId} bordered={false}>
              {cta.label}
            </Tag>
          ))}
        </Flex>
      ) : (
        <Typography.Text type="secondary">none</Typography.Text>
      ),
  },
  {
    title: "Status",
    key: "status",
    width: 150,
    filters: BRICKFI_OFFERING_STATUSES.map((s) => ({ text: s, value: s })),
    onFilter: (value, record) => record.status === value,
    render: (_, record) => (
      <Select
        size="small"
        variant="borderless"
        value={record.status}
        options={STATUS_OPTIONS}
        loading={updatingId === record._id}
        disabled={updatingId === record._id}
        onChange={(status) => onStatusChange(record, status)}
        style={{ width: 120 }}
      />
    ),
  },
  {
    title: "Updated",
    dataIndex: "updatedAt",
    key: "updatedAt",
    width: 190,
    sorter: (a, b) => dayjs(a.updatedAt).diff(dayjs(b.updatedAt)),
    render: (date: string) => (
      <Typography.Text type="secondary">{formatDate(date)}</Typography.Text>
    ),
  },
];

// Create (offering null with open) or edit one offering. `key` is fixed
// once created - threads and tickets refer to the offering by it.
function OfferingDrawer({
  open,
  offering,
  onClose,
}: {
  open: boolean;
  offering: BrickfiOffering | null;
  onClose: () => void;
}) {
  const [form] = Form.useForm<BrickfiOfferingInput>();
  const [detailsView, setDetailsView] = useState<"edit" | "preview">("edit");
  const details = Form.useWatch("details", form);
  const createOffering = useCreateBrickfiOfferingMutation();
  const updateOffering = useUpdateBrickfiOfferingMutation();
  const isNew = !offering;
  const busy = createOffering.isPending || updateOffering.isPending;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(
      offering
        ? {
            ...offering,
            showWhen: offering.showWhen.length ? offering.showWhen : [""],
          }
        : EMPTY_OFFERING,
    );
    setDetailsView("edit");
  }, [form, open, offering]);

  const save = async () => {
    const values = cleanValues(await form.validateFields());
    if (isNew) {
      await createOffering.mutateAsync(values);
    } else {
      const { key: _key, ...update } = values;
      await updateOffering.mutateAsync({ id: offering._id, update });
    }
    onClose();
  };

  return (
    <Drawer
      title={isNew ? "New offering" : offering.title}
      open={open}
      onClose={onClose}
      width={880}
      destroyOnClose
      extra={
        <Flex gap={8}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={busy} onClick={() => save().catch(() => {})}>
            {isNew ? "Create" : "Save"}
          </Button>
        </Flex>
      }
    >
      <Form form={form} layout="vertical" disabled={busy}>
        <Flex gap={16}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, whitespace: true, message: "Title is required" }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="Brickfi Legal Assist" />
          </Form.Item>
          <Form.Item
            name="key"
            label="Key"
            tooltip="Stable id brickchat and tickets use for this offering - can't be changed after creation"
            rules={[
              { required: true, message: "Key is required" },
              {
                pattern: SLUG_PATTERN,
                message: "Lowercase letters, numbers and dashes, e.g. legal-assist",
              },
            ]}
            style={{ width: 240 }}
          >
            <Input placeholder="legal-assist" disabled={!isNew} />
          </Form.Item>
          <Form.Item name="status" label="Status" style={{ width: 150 }}>
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Flex>

        <Form.Item
          name="summary"
          label="Summary"
          tooltip="One or two sentences on what it is - shown to the matcher and planner"
          rules={[{ required: true, whitespace: true, message: "Summary is required" }]}
        >
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>

        <Form.Item
          label="Details"
          tooltip="Everything offered, free and paid (markdown) - brickchat answers questions about the offering from this, and picks the relevant part when pitching it"
          style={{ marginBottom: 0 }}
        >
          <Segmented
            size="small"
            value={detailsView}
            onChange={(v) => setDetailsView(v as "edit" | "preview")}
            options={[
              { label: "Edit", value: "edit" },
              { label: "Preview", value: "preview" },
            ]}
            style={{ marginBottom: 8 }}
          />
        </Form.Item>
        <Form.Item name="details" hidden={detailsView !== "edit"}>
          <Input.TextArea autoSize={{ minRows: 8, maxRows: 24 }} />
        </Form.Item>
        {detailsView === "preview" && (
          <div style={{ ...markdownBox, maxHeight: "50vh", marginBottom: 24 }}>
            {details?.trim() ? (
              <ReactMarkdown components={markdownComponents}>{details}</ReactMarkdown>
            ) : (
              <Typography.Text type="secondary">No details yet</Typography.Text>
            )}
          </div>
        )}

        <Form.Item
          label="Show when"
          tooltip="Scenarios where the offering is worth suggesting, one per line - e.g. 'User is asking about EMI, monthly payments or loan eligibility'"
          required
        >
          <Form.List
            name="showWhen"
            rules={[
              {
                validator: async (_, scenarios?: string[]) => {
                  if (!(scenarios ?? []).some((s) => s?.trim())) {
                    throw new Error("Add at least one scenario");
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <Flex vertical gap={8}>
                {fields.map((field) => (
                  <Flex key={field.key} gap={8} align="start">
                    <Form.Item name={field.name} noStyle>
                      <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} />
                    </Form.Item>
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    />
                  </Flex>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add("")}
                  style={{ alignSelf: "flex-start" }}
                >
                  Add scenario
                </Button>
                <Form.ErrorList errors={errors} />
              </Flex>
            )}
          </Form.List>
        </Form.Item>

        <Form.Item
          name="excludeWhen"
          label="Don't show when"
          tooltip="When not to suggest it even if a scenario above fits - e.g. 'Early broad discovery; user paying fully in cash'"
        >
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>

        <Form.Item
          label="CTAs"
          tooltip="Buttons shown under the offering in brickchat - each starts the brickfi-app flow named by its flow key"
        >
          <Form.List
            name="ctas"
            rules={[
              {
                validator: async (_, ctas?: BrickfiOfferingCta[]) => {
                  const ids = (ctas ?? []).map((c) => c?.ctaId?.trim()).filter(Boolean);
                  if (new Set(ids).size !== ids.length) {
                    throw new Error("CTA ids must be unique");
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <Flex vertical gap={8}>
                {fields.map((field) => (
                  <Card
                    key={field.key}
                    size="small"
                    extra={
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    }
                    title={`CTA ${field.name + 1}`}
                  >
                    <Flex gap={12}>
                      <Form.Item
                        name={[field.name, "label"]}
                        label="Label"
                        rules={[{ required: true, whitespace: true, message: "Required" }]}
                        style={{ flex: 1, marginBottom: 8 }}
                      >
                        <Input placeholder="Ask our legal team" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "ctaId"]}
                        label="CTA id"
                        rules={[
                          { required: true, message: "Required" },
                          { pattern: SLUG_PATTERN, message: "e.g. legal-query" },
                        ]}
                        style={{ width: 180, marginBottom: 8 }}
                      >
                        <Input placeholder="legal-query" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "flowKey"]}
                        label="Flow key"
                        tooltip="The flow in brickfi-app this button starts"
                        rules={[{ required: true, whitespace: true, message: "Required" }]}
                        style={{ width: 180, marginBottom: 8 }}
                      >
                        <Input placeholder="legalQuery" />
                      </Form.Item>
                    </Flex>
                    <Form.Item
                      name={[field.name, "description"]}
                      label="Description"
                      style={{ marginBottom: 8 }}
                    >
                      <Input placeholder="Optional" />
                    </Form.Item>
                    <Flex gap={12} align="flex-start">
                      <Form.Item
                        name={[field.name, "icon", "iconSet"]}
                        label="Icon set"
                        tooltip="Optional button icon - a react-icons set, e.g. md for Material Design"
                        dependencies={[["ctas", field.name, "icon", "iconName"]]}
                        rules={[
                          ({ getFieldValue }) => ({
                            validator: async (_, iconSet?: string) => {
                              const iconName = getFieldValue([
                                "ctas",
                                field.name,
                                "icon",
                                "iconName",
                              ]);
                              if (iconName?.trim() && !iconSet) {
                                throw new Error("Pick the icon's set");
                              }
                            },
                          }),
                        ]}
                        style={{ width: 140, marginBottom: 0 }}
                      >
                        <Select
                          allowClear
                          placeholder="e.g. md"
                          options={CTA_ICON_SETS.map((s) => ({ label: s, value: s }))}
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "icon", "iconName"]}
                        label="Icon name"
                        tooltip="The icon's name in that set, as on react-icons.github.io - e.g. MdGavel"
                        dependencies={[["ctas", field.name, "icon", "iconSet"]]}
                        rules={[
                          ({ getFieldValue }) => ({
                            validator: async (_, iconName?: string) => {
                              const iconSet = getFieldValue([
                                "ctas",
                                field.name,
                                "icon",
                                "iconSet",
                              ]);
                              if (iconSet && !iconName?.trim()) {
                                throw new Error("Enter the icon's name");
                              }
                            },
                          }),
                        ]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input placeholder="e.g. MdGavel" />
                      </Form.Item>
                      <Form.Item label="Preview" style={{ marginBottom: 0 }}>
                        <Form.Item noStyle shouldUpdate>
                          {({ getFieldValue }) => {
                            const icon = getFieldValue(["ctas", field.name, "icon"]);
                            return (
                              <Flex
                                align="center"
                                justify="center"
                                style={{ width: 32, height: 32 }}
                              >
                                {icon?.iconSet && icon?.iconName?.trim() ? (
                                  // keyed so a changed set/name starts fresh
                                  // instead of keeping the last icon found
                                  <DynamicReactIcon
                                    key={`${icon.iconSet}:${icon.iconName.trim()}`}
                                    iconSet={icon.iconSet}
                                    iconName={icon.iconName.trim()}
                                    size={20}
                                  />
                                ) : (
                                  <Typography.Text type="secondary">-</Typography.Text>
                                )}
                              </Flex>
                            );
                          }}
                        </Form.Item>
                      </Form.Item>
                    </Flex>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({ ctaId: "", label: "", flowKey: "" })}
                  style={{ alignSelf: "flex-start" }}
                >
                  Add CTA
                </Button>
                <Form.ErrorList errors={errors} />
              </Flex>
            )}
          </Form.List>
        </Form.Item>
      </Form>
    </Drawer>
  );
}

export function BrickfiOfferingsTab() {
  const { data, isLoading, isError, error } = useGetBrickfiOfferings();
  const updateOffering = useUpdateBrickfiOfferingMutation();
  const [editing, setEditing] = useState<BrickfiOffering | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isError) {
    return (
      <Empty description={errorMessage(error, "Failed to fetch offerings")} />
    );
  }

  const openDrawer = (offering: BrickfiOffering | null) => {
    setEditing(offering);
    setDrawerOpen(true);
  };

  const changeStatus = (offering: BrickfiOffering, status: BrickfiOfferingStatus) =>
    updateOffering.mutate({ id: offering._id, update: { status } });

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">
          Only active offerings are suggested and answered about in brickchat.
          Changes take effect right away.
        </Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer(null)}>
          New offering
        </Button>
      </Flex>
      <Table
        dataSource={data}
        columns={getColumns(
          openDrawer,
          changeStatus,
          updateOffering.isPending ? updateOffering.variables?.id ?? null : null,
        )}
        loading={isLoading}
        rowKey="_id"
        pagination={false}
      />
      <OfferingDrawer
        open={drawerOpen}
        offering={editing}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
