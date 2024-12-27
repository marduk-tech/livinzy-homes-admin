import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Slider } from "antd";
import { useState } from "react";
import {
  useCreateLivindexDriverMutation,
  useUpdateLivindexDriverMutation,
} from "../../hooks/livindex-drivers-hooks";
import { LivIndexMegaDrivers } from "../../libs/constants";
import { ILivIndexDriver } from "../../types";

interface EditLivIndexDriverProps {
  selectedDriver?: ILivIndexDriver | undefined;
}

export function EditLivIndexDriver({
  selectedDriver,
}: EditLivIndexDriverProps) {
  const [form] = Form.useForm();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const updateLivindexDriver = useUpdateLivindexDriverMutation({
    driverId: selectedDriver?._id as string,
  });

  const createLivindexDriver = useCreateLivindexDriverMutation();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (selectedDriver) {
        await updateLivindexDriver.mutateAsync({ driverData: values });
      } else {
        await createLivindexDriver.mutateAsync({ ...values });
        form.resetFields();
      }

      setIsEditModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = () => {
    setIsEditModalOpen(false);
  };

  return (
    <>
      {selectedDriver ? (
        <Button
          type="default"
          shape="default"
          icon={<EditOutlined />}
          onClick={() => {
            setIsEditModalOpen(true);
          }}
        ></Button>
      ) : (
        <Button
          type="primary"
          shape="default"
          icon={<PlusOutlined />}
          onClick={() => {
            setIsEditModalOpen(true);
          }}
        >
          Add New
        </Button>
      )}

      <Modal
        title={
          selectedDriver ? `Edit ${selectedDriver.driverName}` : "Create Driver"
        }
        open={isEditModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={selectedDriver ? "Save" : "Create"}
        okButtonProps={{
          loading:
            updateLivindexDriver.isPending || createLivindexDriver.isPending,
        }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
          initialValues={selectedDriver ? selectedDriver : undefined}
          preserve={false}
        >
          <Form.Item name="driverName" label="Driver Name" required>
            <Input placeholder="Driver Name" />
          </Form.Item>

          <Form.Item name="megaDriver" label="Mega Driver" required>
            <Select
              showSearch
              placeholder="Select driver"
              options={LivIndexMegaDrivers.map((driver) => {
                return { value: driver, label: driver };
              })}
            />
          </Form.Item>

          <Form.Item
            name="defaultProximityThreshold"
            label="Proximity Threshold"
            rules={[
              {
                required: false,
                message: "Please set a proximity threshold!",
              },
            ]}
          >
            <Input placeholder="10" type="number" />
          </Form.Item>

          <Form.Item
            name="defaultTriggerCoefficient"
            label="Trigger Coefficient"
            rules={[
              {
                required: false,
                message: "Please set a trigger coefficient!",
              },
            ]}
          >
            <Slider
              min={0.2}
              max={1}
              step={0.01}
              marks={{
                0.2: "0.2",
                1: "1",
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
