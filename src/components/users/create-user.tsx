import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select } from "antd";
import { useState } from "react";
import { useGetAllProjects } from "../../hooks/project-hooks";
import { useCreateUserMutation } from "../../hooks/user-hooks";
import { CreateSavedLvnzyProject, CreateUserPayload } from "../../types/user";

export function CreateUser() {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createUserMutation = useCreateUserMutation();
  const { data: projects, isLoading: projectsLoading } = useGetAllProjects();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const savedProject: CreateSavedLvnzyProject = {
        collectionName: "default",
        projects: values.projectIds,
      };

      const payload: CreateUserPayload = {
        mobile: `91${values.mobile}`,
        countryCode: "91",
        profile: {
          name: values.name,
        },
        savedLvnzyProjects: [savedProject],
      };

      await createUserMutation.mutateAsync(payload);
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
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsModalOpen(true)}
      >
        Add User
      </Button>

      <Modal
        title="Create New User"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Create"
        confirmLoading={createUserMutation.isPending}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter user name" }]}
          >
            <Input placeholder="Enter user name" />
          </Form.Item>

          <Form.Item
            name="mobile"
            label="Mobile Number"
            rules={[
              { required: true, message: "Please enter mobile number" },
              {
                pattern: /^[0-9]{10}$/,
                message: "Please enter valid 10 digit mobile number",
              },
            ]}
          >
            <Input placeholder="Enter 10 digit mobile number" maxLength={10} />
          </Form.Item>

          <Form.Item
            name="projectIds"
            label="Projects"
            rules={[
              { required: true, message: "Please select at least one project" },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select projects"
              loading={projectsLoading}
              showSearch
              filterOption={(
                input: string,
                option?: { label: string; value: string }
              ) => {
                if (!option?.label) return false;
                return option.label.toLowerCase().includes(input.toLowerCase());
              }}
              options={projects?.map((project) => ({
                label: project.info.name,
                value: project._id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
