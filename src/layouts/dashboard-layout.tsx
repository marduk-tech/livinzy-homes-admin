import { RobotOutlined } from "@ant-design/icons";
import { Button, Flex, Image, Layout } from "antd";
import React from "react";
import { Link, Outlet } from "react-router-dom";
import { CustomErrorBoundary } from "../components/common/custom-error-boundary";
import { UserDropDown } from "../components/common/user-dropdown";
import { useDevice } from "../hooks/use-device";

const { Header, Content } = Layout;

export const DashboardLayout: React.FC = () => {
  const { isMobile } = useDevice();

  return (
    <CustomErrorBoundary>
      <Layout style={{ minHeight: "100vh" }}>
        <Layout>
          <Header style={{ padding: "8px 24px", background: "transparent" }}>
            <Flex align="center" justify="space-between">
              <Link to="/">
                <Image
                  preview={false}
                  src="/brickfi-logo.png"
                  style={{ height: 20, width: "auto" }}
                ></Image>
              </Link>

              <Flex justify="center" align="center" gap={15}>
                <UserDropDown />
              </Flex>
            </Flex>
          </Header>
          <Content style={{ margin: isMobile ? 24 : 48 }}>
            {/* <Menu mode="horizontal" items={menuItems} /> */}
            <CustomErrorBoundary>
              <Outlet />
            </CustomErrorBoundary>
          </Content>
        </Layout>
      </Layout>
    </CustomErrorBoundary>
  );
};
