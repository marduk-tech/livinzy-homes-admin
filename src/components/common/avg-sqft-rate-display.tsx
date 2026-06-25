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
  const validConfigs = (record.info.unitConfigWithPricing ?? []).filter(
    (c) => c.price > 0 && (c.sizeBuiltup ?? 0) > 0
  );
  if (validConfigs.length === 0) return "-";
  const rate = Math.round(
    validConfigs.reduce((sum, c) => sum + c.price / c.sizeBuiltup!, 0) / validConfigs.length
  );

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
