import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Button,
  Col,
  Form,
  Input,
  notification,
  Row,
  Tabs,
  Typography,
} from "antd";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "../hooks/project-hooks";
import { useDevice } from "../hooks/use-device";
import { queries } from "../libs/queries";
import { Project } from "../types/Project";

const { TabPane } = Tabs;
const { TextArea } = Input;

interface ProjectFormProps {
  projectId?: string;
}

const projectStructure = {
  metadata: ["name", "location", "website"],
  land: ["total_area", "plantation", "irrigation", "water_bodies", "others"],
  plots: [
    "size_mix",
    "facing_mix",
    "shape_mix",
    "plots_list",
    "villa",
    "cost_range",
    "others",
  ],
  media: [
    "aerial",
    "plot",
    "construction",
    "video",
    "walkthrough",
    "amenities",
    "others",
  ],
  connectivity: ["roads", "towns", "schools", "hospital", "airport", "others"],
  climate: ["rainfall", "temperature", "humidity", "others"],
  basic_infra: [
    "electricity",
    "water_supply",
    "pathways",
    "security",
    "others",
  ],
  amenities: [
    "sports_external",
    "swimming_pool",
    "clubhouse",
    "kids",
    "parks",
    "parking",
    "others",
  ],
  team: ["partners", "experience", "others"],
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
  fields: string[],
  category: string,
  isMobile: boolean
) => (
  <Row gutter={16}>
    {fields.map((key) => (
      <Col span={isMobile ? 24 : 12} key={key}>
        <Form.Item
          name={[category, key]}
          label={key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}
          rules={
            fieldRules[category as keyof typeof fieldRules]?.[
              key as keyof (typeof fieldRules)[keyof typeof fieldRules]
            ] || []
          }
        >
          <TextArea autoSize={{ minRows: 2 }} />
        </Form.Item>
      </Col>
    ))}
  </Row>
);

export function ProjectDetails({ projectId }: ProjectFormProps) {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const { isMobile } = useDevice();

  const { data: project } = useQuery({
    ...queries.getProjectById(projectId as string),
    enabled: !!projectId,
  });

  const createProject = useCreateProjectMutation();
  const updateProject = useUpdateProjectMutation(projectId || "");

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      console.log(values);

      if (projectId) {
        updateProject.mutate({ projectData: values });
      } else {
        await createProject.mutateAsync(values).then(() => {
          navigate({ to: "/projects" });
        });
      }
    } catch (error) {
      notification.error({
        message: `Please check fields again`,
      });

      console.error("Validation failed:", error);
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={project}>
      {project && (
        <Typography.Title style={{ marginBottom: 20 }} level={3}>
          {project?.metadata.name}
        </Typography.Title>
      )}

      <Tabs defaultActiveKey="metadata">
        {Object.entries(projectStructure).map(([key, fields]) => (
          <TabPane
            tab={key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            key={key}
          >
            {renderFields(fields, key, isMobile)}
          </TabPane>
        ))}
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
