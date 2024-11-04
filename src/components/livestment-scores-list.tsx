import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Col,
  Flex,
  Modal,
  Row,
  Table,
  TableColumnType,
  Typography,
} from "antd";
import { useState } from "react";
import { queries } from "../libs/queries";
import { Project } from "../types/Project";

export function LivestmentScoresList() {
  const { data: projects, isLoading: projectIsLoading } = useQuery(
    queries.getAllProjects()
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    projectName: "",
    title: "",
    description: "",
  });

  const handleCancel = () => {
    setIsModalOpen(false);
    setModalData({
      projectName: "",
      title: "",
      description: "",
    });
  };

  const handleMoreClick = (
    projectName: string,
    title: string,
    description: string
  ) => {
    setIsModalOpen(true);
    console.log(title, description);

    setModalData({
      projectName,
      title,
      description,
    });
  };

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
      sorter: (a: any, b: any) => {
        return (
          (b.livestment ? b.livestment.livestmentScore : 0) -
          (a.livestment ? a.livestment.livestmentScore : 0)
        );
      },
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

        const score =
          record?.livestment?.metroCityScore?.score?.toFixed(1) || "";

        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
              expanded: false,
              onExpand: (_, info) =>
                handleMoreClick(
                  record.metadata.name,
                  `MetroCityScore Score: ${score}`,
                  placeNames
                ),
            }}
          >
            {`${score} ${placeNames && `- ${placeNames}`}`}
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

        const score =
          record?.livestment?.tier2CityScore?.score?.toFixed(1) || "";

        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
              expanded: false,
              onExpand: (_, info) =>
                handleMoreClick(
                  record.metadata.name,
                  `Tier2 City Score: ${score}`,
                  placeNames
                ),
            }}
          >
            {`${score} ${placeNames && `- ${placeNames}`}`}
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
        const score =
          record?.livestment?.touristCityScore?.score?.toFixed(1) || "";
        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
              expanded: false,
              onExpand: (_, info) =>
                handleMoreClick(
                  record.metadata.name,
                  `Tourist Score: ${score}`,
                  placeNames
                ),
            }}
          >
            {`${score} ${placeNames && `- ${placeNames}`}`}
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

        const score = record?.livestment?.schoolsScore?.score?.toFixed(1) || "";

        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
              expanded: false,
              onExpand: (_, info) =>
                handleMoreClick(
                  record.metadata.name,
                  `Schools Score: ${score}`,
                  placeNames
                ),
            }}
          >
            {`${score} ${placeNames && `- ${placeNames}`}`}
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

        const score =
          record?.livestment?.hospitalsScore?.score?.toFixed(1) || "";

        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
              expanded: false,
              onExpand: (_, info) =>
                handleMoreClick(
                  record.metadata.name,
                  `Hospital Score: ${score}`,
                  placeNames
                ),
            }}
          >
            {`${score} ${placeNames && `- ${placeNames}`} `}{" "}
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

        const score = record?.livestment?.airportScore?.score?.toFixed(1) || "";

        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
              expanded: false,
              onExpand: (_, info) =>
                handleMoreClick(
                  record.metadata.name,
                  `Airport Score: ${score}`,
                  placeNames
                ),
            }}
          >
            {`${score} ${placeNames && `- ${placeNames}`}`}
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
        const score = record?.livestment?.roadsScore?.score?.toFixed(1) || "";
        return (
          <Typography.Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: "more",
              expanded: false,
              onExpand: (_, info) =>
                handleMoreClick(
                  record.metadata.name,
                  `Roads Score: ${score}`,
                  placeNames
                ),
            }}
          >
            {`${score} ${placeNames && `- ${placeNames}`}`}
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
        pagination={false}
        dataSource={projects}
        columns={columns}
        rowKey="_id"
        loading={projectIsLoading}
      />

      <Modal
        title={modalData.projectName}
        open={isModalOpen}
        onOk={handleCancel}
        onCancel={handleCancel}
        footer={[
          <Button type="primary" key="back" onClick={handleCancel}>
            Okay
          </Button>,
        ]}
      >
        <Typography.Paragraph
          style={{
            maxHeight: 500,
            overflow: "auto",
          }}
        >
          <br /> <strong>{modalData.title} </strong> <br /> <br />{" "}
          {modalData.description}
        </Typography.Paragraph>
      </Modal>
    </>
  );
}
