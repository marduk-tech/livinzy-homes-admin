import { Tabs } from "antd";
import TabPane from "antd/es/tabs/TabPane";
import { LivindexFutureInfraList } from "../components/livindex-places/livindex-futureinfra-list";
import { LivindexHospitalList } from "../components/livindex-places/livindex-hospital-list";
import { LivindexRoadsList } from "../components/livindex-places/livindex-roads-list";
import { LivindexSchoolList } from "../components/livindex-places/livindex-school-list";

export function LivindexPlacesPage() {
  return (
    <div>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Schools" key="1">
          <LivindexSchoolList />
        </TabPane>
        <TabPane tab="Hospitals" key="2">
          <LivindexHospitalList />
        </TabPane>
        <TabPane tab="Future Infra" key="3">
          <LivindexFutureInfraList />
        </TabPane>
        <TabPane tab="Roads" key="4">
          <LivindexRoadsList />
        </TabPane>
      </Tabs>
    </div>
  );
}
