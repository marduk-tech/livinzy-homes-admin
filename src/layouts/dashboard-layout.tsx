import { Flex, Image, Layout } from "antd";
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

              <UserDropDown />
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
