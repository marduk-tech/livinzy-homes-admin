import { Tabs } from "antd";
import { useNavigate } from "react-router-dom";
import { Brick360ThreadsTab } from "./brick360-threads-tab";
import { BrickchatThreadsTab } from "./brickchat-threads-tab";
import { EvalsTab } from "./evals-tab";
import {
  BRICKFI_LOGGER_PATHS,
  BRICKFI_LOGGER_TABS,
  BrickfiLoggerTab,
} from "./brickfi-logger-paths";
import { FeedbackTab } from "./feedback-tab";
import { PromptsTab } from "./prompts-tab";
import { RevisionsTab } from "./revisions-tab";

// the active tab comes from the URL (see brickfi-logger-paths.ts), and
// switching tabs navigates - so each tab has its own linkable path
export function BrickfiLogger({ tab }: { tab: BrickfiLoggerTab }) {
  const navigate = useNavigate();
  return (
    <Tabs
      activeKey={tab}
      onChange={(key) =>
        navigate(BRICKFI_LOGGER_PATHS.tab(key as BrickfiLoggerTab))
      }
    >
      <Tabs.TabPane tab="BrickChat Threads" key={BRICKFI_LOGGER_TABS.threads}>
        <BrickchatThreadsTab />
      </Tabs.TabPane>

      {/* <Tabs.TabPane tab="Brick360 Threads" key="brick360-threads">
        <Brick360ThreadsTab />
      </Tabs.TabPane> */}

      <Tabs.TabPane tab="Feedback" key={BRICKFI_LOGGER_TABS.feedback}>
        <FeedbackTab />
      </Tabs.TabPane>

      <Tabs.TabPane tab="Prompts" key={BRICKFI_LOGGER_TABS.prompts}>
        <PromptsTab />
      </Tabs.TabPane>

      <Tabs.TabPane tab="Revisions" key={BRICKFI_LOGGER_TABS.revisions}>
        <RevisionsTab />
      </Tabs.TabPane>

      <Tabs.TabPane tab="Evals" key={BRICKFI_LOGGER_TABS.evals}>
        <EvalsTab />
      </Tabs.TabPane>
    </Tabs>
  );
}
