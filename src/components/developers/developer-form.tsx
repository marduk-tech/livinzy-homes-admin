import { DeleteOutlined, LinkOutlined, PlusOutlined } from "@ant-design/icons";
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
        externalWebsites: data.externalWebsites || [],
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
        </Form>
      </Modal>
    </>
  );
}
