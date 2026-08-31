import { Tabs, Typography } from "antd";
import { useState } from "react";
import { BackendScriptsTab } from "./backend-scripts-tab";
import { RunTab } from "./run-tab";
import { RunsTab } from "./runs-tab";

export function ManageScriptsPage() {
  const [activeTab, setActiveTab] = useState("backend");
  const [selectedJobId, setSelectedJobId] = useState<string>();

  const handleStarted = (jobId: string) => {
    setSelectedJobId(jobId);
    setActiveTab("runs");
  };

  const tabs = [
    {
      key: "backend",
      label: "Backend Scripts",
      children: <BackendScriptsTab />,
    },
    {
      key: "run",
      label: "Scripts Repo",
      children: <RunTab onStarted={handleStarted} />,
    },
    {
      key: "runs",
      label: "Runs",
      children: (
        <RunsTab selectedJobId={selectedJobId} onSelectJob={setSelectedJobId} />
      ),
    },
  ];

  return (
    <>
      <Typography.Title level={4}>Manage Scripts</Typography.Title>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
    </>
  );
}
