import { Flex, Spin, SpinProps } from "antd";

export interface LoaderProps extends SpinProps {
  height?: number | string;
}

export function Loader({ size = "large", height = 200, ...props }: LoaderProps) {
  return (
    <Flex align="center" justify="center" style={{ height }}>
      <Spin size={size} {...props} />
    </Flex>
  );
}
