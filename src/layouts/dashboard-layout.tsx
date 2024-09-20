import { Outlet } from "@tanstack/react-router";
import { Flex, Image, Layout } from "antd";
import React from "react";

const { Header, Content } = Layout;

export const DashboardLayout: React.FC = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Header style={{ padding: "8px 24px", background: "transparent" }}>
          <Flex align="center" justify="space-between">
            <Image
              src="/logo-name.png"
              style={{ height: 35, width: "auto" }}
            ></Image>

            {/* <UserDropDown /> */}
          </Flex>
        </Header>
        <Content style={{ margin: "60px 60px" }}>
          {/* <Menu mode="horizontal" items={menuItems} /> */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
