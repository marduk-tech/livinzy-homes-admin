import {
  CheckCircleOutlined,
  SyncOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Button,
  Col,
  Flex,
  Form,
  FormInstance,
  Image,
  Input,
  Row,
  Select,
  Tag,
  Upload,
} from "antd";

import { useEffect, useState } from "react";

import { useUpdateProjectMutation } from "../../hooks/project-hooks";
import { useBunnyUploader } from "../../hooks/use-bunny-uploader";
import { useDevice } from "../../hooks/use-device";
import { api } from "../../libs/api";
import { IMedia, Project } from "../../types/Project";

interface VideoUploadProps {
  projectId?: string;
  form: FormInstance;
  project: Project;
  allTags?: string[];
}

function generateVideoUrls(videoId: string, libraryId: number) {
  return {
    directPlayUrl: `https://iframe.mediadelivery.net/play/${libraryId}/${videoId}`,
    thumbnailUrl: `https://vz-ca10988b-4d6.b-cdn.net/${videoId}/thumbnail.jpg`,
    previewUrl: `https://vz-ca10988b-4d6.b-cdn.net/${videoId}/preview.webp`,

    embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`,
  };
}

export function VideoUpload({
  projectId,
  form,
  project,
  allTags,
}: VideoUploadProps) {
  const updateProject = useUpdateProjectMutation({
    projectId: projectId || "",
  });

  const handleUpload = async (file: File) => {
    try {
      await upload(file);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOnComplete = async ({
    videoId,
    libraryId,
  }: {
    videoId: string;
    libraryId: number;
  }) => {
    try {
      console.log("Upload completed");

      const currentMedia = form.getFieldValue("media") || [];

      const videoUrls = generateVideoUrls(videoId, libraryId);

      // Add new video media
      const newMedia = {
        type: "video",
        video: {
          tags: [],
          caption: "",

          // bunny specific fields
          bunnyVideoId: videoId,
          bunnyLibraryId: libraryId,
          status: "Encoding",
          // urls
          ...videoUrls,
        },
      };

      currentMedia.push(newMedia);

      form.setFieldValue("media", currentMedia);

      if (projectId) {
        updateProject.mutate({
          projectData: {
            media: currentMedia,
          },
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const { upload, progress, isLoading } = useBunnyUploader({
    onComplete: ({ videoId, libraryId }) =>
      handleOnComplete({ videoId, libraryId }),
  });

  return (
    <>
      <Flex justify="end" style={{ marginBottom: 16, gap: 20 }}>
        <Upload
          accept="video/*"
          beforeUpload={(file) => {
            handleUpload(file);
            return false; // Return false to prevent default antd upload behavior
          }}
          showUploadList={false}
        >
          <Button
            icon={<UploadOutlined />}
            disabled={
              isLoading ||
              (progress !== undefined && progress > 0 && progress < 100) ||
              updateProject.isPending
            }
            loading={
              isLoading ||
              (progress !== undefined && progress > 0 && progress < 100) ||
              updateProject.isPending
            }
            type="primary"
          >
            {isLoading && !progress
              ? "Preparing Upload..."
              : progress !== undefined && progress > 0 && progress < 100
              ? `Uploading ${progress}%`
              : isLoading || updateProject.isPending
              ? "Updating Project..."
              : "Upload Video"}
          </Button>
        </Upload>
      </Flex>

      {project?.media.map((item: IMedia, index) => {
        if (item?.type === "video") {
          return (
            <VideoItem
              key={item._id}
              item={item}
              index={index}
              allTags={allTags}
              project={project}
              form={form}
            />
          );
        }
      })}
    </>
  );
}

interface VideoItemProps {
  item: IMedia;
  index: number;
  allTags?: string[];
  project: Project;
  form: FormInstance;
}

export const VideoItem: React.FC<VideoItemProps> = ({
  item,
  index,
  allTags,
  project,
  form,
}) => {
  const { isMobile } = useDevice();
  const [previewUrl, setPreviewUrl] = useState(item.video?.previewUrl);
  const updateProject = useUpdateProjectMutation({
    projectId: project._id,
    enableToasts: false,
  });

  const { data: videoStatus, isLoading: videoStatusLoading } = useQuery({
    queryKey: [`video-item-${item._id}`],
    queryFn: () => api.getVideoStatus(item.video!.bunnyVideoId!),
    enabled: item.video?.status != "done",
    refetchInterval: 5000,
  });

  const updateVideoStatus = async (videoId: string) => {
    const updatedMedia = [...project.media];

    const mediaIndex = updatedMedia.findIndex(
      (media) =>
        media?.type === "video" && media?.video?.bunnyVideoId === videoId
    );

    if (mediaIndex !== -1) {
      updatedMedia[mediaIndex] = {
        ...updatedMedia[mediaIndex],
        video: {
          ...updatedMedia[mediaIndex].video!,
          status: "done",
        },
      };

      updateProject.mutate({
        projectData: {
          media: updatedMedia,
        },
      });

      form.setFieldValue("media", updatedMedia);
    }
  };

  const deleteVideo = useMutation({
    mutationFn: () => api.deleteVideo(item.video?.bunnyVideoId as string),
    onSuccess: () => {
      const updatedMedia = project.media.filter(
        (media) => media?._id !== item?._id
      );

      updateProject.mutate({
        projectData: {
          media: updatedMedia,
        },
      });

      form.setFieldValue("media", updatedMedia);
    },
  });

  useEffect(() => {
    if (videoStatus) {
      if (videoStatus.encodeProgress == 100) {
        updateVideoStatus(videoStatus.guid);
      }
    }
  }, [item.video?.previewUrl, videoStatus]);

  return (
    <Row
      gutter={[16, 16]}
      key={item._id}
      style={{
        marginBottom: 24,
        borderBottom: "1px solid #f0f0f0",
        paddingBottom: 24,
      }}
    >
      <Col xs={24} sm={24} md={6} lg={4} xl={6}>
        <Image
          width="100%"
          src={item.video?.status == "done" ? previewUrl : ""}
          fallback="/img-plchlder.png"
          alt={item._id}
          style={{
            borderRadius: 10,
            objectFit: "cover",
            aspectRatio: "16 / 9",
          }}
          preview={false}
        />
      </Col>
      <Col xs={24} sm={24} md={18} lg={20} xl={18}>
        <Flex vertical justify="center" gap={15} style={{ height: "100%" }}>
          {item.video?.status == "done" ? (
            <Flex>
              <Tag icon={<CheckCircleOutlined />} color="green">
                Processing complete
              </Tag>
            </Flex>
          ) : (
            <Flex>
              {videoStatus && videoStatus.encodeProgress !== 100 && (
                <Tag icon={<SyncOutlined spin />} color="warning">
                  Encoding in progress {videoStatus.encodeProgress}%
                </Tag>
              )}

              {videoStatus?.hasMP4Fallback && (
                <Tag icon={<CheckCircleOutlined />} color="green">
                  Video Playable
                </Tag>
              )}
            </Flex>
          )}

          <Flex vertical gap={0}>
            <Form.Item
              name={["media", index, "video", "tags"]}
              label="Tags"
              style={{ width: "100%" }}
            >
              <Select
                style={{
                  width: "100%",
                  maxWidth: isMobile ? "100%" : "600px",
                }}
                placeholder="Enter tags"
                options={allTags?.map((tag) => ({
                  value: tag,
                  label: tag,
                }))}
              />
            </Form.Item>

            <Form.Item
              name={["media", index, "video", "caption"]}
              label="Caption"
            >
              <Input
                style={{
                  width: "100%",
                  maxWidth: isMobile ? "100%" : "600px",
                }}
                placeholder="Enter caption"
              />
            </Form.Item>

            <Flex wrap="wrap" gap={10}>
              <a
                href={item.video?.directPlayUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>Play Video</Button>
              </a>

              <Button
                disabled={deleteVideo.isPending}
                loading={deleteVideo.isPending}
                onClick={() => {
                  deleteVideo.mutate();
                }}
              >
                Delete Video
              </Button>
            </Flex>
          </Flex>
          {/* Hidden Form Items */}
          <Form.Item name={["media", index, "type"]} hidden />
          <Form.Item name={["media", index, "video", "bunnyVideoId"]} hidden />
          <Form.Item
            name={["media", index, "video", "bunnyLibraryId"]}
            hidden
          />
          <Form.Item name={["media", index, "video", "status"]} hidden />
          <Form.Item name={["media", index, "video", "directPlayUrl"]} hidden />
          <Form.Item name={["media", index, "video", "thumbnailUrl"]} hidden />
          <Form.Item name={["media", index, "video", "previewUrl"]} hidden />
        </Flex>
      </Col>
    </Row>
  );
};
