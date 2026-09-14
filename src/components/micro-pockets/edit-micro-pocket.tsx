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
  useCreateMicroPocketMutation,
  useUpdateMicroPocketMutation,
} from "../../hooks/micro-pockets-hooks";
import { IMicroPocket } from "../../types/micro-pocket";

interface EditMicroPocketProps {
  selectedMicroPocket?: IMicroPocket;
}

export function EditMicroPocket({
  selectedMicroPocket,
}: EditMicroPocketProps) {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createMicroPocketMutation = useCreateMicroPocketMutation();
  const updateMicroPocketMutation = useUpdateMicroPocketMutation({
    microPocketId: selectedMicroPocket?._id || "",
    enableToasts: true,
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (selectedMicroPocket) {
        updateMicroPocketMutation.mutate({
          microPocketData: values,
        });
      } else {
        createMicroPocketMutation.mutate(values);
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleOpen = () => {
    if (selectedMicroPocket) {
      form.setFieldsValue(selectedMicroPocket);
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
        type={selectedMicroPocket ? "default" : "primary"}
        onClick={handleOpen}
        icon={selectedMicroPocket ? <EditOutlined /> : <PlusOutlined />}
      >
        {selectedMicroPocket ? "" : "Add Micro Pocket"}
      </Button>

      <Modal
        title={
          <Typography.Title level={4}>
            {selectedMicroPocket ? "Edit Micro Pocket" : "Add New Micro Pocket"}
          </Typography.Title>
        }
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleClose}
        confirmLoading={
          createMicroPocketMutation.isPending ||
          updateMicroPocketMutation.isPending
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
            rules={[
              { required: true, message: "Please enter micro pocket name" },
            ]}
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
