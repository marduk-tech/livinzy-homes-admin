import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Space, Typography } from "antd";
import PhoneInput from "antd-phone-input";
import { useEffect, useState } from "react";
import { useGetAllLvnzyProjects } from "../../hooks/lvnzyprojects-hooks";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "../../hooks/user-hooks";

import {
  CreateSavedLvnzyProject,
  CreateUserPayload,
  UpdateUserPayload,
  User,
} from "../../types/user";

interface UserFormProps {
  data?: User;
  onClose?: () => void;
}

export function UserForm({ data, onClose }: UserFormProps) {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();
  const { data: projects, isLoading: projectsLoading } =
    useGetAllLvnzyProjects();

  // Pre-populate form when in edit mode
  useEffect(() => {
    if (data) {
      // clean the mobile number
      const cleanMobile = data.mobile?.replace(/[^0-9]/g, "") || "";
      const mobile = cleanMobile.slice(-10); // Take last 10 digits

      form.setFieldsValue({
        name: data.profile?.name || "",
        mobileNumber: {
          countryCode: Number(data.countryCode || "91"),
          phoneNumber: mobile,
        },
        collections: data.savedLvnzyProjects?.map((collection) => ({
          name: collection.collectionName,
          projects: collection.projects,
        })),
      });
    }
  }, [data, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const collections = (values.collections || []).filter(Boolean);
      const savedLvnzyProjects = collections.map((collection: any) => ({
        collectionName: collection.name,
        projects: collection.projects,
      }));

      let areaCode;
      let phoneNumber;
      let combinedNumber;
      let countryCode;

      // format mobile number
      if (values.mobileNumber?.phoneNumber) {
        areaCode = values.mobileNumber.areaCode || "";
        phoneNumber = values.mobileNumber.phoneNumber || "";
        combinedNumber = (areaCode + phoneNumber).replace(/[^0-9]/g, "");
        countryCode = values.mobileNumber.countryCode?.toString() || "91";
      }

      if (data) {
        // update existing user
        const payload: UpdateUserPayload = {
          mobile: combinedNumber,
          countryCode: countryCode,
          profile: {
            name: values.name,
          },
          savedLvnzyProjects,
        };

        await updateUserMutation.mutateAsync({
          userId: data._id,
          userData: payload,
        });
      } else {
        //  new user
        const payload: CreateUserPayload = {
          mobile: combinedNumber,
          countryCode: countryCode,
          profile: {
            name: values.name,
          },
          savedLvnzyProjects,
        };

        await createUserMutation.mutateAsync(payload);
      }

      form.resetFields();
      setIsModalOpen(false);
      onClose?.();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
    onClose?.();
  };

  return (
    <>
      {!data && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Add User
        </Button>
      )}

      <Modal
        title={data ? "Edit User" : "Create New User"}
        open={data ? true : isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={data ? "Update" : "Create"}
        confirmLoading={
          data ? updateUserMutation.isPending : createUserMutation.isPending
        }
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
            name="mobileNumber"
            label="Mobile Number"
            validateTrigger="onSubmit"
            rules={[
              {
                validator: (_, { valid }) => {
                  if (valid(true)) return Promise.resolve();

                  return Promise.reject("Invalid phone number");
                },
              },
            ]}
            initialValue={{
              countryCode: 91,
              isoCode: "in",
            }}
          >
            <PhoneInput
              placeholder="Enter mobile number"
              enableArrow
              enableSearch
              disableParentheses
            />
          </Form.Item>

          <Form.List
            name="collections"
            initialValue={[{ name: "default", projects: [] }]}
          >
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <div
                    key={field.key}
                    style={{
                      marginBottom: 16,
                      border: "1px solid #f0f0f0",
                      padding: 16,
                      borderRadius: 8,
                    }}
                  >
                    <Space align="baseline" style={{ marginBottom: 8 }}>
                      <Typography.Text strong>
                        Collection {index + 1}
                      </Typography.Text>
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      )}
                    </Space>

                    <Form.Item
                      {...field}
                      name={[field.name, "name"]}
                      label="Collection Name"
                      rules={[
                        {
                          required: true,
                          message: "Please enter collection name",
                        },
                      ]}
                    >
                      <Input placeholder="Enter collection name" />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, "projects"]}
                      label="Projects"
                      rules={[
                        {
                          required: true,
                          message: "Please select at least one project",
                        },
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
                          return option.label
                            .toLowerCase()
                            .includes(input.toLowerCase());
                        }}
                        options={projects?.map((project: any) => ({
                          label: project.meta?.projectName,
                          value: project._id,
                        }))}
                      />
                    </Form.Item>
                  </div>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Collection
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
}
