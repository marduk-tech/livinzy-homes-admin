import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { UnitConfigList } from "./unit-config-list";

import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Flex,
  Form,
  FormInstance,
  Grid,
  Image,
  Input,
  Modal,
  notification,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";

import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  DeleteRowOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  HolderOutlined,
  ScissorOutlined,
  TableOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useRemoveWatermark } from "../../hooks/dewatermark-hooks";
import {
  useCreateProjectMutation,
  useProjectForm,
  useUpdateProjectMutation,
} from "../../hooks/project-hooks";
import { useDevice } from "../../hooks/use-device";
import { baseApiUrl, MediaTags } from "../../libs/constants";
import { queries } from "../../libs/queries";
import { calculateFieldStatus } from "../../libs/utils";
import { COLORS } from "../../theme/colors";
import {
  IMedia,
  Project,
  ProjectField,
  ProjectStructure,
} from "../../types/Project";
import DynamicReactIcon from "../../components/common/dynamic-react-icon";
import { FileUpload } from "../../components/common/img-upload";
import { ImagePdfUpload } from "../../components/common/image-pdf-upload";
import { Loader } from "../../components/common/loader";
import { DocumentsList } from "../../components/media-tabs/documents-list";
import { ReraDocumentsModal } from "../../components/rera-projects/rera-documents-modal";
import { VideoUpload } from "../../components/media-tabs/video-tab";
import { JsonEditor } from "../../components/update-json-modal";
import WatermarkPreviewModal from "../../components/watermark-preview-modal";

const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

const isNonFloorplanImage = (item?: IMedia) =>
  item?.type === "image" && !item.image?.tags?.includes("floorplan");

const DraggableRow = ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { "data-row-key"?: string }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props["data-row-key"] ?? "",
  });
  return (
    <tr
      {...props}
      ref={setNodeRef}
      style={{
        ...props.style,
        transform: CSS.Transform.toString(transform),
        transition,
        ...(isDragging ? { position: "relative", zIndex: 9999, background: "#fafafa" } : {}),
      }}
      {...attributes}
    >
      {React.Children.map(children as React.ReactElement[], (child) =>
        child && (child as React.ReactElement).key === "sort"
          ? React.cloneElement(child as React.ReactElement, {
              children: (
                <HolderOutlined
                  style={{ touchAction: "none", cursor: "grab" }}
                  {...listeners}
                />
              ),
            })
          : child
      )}
    </tr>
  );
};

interface ProjectFormProps {
  projectId?: string;
}

interface FieldType extends ProjectField {}

const RenderFields: React.FC<{
  form: FormInstance;
  fields: FieldType[];
  category: string;
  isMobile: boolean;
  fieldRules: Record<string, any>;
  onFloorplanUpload?: (urls: string[], originalNames: string[]) => void;
  disabledFields?: Record<string, boolean>;
  onAutoSave?: (category: string, dbField: string | string[], newValue: any) => void;
}> = ({ fields, category, isMobile, fieldRules, form, onFloorplanUpload, disabledFields, onAutoSave }) => (
  <Row gutter={16}>
    {fields.map(
      ({
        dbField,
        fieldDisplayName,
        fieldDescription,
        mustHave,
        hide,
        type,
        options,
        dependencies,
      }) => {
        if (hide) {
          return null;
        } else
          return (
            <Col
              span={isMobile ? 24 : 12}
              key={Array.isArray(dbField) ? dbField.join(".") : dbField}
            >
              <Form.Item
                name={
                  Array.isArray(dbField)
                    ? [category, ...dbField]
                    : [category, dbField]
                }
                dependencies={dependencies?.map((dep) =>
                  Array.isArray(dep) ? [category, ...dep] : [category, dep],
                )}
                label={
                  <Flex gap={8} align="center">
                    <Typography.Text style={{ fontWeight: "bold" }}>
                      {fieldDisplayName}
                    </Typography.Text>
                    {mustHave ? <Tag color="volcano">Must Have</Tag> : null}
                    {type === "json" && (
                      <JsonEditor
                        title={`Edit ${fieldDisplayName}`}
                        initialJson={form.getFieldValue(
                          Array.isArray(dbField)
                            ? [category, ...dbField]
                            : [category, dbField],
                        )}
                        onJsonChange={(data) => {
                          form.setFieldValue(
                            Array.isArray(dbField)
                              ? [category, ...dbField]
                              : [category, dbField],
                            data,
                          );
                        }}
                      />
                    )}
                    {Array.isArray(dbField) &&
                      dbField[0] === "location" &&
                      dbField[1] === "mapLink" &&
                      form.getFieldValue([category, ...dbField]) && (
                        <span
                          style={{ cursor: "pointer", marginTop: "2px" }}
                          onClick={() => {
                            const mapLink = form.getFieldValue([
                              category,
                              ...dbField,
                            ]);
                            if (mapLink) {
                              window.open(mapLink, "_blank");
                            }
                          }}
                        >
                          <DynamicReactIcon
                            color={COLORS.textColorDark}
                            iconName="IoNavigateCircleSharp"
                            iconSet="io5"
                            size={20}
                          />
                        </span>
                      )}
                  </Flex>
                }
                rules={
                  fieldRules[category as keyof typeof fieldRules]?.[
                    (Array.isArray(dbField)
                      ? dbField.join(".")
                      : dbField) as keyof (typeof fieldRules)[keyof typeof fieldRules]
                  ] || []
                }
                {...(type === "date_month_year"
                  ? {
                      getValueProps: (value) => ({
                        value: value ? dayjs(value) : undefined,
                      }),
                      normalize: (value) =>
                        value ? dayjs(value).toISOString() : value,
                    }
                  : {})}
              >
                {type === "unit_config_list" ? (
                  <UnitConfigList
                    value={form.getFieldValue(
                      Array.isArray(dbField)
                        ? [category, ...dbField]
                        : [category, dbField],
                    )}
                    onChange={(value) => {
                      form.setFieldValue(
                        Array.isArray(dbField)
                          ? [category, ...dbField]
                          : [category, dbField],
                        value,
                      );
                      onAutoSave?.(category, dbField, value);
                    }}
                    media={form.getFieldValue("media") || []}
                    onFloorplanUpload={onFloorplanUpload}
                    homeTypes={form.getFieldValue(["info", "homeType"]) || []}
                  />
                ) : type === "single_select" || type == "multi_select" ? (
                  <Select
                    placeholder={fieldDescription}
                    options={options}
                    mode={type === "multi_select" ? "tags" : undefined}
                    allowClear
                    showSearch={type !== "multi_select"}
                    filterOption={(input, option) =>
                      (option?.label?.toString() || "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    onChange={(value) => {
                      form.setFieldValue(
                        Array.isArray(dbField)
                          ? [category, ...dbField]
                          : [category, dbField],
                        value,
                      );
                    }}
                  />
                ) : type === "date_month_year" ? (
                  <DatePicker
                    style={{ width: "100%" }}
                    disabledDate={(d) =>
                      d.isBefore(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))
                    }
                    disabled={
                      !!(disabledFields?.[
                        Array.isArray(dbField) ? dbField.join(".") : dbField
                      ])
                    }
                  />
                ) : type == "text" ? (
                  <TextArea rows={5} placeholder={fieldDescription} />
                ) : (
                  <Input placeholder={fieldDescription} />
                )}
              </Form.Item>
            </Col>
          );
      },
    )}
  </Row>
);

export function ProjectDetails({ projectId }: ProjectFormProps) {
  const [form] = Form.useForm();

  const navigate = useNavigate();
  const { isMobile } = useDevice();

  const [projectData, setProjectData] = useState<Project>();
  const [uiInstructionsModalOpen, setUiInstructionsModalOpen] = useState(false);
  const [uiInstructions, setUiInstructions] = useState<string>();

  const { fieldRules, projectFields } = useProjectForm(form);

  const { data: project, isLoading: projectIsLoading } = useQuery({
    ...queries.getProjectById(projectId as string),
    enabled: !!projectId,
    throwOnError: true,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // const { data: allProjects, isLoading: allProjectsLoading } = useQuery({
  //   ...queries.getAllProjects(),
  //   enabled: !!projectId,
  // });

  const createProject = useCreateProjectMutation();
  const updateProject = useUpdateProjectMutation({
    projectId: projectId || "",
  });

  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(
    null,
  );

  const [selectedMediaIndices, setSelectedMediaIndices] = useState<Set<number>>(
    new Set(),
  );
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [bulkWatermarkLoading, setBulkWatermarkLoading] = useState(false);
  const [bulkWatermarkConfirmVisible, setBulkWatermarkConfirmVisible] =
    useState(false);

  const [watermarkModal, setWatermarkModal] = useState({
    visible: false,
    originalUrl: "",
    processedUrl: null as string | null,
    mediaIndex: -1,
  });

  const [reraDocsModalOpen, setReraDocsModalOpen] = useState(false);
  const [imageViewMode, setImageViewMode] = useState<"default" | "table">("default");
  const [floorplanViewMode, setFloorplanViewMode] = useState<"default" | "table">("default");

  const [selectedFloorplanUrls, setSelectedFloorplanUrls] = useState<
    Set<string>
  >(new Set());
  const [floorplanDeleteConfirmVisible, setFloorplanDeleteConfirmVisible] =
    useState(false);
  const [floorplanBulkWatermarkLoading, setFloorplanBulkWatermarkLoading] =
    useState(false);
  const [
    floorplanBulkWatermarkConfirmVisible,
    setFloorplanBulkWatermarkConfirmVisible,
  ] = useState(false);

  const removeWatermarkMutation = useRemoveWatermark();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 1 } }));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!active || !over || active.id === over.id) return;
    const currentMedia: IMedia[] = form.getFieldValue("media") || [];
    const imageIndices = currentMedia
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => isNonFloorplanImage(item))
      .map(({ i }) => i);
    const imageItems = imageIndices.map((i) => currentMedia[i]);
    const oldIdx = imageIndices.indexOf(Number(active.id));
    const newIdx = imageIndices.indexOf(Number(over.id));
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(imageItems, oldIdx, newIdx);
    const updatedMedia = [...currentMedia];
    imageIndices.forEach((mediaIdx, pos) => {
      updatedMedia[mediaIdx] = {
        ...reordered[pos],
        image: { ...reordered[pos].image!, sequence: pos },
      };
    });
    form.setFieldValue("media", updatedMedia);
    if (projectId) {
      updateProject.mutate({ projectData: { media: updatedMedia } });
    }
  };

  const handlePreviewImageChange = (index: number, checked: boolean) => {
    if (checked) {
      setPreviewImageIndex(index);
    } else {
      setPreviewImageIndex(null);
    }
  };

  const stripIds = (val: any): any => {
    if (Array.isArray(val)) return val.map(stripIds);
    if (val && typeof val === "object") {
      const { _id, __v, ...rest } = val;
      return Object.fromEntries(
        Object.keys(rest).sort().map((k) => [k, stripIds(rest[k])])
      );
    }
    return val;
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (projectId) {
        const payload: any = {};

        const existingInfo = (projectData?.info || {}) as any;
        const changedInfo: any = {};
        const allFields = Object.values(projectFields).flat();
        for (const { dbField } of allFields) {
          if (Array.isArray(dbField)) {
            const [parent, child] = dbField;
            const newVal = values.info?.[parent]?.[child];
            const oldVal = existingInfo?.[parent]?.[child];
            if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
              changedInfo[parent] = { ...(changedInfo[parent] || {}), [child]: newVal };
            }
          } else {
            const newVal = values.info?.[dbField];
            const oldVal = existingInfo?.[dbField];
            if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
              changedInfo[dbField] = newVal;
            }
          }
        }

        if (Object.keys(changedInfo).length > 0) {
          payload.info = changedInfo;
          if (payload.info.homeType && !Array.isArray(payload.info.homeType)) {
            payload.info.homeType = [payload.info.homeType];
          }
        }

        // Only include media if it changed
        if (values.media) {
          const updatedMedia = values.media.map((item: IMedia, index: number) => ({
            ...item,
            isPreview: index === previewImageIndex,
          }));
          const existingMedia = stripIds(projectData?.media || []);
          if (JSON.stringify(stripIds(updatedMedia)) !== JSON.stringify(existingMedia)) {
            payload.media = updatedMedia;
          }
        }

        if (Object.keys(payload).length > 0) {
          updateProject.mutate({ projectData: payload });
        }
      } else {
        const media = values.media?.map((item: IMedia, index: number) => ({
          ...item,
          isPreview: index === previewImageIndex,
        }));

        if (values.info?.homeType && !Array.isArray(values.info.homeType)) {
          values.info.homeType = [values.info.homeType];
        }

        await createProject
          .mutateAsync({ ...values, media })
          .then((data) => {
            navigate(`/projects/${data._id}/edit`);
          });
      }
    } catch (error) {
      notification.error({
        message: `Please check fields again`,
      });

      console.error("Validation failed:", error);
    }
  };

  const onUploadComplete = (
    urls: string[],
    originalNames: string[],
    index?: number,
    mediaType: "image" | "document" | "video" = "image",
    captions?: string[],
  ) => {
    notification.success({
      message: `${urls.length} ${mediaType}s uploaded successfully`,
    });

    const currentMedia = form.getFieldValue("media") || [];

    if (index !== undefined) {
      // Update existing media
      if (mediaType === "document") {
        currentMedia[index].document.url = urls[0];
      } else if (mediaType === "image") {
        currentMedia[index].image.url = urls[0];
      }
    } else {
      // Add new media
      const newMedia = urls.map((url, index) => {
        switch (mediaType) {
          case "document":
            return {
              type: "document",
              document: {
                name: originalNames[index],
                url,
                documentType: "",
              },
            };
          case "image":
            return {
              type: "image",
              image: {
                url,
                tags: [],
                caption: captions?.[index] ?? "",
              },
            };
          default:
            throw new Error(`Invalid media type: ${mediaType}`);
        }
      });
      currentMedia.push(...newMedia);
    }

    form.setFieldValue("media", currentMedia);

    if (projectId) {
      updateProject.mutate({
        projectData: {
          media: currentMedia,
        },
      });
    }
  };

  const onFloorplanUpload = (urls: string[], originalNames: string[]) => {
    notification.success({
      message: `${urls.length} floor plan${urls.length > 1 ? "s" : ""} uploaded successfully`,
    });

    const currentMedia = form.getFieldValue("media") || [];

    const newFloorplans = urls.map((url, index) => ({
      type: "image" as const,
      image: {
        url,
        tags: ["floorplan"],
        caption:
          originalNames[index] ||
          `Floor Plan ${currentMedia.length + index + 1}`,
      },
      isPreview: false,
      hasWatermark: false,
    }));

    const updatedMedia = [...newFloorplans, ...currentMedia];
    form.setFieldValue("media", updatedMedia);

    if (projectId) {
      updateProject.mutate({
        projectData: {
          media: updatedMedia,
        },
      });
    }
  };

  const handleDeleteMedia = (index: number) => {
    const currentMedia = form.getFieldValue("media") || [];
    const updatedMedia = currentMedia.filter((_: any, i: any) => i !== index);
    form.setFieldValue("media", updatedMedia);

    if (projectId) {
      updateProject.mutate({
        projectData: {
          media: updatedMedia,
        },
      });
    }
  };

  const handleToggleSelect = (index: number) => {
    setSelectedMediaIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleBulkDelete = () => {
    const currentMedia = form.getFieldValue("media") || [];
    const updatedMedia = currentMedia.filter(
      (_: any, i: number) => !selectedMediaIndices.has(i),
    );
    form.setFieldValue("media", updatedMedia);
    if (projectId) {
      updateProject.mutate({ projectData: { media: updatedMedia } });
    }
    setSelectedMediaIndices(new Set());
    setDeleteConfirmVisible(false);
  };

  const handleBulkRemoveWatermark = async () => {
    setBulkWatermarkConfirmVisible(false);
    const currentMedia = form.getFieldValue("media") || [];
    const targets = Array.from(selectedMediaIndices)
      .map((i) => ({ index: i, url: currentMedia[i]?.image?.url as string | undefined }))
      .filter((t): t is { index: number; url: string } => !!t.url);

    if (targets.length === 0) return;

    setBulkWatermarkLoading(true);

    const results = await Promise.allSettled(
      targets.map((t) => removeWatermarkMutation.mutateAsync(t.url)),
    );

    const updatedMedia = [...currentMedia];
    let currentUnitConfigs =
      form.getFieldValue(["info", "unitConfigWithPricing"]) || [];
    let totalFloorplanUpdates = 0;
    let successCount = 0;
    let failCount = 0;

    results.forEach((res, i) => {
      const { index, url: oldUrl } = targets[i];
      if (res.status === "fulfilled" && res.value?.processedImageUrl) {
        const newUrl = res.value.processedImageUrl;
        updatedMedia[index] = {
          ...updatedMedia[index],
          image: { ...updatedMedia[index].image, url: newUrl },
          hasWatermark: false,
        };

        const isFloorplan =
          updatedMedia[index]?.image?.tags?.includes("floorplan");
        if (isFloorplan && oldUrl) {
          const { updatedConfigs, updateCount } = updateFloorplanReferences(
            oldUrl,
            newUrl,
            currentUnitConfigs,
          );
          if (updateCount > 0) {
            currentUnitConfigs = updatedConfigs;
            totalFloorplanUpdates += updateCount;
          }
        }
        successCount++;
      } else {
        failCount++;
      }
    });

    form.setFieldValue("media", updatedMedia);
    if (totalFloorplanUpdates > 0) {
      form.setFieldValue(["info", "unitConfigWithPricing"], currentUnitConfigs);
    }

    if (projectId && successCount > 0) {
      updateProject.mutate({
        projectData: {
          media: updatedMedia,
          ...(totalFloorplanUpdates > 0 && {
            info: { unitConfigWithPricing: currentUnitConfigs } as any,
          }),
        },
      });
    }

    setBulkWatermarkLoading(false);
    setSelectedMediaIndices(new Set());

    if (successCount > 0) {
      notification.success({
        message: `Removed watermark from ${successCount} image${
          successCount > 1 ? "s" : ""
        }${
          totalFloorplanUpdates > 0
            ? ` and updated ${totalFloorplanUpdates} floorplan reference${
                totalFloorplanUpdates > 1 ? "s" : ""
              }`
            : ""
        }${failCount > 0 ? ` (${failCount} failed)` : ""}`,
      });
    } else if (failCount > 0) {
      notification.error({
        message: `Failed to remove watermark from ${failCount} image${
          failCount > 1 ? "s" : ""
        }`,
      });
    }
  };

  const handleFloorplanToggleSelect = (url: string) => {
    setSelectedFloorplanUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const handleFloorplanBulkDelete = () => {
    const deletableItems = floorplanItems.filter(
      (item) =>
        selectedFloorplanUrls.has(item.url) &&
        !item.used &&
        item.mediaIndex !== undefined,
    );
    const skippedCount = selectedFloorplanUrls.size - deletableItems.length;
    const deleteIndices = new Set(
      deletableItems.map((item) => item.mediaIndex!),
    );

    const currentMedia = form.getFieldValue("media") || [];
    const updatedMedia = currentMedia.filter(
      (_: any, i: number) => !deleteIndices.has(i),
    );
    form.setFieldValue("media", updatedMedia);
    if (projectId) {
      updateProject.mutate({ projectData: { media: updatedMedia } });
    }
    setSelectedFloorplanUrls(new Set());
    setFloorplanDeleteConfirmVisible(false);

    if (skippedCount > 0) {
      notification.info({
        message: `Skipped ${skippedCount} image${skippedCount > 1 ? "s" : ""}`,
        description:
          "Images used in a unit configuration cannot be deleted.",
      });
    }
  };

  const handleFloorplanBulkRemoveWatermark = async () => {
    setFloorplanBulkWatermarkConfirmVisible(false);
    const targets = floorplanItems.filter((item) =>
      selectedFloorplanUrls.has(item.url),
    );

    if (targets.length === 0) return;

    setFloorplanBulkWatermarkLoading(true);

    const results = await Promise.allSettled(
      targets.map((t) => removeWatermarkMutation.mutateAsync(t.url)),
    );

    const currentMedia = form.getFieldValue("media") || [];
    const updatedMedia = [...currentMedia];
    let currentUnitConfigs =
      form.getFieldValue(["info", "unitConfigWithPricing"]) || [];
    let totalFloorplanUpdates = 0;
    let successCount = 0;
    let failCount = 0;

    results.forEach((res, i) => {
      const { url: oldUrl, mediaIndex } = targets[i];
      if (res.status === "fulfilled" && res.value?.processedImageUrl) {
        const newUrl = res.value.processedImageUrl;

        if (mediaIndex !== undefined) {
          updatedMedia[mediaIndex] = {
            ...updatedMedia[mediaIndex],
            image: { ...updatedMedia[mediaIndex].image, url: newUrl },
            hasWatermark: false,
          };
        }

        const { updatedConfigs, updateCount } = updateFloorplanReferences(
          oldUrl,
          newUrl,
          currentUnitConfigs,
        );
        if (updateCount > 0) {
          currentUnitConfigs = updatedConfigs;
          totalFloorplanUpdates += updateCount;
        }
        successCount++;
      } else {
        failCount++;
      }
    });

    form.setFieldValue("media", updatedMedia);
    if (totalFloorplanUpdates > 0) {
      form.setFieldValue(["info", "unitConfigWithPricing"], currentUnitConfigs);
    }

    if (projectId && successCount > 0) {
      updateProject.mutate({
        projectData: {
          media: updatedMedia,
          ...(totalFloorplanUpdates > 0 && {
            info: { unitConfigWithPricing: currentUnitConfigs } as any,
          }),
        },
      });
    }

    setFloorplanBulkWatermarkLoading(false);
    setSelectedFloorplanUrls(new Set());

    if (successCount > 0) {
      notification.success({
        message: `Removed watermark from ${successCount} image${
          successCount > 1 ? "s" : ""
        }${
          totalFloorplanUpdates > 0
            ? ` and updated ${totalFloorplanUpdates} floorplan reference${
                totalFloorplanUpdates > 1 ? "s" : ""
              }`
            : ""
        }${failCount > 0 ? ` (${failCount} failed)` : ""}`,
      });
    } else if (failCount > 0) {
      notification.error({
        message: `Failed to remove watermark from ${failCount} image${
          failCount > 1 ? "s" : ""
        }`,
      });
    }
  };

  const handleRemoveWatermark = async (imageUrl: string, index: number) => {
    setWatermarkModal({
      visible: true,
      originalUrl: imageUrl,
      processedUrl: null,
      mediaIndex: index,
    });

    try {
      const result = await removeWatermarkMutation.mutateAsync(imageUrl);
      setWatermarkModal((prev) => ({
        ...prev,
        processedUrl: result.processedImageUrl,
      }));
    } catch (error) {
      notification.error({
        message: "Failed to process image",
        description: "Please try again later",
      });
      setWatermarkModal({
        visible: false,
        originalUrl: "",
        processedUrl: null,
        mediaIndex: -1,
      });
    }
  };

  // Updates floorplan URL references when a floorplan image URL changes
  const updateFloorplanReferences = (
    oldUrl: string,
    newUrl: string,
    unitConfigs: Array<{
      _id?: string;
      config: string;
      price: number;
      floorplans: string[];
    }> = [],
  ): { updatedConfigs: typeof unitConfigs; updateCount: number } => {
    let updateCount = 0;

    const updatedConfigs = unitConfigs.map((unitConfig) => {
      if (!unitConfig.floorplans || !Array.isArray(unitConfig.floorplans)) {
        return unitConfig;
      }

      const updatedFloorplans = unitConfig.floorplans.map((floorplanUrl) => {
        if (floorplanUrl === oldUrl) {
          updateCount++;
          return newUrl;
        }
        return floorplanUrl;
      });

      return {
        ...unitConfig,
        floorplans: updatedFloorplans,
      };
    });

    return { updatedConfigs, updateCount };
  };

  const handleApproveWatermarkRemoval = () => {
    const { processedUrl, mediaIndex, originalUrl } = watermarkModal;

    if (!processedUrl || mediaIndex < 0) {
      return;
    }

    form.setFieldValue(["media", mediaIndex, "image", "url"], processedUrl);
    form.setFieldValue(["media", mediaIndex, "hasWatermark"], false);

    // Check if this is a floorplan image
    const currentMedia = form.getFieldValue("media") || [];
    const mediaItem = currentMedia[mediaIndex];
    const isFloorplan = mediaItem?.image?.tags?.includes("floorplan");

    let floorplanUpdateCount = 0;

    // If it's a floorplan, update all references in unit configurations
    if (isFloorplan && originalUrl) {
      const currentUnitConfigs =
        form.getFieldValue(["info", "unitConfigWithPricing"]) || [];

      const { updatedConfigs, updateCount } = updateFloorplanReferences(
        originalUrl,
        processedUrl,
        currentUnitConfigs,
      );

      floorplanUpdateCount = updateCount;

      // Only update if there were changes
      if (updateCount > 0) {
        form.setFieldValue(["info", "unitConfigWithPricing"], updatedConfigs);
      }
    }

    // Save to backend if editing existing project
    if (projectId) {
      const updatedMedia = form.getFieldValue("media");
      const updatedInfo = form.getFieldValue("info");

      updateProject.mutate({
        projectData: {
          media: updatedMedia,
          ...(floorplanUpdateCount > 0 && { info: updatedInfo }),
        },
      });
    }

    const baseMessage = "Watermark removed successfully";
    const message =
      floorplanUpdateCount > 0
        ? `${baseMessage} and updated ${floorplanUpdateCount} floorplan reference${
            floorplanUpdateCount > 1 ? "s" : ""
          }`
        : baseMessage;

    notification.success({
      message,
    });

    setWatermarkModal({
      visible: false,
      originalUrl: "",
      processedUrl: null,
      mediaIndex: -1,
    });
  };

  const handleRejectWatermarkRemoval = () => {
    setWatermarkModal({
      visible: false,
      originalUrl: "",
      processedUrl: null,
      mediaIndex: -1,
    });
  };

  const watchHomeType = Form.useWatch(["info", "homeType"], form);
  const watchReraNumber = Form.useWatch(["info", "reraNumber"], form);
  const disabledFields: Record<string, boolean> = {
    "realTimeStatus.expectedLaunchDate": !!watchReraNumber,
  };

  const [visibleTabs, setVisibleTabs] = useState<ProjectStructure>();

  useEffect(() => {
    const homeType = form.getFieldValue(["info", "homeType"]);

    const filteredFields = Object.fromEntries(
      Object.entries(projectFields).filter(([key]) => {
        if (homeType?.includes("farmland")) {
          return key !== "unitDetails";
        } else {
          return key !== "plots";
        }
      }),
    ) as ProjectStructure;

    setVisibleTabs(filteredFields);
  }, [watchHomeType, form, projectFields]);

  useEffect(() => {
    if (project) {
      const uiFormatting: any = {};
      // set the form values directly when project data is available
      const formValues = {
        ...project,
        ui: uiFormatting,
        infoV2: {
          ...project.info,
          homeType: Array.isArray(project.info.homeType)
            ? project.info.homeType
            : [],
        },
      };

      form.setFieldsValue(formValues);
      setSelectedMediaIndices(new Set());
      setProjectData(project);

      const initialPreviewIndex = project.media.findIndex(
        (item: IMedia) => item.isPreview,
      );
      setPreviewImageIndex(
        initialPreviewIndex >= 0 ? initialPreviewIndex : null,
      );
    }
  }, [project, form]);

  const floorplanItems = useMemo(() => {
    const map = new Map<
      string,
      {
        url: string;
        caption?: string;
        type: string;
        used: boolean;
        mediaIndex?: number;
      }
    >();

    // Every media image, keyed by URL, so unit-config references can find
    // their mediaIndex even if the underlying media item isn't (or is no
    // longer) tagged "floorplan".
    const mediaIndexByUrl = new Map<string, number>();
    (project?.media || []).forEach((item: IMedia, idx: number) => {
      if (item?.type === "image" && item.image?.url && !mediaIndexByUrl.has(item.image.url)) {
        mediaIndexByUrl.set(item.image.url, idx);
      }
    });

    (project?.media || []).forEach((item: IMedia, idx: number) => {
      if (item?.type === "image" && item.image?.tags?.includes("floorplan")) {
        map.set(item.image.url, {
          url: item.image.url,
          caption: item.image.caption,
          type: "",
          used: false,
          mediaIndex: idx,
        });
      }
    });

    (project?.info?.unitConfigWithPricing || []).forEach((unitConfig) => {
      (unitConfig.floorplans || []).forEach((url) => {
        const existing = map.get(url);
        if (existing) {
          existing.used = true;
          existing.type = (unitConfig as any).type || existing.type;
        } else {
          map.set(url, {
            url,
            type: (unitConfig as any).type || "",
            used: true,
            mediaIndex: mediaIndexByUrl.get(url),
          });
        }
      });
    });

    return Array.from(map.values()).sort(
      (a, b) => Number(b.used) - Number(a.used),
    );
  }, [project]);

  const floorplanByUrl = useMemo(
    () => new Map(floorplanItems.map((item) => [item.url, item])),
    [floorplanItems],
  );

  const screens = useBreakpoint();

  if (projectIsLoading) {
    return <Loader />;
  }

  if (visibleTabs) {
    return (
      <Form form={form} layout="vertical">
        {project && (
          <Typography.Title style={{ marginBottom: 20 }} level={3}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => window.history.back()}
              style={{ marginRight: 16 }}
            ></Button>
            {project?.info.name}
          </Typography.Title>
        )}

        <Tabs defaultActiveKey="basicInfo">
          {Object.entries(visibleTabs || {}).map(([key, fields], index) => {
            const fieldStatus = calculateFieldStatus(
              fields as FieldType[],
              "info",
              form,
            );

            return (
              <TabPane
                tab={
                  <Typography.Text style={{ fontSize: 16 }}>
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}{" "}
                  </Typography.Text>
                }
                key={key}
                disabled={!projectId && index !== 0}
              >
                <RenderFields
                  form={form}
                  fields={fields as FieldType[]}
                  category="info"
                  isMobile={isMobile}
                  fieldRules={fieldRules}
                  onFloorplanUpload={onFloorplanUpload}
                  disabledFields={disabledFields}
                  onAutoSave={(category, dbField, newValue) => {
                    if (!projectId) return;
                    const keys = Array.isArray(dbField) ? dbField : [dbField];
                    const infoUpdate = keys.reduceRight(
                      (acc: any, key: string) => ({ [key]: acc }),
                      newValue,
                    );
                    updateProject.mutate({ projectData: { [category]: infoUpdate } });
                  }}
                />
              </TabPane>
            );
          })}

          <TabPane
            tab={
              <Typography.Text style={{ fontSize: 16 }}>Media</Typography.Text>
            }
            key={"media"}
            disabled={!projectId}
          >
            <Tabs defaultActiveKey="images">
              <TabPane tab={"Images"} key={"images"}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                  <Space align="center">
                    <AppstoreOutlined />
                    <Switch
                      checked={imageViewMode === "table"}
                      onChange={(checked) => setImageViewMode(checked ? "table" : "default")}
                    />
                    <TableOutlined />
                  </Space>
                  <Space>
                    {selectedMediaIndices.size > 0 && (
                      <>
                        <Button
                          icon={<ScissorOutlined />}
                          loading={bulkWatermarkLoading}
                          onClick={() => setBulkWatermarkConfirmVisible(true)}
                        >
                          Remove Watermark ({selectedMediaIndices.size})
                        </Button>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => setDeleteConfirmVisible(true)}
                        >
                          Delete ({selectedMediaIndices.size})
                        </Button>
                      </>
                    )}
                    <ImagePdfUpload
                      onUploadComplete={(
                        urls: string[],
                        originalNames: string[],
                        captions: string[],
                      ) =>
                        onUploadComplete(
                          urls,
                          originalNames,
                          undefined,
                          "image",
                          captions,
                        )
                      }
                      button={{
                        label: "Upload Images",
                        type: "primary",
                      }}
                    />
                  </Space>
                </Flex>

                {imageViewMode === "default" ? (
                  <Flex
                    gap={48}
                    style={{ width: "100%", maxHeight: 550, overflowY: "scroll" }}
                    wrap="wrap"
                  >
                    {project?.media?.map((item: IMedia, index) => {
                      if (isNonFloorplanImage(item)) {
                        return (
                          <Flex
                            key={item._id || index}
                            gap={8}
                            align="center"
                            style={{
                              border: selectedMediaIndices.has(index)
                                ? "2px solid #1677ff"
                                : item.hasWatermark
                                  ? `2px solid ${COLORS.redIdentifier}`
                                  : "none",
                              borderRadius: 8,
                              padding: 8,
                            }}
                          >
                            <Checkbox
                              checked={selectedMediaIndices.has(index)}
                              onChange={() => handleToggleSelect(index)}
                            />
                            <Image
                              width={150}
                              src={item.image?.url}
                              alt={item._id}
                              style={{
                                borderRadius: 10,
                                objectFit: "cover",
                                aspectRatio: "1 / 1",
                              }}
                            />
                            <Flex
                              vertical
                              justify="center"
                              style={{ width: 300 }}
                            >
                              <Form.Item
                                name={["media", index, "type"]}
                                label="Type"
                                hidden
                              ></Form.Item>
                              <Form.Item
                                name={["media", index, "hasWatermark"]}
                                label="Has Watermark ?"
                                hidden
                              ></Form.Item>
                              <Form.Item
                                name={["media", index, "image", "url"]}
                                label="Tags"
                                hidden
                              ></Form.Item>
                              <Flex gap={8}>
                                <Form.Item
                                  name={["media", index, "image", "tags"]}
                                  label="Tags"
                                  style={{ width: "100%" }}
                                >
                                  <Select
                                    style={{
                                      width: "100%",
                                      maxWidth: screens.lg ? "600px" : "100%",
                                    }}
                                    placeholder="Enter tags"
                                    options={MediaTags.map((tag) => ({
                                      value: tag,
                                      label: tag,
                                    }))}
                                  />
                                </Form.Item>

                                <Form.Item
                                  name={["media", index, "image", "caption"]}
                                  label="Caption"
                                  style={{ width: "100%" }}
                                >
                                  <Input
                                    style={{
                                      width: "100%",
                                      maxWidth: screens.lg ? "600px" : "100%",
                                    }}
                                    placeholder="Enter caption"
                                  />
                                </Form.Item>
                              </Flex>

                              <Flex>
                                <Form.Item name={["media", index, "isPreview"]}>
                                  <Checkbox
                                    checked={index === previewImageIndex}
                                    onChange={(e) =>
                                      handlePreviewImageChange(
                                        index,
                                        e.target.checked,
                                      )
                                    }
                                  >
                                    Preview
                                  </Checkbox>
                                </Form.Item>

                                <FileUpload
                                  onUploadComplete={(
                                    urls: string[],
                                    originalNames: string[],
                                  ) =>
                                    onUploadComplete(
                                      urls,
                                      originalNames,
                                      index,
                                      "image",
                                    )
                                  }
                                  fileType="image"
                                  isMultiple={false}
                                  button={{
                                    label: "",
                                  }}
                                />

                                <Button
                                  icon={<ScissorOutlined />}
                                  style={{
                                    marginRight: 10,
                                  }}
                                  onClick={() =>
                                    handleRemoveWatermark(
                                      item.image?.url || "",
                                      index,
                                    )
                                  }
                                  loading={
                                    removeWatermarkMutation.isPending &&
                                    watermarkModal.mediaIndex === index
                                  }
                                  title="Remove Watermark"
                                />

                                <Button
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleDeleteMedia(index)}
                                ></Button>
                              </Flex>
                            </Flex>
                          </Flex>
                        );
                      }
                    })}
                  </Flex>
                ) : (
                  <DndContext
                    sensors={sensors}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                  >
                  <SortableContext
                    items={(project?.media || [])
                      .map((item: IMedia, i: number) => ({ item, i }))
                      .filter(({ item }: { item: IMedia; i: number }) => isNonFloorplanImage(item))
                      .map(({ i }: { item: IMedia; i: number }) => String(i))}
                    strategy={verticalListSortingStrategy}
                  >
                  <Table
                    size="small"
                    pagination={false}
                    scroll={{ y: 500 }}
                    dataSource={project?.media
                      ?.map((item: IMedia, index: number) => ({ item, index }))
                      .filter(({ item }) => isNonFloorplanImage(item))}
                    rowKey={({ index }) => String(index)}
                    components={{ body: { row: DraggableRow } }}
                    columns={[
                      {
                        key: "sort",
                        width: 40,
                        render: () => null,
                      },
                      {
                        title: () => {
                          const imageIndices = (project?.media || [])
                            .map((item: IMedia, i: number) => ({ item, i }))
                            .filter(({ item }: { item: IMedia; i: number }) => isNonFloorplanImage(item))
                            .map(({ i }: { item: IMedia; i: number }) => i);
                          const allSelected =
                            imageIndices.length > 0 &&
                            imageIndices.every((i: number) => selectedMediaIndices.has(i));
                          const someSelected =
                            !allSelected && imageIndices.some((i: number) => selectedMediaIndices.has(i));
                          return (
                            <Checkbox
                              checked={allSelected}
                              indeterminate={someSelected}
                              onChange={() => {
                                if (allSelected) {
                                  setSelectedMediaIndices(new Set());
                                } else {
                                  setSelectedMediaIndices(new Set(imageIndices));
                                }
                              }}
                            />
                          );
                        },
                        width: 40,
                        render: ({ index }: { item: IMedia; index: number }) => (
                          <Checkbox
                            checked={selectedMediaIndices.has(index)}
                            onChange={() => handleToggleSelect(index)}
                          />
                        ),
                      },
                      {
                        title: "Image",
                        width: 100,
                        render: ({ item, index }: { item: IMedia; index: number }) => (
                          <>
                            <Form.Item
                              name={["media", index, "type"]}
                              hidden
                            ></Form.Item>
                            <Form.Item
                              name={["media", index, "hasWatermark"]}
                              hidden
                            ></Form.Item>
                            <Form.Item
                              name={["media", index, "image", "url"]}
                              hidden
                            ></Form.Item>
                            <Image
                              width={80}
                              src={item.image?.url}
                              alt={item._id}
                              style={{
                                borderRadius: 6,
                                objectFit: "cover",
                                aspectRatio: "1 / 1",
                                outline: item.hasWatermark
                                  ? `2px solid ${COLORS.redIdentifier}`
                                  : undefined,
                              }}
                            />
                          </>
                        ),
                      },
                      {
                        title: "Tags",
                        render: ({ index }: { item: IMedia; index: number }) => (
                          <Form.Item
                            name={["media", index, "image", "tags"]}
                            style={{ margin: 0 }}
                          >
                            <Select
                              style={{ width: 180 }}
                              placeholder="Enter tags"
                              options={MediaTags.map((tag) => ({
                                value: tag,
                                label: tag,
                              }))}
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: "Caption",
                        render: ({ index }: { item: IMedia; index: number }) => (
                          <Form.Item
                            name={["media", index, "image", "caption"]}
                            style={{ margin: 0 }}
                          >
                            <Input placeholder="Enter caption" style={{ width: 180 }} />
                          </Form.Item>
                        ),
                      },
                      {
                        title: "Preview",
                        width: 90,
                        render: ({ index }: { item: IMedia; index: number }) => (
                          <Form.Item
                            name={["media", index, "isPreview"]}
                            style={{ margin: 0 }}
                          >
                            <Checkbox
                              checked={index === previewImageIndex}
                              onChange={(e) =>
                                handlePreviewImageChange(index, e.target.checked)
                              }
                            >
                              Preview
                            </Checkbox>
                          </Form.Item>
                        ),
                      },
                      {
                        title: "Watermark",
                        width: 110,
                        render: ({ index }: { item: IMedia; index: number }) => (
                          <FileUpload
                            onUploadComplete={(urls: string[], originalNames: string[]) =>
                              onUploadComplete(urls, originalNames, index, "image")
                            }
                            fileType="image"
                            isMultiple={false}
                            button={{ label: "" }}
                          />
                        ),
                      },
                      {
                        title: "Actions",
                        width: 100,
                        render: ({ item, index }: { item: IMedia; index: number }) => (
                          <Space>
                            <Button
                              icon={<ScissorOutlined />}
                              onClick={() =>
                                handleRemoveWatermark(item.image?.url || "", index)
                              }
                              loading={
                                removeWatermarkMutation.isPending &&
                                watermarkModal.mediaIndex === index
                              }
                              title="Remove Watermark"
                            />
                            <Button
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteMedia(index)}
                            />
                          </Space>
                        ),
                      },
                    ]}
                  />
                  </SortableContext>
                  </DndContext>
                )}

                <Modal
                  title={`Delete ${selectedMediaIndices.size} image(s)?`}
                  open={deleteConfirmVisible}
                  onCancel={() => setDeleteConfirmVisible(false)}
                  onOk={handleBulkDelete}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                >
                  <Typography.Text>
                    The following images will be permanently deleted:
                  </Typography.Text>
                  <Flex
                    gap={8}
                    style={{
                      marginTop: 12,
                      overflowX: "auto",
                      paddingBottom: 8,
                    }}
                  >
                    {Array.from(selectedMediaIndices).map((idx) => {
                      const mediaItem = project?.media?.[idx];
                      return mediaItem ? (
                        <img
                          key={idx}
                          src={mediaItem.image?.url}
                          alt={`Selected ${idx}`}
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: "cover",
                            borderRadius: 6,
                            flexShrink: 0,
                          }}
                        />
                      ) : null;
                    })}
                  </Flex>
                </Modal>

                <Modal
                  title={`Remove watermark from ${selectedMediaIndices.size} image(s)?`}
                  open={bulkWatermarkConfirmVisible}
                  onCancel={() => setBulkWatermarkConfirmVisible(false)}
                  onOk={handleBulkRemoveWatermark}
                  okText="Remove"
                  confirmLoading={bulkWatermarkLoading}
                >
                  <Typography.Text>
                    Processed images will replace the originals directly. This
                    cannot be undone.
                  </Typography.Text>
                </Modal>

                {/* Hot fix for video getting deleted on image save  */}
                <div
                  style={{
                    visibility: "hidden",
                    position: "absolute",
                    width: 0,
                    height: 0,
                    overflow: "hidden",
                  }}
                >
                  <VideoUpload
                    form={form}
                    projectId={projectId}
                    project={project!}
                    allTags={MediaTags}
                  />

                  <DocumentsList
                    project={project!}
                    onUploadComplete={onUploadComplete}
                    handleDeleteMedia={handleDeleteMedia}
                  />
                </div>
              </TabPane>

              <TabPane tab={"Floorplans"} key={"floorplans"}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                  <Space align="center">
                    <AppstoreOutlined />
                    <Switch
                      checked={floorplanViewMode === "table"}
                      onChange={(checked) => setFloorplanViewMode(checked ? "table" : "default")}
                    />
                    <TableOutlined />
                  </Space>
                  {selectedFloorplanUrls.size > 0 && (
                    <Space>
                      <Button
                        icon={<ScissorOutlined />}
                        loading={floorplanBulkWatermarkLoading}
                        onClick={() => setFloorplanBulkWatermarkConfirmVisible(true)}
                      >
                        Remove Watermark ({selectedFloorplanUrls.size})
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => setFloorplanDeleteConfirmVisible(true)}
                      >
                        Delete ({selectedFloorplanUrls.size})
                      </Button>
                    </Space>
                  )}
                </Flex>

                {floorplanItems.length === 0 ? (
                  <Typography.Text type="secondary">
                    No floorplan images found. Tag images as "floorplan" in
                    the Images tab or add them via unit configurations.
                  </Typography.Text>
                ) : floorplanViewMode === "default" ? (
                  <Image.PreviewGroup>
                    <Flex
                      gap={24}
                      style={{
                        width: "100%",
                        maxHeight: 550,
                        overflowY: "scroll",
                      }}
                      wrap="wrap"
                    >
                      {floorplanItems.map((item) => {
                        return (
                          <Flex
                            key={item.url}
                            vertical
                            align="center"
                            gap={8}
                            style={{ width: 180 }}
                          >
                            <div style={{ position: "relative" }}>
                              <Image
                                width={160}
                                height={120}
                                src={item.url}
                                style={{ borderRadius: 8, objectFit: "cover" }}
                              />
                              <Checkbox
                                checked={selectedFloorplanUrls.has(item.url)}
                                onChange={() =>
                                  handleFloorplanToggleSelect(item.url)
                                }
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  left: 4,
                                }}
                              />
                              {item.used && (
                                <div
                                  title="Used in a unit configuration"
                                  style={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    background: "#fff",
                                    borderRadius: "50%",
                                    width: 22,
                                    height: 22,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 0 2px rgba(0,0,0,0.4)",
                                  }}
                                >
                                  <DynamicReactIcon
                                    iconSet="io"
                                    iconName="IoIosCheckmarkCircle"
                                    color={COLORS.textColorDark}
                                    size={20}
                                  />
                                </div>
                              )}
                            </div>
                          </Flex>
                        );
                      })}
                    </Flex>
                  </Image.PreviewGroup>
                ) : (
                  <Table
                    size="small"
                    pagination={false}
                    scroll={{ y: 500 }}
                    dataSource={floorplanItems}
                    rowKey={(item) => item.url}
                    columns={[
                      {
                        title: () => {
                          const allUrls = floorplanItems.map(
                            (item) => item.url,
                          );
                          const allSelected =
                            allUrls.length > 0 &&
                            allUrls.every((url) =>
                              selectedFloorplanUrls.has(url),
                            );
                          const someSelected =
                            !allSelected &&
                            allUrls.some((url) =>
                              selectedFloorplanUrls.has(url),
                            );
                          return (
                            <Checkbox
                              checked={allSelected}
                              indeterminate={someSelected}
                              disabled={allUrls.length === 0}
                              onChange={() => {
                                if (allSelected) {
                                  setSelectedFloorplanUrls(new Set());
                                } else {
                                  setSelectedFloorplanUrls(new Set(allUrls));
                                }
                              }}
                            />
                          );
                        },
                        width: 40,
                        render: (item: (typeof floorplanItems)[number]) => (
                          <Checkbox
                            checked={selectedFloorplanUrls.has(item.url)}
                            onChange={() =>
                              handleFloorplanToggleSelect(item.url)
                            }
                          />
                        ),
                      },
                      {
                        title: "Image",
                        width: 100,
                        render: (item: (typeof floorplanItems)[number]) => (
                          <Image
                            width={80}
                            src={item.url}
                            style={{
                              borderRadius: 6,
                              objectFit: "cover",
                              aspectRatio: "1 / 1",
                            }}
                          />
                        ),
                      },
                      {
                        title: "Unit Type",
                        dataIndex: "type",
                        render: (type: string | undefined) => type || "—",
                      },
                      {
                        title: "Used",
                        width: 90,
                        render: (item: (typeof floorplanItems)[number]) =>
                          item.used ? (
                            <DynamicReactIcon
                              iconSet="io"
                              iconName="IoIosCheckmarkCircle"
                              color={COLORS.textColorDark}
                              size={20}
                            />
                          ) : (
                            "—"
                          ),
                      }
                      
                    ]}
                  />
                )}

                <Modal
                  title={`Delete ${
                    Array.from(selectedFloorplanUrls).filter(
                      (url) => !floorplanByUrl.get(url)?.used,
                    ).length
                  } image(s)?`}
                  open={floorplanDeleteConfirmVisible}
                  onCancel={() => setFloorplanDeleteConfirmVisible(false)}
                  onOk={handleFloorplanBulkDelete}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                >
                  <Typography.Text>
                    The following images will be permanently deleted:
                  </Typography.Text>
                  <Flex
                    gap={8}
                    style={{
                      marginTop: 12,
                      overflowX: "auto",
                      paddingBottom: 8,
                    }}
                  >
                    {Array.from(selectedFloorplanUrls)
                      .filter((url) => !floorplanByUrl.get(url)?.used)
                      .map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt="Selected"
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: "cover",
                            borderRadius: 6,
                            flexShrink: 0,
                          }}
                        />
                      ))}
                  </Flex>
                  {Array.from(selectedFloorplanUrls).some(
                    (url) => floorplanByUrl.get(url)?.used,
                  ) && (
                    <Typography.Text
                      type="secondary"
                      style={{ display: "block", marginTop: 12 }}
                    >
                      Images used in a unit configuration will be skipped.
                    </Typography.Text>
                  )}
                </Modal>

                <Modal
                  title={`Remove watermark from ${selectedFloorplanUrls.size} image(s)?`}
                  open={floorplanBulkWatermarkConfirmVisible}
                  onCancel={() => setFloorplanBulkWatermarkConfirmVisible(false)}
                  onOk={handleFloorplanBulkRemoveWatermark}
                  okText="Remove"
                  confirmLoading={floorplanBulkWatermarkLoading}
                >
                  <Typography.Text>
                    Processed images will replace the originals directly. This
                    cannot be undone.
                  </Typography.Text>
                </Modal>
              </TabPane>

              <TabPane tab={"Videos"} key={"videos"}>
                <VideoUpload
                  form={form}
                  projectId={projectId}
                  project={project!}
                  allTags={MediaTags}
                />
              </TabPane>
            </Tabs>
          </TabPane>

          <TabPane
            tab={
              <Typography.Text style={{ fontSize: 16 }}>
                Documents
              </Typography.Text>
            }
            key={"documents"}
            disabled={!projectId}
          >
            <Tabs defaultActiveKey="project-documents">
              <TabPane tab={"Project Documents"} key={"project-documents"}>
                <DocumentsList
                  project={project!}
                  onUploadComplete={onUploadComplete}
                  handleDeleteMedia={handleDeleteMedia}
                />
              </TabPane>

              <TabPane tab={"RERA Documents"} key={"rera-documents"}>
                {(() => {
                  const reraId =
                    typeof project?.info?.reraProjectId === "object"
                      ? (project?.info?.reraProjectId as any)?._id
                      : (project?.info?.reraProjectId as string | undefined);
                  const reraNumber =
                    project?.info?.reraNumber ||
                    (typeof project?.info?.reraProjectId === "object"
                      ? (project?.info?.reraProjectId as any)?.projectDetails
                          ?.projectRegistrationNumber
                      : undefined);

                  if (!reraId && !reraNumber) {
                    return (
                      <Typography.Text type="secondary">
                        No RERA project linked to this project.
                      </Typography.Text>
                    );
                  }

                  return (
                    <Table
                      dataSource={[
                        { key: `r-${reraNumber}`, reraNumber },
                        ...(project?.info?.otherPhasesRera
                          ? project.info.otherPhasesRera.split(",").map((r) => {
                              return { key: `r-${reraNumber}`, reraNumber: r };
                            })
                          : []),
                      ]}
                      pagination={false}
                      columns={[
                        {
                          title: "RERA Number",
                          dataIndex: "reraNumber",
                          key: "reraNumber",
                          render: (val: string | undefined) => (
                            <Typography.Text copyable={!!val}>
                              {val || "—"}
                            </Typography.Text>
                          ),
                        },
                        {
                          title: "",
                          key: "actions",
                          align: "right",
                          render: () => (
                            <Button
                              type="primary"
                              icon={<FileTextOutlined />}
                              onClick={() => setReraDocsModalOpen(true)}
                            >
                              View Documents
                            </Button>
                          ),
                        },
                      ]}
                    />
                  );
                })()}
              </TabPane>
            </Tabs>
          </TabPane>
        </Tabs>
        <Button
          type="primary"
          style={{ marginTop: 16 }}
          onClick={handleSave}
          loading={createProject.isPending || updateProject.isPending}
        >
          {projectId ? "Save" : "Create New Project"}
        </Button>

        <WatermarkPreviewModal
          visible={watermarkModal.visible}
          originalImageUrl={watermarkModal.originalUrl}
          processedImageUrl={watermarkModal.processedUrl}
          loading={removeWatermarkMutation.isPending}
          onApprove={handleApproveWatermarkRemoval}
          onReject={handleRejectWatermarkRemoval}
        />

        <ReraDocumentsModal
          open={reraDocsModalOpen}
          onClose={() => setReraDocsModalOpen(false)}
          reraProjectId={
            typeof project?.info?.reraProjectId === "object"
              ? (project?.info?.reraProjectId as any)?._id
              : (project?.info?.reraProjectId as string | undefined)
          }
          reraNumber={project?.info?.reraNumber}
          projectName={project?.info?.name}
        />
      </Form>
    );
  }
}
