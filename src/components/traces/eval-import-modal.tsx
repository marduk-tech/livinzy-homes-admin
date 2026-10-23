import { InboxOutlined } from "@ant-design/icons";
import { useAuth0 } from "@auth0/auth0-react";
import { Alert, Flex, message, Modal, Tag, Typography, Upload } from "antd";
import { useState } from "react";
import { useImportEvalCasesMutation } from "../../hooks/brickchat-hooks";
import { errorMessage } from "../../libs/api-error";
import { EvalImportPreview } from "../../types/brickchat-eval";

function IdList({
  label,
  color,
  ids,
}: {
  label: string;
  color: string;
  ids: string[];
}) {
  if (!ids.length) return null;
  return (
    <Flex vertical gap={4}>
      <Typography.Text strong>
        {label} ({ids.length})
      </Typography.Text>
      <Flex gap={4} wrap>
        {ids.map((id) => (
          <Tag key={id} color={color}>
            {id}
          </Tag>
        ))}
      </Flex>
    </Flex>
  );
}

export function EvalImportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth0();
  const importCases = useImportEvalCasesMutation();
  const [fileName, setFileName] = useState<string | null>(null);
  const [cases, setCases] = useState<unknown[] | null>(null);
  const [preview, setPreview] = useState<EvalImportPreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const reset = () => {
    setFileName(null);
    setCases(null);
    setPreview(null);
    setParseError(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const onFile = async (file: File) => {
    reset();
    setFileName(file.name);
    try {
      const parsed = JSON.parse(await file.text());
      // accept the bare queries.json array or { cases: [...] }
      const list = Array.isArray(parsed) ? parsed : parsed?.cases;
      if (!Array.isArray(list))
        throw new Error("Expected a JSON array of cases");
      setCases(list);
      setPreview(await importCases.mutateAsync({ cases: list, dryRun: true }));
    } catch (error) {
      setParseError(
        errorMessage(
          error,
          (error as Error)?.message || "Couldn't read the file",
        ),
      );
    }
    return false; // handled here - no upload request
  };

  const changes = preview ? preview.added.length + preview.updated.length : 0;

  const onImport = async () => {
    if (!cases) return;
    try {
      const result = await importCases.mutateAsync({
        cases,
        dryRun: false,
        updatedBy: user?.email,
      });
      if (result.imported) {
        message.success(
          `Imported - ${result.added.length} added, ${result.updated.length} updated`,
        );
        close();
      } else {
        setPreview(result);
      }
    } catch {
      // toasted by the mutation
    }
  };

  return (
    <Modal
      open={open}
      onCancel={close}
      title="Import eval cases"
      width={720}
      okText={
        changes ? `Import ${changes} case${changes === 1 ? "" : "s"}` : "Import"
      }
      okButtonProps={{
        disabled: !preview || !!preview.errors.length || !changes,
      }}
      confirmLoading={importCases.isPending && !!preview}
      onOk={onImport}
      destroyOnClose
    >
      <Flex vertical gap={12}>
        <Typography.Text type="secondary">
          Upload a queries.json. Cases are matched by id: new ids are added,
          existing ones are replaced, and cases not in the file are kept.
        </Typography.Text>
        <Upload.Dragger
          accept=".json,application/json"
          maxCount={1}
          showUploadList={false}
          beforeUpload={onFile}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {fileName ?? "Click or drop queries.json here"}
          </p>
        </Upload.Dragger>

        {parseError ? (
          <Alert type="error" showIcon message={parseError} />
        ) : null}
        {importCases.isPending && !preview ? (
          <Typography.Text>Checking…</Typography.Text>
        ) : null}

        {preview ? (
          <Flex vertical gap={12}>
            {preview.errors.length ? (
              <Alert
                type="error"
                showIcon
                message={`${preview.errors.length} problem${preview.errors.length === 1 ? "" : "s"} - fix the file and pick it again`}
                description={
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 16,
                      maxHeight: 200,
                      overflow: "auto",
                    }}
                  >
                    {preview.errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}
            <IdList label="New" color="green" ids={preview.added} />
            <IdList label="Changed" color="blue" ids={preview.updated} />
            {preview.unchanged.length ? (
              <Typography.Text type="secondary">
                {preview.unchanged.length} unchanged
              </Typography.Text>
            ) : null}
            {!changes && !preview.errors.length ? (
              <Alert
                type="info"
                showIcon
                message="Nothing to import - every case already matches"
              />
            ) : null}
          </Flex>
        ) : null}
      </Flex>
    </Modal>
  );
}
