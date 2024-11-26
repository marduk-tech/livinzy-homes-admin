import { Form, Input, Modal } from "antd";
import { useCreateProjectMutation } from "../hooks/project-hooks";

interface JsonProjectImportProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export function JsonProjectImport({
  isModalOpen,
  setIsModalOpen,
}: JsonProjectImportProps) {
  const [form] = Form.useForm();
  const createProject = useCreateProjectMutation();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const projectData = JSON.parse(values.jsonData);

      await createProject.mutateAsync(projectData);
      form.resetFields();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  return (
    <Modal
      title="Create Project From JSON"
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Save"
      okButtonProps={{ loading: createProject.isPending }}
    >
      <Form form={form}>
        <Form.Item
          name="jsonData"
          rules={[
            { required: true, message: "Please input JSON data" },
            {
              validator: (_, value) => {
                try {
                  if (value) JSON.parse(value);
                  return Promise.resolve();
                } catch (error) {
                  return Promise.reject("Please enter valid JSON");
                }
              },
            },
          ]}
        >
          <Input.TextArea rows={10} placeholder="Paste project JSON here..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
