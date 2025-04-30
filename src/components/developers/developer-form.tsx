import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import {
  useCreateDeveloperMutation,
  useUpdateDeveloperMutation,
} from "../../hooks/developer-hooks";
import { CreateDeveloperPayload, Developer } from "../../types/developer";

interface DeveloperFormProps {
  data?: Developer;
  developers: Developer[];
  onClose?: () => void;
}

export function DeveloperForm({ data, onClose }: DeveloperFormProps) {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const createMutation = useCreateDeveloperMutation();
  const updateMutation = useUpdateDeveloperMutation();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        name: data.name,
        developerProjects:
          data.developerProjects.length > 0
            ? data.developerProjects
            : [
                {
                  name: "",
                  reraNumber: "",
                  promoterName: "",
                  primaryProject: "",
                },
              ],
      });
      setIsModalVisible(true);
    }
  }, [data, form]);

  const handleSubmit = async (values: CreateDeveloperPayload) => {
    try {
      if (data) {
        await updateMutation.mutateAsync({
          developerId: data._id,
          developerData: values,
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
        width={800}
        style={{ top: 20 }}
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
                  developerProjects: [
                    {
                      name: "",
                      reraNumber: "",
                      promoterName: "",
                      primaryProject: "",
                    },
                  ],
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

          {/* developer projects edit form */}
          {/* <div style={{ marginBottom: 16 }}>
            <Typography.Text strong>Developer Projects</Typography.Text>
          </div>

          <div
            style={{
              maxHeight: "calc(100vh - 300px)",
              overflowY: "auto",
              padding: "0 4px",
            }}
          >
            <Form.List name="developerProjects">
              {(fields, { add, remove }) => (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {fields.map((field) => (
                    <div
                      key={field.key}
                      style={{
                        background: "#f5f5f5",
                        padding: 16,
                        borderRadius: 8,
                      }}
                    >
                      <Space align="baseline" style={{ marginBottom: 8 }}>
                        <Typography.Text>
                          Project #{field.name + 1}
                        </Typography.Text>
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          />
                        )}
                      </Space>

                      <Form.Item
                        {...field}
                        label="Project Name"
                        name={[field.name, "name"]}
                        rules={[
                          {
                            required: true,
                            message: "Please enter project name",
                          },
                        ]}
                      >
                        <Input placeholder="Enter project name" />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label="RERA Number"
                        name={[field.name, "reraNumber"]}
                      >
                        <Input placeholder="Enter RERA number" />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label="Promoter Name"
                        name={[field.name, "promoterName"]}
                      >
                        <Input placeholder="Enter promoter name" />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label="Primary Project"
                        name={[field.name, "primaryProject"]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="Enter primary project" />
                      </Form.Item>
                    </div>
                  ))}
                </div>
              )}
            </Form.List>
          </div>

          <div style={{ marginTop: 16 }}>
            <Button
              type="dashed"
              onClick={() =>
                form.getFieldValue("developerProjects")?.length < 10 &&
                form.setFieldsValue({
                  developerProjects: [
                    ...(form.getFieldValue("developerProjects") || []),
                    {
                      name: "",
                      reraNumber: "",
                      promoterName: "",
                      primaryProject: "",
                    },
                  ],
                })
              }
              block
              icon={<PlusOutlined />}
              disabled={form.getFieldValue("developerProjects")?.length >= 10}
            >
              Add Project
            </Button>
          </div> */}
        </Form>
      </Modal>
    </>
  );
}
