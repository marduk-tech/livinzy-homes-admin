import { Button, Flex, Modal, Typography } from "antd";
import { useState } from "react";
import { GlossaryForm } from "../../components/marketing/glossary-form";
import { GlossaryList } from "../../components/marketing/glossary-list";

export function GlossaryPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
  };

  return (
    <>
      <Typography.Title level={5}>Marketing - Glossary</Typography.Title>

      <Flex justify="flex-end" style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAddClick}>
          Add Glossary Term
        </Button>
      </Flex>

      <GlossaryList />

      <Modal
        title="Add Glossary Term"
        open={isAddModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={800}
      >
        <GlossaryForm onSuccess={handleModalClose} />
      </Modal>
    </>
  );
}
