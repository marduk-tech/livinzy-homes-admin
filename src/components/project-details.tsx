import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { UnitConfigList } from "./unit-config-list";

import {
  Button,
  Checkbox,
  Col,
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
  Tabs,
  Tag,
  Typography,
} from "antd";

import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import { useNavigate } from "react-router-dom";
import {
  useCreateProjectMutation,
  useGenerateProjectUI,
  useProjectForm,
  useUpdateProjectMutation,
} from "../hooks/project-hooks";
import { useDevice } from "../hooks/use-device";
import { baseApiUrl, MediaTags } from "../libs/constants";
import { queries } from "../libs/queries";
import { calculateFieldStatus } from "../libs/utils";
import { COLORS } from "../theme/colors";
import DynamicReactIcon from "./common/dynamic-react-icon";
import {
  IMedia,
  Project,
  ProjectField,
  ProjectStructure,
} from "../types/Project";
import { FileUpload } from "./common/img-upload";
import { Loader } from "./common/loader";
import { DocumentsList } from "./media-tabs/documents-list";
import { ReraDocumentsList } from "./media-tabs/rera-documents-list";
import { VideoUpload } from "./media-tabs/video-tab";
import { JsonEditor } from "./update-json-modal";

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
}> = ({ fields, category, isMobile, fieldRules, form }) => (
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
                    <Typography.Text style={{fontWeight: "bold"}}>{fieldDisplayName}</Typography.Text>
                    {mustHave ? <Tag color="volcano">Must Have</Tag> : null}
                    {type === "json" && (
                      <JsonEditor
                        title={`Edit ${fieldDisplayName}`}
                        initialJson={form.getFieldValue(
                          Array.isArray(dbField)
                            ? [category, ...dbField]
                            : [category, dbField]
                        )}
                        onJsonChange={(data) => {
                          form.setFieldValue(
                            Array.isArray(dbField)
                              ? [category, ...dbField]
                              : [category, dbField],
                            data
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
                          const mapLink = form.getFieldValue([category, ...dbField]);
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
                        : [category, dbField]
                    )}
                    onChange={(value) => {
                      form.setFieldValue(
                        Array.isArray(dbField)
                          ? [category, ...dbField]
                          : [category, dbField],
                        value
                      );
                    }}
                    media={form.getFieldValue("media") || []}
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
                        value
                      );
                    }}
                  />
                ) : type == "text" ? (
                  <TextArea rows={5} placeholder={fieldDescription} />
                ) : (
                  <Input placeholder={fieldDescription} />
                )}
              </Form.Item>
            </Col>
          );
      }
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
  });

  // const { data: allProjects, isLoading: allProjectsLoading } = useQuery({
  //   ...queries.getAllProjects(),
  //   enabled: !!projectId,
  // });

  const createProject = useCreateProjectMutation();
  const updateProject = useUpdateProjectMutation({
    projectId: projectId || "",
  });

  const generateProjectUI = useGenerateProjectUI();

  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(
    null
  );

  const handlePreviewImageChange = (index: number, checked: boolean) => {
    if (checked) {
      setPreviewImageIndex(index);
    } else {
      setPreviewImageIndex(null);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (projectData && projectData.info && projectData.info.location) {
        if (values.info.location.mapLink == projectData.info.location) {
          values.info.location = {
            ...projectData.info.location,
            ...values.info.location,
          };
        }
      }

      // Preserving other layout values. 
      if (projectData?.info.layout) {
        values.info.layout = {
          ...projectData.info.layout,
          ...values.info.layout
        }
      }

      // add corridors to info
      if (
        projectId &&
        projectData &&
        projectData.info &&
        projectData.info.corridors
      ) {
        values.info = {
          ...projectData.info,
          ...values.info,
        };
      }

      let updatedMedia;
      if (values.media) {
        updatedMedia = values.media.map((item: IMedia, index: number) => ({
          ...item,
          isPreview: index === previewImageIndex,
        }));
      }

      // format hometype
      if (values.info.homeType && !Array.isArray(values.info.homeType)) {
        values.info.homeType = [values.info.homeType];
      }

      if (projectId) {
        if (updatedMedia) {
          updateProject.mutate({
            projectData: { ...values, media: updatedMedia },
          });
        } else {
          updateProject.mutate({
            projectData: { ...values },
          });
        }
      } else {
        await createProject
          .mutateAsync({ ...values, media: updatedMedia })
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
    mediaType: "image" | "document" | "video" = "image"
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

  const watchHomeType = Form.useWatch(["info", "homeType"], form);

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
      })
    ) as ProjectStructure;

    setVisibleTabs(filteredFields);
  }, [watchHomeType, form, projectFields]);

  useEffect(() => {
    if (!projectData && project) {
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
      setProjectData(project);

      const initialPreviewIndex = project.media.findIndex(
        (item: IMedia) => item.isPreview
      );
      setPreviewImageIndex(
        initialPreviewIndex >= 0 ? initialPreviewIndex : null
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
              form
            );

            return (
              <TabPane
                tab={
                  <Typography.Text style={{fontSize: 16}}>
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
                />
              </TabPane>
            );
          })}

          {/* <TabPane tab={"Documents"} key={"documents"} disabled={!projectId}>
            {project && (
              <DocumentsList
                project={project}
                onUploadComplete={onUploadComplete}
                handleDeleteMedia={handleDeleteMedia}
              />
            )}
          </TabPane> */}

          <TabPane tab={<Typography.Text style={{fontSize: 16}}>Media</Typography.Text>} key={"media"} disabled={!projectId}>
            <Tabs defaultActiveKey="images">
              <TabPane tab={"Images"} key={"images"}>
                <Flex justify="end" style={{ marginBottom: 16, gap: 20 }}>
                  <FileUpload
                    onUploadComplete={(
                      urls: string[],
                      originalNames: string[]
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

                {project?.media?.map((item: IMedia, index) => {
                  if (item?.type === "image") {
                    return (
                      <Row
                        gutter={[16, 16]}
                        key={item._id}
                        style={{
                          marginBottom: 24,
                          alignItems: "stretch",
                          borderBottom: "1px solid #f0f0f0",
                          paddingBottom: 24,
                        }}
                      >
                        <Col xs={24} sm={24} md={6} lg={4} xl={4}>
                          <Image
                            width="100%"
                            src={item.image?.url}
                            alt={item._id}
                            style={{
                              borderRadius: 10,
                              objectFit: "cover",
                              aspectRatio: "1 / 1",
                            }}
                          />
                        </Col>
                        <Col xs={24} sm={24} md={18} lg={20} xl={20}>
                          <Flex
                            vertical
                            justify="center"
                            style={{ height: "100%" }}
                          >
                            <Form.Item
                              name={["media", index, "type"]}
                              label="Type"
                              hidden
                            ></Form.Item>
                            <Form.Item
                              name={["media", index, "image", "url"]}
                              label="Tags"
                              hidden
                            ></Form.Item>
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

                            <Form.Item name={["media", index, "isPreview"]}>
                              <Checkbox
                                checked={index === previewImageIndex}
                                onChange={(e) =>
                                  handlePreviewImageChange(
                                    index,
                                    e.target.checked
                                  )
                                }
                              >
                                Preview Image
                              </Checkbox>
                            </Form.Item>

                            <Flex wrap="wrap">
                              <FileUpload
                                onUploadComplete={(
                                  urls: string[],
                                  originalNames: string[]
                                ) =>
                                  onUploadComplete(
                                    urls,
                                    originalNames,
                                    index,
                                    "image"
                                  )
                                }
                                fileType="image"
                                isMultiple={false}
                                button={{
                                  label: "Update Image",
                                }}
                              />

                              <Button onClick={() => handleDeleteMedia(index)}>
                                Delete Image
                              </Button>
                            </Flex>
                          </Flex>
                        </Col>
                      </Row>
                    );
                  }
                })}

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

          <TabPane tab={<Typography.Text style={{fontSize: 16}}>Documents</Typography.Text>} key={"documents"} disabled={!projectId}>
            <Tabs defaultActiveKey="project-documents">
              <TabPane tab={"Project Documents"} key={"project-documents"}>
                <DocumentsList
                  project={project!}
                  onUploadComplete={onUploadComplete}
                  handleDeleteMedia={handleDeleteMedia}
                />
              </TabPane>

              <TabPane tab={"RERA Documents"} key={"rera-documents"}>
                <ReraDocumentsList
                  reraProjectId={project?.info?.reraProjectId}
                />
              </TabPane>
            </Tabs>
          </TabPane>
        </Tabs>

        <Button
          type="primary"
          onClick={handleSave}
          loading={createProject.isPending || updateProject.isPending}
        >
          {projectId ? "Save" : "Create New Project"}
        </Button>
      </Form>
    );
  }
}
