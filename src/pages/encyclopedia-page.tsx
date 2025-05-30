import { Button, Flex, Modal, Typography } from "antd";
import { useState } from "react";
import { CreateGlobalKnowladgeForm } from "../components/global-knowledge/create-global-knowledge-form";
import { GlobalKnowladgeList } from "../components/global-knowledge/global-knowledge-list";

export function EncyclopediaPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
  };

  return (
    <>
      <Typography.Title level={5}>Encyclopedia</Typography.Title>

      <Flex justify="flex-end" style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAddClick}>
          Add Knowledge
        </Button>
      </Flex>

      <GlobalKnowladgeList />

      <Modal
        title="Add Knowledge"
        open={isAddModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={800}
      >
        <CreateGlobalKnowladgeForm onSuccess={handleModalClose} />
      </Modal>
    </>
  );
}
