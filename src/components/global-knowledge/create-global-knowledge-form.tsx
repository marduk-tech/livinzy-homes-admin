import { Button, Flex, Form, Input, Typography } from "antd";
import { useCreateGlobalKnowledgeMutation } from "../../hooks/global-knowledge-hooks";

export function CreateGlobalKnowladgeForm() {
  const [form] = Form.useForm();

  const createGlobalKnowledge = useCreateGlobalKnowledgeMutation();

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
