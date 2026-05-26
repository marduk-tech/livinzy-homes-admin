import { Button, Modal, Select, Typography } from "antd";
import { useState } from "react";
import {
  useAddProjectsToDeveloperMutation,
  useGetDeveloperNames,
} from "../../hooks/real-estate-developer-hooks";

interface AssignToDeveloperModalProps {
  open: boolean;
  onClose: () => void;
  projects: { id: string; name: string; reraNumber: string }[];
}

export function AssignToDeveloperModal({
  open,
  onClose,
  projects,
}: AssignToDeveloperModalProps) {
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<
    string | undefined
  >();

  const { data: developerNames, isLoading: loadingNames } =
    useGetDeveloperNames();
  const { mutate: addProjects, isPending } =
    useAddProjectsToDeveloperMutation();

  const handleSubmit = () => {
    if (!selectedDeveloperId) return;
    addProjects(
      { developerId: selectedDeveloperId, projects },
      {
        onSuccess: () => {
          setSelectedDeveloperId(undefined);
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    setSelectedDeveloperId(undefined);
    onClose();
  };

  const options = (developerNames ?? []).map((d) => ({
    label: d.name,
    value: d._id,
  }));

  return (
    <Modal
      title="Assign Projects to Developer"
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isPending}
          disabled={!selectedDeveloperId}
          onClick={handleSubmit}
        >
          Assign
        </Button>,
      ]}
      width={480}
    >
      <div style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">
          {projects.length} project(s) selected
        </Typography.Text>
        <ul style={{ marginTop: 8, paddingLeft: 20, maxHeight: 160, overflowY: "auto" }}>
          {projects.map((p) => (
            <li key={p.id}>
              <Typography.Text>{p.name}</Typography.Text>
              {p.reraNumber && (
                <Typography.Text type="secondary">
                  {" "}
                  ({p.reraNumber})
                </Typography.Text>
              )}
            </li>
          ))}
        </ul>
      </div>

      <Select
        style={{ width: "100%" }}
        placeholder="Select a developer"
        loading={loadingNames}
        options={options}
        value={selectedDeveloperId}
        onChange={setSelectedDeveloperId}
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
      />
    </Modal>
  );
}
