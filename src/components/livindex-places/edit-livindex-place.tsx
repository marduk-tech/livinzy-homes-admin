import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal } from "antd";
import { useState } from "react";
import {
  useCreateProjectMutation,
  useUpdateLivindexPlaceMutation,
} from "../../hooks/livindex-places-hook";
import { ILivIndexPlaces, PlaceType } from "../../types";

interface EditLivIndexPlaceProps {
  selectedPlace?: ILivIndexPlaces | undefined;
  type: PlaceType;
}

export function EditLivIndexPlace({
  selectedPlace,
  type,
}: EditLivIndexPlaceProps) {
  const [form] = Form.useForm();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const updateLivindexPlace = useUpdateLivindexPlaceMutation({
    placeId: selectedPlace?._id as string,
    type: type,
  });

  const createLivindexPlace = useCreateProjectMutation({
    type: type,
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (selectedPlace) {
        await updateLivindexPlace.mutateAsync({ placeData: values });
      } else {
        await createLivindexPlace.mutateAsync({ ...values, type: type });
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
          Add {type}
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
          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="name" label="Place Name" required>
            <Input placeholder="Place Name" />
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
