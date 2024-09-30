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
  Typography,
} from "antd";

import { DeleteOutlined, RedoOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "../hooks/project-hooks";
import { useDevice } from "../hooks/use-device";
import { baseApiUrl } from "../libs/constants";
import { queries } from "../libs/queries";
import { IMedia, Project } from "../types/Project";
import { Loader } from "./common/loader";
import { ImgUpload } from "./img-upload";

const { TabPane } = Tabs;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

interface ProjectFormProps {
  projectId?: string;
}

const projectStructure = {
  metadata: [
    {
      dbField: "name",
      fieldDisplayName: "Name",
      fieldDescription: "The name of the project.",
    },
    {
      dbField: "location",
      fieldDisplayName: "Location",
      fieldDescription:
        "The location of the project identified by Google maps url",
    },
    {
      dbField: "website",
      fieldDisplayName: "Website",
      fieldDescription: "Website for the project",
    },
    {
      dbField: "address",
      fieldDisplayName: "Address",
      fieldDescription: "The physical address of the project",
    },
    {
      dbField: "oneLiner",
      fieldDisplayName: "Oneliner",
      fieldDescription: "One liner showing the speciality of the project.",
    },
    {
      dbField: "description",
      fieldDisplayName: "Description",
      fieldDescription:
        "The description or summary of the project covering the important points at high level.",
    },
    {
      dbField: "summary",
      fieldDisplayName: "Summary",
      fieldDescription:
        "The description or summary of the project covering the important points at high level.",
    },
  ],
  land: [
    {
      dbField: "total_area",
      fieldDisplayName: "Total area",
      fieldDescription: "The total land area of the project in acres.",
    },
    {
      dbField: "plantation",
      fieldDisplayName: "Plantation",
      fieldDescription:
        "Information about plantation on the project i.e trees, plants etc that can be grown",
    },
    {
      dbField: "irrigation",
      fieldDisplayName: "Irrigation",
      fieldDescription: "Irrigation facilities at the project",
    },
    {
      dbField: "water_bodies",
      fieldDisplayName: "Water bodies",
      fieldDescription: "Any natural or man made water bodies in the project",
    },
    {
      dbField: "others",
      fieldDisplayName: "Others",
      fieldDescription: "Any other land related information.",
    },
  ],
  plots: [
    {
      dbField: "size_mix",
      fieldDisplayName: "Size mix",
      fieldDescription: "Size wise distribution of the plots.",
    },
    {
      dbField: "facing_mix",
      fieldDisplayName: "Facing mix",
      fieldDescription: "Direction wise distribution of the plots",
    },
    {
      dbField: "shape_mix",
      fieldDisplayName: "Shape mix",
      fieldDescription: "Shape wise distribution of the plots",
    },
    {
      dbField: "plots_list",
      fieldDisplayName: "Plots list",
      fieldDescription:
        "List of plots in as detailed manner as possible (if available)",
    },
    {
      dbField: "villa",
      fieldDisplayName: "Villa",
      fieldDescription:
        "Information about the villa that can be constructed on the plot",
    },
    {
      dbField: "cost_range",
      fieldDisplayName: "Cost range",
      fieldDescription: "Costing information of the plots",
    },
    {
      dbField: "others",
      fieldDisplayName: "Others",
      fieldDescription: "Any other relevant information about the plots",
    },
  ],

  connectivity: [
    {
      dbField: "roads",
      fieldDisplayName: "Roads",
      fieldDescription: "Road connectivity for the project",
    },
    {
      dbField: "towns",
      fieldDisplayName: "Towns",
      fieldDescription: "Any nearby towns or cities.",
    },
    {
      dbField: "schools",
      fieldDisplayName: "Schools",
      fieldDescription: "Nearby schools.",
    },
    {
      dbField: "hospital",
      fieldDisplayName: "Hospital",
      fieldDescription: "Nearby hospitals",
    },
    {
      dbField: "airport",
      fieldDisplayName: "Airport",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "others",
      fieldDisplayName: "Others",
      fieldDescription: "Provide relevant details.",
    },
  ],
  climate: [
    {
      dbField: "rainfall",
      fieldDisplayName: "Rainfall",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "temperature",
      fieldDisplayName: "Temperature",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "humidity",
      fieldDisplayName: "Humidity",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "others",
      fieldDisplayName: "Others",
      fieldDescription: "Provide relevant details.",
    },
  ],
  basic_infra: [
    {
      dbField: "electricity",
      fieldDisplayName: "Electricity",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "water_supply",
      fieldDisplayName: "Water supply",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "pathways",
      fieldDisplayName: "Pathways",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "security",
      fieldDisplayName: "Security",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "others",
      fieldDisplayName: "Others",
      fieldDescription: "Provide relevant details.",
    },
  ],

  amenities: [
    {
      dbField: "sports_external",
      fieldDisplayName: "Sports external",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "swimming_pool",
      fieldDisplayName: "Swimming pool",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "clubhouse",
      fieldDisplayName: "Clubhouse",
      fieldDescription: " Provide relevant details.",
    },
    {
      dbField: "kids",
      fieldDisplayName: "Kids",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "parks",
      fieldDisplayName: "Parks",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "parking",
      fieldDisplayName: "Parking",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "others",
      fieldDisplayName: "Others",
      fieldDescription: "Provide relevant details.",
    },
  ],
  team: [
    {
      dbField: "partners",
      fieldDisplayName: "Partners",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "experience",
      fieldDisplayName: "Experience",
      fieldDescription: "Provide relevant details.",
    },
    {
      dbField: "others",
      fieldDisplayName: "Others",
      fieldDescription: "Provide relevant details.",
    },
  ],
};

const fieldRules = {
  metadata: {
    name: [
      { required: true, message: "Please input the project name!" },
      { max: 100, message: "Name cannot be longer than 100 characters" },
    ],
    location: [
      { required: true, message: "Please input the project location!" },
    ],
    website: [
      { required: true, message: "Please input the project location!" },
      { type: "url", message: "Please enter a valid URL" },
    ],
  },
  land: {},
};

const renderFields = (
  fields: {
    dbField: string;
    fieldDisplayName: string;
    fieldDescription: string;
  }[],
  category: string,
  isMobile: boolean
) => (
  <Row gutter={16}>
    {fields.map(({ dbField, fieldDisplayName, fieldDescription }) => (
      <Col span={isMobile ? 24 : 12} key={dbField}>
        <Form.Item
          name={[category, dbField]}
          label={fieldDisplayName}
          rules={
            fieldRules[category as keyof typeof fieldRules]?.[
              dbField as keyof (typeof fieldRules)[keyof typeof fieldRules]
            ] || []
          }
        >
          <TextArea autoSize={{ minRows: 2 }} placeholder={fieldDescription} />
        </Form.Item>
      </Col>
    ))}
  </Row>
);

export function ProjectDetails({ projectId }: ProjectFormProps) {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { isMobile } = useDevice();
  const [allTags, setAllTags] = useState<string[]>([]);

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
        {Object.entries(projectStructure).map(([key, fields], index) => (
          <TabPane
            tab={key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            key={key}
            disabled={!projectId && index !== 0}
          >
            {renderFields(
              fields as {
                dbField: string;
                fieldDisplayName: string;
                fieldDescription: string;
              }[],
              key,
              isMobile
            )}
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
                        mode="tags"
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
