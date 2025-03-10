import { Tabs } from "antd";
import { ChromaDocsList } from "../components/chroma-docs/chroma-docs-list";
import { PROJECTS_CHROMA_COLLECTION, AREA_CHROMA_COLLECTION } from "../libs/constants";

export default function ChromaDocsPage() {
  return (
    <Tabs defaultActiveKey="1">
      <Tabs.TabPane tab="Projects" key="1">
        <ChromaDocsList collectionName={PROJECTS_CHROMA_COLLECTION} />
      </Tabs.TabPane>
      <Tabs.TabPane tab="Area" key="2">
        <ChromaDocsList collectionName={AREA_CHROMA_COLLECTION} />
      </Tabs.TabPane>
    </Tabs>
  );
}
