import { Tabs, Typography } from "antd";
import { useState } from "react";
import { IvyHomesTab } from "./ivy-homes-tab";

export function ThirdPartyPage() {
  const [activeTab, setActiveTab] = useState("ivy-homes");

  const tabs = [{ key: "ivy-homes", label: "Ivy Homes", children: <IvyHomesTab /> }];

  return (
    <>
      <Typography.Title level={4}>3rd Party</Typography.Title>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} destroyInactiveTabPane />
    </>
  );
}
