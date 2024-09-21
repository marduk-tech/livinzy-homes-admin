import { Link, Outlet } from "@tanstack/react-router";
import { Flex, Image, Layout } from "antd";
import React from "react";
import { CustomErrorBoundary } from "../components/common/custom-error-boundary";
import { useDevice } from "../hooks/use-device";

const { Header, Content } = Layout;

export const DashboardLayout: React.FC = () => {
  const { isMobile } = useDevice();

  return (
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

            {/* <UserDropDown /> */}
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
  );
};
