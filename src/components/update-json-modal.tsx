import { Button, Modal } from "antd";
import React, { useEffect, useState } from "react";
import ReactJson, { InteractionProps } from "react-json-view";

interface JsonEditorProps {
  initialJson: string;
  onJsonChange: (updatedJson: Record<string, unknown>) => void;
  title?: string;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  initialJson,
  onJsonChange,
  title,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [json, setJson] = useState<any>();

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleEdit = (edit: InteractionProps) => {
    const updatedJson = edit.updated_src as Record<string, unknown>;
    setJson(updatedJson);
  };

  const handleOk = () => {
    onJsonChange(json);
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        type="link"
        onClick={() => {
          setJson(JSON.parse(initialJson));
          setIsModalOpen(true);
        }}
        style={{
          padding: "0px",
        }}
      >
        Edit JSON
      </Button>
      <Modal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
        title={title}
        okText="Update"
        cancelText="Cancel"
        styles={{
          body: {
            maxHeight: "650px",
            overflowY: "auto",
          },
        }}
      >
        <div
          style={{
            marginTop: 20,
          }}
        >
          <ReactJson
            enableClipboard={false}
            src={json}
            onEdit={handleEdit}
            onAdd={handleEdit}
            theme="rjv-default"
            style={{ fontSize: "16px" }}
            displayDataTypes={false}
          />
        </div>
      </Modal>
    </>
  );
};
