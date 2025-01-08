import { Tabs } from "antd";
import { LivindexDriversList } from "../components/livindex-drivers/livindex-drivers-list";
import { LivindexList } from "../components/livindex-places/livindex-list";

export function LivindexPlacesPage() {
  return (
    <Tabs defaultActiveKey="1">
      <Tabs.TabPane tab="Livindex Places" key="1">
        <LivindexList />
      </Tabs.TabPane>
      <Tabs.TabPane tab="Livindex Drivers" key="2">
        <LivindexDriversList />
      </Tabs.TabPane>
    </Tabs>
  );
}
