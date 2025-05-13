import { Form, Input, Modal } from "antd";
import { useEffect } from "react";
import { useUpdateDeveloperMutation } from "../../hooks/developer-hooks";
import { Developer } from "../../types/developer";

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  developer: Developer;
  projectIndex?: number;
}

const ProjectForm = ({
  isOpen,
  onClose,
  developer,
  projectIndex,
}: ProjectFormProps) => {
  const [form] = Form.useForm();
  const updateMutation = useUpdateDeveloperMutation();

  useEffect(() => {
    if (
      projectIndex !== undefined &&
      developer.developerProjects[projectIndex]
    ) {
      const project = developer.developerProjects[projectIndex];
      form.setFieldsValue(project);
    }
  }, [form, developer, projectIndex]);

  const handleSubmit = async (values: Developer["developerProjects"][0]) => {
    try {
      const updatedProjects = [...developer.developerProjects];
      if (projectIndex !== undefined) {
        // Edit existing project
        updatedProjects[projectIndex] = values;
      } else {
        // Add new project
        updatedProjects.push(values);
      }

      await updateMutation.mutateAsync({
        developerId: developer._id,
        developerData: {
          name: developer.name,
          developerProjects: updatedProjects,
        },
      });
      handleCancel();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={projectIndex !== undefined ? "Edit Project" : "Add New Project"}
      open={isOpen}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      width={600}
      style={{ top: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          name: "",
          reraNumber: "",
          promoterName: "",
          primaryProject: "",
        }}
      >
        <Form.Item
          name="name"
          label="Project Name"
          rules={[{ required: true, message: "Please enter project name" }]}
        >
          <Input placeholder="Enter project name" />
        </Form.Item>

        <Form.Item name="reraNumber" label="RERA Number">
          <Input placeholder="Enter RERA number" />
        </Form.Item>

        <Form.Item name="promoterName" label="Promoter Name">
          <Input placeholder="Enter promoter name" />
        </Form.Item>

        <Form.Item
          name="primaryProject"
          label="Primary Project"
          style={{ marginBottom: 0 }}
        >
          <Input placeholder="Enter primary project" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProjectForm;
