import {
  DeleteOutlined,
  EditOutlined,
  HighlightOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Form, InputNumber, message, Modal, Typography } from "antd";
import { useState } from "react";
import Editor, {
  BtnBold,
  BtnBulletList,
  BtnItalic,
  BtnLink,
  BtnNumberedList,
  BtnRedo,
  BtnStrikeThrough,
  BtnUnderline,
  BtnUndo,
  createButton,
  Separator,
  Toolbar,
} from "react-simple-wysiwyg";

function isSelectionHighlighted(range: Range): boolean {
  let ancestor: Node | null = range.commonAncestorContainer;
  if (ancestor.nodeType === Node.TEXT_NODE) {
    ancestor = ancestor.parentElement;
  }

  let current = ancestor as HTMLElement | null;
  while (current && current !== document.body) {
    if (current.classList?.contains("highlight")) {
      return true;
    }
    current = current.parentElement;
  }

  return false;
}

function removeHighlight(range: Range): void {
  let node: Node | null = range.commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  let highlightSpan = node as HTMLElement | null;
  while (highlightSpan && !highlightSpan.classList?.contains("highlight")) {
    highlightSpan = highlightSpan.parentElement;
  }

  if (highlightSpan?.classList?.contains("highlight")) {
    const parent = highlightSpan.parentNode;
    if (parent) {
      while (highlightSpan.firstChild) {
        parent.insertBefore(highlightSpan.firstChild, highlightSpan);
      }
      parent.removeChild(highlightSpan);
    }
  }
}

const BtnHighlight = createButton(
  "Highlight Text",
  <HighlightOutlined style={{ fontSize: "16px" }} />,
  () => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || !selection.toString()) {
      message.warning("Please select some text first");
      return;
    }

    try {
      const range = selection.getRangeAt(0);

      // Check if selection is already highlighted
      if (isSelectionHighlighted(range)) {
        // Toggle off: remove highlight
        removeHighlight(range);
        message.success("Highlight removed");
      } else {
        // Toggle on: add highlight
        const span = document.createElement("span");
        span.className = "highlight";
        span.appendChild(range.extractContents());
        range.insertNode(span);
        message.success("Text highlighted");
      }

      selection.removeAllRanges();
    } catch (error) {
      console.error("Highlight error:", error);
      message.error("Failed to toggle highlight");
    }
  }
);

function arrayToHtml(items: string[]): string {
  if (!items || items.length === 0) return "";

  return items
    .filter((item) => item && item.trim())
    .map((item) => {
      const trimmed = item.trim();
      if (trimmed.match(/^<(div|p)/i)) return trimmed;
      return `<div>${trimmed}</div>`;
    })
    .join("");
}

function htmlToArray(html: string): string[] {
  if (!html || !html.trim()) return [];

  const trimmed = html.trim();

  if (trimmed.includes("\n") && !trimmed.includes("<")) {
    return trimmed
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const temp = document.createElement("div");
  temp.innerHTML = trimmed;
  const children = Array.from(temp.children);

  if (children.length === 0) {
    // Handle <br>-separated content
    return trimmed
      .split(/<br\s*\/?>/gi)
      .map((item) => item.trim())
      .filter((item) => {
        const text = item.replace(/<[^>]*>/g, "").trim();
        return text.length > 0;
      });
  }

  return children
    .map((child) => child.innerHTML.trim())
    .filter((item) => {
      const text = item.replace(/<[^>]*>/g, "").trim();
      return text.length > 0;
    });
}

// Clean up whitespace issues from WYSIWYG editor
function normalizeProConHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  let normalized = html.trim();

  // Remove &nbsp; and whitespace between </b> and <br>
  normalized = normalized.replace(/<\/b>(?:\s|&nbsp;)*<br\s*\/?>/gi, "</b><br>");

  // Remove trailing &nbsp; after </b> if no <br> follows
  normalized = normalized.replace(/<\/b>(?:\s|&nbsp;)+$/gi, "</b>");

  // Consolidate multiple <br> tags into single <br>
  normalized = normalized.replace(/(<br\s*\/?>\s*){2,}/gi, "<br>");

  // Remove leading/trailing whitespace and &nbsp;
  normalized = normalized.replace(/^(?:\s|&nbsp;)+|(?:\s|&nbsp;)+$/gi, "");

  return normalized;
}

// Only save items with actual text content
function hasValidContent(html: string): boolean {
  if (!html || typeof html !== "string") return false;

  // Strip all HTML tags
  const textContent = html.replace(/<[^>]*>/g, "").trim();

  // Decode HTML entities
  const temp = document.createElement("div");
  temp.innerHTML = textContent;
  const decoded = temp.textContent || temp.innerText || "";

  return decoded.trim().length > 0;
}

interface EditScoreDialogProps {
  sectionData: any;
  sectionKey: string;
  onSave: (updatedData: any) => void;
}

// WYSIWYG wrapper for Ant Design Form.Item
interface WysiwygEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

function WysiwygEditor({ value, onChange, placeholder }: WysiwygEditorProps) {
  const handleChange = (e: any) => {
    onChange?.(e.target.value);
  };

  return (
    <Editor
      value={value || ""}
      onChange={handleChange}
      placeholder={placeholder}
      containerProps={{
        style: {
          minHeight: "250px",
          resize: "vertical",
          backgroundColor: "white",
        },
      }}
    >
      <Toolbar>
        <BtnUndo />
        <BtnRedo />
        <Separator />
        <BtnBold />
        <BtnItalic />
        <BtnUnderline />
        <BtnStrikeThrough />
        <Separator />
        <BtnBulletList />
        <BtnNumberedList />
        <Separator />
        <BtnLink />
        <Separator />
        <BtnHighlight />
      </Toolbar>
    </Editor>
  );
}

export function EditScoreDialog({
  sectionData,
  sectionKey,
  onSave,
}: EditScoreDialogProps) {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const updatedValues = { ...values };

      if (sectionKey === "summary") {
        // Normalize and filter pros
        updatedValues.pros = (values.pros || [])
          .map((item: string) => normalizeProConHtml(item))
          .filter((item: string) => hasValidContent(item));

        // Normalize and filter cons
        updatedValues.cons = (values.cons || [])
          .map((item: string) => normalizeProConHtml(item))
          .filter((item: string) => hasValidContent(item));
      } else {
        Object.keys(values).forEach((key) => {
          if (values[key] && typeof values[key].reasoning === "string") {
            updatedValues[key] = {
              ...values[key],
              reasoning: htmlToArray(values[key].reasoning),
            };
          }
        });
      }
      const finalData = { ...sectionData, ...updatedValues };
      onSave(finalData);
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleOpen = () => {
    if (sectionKey === "summary") {
      form.setFieldsValue({
        pros: sectionData.pros || [],
        cons: sectionData.cons || [],
      });
    } else {
      const initialValues: { [key: string]: any } = {};
      Object.keys(sectionData).forEach((key) => {
        if (key !== "_id" && sectionData[key]) {
          initialValues[key] = {
            ...sectionData[key],
            reasoning: arrayToHtml(sectionData[key].reasoning || []),
          };
        }
      });
      form.setFieldsValue(initialValues);
    }
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  return (
    <>
      <Button onClick={handleOpen} icon={<EditOutlined />} />

      <Modal
        title={`Edit ${sectionKey}`}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleClose}
        keyboard={false}
        width={1400}
        style={{ top: 20 }}
        styles={{ body: { height: "80vh", overflow: "hidden" } }}
        footer={[
          <Button key="cancel" onClick={handleClose}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            OK
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ height: "100%", overflowY: "auto", paddingRight: 8 }}
        >
          {sectionKey === "summary" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
                height: "100%",
              }}
            >
              {/* PROS SECTION - LEFT COLUMN */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Typography.Title level={4} style={{ marginBottom: 16 }}>
                  Pros
                </Typography.Title>

                <Form.List name="pros">
                  {(fields, { add, remove }) => (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}
                    >
                      <Button
                        type="dashed"
                        onClick={() => add("", 0)}
                        icon={<PlusOutlined />}
                        size="large"
                        style={{ marginBottom: 16 }}
                      >
                        Add Pro
                      </Button>

                      <div
                        style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}
                      >
                        {fields.map((field, index) => (
                          <div
                            key={field.key}
                            style={{
                              marginBottom: 16,
                              border: "1px solid #d9d9d9",
                              padding: 16,
                              borderRadius: 8,
                              backgroundColor: "#fafafa",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 12,
                              }}
                            >
                              <Typography.Text strong>
                                Pro #{index + 1}
                              </Typography.Text>
                              <DeleteOutlined
                                onClick={() => remove(field.name)}
                                style={{
                                  color: "#ff4d4f",
                                  cursor: "pointer",
                                  fontSize: 18,
                                  padding: 4,
                                }}
                              />
                            </div>

                            <Form.Item
                              {...field}
                              rules={[
                                {
                                  required: true,
                                  message:
                                    "Please enter content or delete this item",
                                },
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <WysiwygEditor placeholder="Enter pro item content..." />
                            </Form.Item>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Form.List>
              </div>

              {/* CONS SECTION - RIGHT COLUMN */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Typography.Title level={4} style={{ marginBottom: 16 }}>
                  Cons
                </Typography.Title>

                <Form.List name="cons">
                  {(fields, { add, remove }) => (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}
                    >
                      <Button
                        type="dashed"
                        onClick={() => add("", 0)}
                        icon={<PlusOutlined />}
                        size="large"
                        style={{ marginBottom: 16 }}
                      >
                        Add Con
                      </Button>

                      <div
                        style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}
                      >
                        {fields.map((field, index) => (
                          <div
                            key={field.key}
                            style={{
                              marginBottom: 16,
                              border: "1px solid #d9d9d9",
                              padding: 16,
                              borderRadius: 8,
                              backgroundColor: "#fafafa",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 12,
                              }}
                            >
                              <Typography.Text strong>
                                Con #{index + 1}
                              </Typography.Text>
                              <DeleteOutlined
                                onClick={() => remove(field.name)}
                                style={{
                                  color: "#ff4d4f",
                                  cursor: "pointer",
                                  fontSize: 18,
                                  padding: 4,
                                }}
                              />
                            </div>

                            <Form.Item
                              {...field}
                              rules={[
                                {
                                  required: true,
                                  message:
                                    "Please enter content or delete this item",
                                },
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <WysiwygEditor placeholder="Enter con item content..." />
                            </Form.Item>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Form.List>
              </div>
            </div>
          ) : (
            Object.entries(sectionData).map(([subKey, subSection]: any) =>
              subKey !== "_id" ? (
                <div key={subKey}>
                  <Typography.Title level={5}>{subKey}</Typography.Title>
                  <Form.Item
                    label="Rating"
                    name={[subKey, "rating"]}
                    rules={[
                      { required: true, message: "Please enter rating" },
                      {
                        type: "number",
                        min: 0,
                        max: 100,
                        message: "Rating must be between 0 and 100",
                      },
                    ]}
                  >
                    <InputNumber min={0} max={100} style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item
                    label="Reasoning"
                    name={[subKey, "reasoning"]}
                    rules={[
                      { required: true, message: "Please enter reasoning" },
                    ]}
                  >
                    <WysiwygEditor />
                  </Form.Item>
                </div>
              ) : null
            )
          )}
        </Form>
      </Modal>
    </>
  );
}
