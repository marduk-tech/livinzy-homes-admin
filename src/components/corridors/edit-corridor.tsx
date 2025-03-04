import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Typography,
} from "antd";
import { useState } from "react";
import {
  useCreateCorridorMutation,
  useUpdateCorridorMutation,
} from "../../hooks/corridors-hooks";
import { ICorridor } from "../../types/corridor";

interface EditCorridorProps {
  selectedCorridor?: ICorridor;
}

export function EditCorridor({ selectedCorridor }: EditCorridorProps) {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createCorridorMutation = useCreateCorridorMutation();
  const updateCorridorMutation = useUpdateCorridorMutation({
    corridorId: selectedCorridor?._id || "",
    enableToasts: true,
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (selectedCorridor) {
        updateCorridorMutation.mutate({
          corridorData: values,
        });
      } else {
        createCorridorMutation.mutate(values);
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleOpen = () => {
    if (selectedCorridor) {
      form.setFieldsValue(selectedCorridor);
    }
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  return (
    <>
      <Button
        type={selectedCorridor ? "default" : "primary"}
        onClick={handleOpen}
        icon={selectedCorridor ? <EditOutlined /> : <PlusOutlined />}
      >
        {selectedCorridor ? "" : "Add Corridor"}
      </Button>

      <Modal
        title={
          <Typography.Title level={4}>
            {selectedCorridor ? "Edit Corridor" : "Add New Corridor"}
          </Typography.Title>
        }
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleClose}
        confirmLoading={
          createCorridorMutation.isPending || updateCorridorMutation.isPending
        }
      >
        <Form
          form={form}
          layout="vertical"
          style={{ maxHeight: "60vh", overflowY: "auto" }}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter corridor name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Aliases" name="aliases">
            <Select
              mode="tags"
              style={{ width: "100%" }}
              placeholder="Add aliases"
              open={false}
            />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Location">
            <Input.Group>
              <Form.Item
                name={["location", "lat"]}
                rules={[{ required: true, message: "Latitude is required" }]}
                style={{ display: "inline-block", width: "calc(50% - 8px)" }}
              >
                <InputNumber placeholder="Latitude" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name={["location", "lng"]}
                rules={[{ required: true, message: "Longitude is required" }]}
                style={{
                  display: "inline-block",
                  width: "calc(50% - 8px)",
                  margin: "0 8px",
                }}
              >
                <InputNumber
                  placeholder="Longitude"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Input.Group>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
