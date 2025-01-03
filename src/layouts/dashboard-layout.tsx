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
                  src="/logo-name.png"
                  style={{ height: 35, width: "auto" }}
                ></Image>
              </Link>

              <Flex justify="center" align="center" gap={15}>
                <Link to="/chroma-docs">
                  <Button>Chroma Docs</Button>
                </Link>
                <Link to="/global-knowledge">
                  <Button>Global Knowledge</Button>
                </Link>
                <Link to="/livindex-places">
                  <Button>LivIndex Places</Button>
                </Link>
                <Link to="/livindex-scores">
                  <Button>Livindex Scores</Button>
                </Link>
                <Link to="/ask">
                  <Button icon={<RobotOutlined />}>Ask Liv</Button>
                </Link>

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
