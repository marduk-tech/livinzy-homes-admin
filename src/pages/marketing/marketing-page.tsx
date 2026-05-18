import { Tabs } from "antd";
import { EmailReachoutPage } from "./email-reachout-page";
import { GlossaryPage } from "./glossary-page";
import { UserFeedbackPage } from "./user-feedback-page";

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
    {
      key: "userFeedback",
      label: "User Feedback",
      children: <UserFeedbackPage />,
    },
  ];

  return (
    <>
      <Tabs defaultActiveKey="glossary" items={tabs} />
    </>
  );
}
