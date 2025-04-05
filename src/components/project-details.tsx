import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

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
  Tabs,
  Tag,
  Typography,
} from "antd";

import { ArrowLeftOutlined } from "@ant-design/icons";
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
import {
  IMedia,
  Project,
  ProjectField,
  ProjectStructure,
} from "../types/Project";
import { ImgUpload } from "./common/img-upload";
import { Loader } from "./common/loader";
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
                    <Typography.Text>{fieldDisplayName}</Typography.Text>
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
                {type === "single_select" || type == "multi_select" ? (
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
                ): (
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

      // add corridors to info
      if (
        projectId &&
        projectData &&
        projectData.info &&
        projectData.info.corridors
      ) {
        values.info = {
          ...values.info,
          corridors: projectData.info.corridors,
          reraProjectId: projectData.info.reraProjectId,
          developerId: projectData.info.developerId,
          refinedContent: projectData.info.refinedContent
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
      if (
        values.info.homeType &&
        !Array.isArray(values.info.homeType)
      ) {
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

  const onUploadComplete = (urls: string[], index?: number) => {
    notification.success({
      message: `${urls.length} images uploaded successfully`,
    });

    const currentMedia = form.getFieldValue("media") || [];

    if (index !== undefined) {
      // Update existing media
      currentMedia[index].image.url = urls[0];
    } else {
      // Add new media
      const newMedia = urls.map((url) => ({
        type: "image",
        image: {
          url,
          tags: [],
          caption: "",
        },
      }));
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
  }, [watchHomeType, form]);

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

        <Tabs defaultActiveKey="info">
          {Object.entries(visibleTabs || {}).map(([key, fields], index) => {
            const fieldStatus = calculateFieldStatus(
              fields as FieldType[],
              key,
              form
            );

            return (
              <TabPane
                tab={
                  <span>
                    {key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                    <Tag
                      style={{
                        borderRadius: "100px",
                        marginLeft: 5,
                      }}
                      color={
                        fieldStatus.badgeStatus === "success"
                          ? "green"
                          : fieldStatus.badgeStatus === "warning"
                          ? "orange"
                          : "red"
                      }
                    >
                      {`${fieldStatus.filledFieldsCount}/${fieldStatus.totalVisibleFields}`}
                    </Tag>
                  </span>
                }
                key={key}
                disabled={!projectId && index !== 0}
              >
                <RenderFields
                  form={form}
                  fields={fields as FieldType[]}
                  category={key}
                  isMobile={isMobile}
                  fieldRules={fieldRules}
                />
              </TabPane>
            );
          })}

          <TabPane tab={"Media"} key={"media"} disabled={!projectId}>
            <Tabs defaultActiveKey="images">
              <TabPane tab={"Images"} key={"images"}>
                <Flex justify="end" style={{ marginBottom: 16, gap: 20 }}>
                  <ImgUpload
                    onUploadComplete={onUploadComplete}
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
                              <ImgUpload
                                onUploadComplete={(urls) =>
                                  onUploadComplete(urls, index)
                                }
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
