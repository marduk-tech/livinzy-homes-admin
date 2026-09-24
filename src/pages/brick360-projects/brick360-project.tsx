import { CheckCircleFilled } from "@ant-design/icons";
import { Button, Flex, Popconfirm, Typography } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { EditScoreDialog } from "../../components/brick360/edit-score-dialog";
import { Loader } from "../../components/common/loader";
import {
  containerStyle,
  HtmlList,
  sectionTitleStyle,
} from "../../components/common/score-html-list";
import {
  useFetchLvnzyProjectById,
  useUpdateLvnzyProject,
} from "../../hooks/lvnzyprojects-hooks";
import { useUpdateProjectMutation } from "../../hooks/project-hooks";
import { LvnzyProject } from "../../types/lvnzy-project";

export function Brick360Full() {
  const { brick360ProjectId } = useParams();

  const { data: brick360Project, isLoading: brick360ProjectIsLoading } =
    useFetchLvnzyProjectById(brick360ProjectId!);

  const [brick360ProjectData, setBrick360ProjectData] =
    useState<LvnzyProject>();

  const updateProjectMutation = useUpdateLvnzyProject();

  const updateOriginalProjectMutation = useUpdateProjectMutation({
    projectId: brick360ProjectData?.originalProjectId?._id || "",
  });

  useEffect(() => {
    if (brick360Project) {
      setBrick360ProjectData(brick360Project);
    }
  }, [brick360Project]);

  const handleSave = () => {
    if (brick360ProjectData) {
      updateProjectMutation.mutate({
        id: brick360ProjectId!,
        payload: brick360ProjectData,
      });
    }
  };

  const isVerified =
    brick360ProjectData?.originalProjectId?.info?.status ===
    "report-verified";

  const handleVerify = () => {
    if (brick360ProjectData?.originalProjectId?._id) {
      updateOriginalProjectMutation.mutate(
        {
          projectData: { info: { status: "report-verified" } } as any,
        },
        {
          onSuccess: () => {
            setBrick360ProjectData((prev) =>
              prev
                ? {
                    ...prev,
                    originalProjectId: {
                      ...prev.originalProjectId,
                      info: {
                        ...prev.originalProjectId?.info,
                        status: "report-verified",
                      },
                    },
                  }
                : prev,
            );
          },
        },
      );
    }
  };

  const scoreParams = [
    {
      key: "property",
      label: "Property",
    },
    { key: "developer", label: "Developer" },
    { key: "areaConnectivity", label: "Area Connectivity" },
    { key: "financials", label: "Financials" },
  ];

  const sections = [
    {
      key: "summary",
      label: "Summary",
      content: (section: any) => (
        <>
          <HtmlList title="Pros" items={section.pros} />
          <HtmlList title="Cons" items={section.cons} />
        </>
      ),
    },
    ...scoreParams.map((param) => {
      return {
        key: param.key,
        label: param.label,
        content: (section: any) => (
          <>
            {Object.entries(section).map(([subKey, subSection]: any) =>
              subKey !== "_id" ? (
                <HtmlList
                  title={subKey}
                  items={subSection.reasoning}
                  rating={subSection.rating}
                ></HtmlList>
              ) : null
            )}
          </>
        ),
      };
    }),
  ];

  if (brick360ProjectIsLoading || !brick360Project) {
    return <Loader></Loader>;
  }
  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto", marginTop: 0 }}>
      <Flex gap={24} align="flex-start">
        <div style={{ width: "75%" }}>
          <Flex justify="space-between" align="center">
            <h1 style={{ margin: 0 }}>{brick360Project.meta.projectName}</h1>
            <Flex gap={8} align="center">
              {isVerified ? (
                <Typography.Text type="success">
                  <CheckCircleFilled /> Verified
                </Typography.Text>
              ) : (
                <Popconfirm
                  title="Mark report as verified"
                  description="Are you sure you want to mark this project's report as verified?"
                  onConfirm={handleVerify}
                  okButtonProps={{
                    loading: updateOriginalProjectMutation.isPending,
                  }}
                >
                  <Button disabled={!brick360ProjectData?.originalProjectId?._id}>
                    Verified
                  </Button>
                </Popconfirm>
              )}
              <Button
                type="primary"
                onClick={handleSave}
                loading={updateProjectMutation.isPending}
              >
                Save
              </Button>
            </Flex>
          </Flex>
          <h3 style={{ margin: 0, marginBottom: 24 }}>
            {brick360Project.meta.oneLiner}
          </h3>
          <Flex
            vertical
            style={{ height: "calc(100vh - 200px)", overflowY: "scroll" }}
          >
            {sections.map(({ key, label, content }) => {
              const sectionData = brick360Project["score"][key];
              if (!sectionData) return null;

              return (
                <div key={key} style={containerStyle}>
                  <Flex justify="space-between" align="center">
                    <div style={sectionTitleStyle}>{label}</div>
                    <EditScoreDialog
                      sectionData={sectionData}
                      sectionKey={key}
                      onSave={(updatedData) => {
                        const newProjectData = { ...brick360ProjectData };
                        newProjectData.score[key] = updatedData;
                        setBrick360ProjectData(newProjectData as LvnzyProject);
                      }}
                    />
                  </Flex>
                  {content(sectionData)}
                </div>
              );
            })}
          </Flex>
        </div>

        <div
          style={{
            width: "25%",
            position: "sticky",
            top: 16,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <iframe
            key={brick360ProjectId}
            src={`https://www.brickfi.in/app/brick360/${brick360ProjectId}`}
            title="Brick360 mobile preview"
            style={{
              width: "100%",
              maxWidth: 400,
              height: "calc(100vh - 140px)",
              border: "1px solid #d9d9d9",
              borderRadius: 16,
            }}
          />
        </div>
      </Flex>
    </div>
  );
}
