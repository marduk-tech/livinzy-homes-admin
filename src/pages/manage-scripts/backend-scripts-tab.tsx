import { LoadingOutlined } from "@ant-design/icons";
import { Button, Flex, List, message, Tag, Typography } from "antd";
import { useGetScripts, useRunScript } from "../../hooks/scripts-hooks";

export function BackendScriptsTab() {
  const { data: scripts, isLoading } = useGetScripts();
  const runScript = useRunScript();

  const handleRun = (scriptName: string) => {
    runScript.mutate(scriptName, {
      onSuccess: (data) => {
        message.success(data.message);
      },
      onError: (error: any) => {
        message.error(
          error.response?.data?.message || `Failed to run "${scriptName}"`,
        );
      },
    });
  };

  return (
    <Flex vertical gap={12}>
      <Typography.Text type="secondary">
        These run in-process on the main API, not the script server — the request
        blocks until the script finishes, so there is no job id, no logs and no
        stop. The Running tag refreshes on a 30s poll.
      </Typography.Text>

      <List
        loading={isLoading}
        bordered
        dataSource={scripts}
        renderItem={(script) => (
          <List.Item
            actions={[
              <Button
                key="run"
                disabled={script.isRunning}
                type="primary"
                onClick={() => handleRun(script.scriptName)}
              >
                Run
              </Button>,
            ]}
          >
            <Flex gap={16}>
              <Typography.Text>{script.scriptName}</Typography.Text>
              {script.isRunning && (
                <Tag icon={<LoadingOutlined spin />} color="processing">
                  Running
                </Tag>
              )}
            </Flex>
          </List.Item>
        )}
      />
    </Flex>
  );
}
