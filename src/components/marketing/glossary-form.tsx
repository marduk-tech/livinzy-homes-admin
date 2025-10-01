import { Button, Flex, Form, Input, Select } from "antd";
import { useEffect, useState } from "react";
import {
  useCreateGlossaryMutation,
  useUpdateGlossaryMutation,
} from "../../hooks/marketing-hooks";
import { getGhostGlossaryPages } from "../../libs/api/marketing";
import { IGhostPage, IGlossary } from "../../types";

interface GlossaryFormProps {
  initialData?: IGlossary | null;
  onSuccess?: () => void;
}

export function GlossaryForm({ initialData, onSuccess }: GlossaryFormProps) {
  const [form] = Form.useForm();
  const [ghostPages, setGhostPages] = useState<IGhostPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  const createGlossaryMutation = useCreateGlossaryMutation();
  const updateGlossaryMutation = useUpdateGlossaryMutation();

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        title: initialData.content.title,
        description: initialData.content.description,
        pageLink: initialData.content.pageLink,
      });
    }
  }, [initialData, form]);

  useEffect(() => {
    const fetchGhostPages = async () => {
      setLoadingPages(true);
      try {
        const pages = await getGhostGlossaryPages();
        setGhostPages(pages);
      } catch (error) {
        console.error("Failed to fetch Ghost pages:", error);
      } finally {
        setLoadingPages(false);
      }
    };

    fetchGhostPages();
  }, []);

  const handleSubmit = async (values: any) => {
    const glossaryData: Partial<IGlossary> = {
      type: "glossary",
      content: {
        title: values.title,
        description: values.description,
        pageLink: values.pageLink,
      },
    };

    try {
      if (initialData) {
        await updateGlossaryMutation.mutateAsync({
          id: initialData._id,
          glossaryData,
        });
      } else {
        await createGlossaryMutation.mutateAsync(glossaryData);
      }

      form.resetFields();
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        label="Title"
        name="title"
        rules={[{ required: true, message: "Please enter a title" }]}
      >
        <Input placeholder="Enter glossary term title" />
      </Form.Item>

      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: "Please enter a description" }]}
      >
        <Input.TextArea rows={5} placeholder="Enter description" />
      </Form.Item>

      <Form.Item label="Page Link" name="pageLink">
        <Select
          placeholder="Select a Ghost blog page"
          loading={loadingPages}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label?.toString().toLowerCase() ?? "").includes(
              input.toLowerCase()
            )
          }
          options={ghostPages.map((page) => ({
            value: page.slug,
            label: `${page.title} (${page.slug})${page.status === 'draft' ? ' [draft]' : ''}`,
          }))}
        />
      </Form.Item>

      <Flex justify="flex-end" gap={8}>
        <Button
          type="primary"
          htmlType="submit"
          loading={
            createGlossaryMutation.isPending || updateGlossaryMutation.isPending
          }
        >
          {initialData ? "Update" : "Create"}
        </Button>
      </Flex>
    </Form>
  );
}
