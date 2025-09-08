import { Tabs } from "antd";
import { CorridorsList } from "../components/corridors/corridors-list";
import { DevelopersList } from "../components/developers/developers-list";
import { LivindexDriversList } from "../components/livindex-drivers/livindex-drivers-list";
import { LivindexList } from "../components/livindex-places/livindex-list";
import { ReraProjectsList } from "../components/rera-projects/rera-projects-list";

export function BrickfiConfig() {
  return (
    <Tabs defaultActiveKey="1">
      <Tabs.TabPane tab="Drivers" key="1">
        <LivindexList />
      </Tabs.TabPane>
      {/* <Tabs.TabPane tab="Driver Config" key="2">
        <LivindexDriversList />
      </Tabs.TabPane> */}
      <Tabs.TabPane tab="Developers" key="4">
        <DevelopersList />
      </Tabs.TabPane>
      <Tabs.TabPane tab="Rera Projects" key="5">
        <ReraProjectsList />
      </Tabs.TabPane>
       <Tabs.TabPane tab="Corridors" key="3">
        <CorridorsList />
      </Tabs.TabPane>
    </Tabs>
  );
}
