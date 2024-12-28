import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Switch } from "antd";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useUpdateLivindexPlaceMutation } from "../../hooks/livindex-places-hook";
import { ILivIndexPlaces } from "../../types";

import { BiDetail } from "react-icons/bi";

interface EditLivIndexPlaceProps {
  selectedPlace: ILivIndexPlaces;
}

export function EditPlaceDetails({ selectedPlace }: EditLivIndexPlaceProps) {
  const [form] = Form.useForm();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const updateLivindexPlace = useUpdateLivindexPlaceMutation({
    placeId: selectedPlace?._id as string,
  });

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      await updateLivindexPlace.mutateAsync({ placeData: values });

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
      <Button
        type="default"
        shape="default"
        icon={<BiDetail />}
        onClick={() => {
          setIsEditModalOpen(true);
        }}
      ></Button>

      <Modal
        title={`Edit ${selectedPlace.name}`}
        open={isEditModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={selectedPlace ? "Save" : "Create"}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
          initialValues={selectedPlace}
          preserve={false}
        >
          <Form.Item name="oneLiner" label="One Liner">
            <Input placeholder="One Liner" />
          </Form.Item>

          <Form.Item name="footfall" label="Footfall">
            <Input placeholder="Footfall" />
          </Form.Item>

          {isPreview && (
            <div
              style={{
                padding: "8px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
                minHeight: "120px",
                backgroundColor: "#f5f5f5",
                maxHeight: "300px",
                overflow: "scroll",
              }}
            >
              <ReactMarkdown>{form.getFieldValue("description")}</ReactMarkdown>
            </div>
          )}

          <Form.Item name="description" label="Description" hidden={isPreview}>
            <Input.TextArea rows={4} placeholder="Description" />
          </Form.Item>

          <div style={{ marginTop: 8 }}>
            <Switch
              checked={isPreview}
              onChange={(checked) => setIsPreview(checked)}
              checkedChildren="Preview"
              unCheckedChildren="Edit"
            />
          </div>
        </Form>
      </Modal>
    </>
  );
}
