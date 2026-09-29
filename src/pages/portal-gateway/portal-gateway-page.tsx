import { Tabs, Typography } from "antd";
import { useState } from "react";
import { ConfigTab } from "./config-tab";
import { OverviewTab } from "./overview-tab";
import { ProxiesTab } from "./proxies-tab";
import { ScrapesTab } from "./scrapes-tab";
import { TryUrlTab } from "./try-url-tab";

export function PortalGatewayPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { key: "overview", label: "Overview", children: <OverviewTab /> },
    { key: "proxies", label: "Proxies", children: <ProxiesTab /> },
    { key: "scrapes", label: "Recent scrapes", children: <ScrapesTab /> },
    { key: "config", label: "Config", children: <ConfigTab /> },
    { key: "try", label: "Try a URL", children: <TryUrlTab /> },
  ];

  return (
    <>
      <Typography.Title level={4}>Portal Gateway</Typography.Title>
      <Typography.Paragraph type="secondary">
        Unblocks real-estate portals (housing.com, …) for the search pipeline. Sessions are minted in Camoufox
        profiles on the browser manager and kept warm, one per proxy.
      </Typography.Paragraph>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} destroyInactiveTabPane />
    </>
  );
}
