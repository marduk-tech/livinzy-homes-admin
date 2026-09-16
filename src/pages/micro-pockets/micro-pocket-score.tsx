import { Button, Flex, Typography } from "antd";
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
  useFetchMicroPocketById,
  useUpdateMicroPocketMutation,
} from "../../hooks/micro-pockets-hooks";
import { IMicroPocket } from "../../types/micro-pocket";

// Same two pillars MicroPocket.score stores (see
// src/api/models/micro-pockets.model.js) - unlike a project's score, there's
// no "summary" pros/cons pillar here.
const scoreParams = [
  { key: "location", label: "Location" },
  { key: "investment", label: "Investment" },
];

const sections = scoreParams.map((param) => ({
  key: param.key,
  label: param.label,
  content: (section: any) => (
    <>
      {Object.entries(section).map(([subKey, subSection]: any) =>
        subKey !== "_id" ? (
          <HtmlList
            key={subKey}
            title={subKey}
            items={subSection?.reasoning}
            rating={subSection?.rating}
          ></HtmlList>
        ) : null
      )}
    </>
  ),
}));

export function MicroPocketScore() {
  const { microPocketId } = useParams();

  const { data: microPocket, isLoading: microPocketIsLoading } =
    useFetchMicroPocketById(microPocketId!);

  const [microPocketData, setMicroPocketData] = useState<IMicroPocket>();

  const updateMicroPocketMutation = useUpdateMicroPocketMutation({
    microPocketId: microPocketId!,
  });

  useEffect(() => {
    if (microPocket) {
      setMicroPocketData(microPocket);
    }
  }, [microPocket]);

  const handleSave = () => {
    if (microPocketData) {
      updateMicroPocketMutation.mutate({ microPocketData });
    }
  };

  if (microPocketIsLoading || !microPocket) {
    return <Loader></Loader>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", marginTop: 0 }}>
      <Flex justify="space-between" align="center">
        <h1 style={{ margin: 0 }}>{microPocket.name}</h1>
        <Button
          type="primary"
          onClick={handleSave}
          loading={updateMicroPocketMutation.isPending}
        >
          Save
        </Button>
      </Flex>
      <h3 style={{ margin: 0, marginBottom: 24 }}>{microPocket.description}</h3>

      {!microPocket.score ? (
        <Typography.Text type="secondary">
          This micro-pocket hasn't been scored yet.
        </Typography.Text>
      ) : (
        <Flex
          vertical
          style={{ height: "calc(100vh - 200px)", overflowY: "scroll" }}
        >
          {sections.map(({ key, label, content }) => {
            const sectionData = microPocket.score[key];
            if (!sectionData) return null;

            return (
              <div key={key} style={containerStyle}>
                <Flex justify="space-between" align="center">
                  <div style={sectionTitleStyle}>{label}</div>
                  <EditScoreDialog
                    sectionData={sectionData}
                    sectionKey={key}
                    onSave={(updatedData) => {
                      const newMicroPocketData = { ...microPocketData };
                      newMicroPocketData.score = {
                        ...newMicroPocketData.score,
                        [key]: updatedData,
                      };
                      setMicroPocketData(newMicroPocketData as IMicroPocket);
                    }}
                  />
                </Flex>
                {content(sectionData)}
              </div>
            );
          })}
        </Flex>
      )}
    </div>
  );
}
