import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Flex,
  Input,
  Row,
  Select,
  Table,
  TableColumnType,
  Tabs,
  Typography,
} from "antd";
import { useState } from "react";

const { Search } = Input;
import { useFetchCorridors } from "../../hooks/corridors-hooks";
import {
  useDeletePlaceMutation,
  useFetchLivindexPlaces,
} from "../../hooks/livindex-places-hook";
import { useDevice } from "../../hooks/use-device";
import { ILivIndexPlaces } from "../../types";
import { ColumnSearch } from "../common/column-search";
import { DeletePopconfirm } from "../common/delete-popconfirm";
import { CorridorsList } from "../corridors/corridors-list";
import { EditLivIndexPlace } from "./edit-livindex-place";
import { EditPlaceDetails } from "./edit-place-details";
import { FONT_SIZES } from "../../theme/font-sizes";
import { COLORS } from "../../theme/colors";

export function LivindexList() {
  const { isMobile } = useDevice();
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [driverTypeFilter, setDriverTypeFilter] = useState<string>("");
  const { data, isLoading, isError } = useFetchLivindexPlaces({
    keyword: searchKeyword,
    driverType: driverTypeFilter,
    limit: 50,
    sort: { updatedAt: -1 }
  });

  const { data: corridorsData, isLoading: corridorLoading } =
    useFetchCorridors();

  const deletePlaceMutation = useDeletePlaceMutation();

  const handleDelete = async ({
    placeId,
  }: {
    placeId: string;
  }): Promise<void> => {
    deletePlaceMutation.mutate({ placeId: placeId });
  };

  const columns: TableColumnType<ILivIndexPlaces>[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ...ColumnSearch("name"),
    },
    {
      title: "Driver",
      dataIndex: "driver",
      key: "driver",
      ...ColumnSearch("driver"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      ...ColumnSearch("status"),
    },
    {
      title: "Corridors",
      dataIndex: "corridors",
      key: "corridors",
      width: "400px",
      render: (corridors: Array<{ corridorId: string }>) => {
        if (!corridors?.length || !corridorsData?.length) return "-";

        return (
          corridors
            .map((corridor) => {
              const corridorDetails = corridorsData.find(
                (c) => c._id === corridor.corridorId
              );
              return corridorDetails?.name;
            })
            .filter(Boolean)
            .join(", ") || "-"
        );
      },
    },
    {
      title: "",
      align: "right",
      dataIndex: "_id",
      key: "_id",

      render: (id: string, record) => {
        return (
          <Flex gap={isMobile ? 5 : 15} justify="end">
            <EditPlaceDetails selectedPlace={record} />

            <EditLivIndexPlace selectedPlace={record} />

            <DeletePopconfirm
              handleOk={() => handleDelete({ placeId: id })}
              isLoading={deletePlaceMutation.isPending}
              title="Delete"
              description="Are you sure you want to delete this place"
            >
              <Button
                type="default"
                shape="default"
                icon={<DeleteOutlined />}
              ></Button>
            </DeletePopconfirm>
          </Flex>
        );
      },
    },
  ];

  if (isError) return <div>Error fetching data</div>;

  return (
    <>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20, padding: "0 10px" }}
      >
        <Col>
          <Flex gap={16} align="flex-end">
            <Search
              loading={isLoading}
              placeholder="Search drivers by name or type"
              onSearch={(value: string) => {
                setSearchKeyword(value);
              }}
              enterButton="Search"
              style={{ width: 300 }}
            />
            <Select
              onChange={(value) => {
                setDriverTypeFilter(value);
              }}
              placeholder="Filter by driver type"
              style={{ width: 200 }}
              options={[
                { label: "All", value: "all" },
                { label: "Highway", value: "highway" },
                { label: "Lake", value: "lake" },
                { label: "School", value: "school" },
                { label: "University", value: "university" },
                { label: "Hospital", value: "hospital" },
                { label: "Leisure", value: "leisure" },
                { label: "Commercial", value: "commercial" },
                { label: "Food", value: "food" },
                { label: "Industrial Hi-Tech", value: "industrial-hitech" },
                { label: "Industrial General", value: "industrial-general" },
                { label: "Airport", value: "airport" },
                { label: "Transit", value: "transit" },
                { label: "Micro Market", value: "micro-market" },
              ]}
            />
            <Typography.Text style={{fontSize: FONT_SIZES.SUB_TEXT, color: COLORS.textColorLight}}>Showing 10 recently updated items</Typography.Text>
          </Flex>
        </Col>
        <Col>
          <EditLivIndexPlace />
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading || corridorLoading}
        rowKey="_id"
      />
    </>
  );
}
