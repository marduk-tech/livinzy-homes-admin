import { Button, Flex, Form, Input, Select, Typography } from "antd";
import { useFetchCorridors } from "../../hooks/corridors-hooks";
import { useCreateGlobalKnowledgeMutation } from "../../hooks/global-knowledge-hooks";

export function CreateGlobalKnowladgeForm() {
  const [form] = Form.useForm();

  const createGlobalKnowledge = useCreateGlobalKnowledgeMutation();
  const { data: corridors = [] } = useFetchCorridors();

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      await createGlobalKnowledge.mutateAsync({ ...values });

      form.resetFields();
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <Form form={form} layout="vertical">
        <Form.Item name="content">
          <Input.TextArea rows={20} />
        </Form.Item>

        <Form.Item name="sources" label="Sources">
          <Input.TextArea rows={3} placeholder="Enter sources" />
        </Form.Item>

        <Form.Item name="corridors" label="Corridors">
          <Select
            mode="multiple"
            placeholder="Select corridors"
            style={{ width: "100%" }}
            options={corridors.map((corridor) => ({
              label: corridor.name,
              value: corridor._id,
            }))}
          />
        </Form.Item>

        <Flex gap={20} justify="flex-end">
          <Button
            onClick={() => {
              form.resetFields();
            }}
          >
            Reset
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={createGlobalKnowledge.isPending}
          >
            Embed
          </Button>
        </Flex>
      </Form>
    </>
  );
}
