import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Col,
  Flex,
  Modal,
  Row,
  Table,
  TableColumnType,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useState } from "react";
import { queries } from "../libs/queries";
import { COLORS } from "../theme/colors";
import { ExtrinsicDriver, LivIndexScore, Project } from "../types/Project";

export function LivIndexScoresList() {
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
      title: "Score",
      dataIndex: ["livIndexScore", "score"],
      key: "livIndexScore",
      sorter: (a: any, b: any) => {
        return (
          (b.livIndexScore ? b.livIndexScore.score : 0) -
          (a.livIndexScore ? a.livIndexScore.score : 0)
        );
      },
      render: (livIndexScore: number) => livIndexScore?.toFixed(2) || "",
    },

    {
      title: "Extrinsic Drivers",
      dataIndex: ["livIndexScore", "extrinsicDrivers"],
      key: "extrinsicDrivers",
      width: 1000,
      render: (extrinsicDrivers: ExtrinsicDriver[]) => (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {extrinsicDrivers?.map((driver) => {
            if (!driver.place) {
              return null;
            }

            return (
              <Tooltip
                key={driver.place._id}
                title={
                  <Flex vertical gap={0}>
                    <span>{`Distance: ${driver.distance.toFixed(2)}`}</span>

                    <span>{`Proximity Coefficient: ${driver.coefficients.proximityCoeffecient.toFixed(
                      2
                    )}`}</span>

                    <span>{`Trigger Coefficient: ${driver.coefficients.triggerCoeffecient.toFixed(
                      2
                    )}`}</span>

                    <span>{`Timeline Coefficient: ${driver.coefficients.timelineCoeffecient.toFixed(
                      2
                    )}`}</span>

                    <span>{`Count Coefficient: ${driver.coefficients.countCoeffecient.toFixed(
                      2
                    )}`}</span>
                  </Flex>
                }
              >
                <Tag
                  style={{ marginTop: 10, cursor: "pointer" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = COLORS.primaryColor)
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                >
                  {" "}
                  {driver?.place?.name}
                </Tag>
              </Tooltip>
            );
          })}
        </div>
      ),
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
            LivIndex Scores
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
