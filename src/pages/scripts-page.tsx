import { LoadingOutlined } from "@ant-design/icons";
import { Button, Flex, List, message, Tag, Typography } from "antd";
import { useGetScripts, useRunScript } from "../hooks/scripts-hooks";
import { Loader } from "../components/common/loader";

export function ScriptsPage() {
  const { data: scripts, isLoading, refetch } = useGetScripts();
  const runScript = useRunScript();

  const handleRun = (scriptName: string) => {
    refetch();
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
    <>
      <Typography.Title level={4}>Scripts</Typography.Title>
      <List
        loading={isLoading}
        bordered
        dataSource={scripts}
        renderItem={(script) => (
          <List.Item
            actions={[
              <Button
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
    </>
  );
}
