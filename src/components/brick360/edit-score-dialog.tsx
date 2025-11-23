import { EditOutlined, HighlightOutlined } from "@ant-design/icons";
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
      containerProps={{ style: { minHeight: "200px", resize: "vertical" } }}
    >
      <Toolbar>
        <BtnUndo />
        <BtnRedo />
        <Separator />
        {/* <BtnBold />
        <BtnItalic />
        <BtnUnderline />
        <BtnStrikeThrough />
        <Separator />
        <BtnBulletList />
        <BtnNumberedList />
        <Separator />
        <BtnLink />
        <Separator /> */}
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
        updatedValues.pros = values.pros
          ? values.pros.split("\n").filter(Boolean)
          : [];
        updatedValues.cons = values.cons
          ? values.cons.split("\n").filter(Boolean)
          : [];
      } else {
        Object.keys(values).forEach((key) => {
          if (values[key] && typeof values[key].reasoning === "string") {
            updatedValues[key] = {
              ...values[key],
              reasoning: values[key].reasoning.split("\n").filter(Boolean),
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
        pros: sectionData.pros?.join("\n"),
        cons: sectionData.cons?.join("\n"),
      });
    } else {
      const initialValues: { [key: string]: any } = {};
      Object.keys(sectionData).forEach((key) => {
        if (key !== "_id" && sectionData[key]) {
          initialValues[key] = {
            ...sectionData[key],
            reasoning: sectionData[key].reasoning?.join("\n"),
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
        width={1200}
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
          style={{ maxHeight: "60vh", overflowY: "auto" }}
        >
          {sectionKey === "summary" ? (
            <>
              <Form.Item label="Pros" name="pros">
                <WysiwygEditor />
              </Form.Item>
              <Form.Item label="Cons" name="cons">
                <WysiwygEditor />
              </Form.Item>
            </>
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
