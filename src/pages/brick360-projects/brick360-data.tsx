import { useParams } from "react-router-dom";
import { useFetchLvnzyProjectById } from "../../hooks/lvnzyprojects-hooks";
import { Loader } from "../../components/common/loader";
import ReactJson from "react-json-view";
import { useEffect, useState } from "react";

export function Brick360Data() {
  const { brick360ProjectId } = useParams();

  const { data: brick360Project, isLoading: brick360ProjectIsLoading } =
    useFetchLvnzyProjectById(brick360ProjectId!);

    const [formattedData, setFormattedData] = useState<any>();

    useEffect(() => {
        
        if (brick360Project) {
            const fData = JSON.parse(JSON.stringify(brick360Project));
            delete fData._id;
            delete fData.__v;
            delete fData.createdAt;
            delete fData.score;
            delete fData.slug;
            setFormattedData(fData);
        }

    })

  if (brick360ProjectIsLoading) {
    return <Loader></Loader>;
  }
  return (
    <ReactJson
      src={formattedData!}
      theme="rjv-default"
      displayDataTypes={false}
      displayObjectSize={true}
      enableClipboard={true}
      collapsed={1}
      sortKeys={true}
      name="brickfiData"
      indentWidth={4}
      style={{ fontSize: "14px" }}
    />
  );
}
