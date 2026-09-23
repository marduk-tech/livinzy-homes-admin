import {
  DeleteOutlined,
  LinkOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Switch,
  Typography,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { axiosApiInstance } from "../../libs/axios-api-Instance";
import {
  useCreateDeveloperMutation,
  useUpdateDeveloperMutation,
} from "../../hooks/developer-hooks";
import {
  CreateDeveloperPayload,
  Developer,
  DeveloperFile,
  UpdateDeveloperPayload,
} from "../../types/developer";

// Uploads selected files to the shared upload endpoint, returns name+url
// pairs to drop straight into the "files" Form.List.
async function uploadDeveloperFiles(files: File[]): Promise<DeveloperFile[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file, file.name));

  const { data } = await axiosApiInstance.post("upload/multiple", formData, {
    headers: { "client-type": "admin" },
  });

  const results: { Location: string }[] = data?.results || [];
  return results.map((r, i) => ({ name: files[i].name, url: r.Location }));
}

interface DeveloperFormProps {
  data?: Developer;
  developers: Developer[];
  onClose?: () => void;
}

export function DeveloperForm({ data, onClose }: DeveloperFormProps) {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filesUploading, setFilesUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateDeveloperMutation();
  const updateMutation = useUpdateDeveloperMutation();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        name: data.name,
        externalWebsites: data.externalWebsites || [],
        files: data.files || [],
        brkfiScore: { score: data.brkfiScore?.score },
        brkfiStatus: { isPartner: data.brkfiStatus?.isPartner || false },
      });
      setIsModalVisible(true);
    }
  }, [data, form]);

  const handleSubmit = async (values: CreateDeveloperPayload) => {
    try {
      if (data) {
        // findByIdAndUpdate replaces a nested object wholesale rather than
        // deep-merging it, so sending just `{ brkfiScore: { score } }` would
        // wipe out the reasoning already generated for brkfiScore - merge
        // the edited leaf field onto the existing sub-objects instead
        const developerData: UpdateDeveloperPayload = {
          ...values,
          brkfiScore: {
            ...data.brkfiScore,
            score: values.brkfiScore?.score,
          },
          brkfiStatus: {
            ...data.brkfiStatus,
            isPartner: values.brkfiStatus?.isPartner || false,
          },
        };
        await updateMutation.mutateAsync({
          developerId: data._id,
          developerData,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      handleCancel();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    onClose?.();
  };

  return (
    <>
      {!data && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Add Developer
        </Button>
      )}

      <Modal
        title={data ? "Edit Developer" : "Create New Developer"}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={handleCancel}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={
            data
              ? undefined
              : {
                  name: "",
                  externalWebsites: [],
                  files: [],
                }
          }
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter developer name" }]}
          >
            <Input placeholder="Enter developer name" />
          </Form.Item>

          {data && (
            <Space size="large" style={{ marginBottom: 24 }}>
              <Form.Item
                name={["brkfiScore", "score"]}
                label="BrkFi Score"
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={0} max={100} />
              </Form.Item>
              <Form.Item
                name={["brkfiStatus", "isPartner"]}
                label="BrkFi Partner"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch />
              </Form.Item>
            </Space>
          )}

          <Form.List name="externalWebsites">
            {(fields, { add, remove }) => (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  width: "100%",
                }}
              >
                <Typography.Text strong>External Websites</Typography.Text>

                {fields.map((field, index) => (
                  <div
                    key={field.key}
                    style={{
                      display: "flex",
                      gap: 8,
                      width: "100%",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <Form.Item
                        {...field}
                        validateTrigger={["onChange", "onBlur"]}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message:
                              "Please input website URL or delete this field",
                          },
                          {
                            type: "url",
                            message: "Please enter a valid URL",
                          },
                        ]}
                      >
                        <Input
                          placeholder="https://example.com"
                          prefix={<LinkOutlined />}
                        />
                      </Form.Item>
                    </div>
                    <DeleteOutlined
                      onClick={() => remove(index)}
                      style={{ flexShrink: 0, marginTop: 5 }}
                    />
                  </div>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  style={{ width: "100%", marginTop: 8 }}
                >
                  Add Website
                </Button>
              </div>
            )}
          </Form.List>

          <Form.List name="files">
            {(fields, { add, remove }) => (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  width: "100%",
                  marginTop: 24,
                }}
              >
                <Typography.Text strong>Files</Typography.Text>

                {fields.map((field, index) => (
                  <div
                    key={field.key}
                    style={{
                      display: "flex",
                      gap: 8,
                      width: "100%",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <Form.Item
                        {...field}
                        name={[field.name, "name"]}
                        validateTrigger={["onChange", "onBlur"]}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: "Please enter a name for this file",
                          },
                        ]}
                      >
                        <Input placeholder="File name" />
                      </Form.Item>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Form.Item name={[field.name, "url"]} noStyle>
                        <Input placeholder="File URL" disabled />
                      </Form.Item>
                    </div>
                    <DeleteOutlined
                      onClick={() => remove(index)}
                      style={{ flexShrink: 0, marginTop: 5 }}
                    />
                  </div>
                ))}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const selected = Array.from(e.target.files || []);
                    e.target.value = ""; // allow re-selecting the same file
                    if (!selected.length) return;
                    setFilesUploading(true);
                    try {
                      const uploaded = await uploadDeveloperFiles(selected);
                      uploaded.forEach((file) => add(file));
                    } catch (error) {
                      console.error(error);
                      message.error("Failed to upload file(s)");
                    } finally {
                      setFilesUploading(false);
                    }
                  }}
                />
                <Button
                  type="dashed"
                  icon={<UploadOutlined />}
                  loading={filesUploading}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: "100%", marginTop: 8 }}
                >
                  Upload Files
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
}
