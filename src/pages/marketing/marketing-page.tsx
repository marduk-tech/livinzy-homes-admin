import { Tabs } from "antd";
import { EmailReachoutPage } from "./email-reachout-page";
import { GlossaryPage } from "./glossary-page";

export function MarketingPage() {
  const tabs = [
    {
      key: "glossary",
      label: "Glossary",
      children: <GlossaryPage />,
    },
    {
      key: "emailReachout",
      label: "Email Reachouts",
      children: <EmailReachoutPage />,
    },
  ];

  return (
    <>
      <Tabs defaultActiveKey="glossary" items={tabs} />
    </>
  );
}
