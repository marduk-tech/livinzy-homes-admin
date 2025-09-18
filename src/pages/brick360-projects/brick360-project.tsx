import { Button, Flex } from "antd";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { EditScoreDialog } from "../../components/brick360/edit-score-dialog";
import { Loader } from "../../components/common/loader";
import {
  useFetchLvnzyProjectById,
  useUpdateLvnzyProject,
} from "../../hooks/lvnzyprojects-hooks";
import { LvnzyProject } from "../../types/lvnzy-project";

const containerStyle: React.CSSProperties = {
  backgroundColor: "#f8f9fa",
  padding: "1.5rem",
  borderRadius: "8px",
  marginBottom: "2rem",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: "bold",
  marginBottom: "1rem",
  textTransform: "capitalize",
};

const subsectionStyle: React.CSSProperties = {
  marginBottom: "1.25rem",
};

const ratingStyle: React.CSSProperties = {
  fontStyle: "italic",
  color: "#555",
};

const HtmlList = ({
  title,
  rating,
  items,
}: {
  title: string;
  rating?: number;
  items: string[];
}) => (
  <div style={subsectionStyle}>
    <h4 style={{ marginBottom: 8 }}>{title}</h4>
    <Flex
      vertical
      style={{ backgroundColor: "#eee", padding: 4, borderRadius: 8 }}
    >
      {rating && <p style={ratingStyle}>Rating: {rating}/100</p>}
      <Flex vertical className="reasoning">
        {items?.map((html, idx) => (
          <div
            key={idx}
            dangerouslySetInnerHTML={{ __html: html }}
            style={{ marginBottom: "0.75rem" }}
          />
        ))}
      </Flex>
    </Flex>
  </div>
);

export function Brick360Full() {
  const { brick360ProjectId } = useParams();

  const { data: brick360Project, isLoading: brick360ProjectIsLoading } =
    useFetchLvnzyProjectById(brick360ProjectId!);

  const [brick360ProjectData, setBrick360ProjectData] =
    useState<LvnzyProject>();

  const updateProjectMutation = useUpdateLvnzyProject();

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
    <div style={{ maxWidth: "1200px", margin: "0 auto", marginTop: 0 }}>
      <Flex justify="space-between" align="center">
        <h1 style={{ margin: 0 }}>{brick360Project.meta.projectName}</h1>
        <Button
          type="primary"
          onClick={handleSave}
          loading={updateProjectMutation.isPending}
        >
          Save
        </Button>
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
  );
}
