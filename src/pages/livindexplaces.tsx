import { Tabs } from "antd";
import TabPane from "antd/es/tabs/TabPane";
import { LivindexFutureInfraList } from "../components/livindex-places/livindex-futureinfra-list";
import { LivindexHospitalList } from "../components/livindex-places/livindex-hospital-list";
import { LivindexRoadsList } from "../components/livindex-places/livindex-roads-list";
import { LivindexSchoolList } from "../components/livindex-places/livindex-school-list";
import { LivindexList } from "../components/livindex-places/livindex-list";

export function LivindexPlacesPage() {
  return (
    <LivindexList></LivindexList>
  );
}
