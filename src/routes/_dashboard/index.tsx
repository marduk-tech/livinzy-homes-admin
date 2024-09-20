import { createFileRoute } from "@tanstack/react-router";
import { Tabs } from "antd";
import TabPane from "antd/es/tabs/TabPane";

export const Route = createFileRoute("/_dashboard/")({
  component: () => <HomePage />,
});

function HomePage() {
  return (
    <Tabs defaultActiveKey="1">
      <TabPane tab="Designers" key="1"></TabPane>
      <TabPane tab="Projects" key="2"></TabPane>
      <TabPane tab="Meta" key="3"></TabPane>
      <TabPane tab="Fixture Materials" key="4"></TabPane>
    </Tabs>
  );
}
