import { Tabs, Typography } from "antd";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BackendScriptsTab } from "./backend-scripts-tab";
import { PricingUpdatesTab } from "./pricing-updates-tab";
import { RunTab } from "./run-tab";
import { RunsTab } from "./runs-tab";
import { SchedulesTab } from "./schedules-tab";

export function ManageScriptsPage() {
  // ?run=<id> opens that run on the Runs tab - a link to it from anything
  // that stored the run id (e.g. a project's priceChecks.runId)
  const [searchParams, setSearchParams] = useSearchParams();
  const runParam = searchParams.get("run") || undefined;
  const [activeTab, setActiveTab] = useState(runParam ? "runs" : "backend");
  const [selectedJobId, setSelectedJobIdState] = useState<string | undefined>(
    runParam,
  );

  // keeps ?run= in step with the open run, so it can be copied as a link
  const setSelectedJobId = (jobId?: string) => {
    setSelectedJobIdState(jobId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (jobId) next.set("run", jobId);
        else next.delete("run");
        return next;
      },
      { replace: true },
    );
  };

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
      key: "schedules",
      label: "Schedules",
      children: <SchedulesTab onStarted={handleStarted} />,
    },
    {
      key: "runs",
      label: "Runs",
      children: (
        <RunsTab
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
          onStarted={handleStarted}
        />
      ),
    },
    {
      key: "pricing-updates",
      label: "Pricing Updates",
      children: <PricingUpdatesTab onOpenRun={handleStarted} />,
    },
  ];

  return (
    <>
      <Typography.Title level={4}>Manage Scripts</Typography.Title>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
    </>
  );
}
