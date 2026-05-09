import { Empty, Flex, Modal, Spin, Typography } from "antd";

import {
  useGetReraProjectById,
  useGetReraProjectByReraNumber,
} from "../../hooks/rera-projects-hooks";
import { ReraDocumentsList } from "../media-tabs/rera-documents-list";

interface ReraDocumentsModalProps {
  open: boolean;
  onClose: () => void;

  reraNumber?: string;
  reraProjectId?: string;
  projectName?: string;
}

export function ReraDocumentsModal({
  open,
  onClose,
  reraNumber,
  reraProjectId,
  projectName,
}: ReraDocumentsModalProps) {
  const trimmedReraNumber = reraNumber?.trim();

  // prefer mongo _id when available; fall back to RERA registration number
  const byId = useGetReraProjectById(reraProjectId || "");
  const byNumber = useGetReraProjectByReraNumber(
    reraProjectId ? undefined : trimmedReraNumber,
  );

  const isLoading = byNumber.isLoading || byId.isLoading;
  const isError = byNumber.isError || byId.isError;
  const reraProject = byNumber.data || byId.data;

  const titleSuffix =
    projectName ||
    reraProject?.projectDetails?.projectName ||
    trimmedReraNumber ||
    "Project";

  const renderBody = () => {
    if (!trimmedReraNumber && !reraProjectId) {
      return (
        <Empty description="No RERA project linked" style={{ marginTop: 40 }} />
      );
    }

    if (isLoading) {
      return (
        <Flex justify="center" align="center" style={{ padding: 40 }}>
          <Spin size="large" />
        </Flex>
      );
    }

    if (isError || !reraProject) {
      return (
        <Empty
          description="Could not load RERA project documents"
          style={{ marginTop: 40 }}
        />
      );
    }

    // pass the populated object so ReraDocumentsList skips its own fetch
    return <ReraDocumentsList reraProjectId={reraProject} />;
  };

  return (
    <Modal
      title={
        <Typography.Text strong>RERA Documents — {titleSuffix}</Typography.Text>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: 1200, top: 40 }}
      styles={{
        body: {
          maxHeight: "calc(80vh - 108px)",
          overflow: "auto",
          padding: 16,
        },
      }}
      destroyOnClose
    >
      {renderBody()}
    </Modal>
  );
}
