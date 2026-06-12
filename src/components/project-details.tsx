import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";

import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DeleteRowOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  ScissorOutlined,
} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import { useNavigate } from "react-router-dom";
import { useRemoveWatermark } from "../hooks/dewatermark-hooks";
import {
  useCreateProjectMutation,
  useProjectForm,
  useUpdateProjectMutation,
} from "../hooks/project-hooks";
import { useDevice } from "../hooks/use-device";
import { baseApiUrl, MediaTags } from "../libs/constants";
import { queries } from "../libs/queries";
import { calculateFieldStatus } from "../libs/utils";
import { COLORS } from "../theme/colors";
import {
  IMedia,
  Project,
  ProjectField,
  ProjectStructure,
} from "../types/Project";
import DynamicReactIcon from "./common/dynamic-react-icon";
import { FileUpload } from "./common/img-upload";
import { Loader } from "./common/loader";
import { DocumentsList } from "./media-tabs/documents-list";
import { ReraDocumentsModal } from "./rera-projects/rera-documents-modal";
import { VideoUpload } from "./media-tabs/video-tab";
import { JsonEditor } from "./update-json-modal";
import WatermarkPreviewModal from "./watermark-preview-modal";

const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

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
}> = ({ fields, category, isMobile, fieldRules, form, onFloorplanUpload, disabledFields }) => (
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
                    }}
                    media={form.getFieldValue("media") || []}
                    onFloorplanUpload={onFloorplanUpload}
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

  const { fieldRules, projectFields } = useProjectForm();

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

  const removeWatermarkMutation = useRemoveWatermark();

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
                caption: "",
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
          ...(totalFloorplanUpdates > 0 && { info: form.getFieldValue("info") }),
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
    "otherDetails.expectedLaunchDate": !!watchReraNumber,
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
                <Flex justify="end" style={{ marginBottom: 16, gap: 8 }}>
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
                  <FileUpload
                    onUploadComplete={(
                      urls: string[],
                      originalNames: string[],
                    ) =>
                      onUploadComplete(urls, originalNames, undefined, "image")
                    }
                    fileType="image"
                    button={{
                      label: "Upload Images",
                      type: "primary",
                    }}
                  />
                </Flex>

                <Flex
                  gap={48}
                  style={{ width: "100%", maxHeight: 550, overflowY: "scroll" }}
                  wrap="wrap"
                >
                  {project?.media?.map((item: IMedia, index) => {
                    if (item?.type === "image") {
                      return (
                        <Flex
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
