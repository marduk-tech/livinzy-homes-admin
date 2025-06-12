import { Divider, Flex, Tooltip, Typography } from "antd";
import { Project } from "../../types/Project";

type Props = {
  details: {
    minimumUnitCost: number;
    minimumUnitSize: number;
    configurations: [
      {
        config: string;
        cost: number;
      }
    ];
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

    return (
      <Tooltip
        title={
          <Flex vertical>
            {record.info.unitConfigWithPricing.map((config: any) => {
              return (
                <Typography.Text style={{color:"white"}}>
                  {config.config}: ₹{config.price}
                </Typography.Text>
              );
            })}
          </Flex>
        }
      >
        <Typography.Text>
          ₹{rate.toLocaleString()}
        </Typography.Text>
      </Tooltip>
    );
  }
