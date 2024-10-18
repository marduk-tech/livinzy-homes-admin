import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  Button,
  Col,
  Flex,
  Form,
  Grid,
  Image,
  Input,
  notification,
  Row,
  Select,
  Tabs,
  Tag,
  Typography,
} from "antd";

import { DeleteOutlined, RedoOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  useCreateProjectMutation,
  useGenerateProjectUI,
  useProjectForm,
  useUpdateProjectMutation,
} from "../hooks/project-hooks";
import { useDevice } from "../hooks/use-device";
import { baseApiUrl } from "../libs/constants";
import { queries } from "../libs/queries";
import { IMedia, Project } from "../types/Project";
import { ImgUpload } from "./common/img-upload";
import { Loader } from "./common/loader";
import TextArea from "antd/es/input/TextArea";

const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

interface ProjectFormProps {
  projectId?: string;
}

const RenderFields: React.FC<{
  fields: {
    dbField: string;
    fieldDisplayName: string;
    fieldDescription: string;
    mustHave: boolean;
    hide: boolean;
  }[];
  category: string;
  isMobile: boolean;
  fieldRules: Record<string, any>;
}> = ({ fields, category, isMobile, fieldRules }) => (
  <Row gutter={16}>
    {fields.map(
      ({ dbField, fieldDisplayName, fieldDescription, mustHave, hide }) => {
        if (hide) {
          return null;
        } else
          return (
            <Col span={isMobile ? 24 : 12} key={dbField}>
              <Form.Item
                name={[category, dbField]}
                label={
                  <Flex gap={8}>
                    <Typography.Text>{fieldDisplayName}</Typography.Text>
                    {mustHave ? <Tag color="volcano">Must Have</Tag> : null}
                  </Flex>
                }
                rules={
                  fieldRules[category as keyof typeof fieldRules]?.[
                    dbField as keyof (typeof fieldRules)[keyof typeof fieldRules]
                  ] || []
                }
              >
                <TextArea rows={5} placeholder={fieldDescription} />
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
  const [allTags, setAllTags] = useState<string[]>([]);

  const [projectData, setProjectData] = useState<Project>();

  const { fieldRules, projectFields } = useProjectForm();

  const { data: project, isLoading: projectIsLoading } = useQuery({
    ...queries.getProjectById(projectId as string),
    enabled: !!projectId,
    throwOnError: true,
  });

  const { data: allProjects, isLoading: allProjectsLoading } = useQuery({
    ...queries.getAllProjects(),
    enabled: !!projectId,
  });

  const createProject = useCreateProjectMutation();
  const updateProject = useUpdateProjectMutation(projectId || "");

  const generateProjectUI = useGenerateProjectUI();

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      console.log(values);

      console.log(values);

      if (projectId) {
        updateProject.mutate({ projectData: values });
      } else {
        await createProject.mutateAsync(values).then((data) => {
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
      currentMedia[index].url = urls[0];
    } else {
      const newMedia = urls.map((url) => ({
        url,
        tags: [],
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

  const renderTabActions = (key: string) => {
    if (key == "ui") {
      return (
        <Flex style={{ width: "100%" }}>
          <Button
            style={{ marginLeft: "auto" }}
            loading={generateProjectUI.isPending}
            onClick={async () => {
              const uiData = await generateProjectUI.mutate(projectId || "", {
                onSuccess: (data) => {
                  const uiData = data.data;
                  if (uiData) {
                    form.setFields([
                      {
                        name: ["ui", "costSummary"],
                        value: uiData.costSummary,
                      },
                      {
                        name: ["ui", "description"],
                        value: uiData.description,
                      },
                      {
                        name: ["ui", "highlights"],
                        value: uiData.highlights,
                      },
                      {
                        name: ["ui", "oneLiner"],
                        value: uiData.oneLiner,
                      },
                      {
                        name: ["ui", "summary"],
                        value: uiData.summary,
                      },

                    ]);
                  }
                },
              });
              console.log(uiData);
            }}
          >
            Generate UI
          </Button>
        </Flex>
      );
    }
    return null;
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

  useEffect(() => {
    if (allProjects) {
      const tags = new Set<string>();
      allProjects.forEach((project: Project) => {
        project.media.forEach((media: IMedia) => {
          media.tags?.forEach((tag: string) => tags.add(tag));
        });
      });

      const dummyTags = [
        "exterior",
        "layout",
        "aerial",
        "video",
        "construction",
        "amenities",
        "walkthrough",
        "plot",
        "house",
      ];

      setAllTags(Array.from(dummyTags));
    }
  }, [allProjects]);

  useEffect(() => {
    if (!projectData && project) {
      setProjectData(project);
    }
  }, [project]);

  const screens = useBreakpoint();

  if (projectIsLoading || allProjectsLoading) {
    return <Loader />;
  }

  return (
    <Form form={form} layout="vertical" initialValues={project}>
      {project && (
        <Typography.Title style={{ marginBottom: 20 }} level={3}>
          {project?.metadata.name}
        </Typography.Title>
      )}

      <Tabs defaultActiveKey="metadata">
        {Object.entries(projectFields).map(([key, fields], index) => (
          <TabPane
            tab={key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            key={key}
            disabled={!projectId && index !== 0}
          >
            {renderTabActions(key)}
            <RenderFields
              fields={
                fields as {
                  dbField: string;
                  fieldDisplayName: string;
                  fieldDescription: string;
                  mustHave: boolean;
                  hide: boolean;
                }[]
              }
              category={key}
              isMobile={isMobile}
              fieldRules={fieldRules}
            />
          </TabPane>
        ))}

        <TabPane tab={"Media"} key={"media"} disabled={!projectId}>
          <Flex justify="end" style={{ marginBottom: 16 }}>
            <ImgUpload onUploadComplete={onUploadComplete} />
          </Flex>

          {project?.media.map((item: IMedia, index) => {
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
                <Col xs={24} sm={24} md={6} lg={4} xl={3}>
                  <Image
                    width="100%"
                    src={item.url}
                    alt={item._id}
                    style={{
                      borderRadius: 10,
                      objectFit: "cover",
                      aspectRatio: "1 / 1",
                    }}
                  />
                </Col>
                <Col xs={24} sm={24} md={18} lg={20} xl={21}>
                  <Flex vertical justify="center" style={{ height: "100%" }}>
                    <Form.Item
                      name={["media", index, "url"]}
                      label="Tags"
                      hidden
                    ></Form.Item>
                    <Form.Item
                      name={["media", index, "tags"]}
                      label="Tags"
                      style={{ width: "100%" }}
                    >
                      <Select
                        style={{
                          width: "100%",
                          maxWidth: screens.lg ? "600px" : "100%",
                        }}
                        placeholder="Enter tags"
                        options={allTags.map((tag) => ({
                          value: tag,
                          label: tag,
                        }))}
                      />
                    </Form.Item>

                    <Form.Item
                      name={["media", index, "caption"]}
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
          })}
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
