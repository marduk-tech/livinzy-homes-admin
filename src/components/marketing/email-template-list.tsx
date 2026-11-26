import { PlusOutlined, SendOutlined } from "@ant-design/icons";
import {
  Button,
  Flex,
  Input,
  Modal,
  Segmented,
  Table,
  TableColumnType,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import {
  useCreateEmailTemplateMutation,
  useFetchEmailTemplates,
  useSendTestEmailTemplateMutation,
  useUpdateEmailTemplateMutation,
} from "../../hooks/marketing-hooks";
import { IEmailTemplate } from "../../types";

type DialogMode = "view" | "edit";

// {{name}} placeholders (also Mailjet's {{var:name}} / {{var:name:"default"}}),
// matching what the services API fills in
const PLACEHOLDER = /\{\{\s*(?:var:)?([\w.]+)(?::\s*"[^"]*")?\s*\}\}/g;
const getTemplateVariables = (...texts: (string | null | undefined)[]) => {
  const names = new Set<string>();
  texts.forEach((text) => {
    for (const [, key] of (text || "").matchAll(PLACEHOLDER)) names.add(key);
  });
  return [...names];
};

const LAST_TEST_EMAIL_KEY = "emailTemplates.lastTestEmail";
const readLastTestEmail = () => {
  try {
    return localStorage.getItem(LAST_TEST_EMAIL_KEY) || "";
  } catch {
    return "";
  }
};
const saveLastTestEmail = (email: string) => {
  try {
    localStorage.setItem(LAST_TEST_EMAIL_KEY, email);
  } catch {
    // storage unavailable - only a convenience
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sends the template (as currently in the editor, saved or not) to one
// address, with values for its {{variables}}
function SendTestModal({
  open,
  templateId,
  html,
  subject,
  onClose,
}: {
  open: boolean;
  templateId: string;
  html: string;
  subject: string | null;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const sendMutation = useSendTestEmailTemplateMutation();
  const variableNames = getTemplateVariables(html, subject);

  useEffect(() => {
    if (open) {
      setEmail(readLastTestEmail());
      setVariables({});
    }
  }, [open]);

  const isValidEmail = EMAIL_RE.test(email.trim());

  const handleSend = () => {
    const to = email.trim();
    saveLastTestEmail(to);
    sendMutation.mutate(
      {
        id: templateId,
        email: to,
        html,
        subject: subject ?? undefined,
        variables: Object.fromEntries(
          Object.entries(variables).filter(([, v]) => v !== ""),
        ),
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Send test email"
      okText="Send"
      onOk={handleSend}
      okButtonProps={{ disabled: !isValidEmail, loading: sendMutation.isPending }}
      destroyOnClose
    >
      <Flex vertical gap={12}>
        <Input
          type="email"
          placeholder="Recipient email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onPressEnter={() => isValidEmail && handleSend()}
          autoFocus
        />
        {variableNames.length > 0 && (
          <Flex vertical gap={8}>
            <Typography.Text type="secondary">
              Template variables (left empty, they render blank or use their
              default)
            </Typography.Text>
            {variableNames.map((name) => (
              <Input
                key={name}
                addonBefore={name}
                value={variables[name] ?? ""}
                onChange={(e) =>
                  setVariables((prev) => ({ ...prev, [name]: e.target.value }))
                }
              />
            ))}
          </Flex>
        )}
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Sends what's in the editor now, including unsaved changes. The
          subject is prefixed with [TEST].
        </Typography.Text>
      </Flex>
    </Modal>
  );
}

// null = closed, "new" = creating a template, otherwise the template opened
type DialogTarget = IEmailTemplate | "new" | null;

function EmailTemplateDialog({
  target,
  onClose,
}: {
  target: DialogTarget;
  onClose: () => void;
}) {
  const isNew = target === "new";
  const template = target && target !== "new" ? target : null;

  const [mode, setMode] = useState<DialogMode>("view");
  const [html, setHtml] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [isTestOpen, setIsTestOpen] = useState(false);
  const updateMutation = useUpdateEmailTemplateMutation();
  const createMutation = useCreateEmailTemplateMutation();

  // reset whenever the dialog opens on a different template (or a new one) -
  // a new template starts in the editor since there's nothing to view yet
  useEffect(() => {
    setMode(target === "new" ? "edit" : "view");
    setHtml(template?.html ?? "");
    setName("");
    setSubject("");
    setIsTestOpen(false);
  }, [target]);

  const isDirty = isNew
    ? !!(html || name || subject)
    : !!template && html !== template.html;
  const canSave = isNew ? !!name.trim() && !!html.trim() : isDirty;
  const isSaving = updateMutation.isPending || createMutation.isPending;

  const handleClose = () => {
    if (isDirty && !window.confirm("Discard unsaved changes to this template?")) {
      return;
    }
    onClose();
  };

  const handleSave = () => {
    if (isNew) {
      createMutation.mutate(
        { name: name.trim(), subject: subject.trim() || undefined, html },
        { onSuccess: () => onClose() },
      );
    } else if (template) {
      updateMutation.mutate(
        { id: template._id, html },
        { onSuccess: () => onClose() },
      );
    }
  };

  return (
    <Modal
      open={!!target}
      onCancel={handleClose}
      width={960}
      destroyOnClose
      title={
        isNew ? (
          "New email template"
        ) : (
          <Flex vertical gap={2}>
            <span>{template?.name || "Untitled template"}</span>
            {template?.subject && (
              <Typography.Text
                type="secondary"
                style={{ fontWeight: 400, fontSize: 13 }}
              >
                Subject: {template.subject}
              </Typography.Text>
            )}
          </Flex>
        )
      }
      footer={
        <Flex justify="space-between" align="center">
          <Flex gap={12} align="center">
            {template && (
              <Button
                icon={<SendOutlined />}
                onClick={() => setIsTestOpen(true)}
                disabled={!html.trim()}
              >
                Send test
              </Button>
            )}
            <Typography.Text type="secondary">
              {isNew && !canSave
                ? "Name and HTML are required"
                : isDirty
                  ? "Unsaved changes"
                  : ""}
            </Typography.Text>
          </Flex>
          <Flex gap={8}>
            <Button onClick={handleClose}>Close</Button>
            <Button
              type="primary"
              onClick={handleSave}
              disabled={!canSave}
              loading={isSaving}
            >
              {isNew ? "Create" : "Save"}
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Flex vertical gap={12}>
        {isNew && (
          <Flex gap={12}>
            <Input
              placeholder="Template name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Flex>
        )}
        <Segmented<DialogMode>
          value={mode}
          onChange={setMode}
          options={[
            { label: "View", value: "view" },
            { label: "Edit HTML", value: "edit" },
          ]}
          style={{ alignSelf: "flex-start" }}
        />
        {mode === "view" ? (
          // sandboxed iframe: renders the email as-is without its styles or
          // scripts touching the admin page
          <iframe
            title="Email template preview"
            srcDoc={html}
            sandbox=""
            style={{
              width: "100%",
              height: "60vh",
              border: "1px solid #f0f0f0",
              borderRadius: 6,
              background: "#fff",
            }}
          />
        ) : (
          <Input.TextArea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="Paste or write the email HTML here"
            spellCheck={false}
            style={{
              height: "60vh",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12,
            }}
          />
        )}
      </Flex>
      {template && (
        <SendTestModal
          open={isTestOpen}
          templateId={template._id}
          html={html}
          subject={template.subject}
          onClose={() => setIsTestOpen(false)}
        />
      )}
    </Modal>
  );
}

export function EmailTemplateList() {
  const { data, isLoading, isError } = useFetchEmailTemplates();
  const [target, setTarget] = useState<DialogTarget>(null);

  const columns: TableColumnType<IEmailTemplate>[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string | null) =>
        name || <Typography.Text type="secondary">Untitled</Typography.Text>,
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      render: (subject: string | null) => subject || "-",
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 200,
      render: (date: string) => (date ? new Date(date).toLocaleString() : "-"),
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
  ];

  return (
    <>
      <Flex justify="flex-end" style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setTarget("new")}
        >
          Add Template
        </Button>
      </Flex>

      {isError ? (
        <Typography.Text type="danger">
          Failed to load email templates.
        </Typography.Text>
      ) : (
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={data ?? []}
          loading={isLoading}
          pagination={{ pageSize: 20 }}
          onRow={(record) => ({
            onClick: () => setTarget(record),
            style: { cursor: "pointer" },
          })}
        />
      )}

      <EmailTemplateDialog target={target} onClose={() => setTarget(null)} />
    </>
  );
}
