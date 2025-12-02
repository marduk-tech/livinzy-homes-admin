import { Modal, Button, Flex, Typography, Spin, Image } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface WatermarkPreviewModalProps {
  visible: boolean;
  originalImageUrl: string;
  processedImageUrl: string | null;
  loading: boolean;
  onApprove: () => void;
  onReject: () => void;
}

const WatermarkPreviewModal: React.FC<WatermarkPreviewModalProps> = ({
  visible,
  originalImageUrl,
  processedImageUrl,
  loading,
  onApprove,
  onReject,
}) => {
  return (
    <Modal
      open={visible}
      title="Watermark Removal Preview"
      onCancel={onReject}
      width={900}
      footer={
        <Flex justify="end" gap={8}>
          <Button
            icon={<CloseOutlined />}
            onClick={onReject}
            disabled={loading}
          >
            Reject
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={onApprove}
            disabled={loading || !processedImageUrl}
          >
            Approve & Replace
          </Button>
        </Flex>
      }
    >
      <Flex vertical gap={16} style={{ padding: "16px 0" }}>
        {loading && (
          <Flex justify="center" align="center" style={{ minHeight: 200 }}>
            <Flex vertical align="center" gap={16}>
              <Spin size="large" />
              <Text>Processing image, please wait...</Text>
            </Flex>
          </Flex>
        )}

        {!loading && processedImageUrl && (
          <Flex gap={16} wrap="wrap" justify="center">
            <Flex vertical gap={8} style={{ flex: 1, minWidth: 300 }}>
              <Title level={5}>Original Image</Title>
              <Image
                src={originalImageUrl}
                alt="Original"
                style={{
                  borderRadius: 8,
                  border: "1px solid #d9d9d9",
                  width: "100%",
                  maxHeight: 400,
                  objectFit: "contain",
                }}
                preview={false}
              />
            </Flex>

            <Flex vertical gap={8} style={{ flex: 1, minWidth: 300 }}>
              <Title level={5}>Processed Image</Title>
              <Image
                src={processedImageUrl}
                alt="Processed"
                style={{
                  borderRadius: 8,
                  border: "1px solid #52c41a",
                  width: "100%",
                  maxHeight: 400,
                  objectFit: "contain",
                }}
                preview={false}
              />
            </Flex>
          </Flex>
        )}
      </Flex>
    </Modal>
  );
};

export default WatermarkPreviewModal;
