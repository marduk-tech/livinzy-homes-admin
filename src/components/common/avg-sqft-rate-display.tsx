import { Tooltip, Typography } from "antd";
import { Project } from "../../types/Project";

type Props = {
  details: {
    minimumUnitCost: number;
    minimumUnitSize: number;
  };
  record: Project;
  projects?: Project[];
};

export const AVGSQFTRateDisplay: React.FC<Props> = ({
  details,
  record,
  projects,
}) => {
  if (!details?.minimumUnitCost || !details?.minimumUnitSize) {
    return "-";
  }
  const cost = details.minimumUnitCost;
  const size = details.minimumUnitSize;
  if (isNaN(cost) || isNaN(size) || size <= 0) {
    return "-";
  }
  const rate = Math.round(cost / size);

  //  all rates for the same corridor
  const corridorRates: number[] = [];
  const recordCorridors = (record.info.corridors || []) as Array<{
    corridorId: string;
    haversineDistance: number;
  }>;

  if (projects && recordCorridors.length > 0) {
    projects.forEach((project) => {
      const costingDetails = record.info.refinedContent.costingDetails as unknown as
        | {
          minimumUnitCost: number;
          minimumUnitSize: number;
          }
        | undefined;

      if (!costingDetails?.minimumUnitCost || !costingDetails?.minimumUnitSize) {
        return;
      }

      // check if project shares any corridor with current record
      const projectCorridors = (project.info.corridors || []) as Array<{
        corridorId: string;
        haversineDistance: number;
      }>;

      const hasCommonCorridor = projectCorridors.some(
        (c1: { corridorId: string }) =>
          recordCorridors.some(
            (c2: { corridorId: string }) => c1.corridorId === c2.corridorId
          )
      );

      if (hasCommonCorridor) {
        const projectCostingDetails = project.info?.refinedContent.costingDetails as unknown as
          | {
              singleUnitCost: string;
              singleUnitSize: string;
            }
          | undefined;

        if (!projectCostingDetails) return;

        const pCost = Number(projectCostingDetails.singleUnitCost);
        const pSize = Number(projectCostingDetails.singleUnitSize);
        if (!isNaN(pCost) && !isNaN(pSize) && pSize > 0) {
          corridorRates.push(Math.round(pCost / pSize));
        }
      }
    });
  }

  //  median calculation if we have rates
  if (corridorRates.length > 0) {
    const sortedRates = [...corridorRates].sort((a, b) => a - b);
    const mid = Math.floor(sortedRates.length / 2);
    const medianRate =
      sortedRates.length % 2 === 0
        ? (sortedRates[mid - 1] + sortedRates[mid]) / 2
        : sortedRates[mid];

    // check if current rate deviates more than 30% from median
    const deviation = (rate - medianRate) / medianRate;

    if (deviation <= -0.25 ) {
      return (
        <Tooltip
          title={`Corridor median: ₹${medianRate.toLocaleString()}/sqft`}
        >
          <Typography.Text type="danger">
            ₹{rate.toLocaleString()}
          </Typography.Text>
        </Tooltip>
      );
    }

    return (
      <Tooltip title={`Corridor median: ₹${medianRate.toLocaleString()}/sqft`}>
        <Typography.Text>₹{rate.toLocaleString()}</Typography.Text>
      </Tooltip>
    );
  }

  return <Typography.Text>₹{rate.toLocaleString()}</Typography.Text>;
};
