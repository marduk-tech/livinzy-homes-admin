import { Tabs } from "antd";
import { EmailReachoutPage } from "./email-reachout-page";
import { EmailTemplatesPage } from "./email-templates-page";
import { GlossaryPage } from "./glossary-page";
import { SeoOptimizePage } from "./seo-optimize-page";
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
      key: "emailTemplates",
      label: "Email Templates",
      children: <EmailTemplatesPage />,
    },
    {
      key: "userFeedback",
      label: "User Feedback",
      children: <UserFeedbackPage />,
    },
    {
      key: "seoOptimize",
      label: "SEO Optimize",
      children: <SeoOptimizePage />,
    },
  ];

  return (
    <>
      <Tabs defaultActiveKey="glossary" items={tabs} />
    </>
  );
}
