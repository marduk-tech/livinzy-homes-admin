import { useQuery } from "@tanstack/react-query";
import { Col, Row, Table, TableColumnType, Typography } from "antd";
import { queries } from "../libs/queries";
import { Project } from "../types/Project";

export function LivestmentScoresList() {
  const { data: projects, isLoading: projectIsLoading } = useQuery(
    queries.getAllProjects()
  );

  const columns: TableColumnType<Project>[] = [
    {
      title: "Project Name",
      dataIndex: ["metadata", "name"],
      key: "name",
    },

    {
      title: "Livestment Score",
      dataIndex: ["livestment", "livestmentScore"],
      key: "livestmentScore",
      render: (livestmentScore: number) => livestmentScore?.toFixed(2) || "",
    },

    {
      title: "MetroCityScore Score",
      dataIndex: ["livestment", "metroCityScore", "score"],
      key: "metroCityScore",
      render: (metroCityScore: number, record) => {
        const placeNames =
          record?.livestment?.metroCityScore?.placesList
            ?.map((place) => place.name)
            .join(", ") || "";

        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
            }}
          >
            {`${record?.livestment?.metroCityScore?.score?.toFixed(1) || ""} ${
              placeNames && `- ${placeNames}`
            }`}
          </Typography.Paragraph>
        );
      },
      width: 300,
    },

    {
      title: "Tier2 City Score",
      dataIndex: ["livestment", "tier2CityScore", "score"],
      key: "tier2CityScore",
      render: (tier2CityScore: number, record) => {
        const placeNames =
          record?.livestment?.tier2CityScore?.placesList
            ?.map((place) => place.name)
            .join(", ") || "";

        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
            }}
          >
            {`${record?.livestment?.tier2CityScore?.score?.toFixed(1) || ""} ${
              placeNames && `- ${placeNames}`
            }`}
          </Typography.Paragraph>
        );
      },
      width: 300,
    },

    {
      title: "Tourist City Score",
      dataIndex: ["livestment", "touristCityScore", "score"],
      key: "touristCityScore",
      render: (touristCityScore: number, record) => {
        const placeNames =
          record?.livestment?.touristCityScore?.placesList
            ?.map((place) => place.name)
            .join(", ") || "";

        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
            }}
          >
            {`${
              record?.livestment?.touristCityScore?.score?.toFixed(1) || ""
            } ${placeNames && `- ${placeNames}`}`}
          </Typography.Paragraph>
        );
      },
      width: 300,
    },

    {
      title: "Schools Score",
      dataIndex: ["livestment", "schoolsScore", "score"],
      key: "schoolsScore",
      render: (schoolsScore: number, record) => {
        const placeNames =
          record?.livestment?.schoolsScore?.placesList
            ?.map((place) => place.name)
            .join(", ") || "";

        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
            }}
          >
            {`${record?.livestment?.schoolsScore?.score?.toFixed(1) || ""} ${
              placeNames && `- ${placeNames}`
            }`}
          </Typography.Paragraph>
        );
      },
      width: 300,
    },

    {
      title: "Hospitals Score",
      dataIndex: ["livestment", "hospitalsScore", "score"],
      key: "hospitalsScore",
      render: (hospitalsScore: number, record) => {
        const placeNames =
          record?.livestment?.hospitalsScore?.placesList
            ?.map((place) => place.name)
            .join(", ") || "";

        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
            }}
          >
            {`${record?.livestment?.hospitalsScore?.score?.toFixed(1) || ""} ${
              placeNames && `- ${placeNames}`
            }`}
          </Typography.Paragraph>
        );
      },
      width: 300,
    },

    {
      title: "Airport Score",
      dataIndex: ["livestment", "airportScore", "score"],
      key: "airportScore",
      render: (airportScore: number, record) => {
        const placeNames =
          record?.livestment?.airportScore?.placesList
            ?.map((place) => place.name)
            .join(", ") || "";

        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
            }}
          >
            {`${record?.livestment?.airportScore?.score?.toFixed(1) || ""} ${
              placeNames && `- ${placeNames}`
            }`}
          </Typography.Paragraph>
        );
      },
      width: 300,
    },

    {
      title: "Roads Score",
      dataIndex: ["livestment", "roadsScore", "score"],
      key: "roadsScore",
      render: (roadsScore: number, record) => {
        const placeNames =
          record?.livestment?.roadsScore?.placesList
            ?.map((place) => place.name)
            .join(", ") || "";

        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
            }}
          >
            {`${record?.livestment?.roadsScore?.score?.toFixed(1) || ""} ${
              placeNames && `- ${placeNames}`
            }`}
          </Typography.Paragraph>
        );
      },
      width: 300,
    },
  ];

  return (
    <>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20, padding: "0 10px" }}
      >
        <Col>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Livestment Scores
          </Typography.Title>
        </Col>
        <Col></Col>
      </Row>

      <Table
        dataSource={projects}
        columns={columns}
        rowKey="_id"
        loading={projectIsLoading}
      />
    </>
  );
}
