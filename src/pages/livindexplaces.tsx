import { Tabs } from "antd";
import { LivindexDriversList } from "../components/livindex-drivers/livindex-drivers-list";
import { LivindexList } from "../components/livindex-places/livindex-list";

export function LivindexPlacesPage() {
  return (
    <Tabs defaultActiveKey="1">
      <Tabs.TabPane tab="Drivers" key="1">
        <LivindexList />
      </Tabs.TabPane>
      <Tabs.TabPane tab="Driver Config" key="2">
        <LivindexDriversList />
      </Tabs.TabPane>
    </Tabs>
  );
}
