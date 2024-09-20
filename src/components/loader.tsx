import { Flex, Spin, SpinProps } from "antd";

export interface LoaderProps extends SpinProps {}

export function Loader({ size = "large", ...props }: LoaderProps) {
  return (
    <Flex align="center" justify="center" style={{ height: "200px" }}>
      <Spin size={size} {...props} />
    </Flex>
  );
}
