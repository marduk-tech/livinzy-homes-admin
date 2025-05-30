import { Button, Flex, Form, Input, Select, Switch, Typography } from "antd";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useFetchCorridors } from "../../hooks/corridors-hooks";
import {
  useCreateGlobalKnowledgeMutation,
  useUpdateGlobalKnowledgeMutation,
} from "../../hooks/global-knowledge-hooks";
import { IGlobalKnowledge } from "../../types";

interface CreateGlobalKnowladgeFormProps {
  onSuccess?: () => void;
  initialData?: IGlobalKnowledge | null;
}

export function CreateGlobalKnowladgeForm({
  onSuccess,
  initialData,
}: CreateGlobalKnowladgeFormProps) {
  const [form] = Form.useForm();
  const [isPreview, setIsPreview] = useState(false);

  const createGlobalKnowledge = useCreateGlobalKnowledgeMutation();
  const updateGlobalKnowledge = useUpdateGlobalKnowledgeMutation();

  useEffect(() => {
    if (initialData) {
      // Transform corridor data to just array of IDs before setting form values
      const formData = {
        ...initialData,
        corridors: initialData.corridors?.map((corridor) => corridor._id),
      };
      form.setFieldsValue(formData);
    }
  }, [initialData, form]);
  const { data: corridors = [] } = useFetchCorridors();

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (initialData) {
        await updateGlobalKnowledge.mutateAsync({
          id: initialData._id,
          globalKnowledgeData: values,
        });
      } else {
        await createGlobalKnowledge.mutateAsync({ ...values });
      }

      form.resetFields();
      onSuccess?.();
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <Form form={form} layout="vertical">
        {isPreview ? (
          <div
            style={{
              padding: "8px",
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
              minHeight: "120px",
              backgroundColor: "#f5f5f5",
              maxHeight: "500px",
              overflow: "auto",
              marginBottom: 16,
            }}
          >
            <ReactMarkdown>{form.getFieldValue("content")}</ReactMarkdown>
          </div>
        ) : (
          <Form.Item name="content">
            <Input.TextArea rows={20} />
          </Form.Item>
        )}

        <div style={{ marginBottom: 16 }}>
          <Switch
            checked={isPreview}
            onChange={(checked) => setIsPreview(checked)}
            checkedChildren="Preview"
            unCheckedChildren="Edit"
          />
        </div>

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
            disabled={isPreview}
          >
            Reset
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={
              createGlobalKnowledge.isPending || updateGlobalKnowledge.isPending
            }
          >
            {initialData ? "Update" : "Save"}
          </Button>
        </Flex>
      </Form>
    </>
  );
}
