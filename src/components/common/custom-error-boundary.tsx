import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Alert, Button, Space } from "antd";
import { AxiosError } from "axios";
import { ErrorBoundary } from "react-error-boundary";

export function CustomErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary fallbackRender={ErrorBoundaryFallback}>
      {children}
    </ErrorBoundary>
  );
}

export function ErrorBoundaryFallback({
  error,
  resetErrorBoundary,
}: {
  error: AxiosError<any>;
  resetErrorBoundary: () => void;
}) {
  const errorMessage =
    error.response?.data.message || error.message || "Something went wrong";

  return (
    <Alert
      message="Oops, something went wrong!"
      description={errorMessage}
      type="error"
      showIcon
      icon={<ExclamationCircleOutlined />}
      action={
        <Space>
          <Button onClick={resetErrorBoundary} size="small" type="primary">
            Try again
          </Button>
          <Button onClick={resetErrorBoundary} size="small">
            Report Issue
          </Button>
        </Space>
      }
    />
  );
}
