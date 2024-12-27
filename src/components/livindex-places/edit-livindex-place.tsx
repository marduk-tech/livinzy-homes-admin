import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Slider } from "antd";
import { useState } from "react";
import {
  useCreateLivindexPlaceMutation,
  useUpdateLivindexPlaceMutation,
} from "../../hooks/livindex-places-hook";
import {
  LivIndexDrivers,
  LivIndexPlacesSuperFactors,
  LivIndexStatuses,
} from "../../libs/constants";
import { ILivIndexPlaces, PlaceType } from "../../types";

interface EditLivIndexPlaceProps {
  selectedPlace?: ILivIndexPlaces | undefined;
  type: PlaceType;
}

export function EditLivIndexPlace({ selectedPlace }: EditLivIndexPlaceProps) {
  const [form] = Form.useForm();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const updateLivindexPlace = useUpdateLivindexPlaceMutation({
    placeId: selectedPlace?._id as string,
  });

  const createLivindexPlace = useCreateLivindexPlaceMutation();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (selectedPlace) {
        await updateLivindexPlace.mutateAsync({ placeData: values });
      } else {
        await createLivindexPlace.mutateAsync({ ...values });
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
      {selectedPlace ? (
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
        title={selectedPlace ? `Edit ${selectedPlace.type}` : "Create Place"}
        open={isEditModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={selectedPlace ? "Save" : "Create"}
        okButtonProps={{
          loading:
            updateLivindexPlace.isPending || createLivindexPlace.isPending,
        }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
          initialValues={selectedPlace ? selectedPlace : undefined}
          preserve={false}
        >
          <Form.Item name="driver">
            <Select
              showSearch
              placeholder="Select driver"
              options={LivIndexDrivers.map((type) => {
                return { value: type, label: type };
              })}
            />
          </Form.Item>
          <Form.Item name="status">
            <Select
              showSearch
              placeholder="Select status"
              options={LivIndexStatuses.map((type) => {
                return { value: type, label: type };
              })}
            />
          </Form.Item>
          <Form.Item name="name" label="Place Name" required>
            <Input placeholder="Place Name" />
          </Form.Item>

          <Form.Item
            name={["parameters", "proximityThreshold"]}
            label="Proximity Threshold"
            rules={[
              {
                type: "number",
                transform: (value) => Number(value),
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }
                  if (value < 0 || value > 100 || value % 1 !== 0) {
                    return Promise.reject(
                      new Error("Value must be an integer between 0 and 100!")
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="Proximity Threshold" type="number" />
          </Form.Item>

          <Form.Item
            name={["parameters", "triggerCoefficient"]}
            label="Trigger Coefficient"
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

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Description" />
          </Form.Item>

          {selectedPlace?.type !== "road" && (
            <Form.Item name={["location", "mapLink"]} label="Google Map Link">
              <Input.TextArea
                rows={3}
                placeholder="https://www.google.com/maps/place/Sannidhi+Eco+Farms+by+Swasya+Living/@12.8767065,75.8351101,17z/data=!3m1!4b1!4m6!3m5!1s0x3ba523834bb2aa09:0xcd51110d857ac773!8m2!3d12.8767065!4d75.837685!16s%2Fg%2F11strc1vcp?entry=tts&g_ep=EgoyMDI0MDkyMi4wKgBIAVAD"
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
