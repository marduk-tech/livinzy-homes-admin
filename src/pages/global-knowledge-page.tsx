import { Col, Row, Typography } from "antd";
import { CreateGlobalKnowladgeForm } from "../components/global-knowledge/create-global-knowledge-form";
import { GlobalKnowladgeList } from "../components/global-knowledge/global-knowledge-list";

export function GlobalKnowledgePage() {
  return (
    <>
      <Typography.Title level={5}>Encyclopedia</Typography.Title>
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <CreateGlobalKnowladgeForm />
        </Col>
        <Col xs={24} lg={12}>
          <GlobalKnowladgeList />
        </Col>
      </Row>
    </>
  );
}
