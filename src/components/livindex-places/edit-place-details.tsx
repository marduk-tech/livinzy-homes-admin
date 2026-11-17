import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Collapse,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { useUpdateLivindexPlaceMutation } from "../../hooks/livindex-places-hook";
import { ILivIndexPlaceUpdatesEntry, ILivIndexPlaces } from "../../types";

import { BiDetail } from "react-icons/bi";

interface EditLivIndexPlaceProps {
  selectedPlace: ILivIndexPlaces;
}

// a link's hostname without "www.", or null when it isn't an http(s) url
const domainOf = (link: string): string | null => {
  try {
    const url = new URL(link.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

const splitLinks = (value?: string): string[] =>
  (value || "")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No date";

function UpdatesEntryItems({ entry }: { entry: ILivIndexPlaceUpdatesEntry }) {
  return (
    <Flex vertical gap={12}>
      {entry.updates.map((update, i) => {
        const links = (update.links || [])
          .map((link) => ({ link, domain: domainOf(link) }))
          .filter((l): l is { link: string; domain: string } => !!l.domain);
        return (
          <Flex key={update._id || i} vertical gap={4}>
            <Typography.Text>{update.summary}</Typography.Text>
            {links.length > 0 && (
              <Flex wrap gap={4}>
                {links.map(({ link, domain }, j) => (
                  <Tag key={j} style={{ marginInlineEnd: 0 }}>
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      {domain}
                    </a>
                  </Tag>
                ))}
              </Flex>
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}

export function EditPlaceDetails({ selectedPlace }: EditLivIndexPlaceProps) {
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // manual updates added in this dialog, saved with the rest on Save
  const [pendingEntries, setPendingEntries] = useState<
    ILivIndexPlaceUpdatesEntry[]
  >([]);

  const updateLivindexPlace = useUpdateLivindexPlaceMutation({
    placeId: selectedPlace?._id as string,
  });

  const existingEntries = selectedPlace.details?.updates || [];

  const handleAddUpdate = async () => {
    const { summary, links } = await updateForm.validateFields();
    setPendingEntries((prev) => [
      ...prev,
      {
        updatedAt: new Date().toISOString(),
        updates: [{ summary: summary.trim(), links: splitLinks(links) }],
      },
    ]);
    updateForm.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // dotted paths so only these fields change - sending `details` itself
      // would replace the whole object (updates, links, trafficData, ...)
      const placeData: Record<string, unknown> = Object.fromEntries(
        (["oneLiner"] as const)
          .filter((key) => values[key] !== undefined)
          .map((key) => [`details.${key}`, values[key]]),
      );
      if (pendingEntries.length) {
        placeData["details.updates"] = [...existingEntries, ...pendingEntries];
      }

      await updateLivindexPlace.mutateAsync({ placeData });

      setPendingEntries([]);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = () => {
    setPendingEntries([]);
    setIsEditModalOpen(false);
  };

  // newest first; unsaved manual entries on top
  const entries = [
    ...pendingEntries.map((entry) => ({ entry, pending: true })).reverse(),
    ...[...existingEntries]
      .sort(
        (a, b) =>
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime(),
      )
      .map((entry) => ({ entry, pending: false })),
  ].filter(({ entry }) => entry.updates?.length);

  return (
    <>
      <Button
        type="default"
        shape="default"
        icon={<BiDetail />}
        onClick={() => {
          setIsEditModalOpen(true);
        }}
      ></Button>

      <Modal
        title={`Edit ${selectedPlace.name}`}
        open={isEditModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Save"
        confirmLoading={updateLivindexPlace.isPending}
        width={720}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
          initialValues={selectedPlace.details}
          preserve={false}
        >
          <Form.Item name="oneLiner" label="One Liner">
            <Input.TextArea rows={4} placeholder="One Liner" />
          </Form.Item>
        </Form>

        <Typography.Title level={5} style={{ marginTop: 24 }}>
          Updates
        </Typography.Title>

        {entries.length ? (
          <Collapse
            size="small"
            items={entries.map(({ entry, pending }, i) => ({
              key: entry._id || `pending-${i}`,
              label: (
                <Flex gap={8} align="center">
                  <span>{formatDate(entry.updatedAt)}</span>
                  <Typography.Text type="secondary">
                    {entry.updates.length} update
                    {entry.updates.length === 1 ? "" : "s"}
                  </Typography.Text>
                  {pending && <Tag color="orange">Unsaved</Tag>}
                </Flex>
              ),
              children: <UpdatesEntryItems entry={entry} />,
            }))}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No updates yet"
          />
        )}

        <Form
          form={updateForm}
          layout="vertical"
          style={{ marginTop: 16 }}
          preserve={false}
        >
          <Form.Item
            name="summary"
            label="Add an update"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Enter the update's summary",
              },
            ]}
          >
            <Input.TextArea rows={2} placeholder="Summary" />
          </Form.Item>
          <Form.Item
            name="links"
            rules={[
              {
                validator: (_, value) => {
                  const invalid = splitLinks(value).filter((l) => !domainOf(l));
                  return invalid.length
                    ? Promise.reject(
                        new Error(`Not a valid url: ${invalid.join(", ")}`),
                      )
                    : Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="Links, comma separated (optional)" />
          </Form.Item>
          <Button icon={<PlusOutlined />} onClick={handleAddUpdate}>
            Add update
          </Button>
        </Form>
      </Modal>
    </>
  );
}
