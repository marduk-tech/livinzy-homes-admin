import { Tabs } from "antd";
import { ChromaDocsList } from "../components/chroma-docs/chroma-docs-list";
import { CHROMA_COLLECTION, GLOBAL_CHROMA_COLLECTION } from "../libs/constants";

export default function ChromaDocsPage() {
  return (
    <Tabs defaultActiveKey="1">
      <Tabs.TabPane tab="Ask Liv" key="1">
        <ChromaDocsList collectionName={CHROMA_COLLECTION} />
      </Tabs.TabPane>
      <Tabs.TabPane tab="Global Ask Liv " key="2">
        <ChromaDocsList collectionName={GLOBAL_CHROMA_COLLECTION} />
      </Tabs.TabPane>
    </Tabs>
  );
}
