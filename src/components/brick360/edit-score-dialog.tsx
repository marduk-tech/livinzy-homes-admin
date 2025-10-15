import { EditOutlined, HighlightOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Typography,
  message,
} from "antd";
import { useRef, useState } from "react";

interface EditScoreDialogProps {
  sectionData: any;
  sectionKey: string;
  onSave: (updatedData: any) => void;
}

export function EditScoreDialog({
  sectionData,
  sectionKey,
  onSave,
}: EditScoreDialogProps) {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTextAreaField, setActiveTextAreaField] = useState<string | null>(
    null
  );
  const textAreaRefs = useRef<{ [key: string]: any }>({});

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
    setActiveTextAreaField(null);
  };

  const handleHighlight = () => {
    if (!activeTextAreaField) {
      message.warning("Please focus on a text area first");
      return;
    }

    const textArea = textAreaRefs.current[activeTextAreaField];
    if (!textArea || !textArea.resizableTextArea?.textArea) {
      message.error("Text area not found");
      return;
    }

    const textarea = textArea.resizableTextArea.textArea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText) {
      message.warning("Please select some text first");
      return;
    }

    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    const newText = `${beforeText}<span class='highlight'>${selectedText}</span>${afterText}`;

    // update form field value handle both simple and nested fields
    const fieldPath = activeTextAreaField.includes(".")
      ? activeTextAreaField.split(".")
      : activeTextAreaField;
    form.setFieldValue(fieldPath, newText);

    message.success("Text highlighted successfully");
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
          <Button
            key="highlight"
            icon={<HighlightOutlined />}
            onClick={handleHighlight}
          >
            Highlight Selected Text
          </Button>,
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
                <Input.TextArea
                  rows={4}
                  ref={(el) => (textAreaRefs.current["pros"] = el)}
                  onFocus={() => setActiveTextAreaField("pros")}
                />
              </Form.Item>
              <Form.Item label="Cons" name="cons">
                <Input.TextArea
                  rows={4}
                  ref={(el) => (textAreaRefs.current["cons"] = el)}
                  onFocus={() => setActiveTextAreaField("cons")}
                />
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
                    rules={[{ required: true, message: "Please enter rating" }]}
                  >
                    <InputNumber style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item
                    label="Reasoning"
                    name={[subKey, "reasoning"]}
                    rules={[
                      { required: true, message: "Please enter reasoning" },
                    ]}
                  >
                    <Input.TextArea
                      rows={7}
                      style={{ fontSize: 16 }}
                      ref={(el) =>
                        (textAreaRefs.current[`${subKey}.reasoning`] = el)
                      }
                      onFocus={() =>
                        setActiveTextAreaField(`${subKey}.reasoning`)
                      }
                    />
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
