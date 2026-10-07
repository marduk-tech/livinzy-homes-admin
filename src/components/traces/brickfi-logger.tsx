import { Tabs } from "antd";
import { Brick360ThreadsTab } from "./brick360-threads-tab";
import { BrickchatThreadsTab } from "./brickchat-threads-tab";
import { FeedbackTab } from "./feedback-tab";

export function BrickfiLogger() {
  return (
    <Tabs defaultActiveKey="brickchat-threads">
      <Tabs.TabPane tab="BrickChat Threads" key="brickchat-threads">
        <BrickchatThreadsTab />
      </Tabs.TabPane>

      <Tabs.TabPane tab="Brick360 Threads" key="brick360-threads">
        <Brick360ThreadsTab />
      </Tabs.TabPane>

      <Tabs.TabPane tab="Feedback" key="feedback">
        <FeedbackTab />
      </Tabs.TabPane>
    </Tabs>
  );
}
