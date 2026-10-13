import { BrickfiLogger } from "../components/traces/brickfi-logger";
import { BrickfiLoggerTab } from "../components/traces/brickfi-logger-paths";

export function BrickfiLoggerPage({ tab }: { tab: BrickfiLoggerTab }) {
  return <BrickfiLogger tab={tab} />;
}
