import { Empty, Flex, Modal, Spin, Typography } from "antd";
import ReactJson from "react-json-view";

import { useGetReraProjectByReraNumber } from "../../hooks/rera-projects-hooks";

interface ReraDetailsModalProps {
  open: boolean;
  onClose: () => void;
  reraNumber?: string;
  projectName?: string;
}

// The full RERA project record (looked up by registration number) as JSON
export function ReraDetailsModal({
  open,
  onClose,
  reraNumber,
  projectName,
}: ReraDetailsModalProps) {
  const trimmedReraNumber = reraNumber?.trim();
  const {
    data: reraProject,
    isLoading,
    isError,
  } = useGetReraProjectByReraNumber(open ? trimmedReraNumber : undefined);

  const displayProjectName =
    reraProject?.projectDetails?.projectName || projectName || "Project";

  const renderBody = () => {
    if (!trimmedReraNumber) {
      return (
        <Empty description="No RERA number on this project" style={{ marginTop: 40 }} />
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
          description="Could not load the RERA project"
          style={{ marginTop: 40 }}
        />
      );
    }

    return (
      <div style={{ padding: 10, backgroundColor: "#f8f9fa" }}>
        <ReactJson
          src={reraProject}
          name="reraProject"
          theme="rjv-default"
          displayDataTypes={false}
          displayObjectSize={true}
          enableClipboard={true}
          collapsed={1}
          sortKeys={true}
          indentWidth={4}
          style={{ fontSize: 14 }}
        />
      </div>
    );
  };

  return (
    <Modal
      title={
        <Flex vertical gap={2}>
          <Typography.Text strong>
            RERA Project Details — {displayProjectName}
          </Typography.Text>
          {trimmedReraNumber && (
            <Typography.Text type="secondary" style={{ fontWeight: "normal" }}>
              RERA Number: {trimmedReraNumber}
            </Typography.Text>
          )}
        </Flex>
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
