import { PlayCircleFilled } from "@ant-design/icons";
import { Alert, Avatar, Card, Col, Descriptions, Empty, Flex, Image, List, Modal, Row, Select, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { useIvyListings } from "../../hooks/third-party-hooks";
import type { IvyListing, IvyStagingGroup, IvyVideo } from "../../libs/api/ivy-homes";
import { errorMessage } from "../../libs/api-error";
import { HlsVideo } from "./hls-video";

const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

function ListingDetails({ listing }: { listing: IvyListing }) {
  return (
    <Card
      title={listing.property_title}
      extra={
        <Typography.Link href={listing.property_url} target="_blank">
          View on Ivy Homes
        </Typography.Link>
      }
    >
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="Title" span={2}>
          {listing.property_title}
        </Descriptions.Item>
        <Descriptions.Item label="Config">{listing.property_config ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="Bedrooms">{listing.bedrooms}</Descriptions.Item>
        <Descriptions.Item label="Price">{formatPrice(listing.price)}</Descriptions.Item>
        <Descriptions.Item label="Area">
          {listing.area} sqft ({listing.area_type.replace(/_/g, " ")})
        </Descriptions.Item>
        <Descriptions.Item label="Floor">{listing.floor}</Descriptions.Item>
        <Descriptions.Item label="Sales start">{listing.sales_start_date}</Descriptions.Item>
        <Descriptions.Item label="Location" span={2}>
          {[listing.project?.locality, listing.project?.sales_area, listing.city].filter(Boolean).join(", ")}
        </Descriptions.Item>
        {listing.tags.length > 0 && (
          <Descriptions.Item label="Tags" span={2}>
            {listing.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Typography.Title level={5} style={{ marginTop: 16 }}>
        Gallery ({listing.gallery.length})
      </Typography.Title>
      {listing.gallery.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No gallery images" />
      ) : (
        <Image.PreviewGroup>
          <Flex gap={8} style={{ overflowX: "auto", paddingBottom: 8 }}>
            {listing.gallery.map((img) => (
              <div key={img.full_image} style={{ flex: "0 0 auto" }}>
                <Image
                  src={img.full_image}
                  alt={img.alt}
                  height={140}
                  style={{ width: "auto", objectFit: "cover", borderRadius: 6 }}
                />
              </div>
            ))}
          </Flex>
        </Image.PreviewGroup>
      )}

      <ExploreSpace groups={listing.virtual_stagging_media ?? []} />
    </Card>
  );
}

function ExploreSpace({ groups }: { groups: IvyStagingGroup[] }) {
  const [playing, setPlaying] = useState<IvyVideo | null>(null);
  const withVideos = groups
    .map((g) => ({ title: g.title, videos: g.items.flatMap((i) => i.videos) }))
    .filter((g) => g.videos.length > 0);

  return (
    <>
      <Typography.Title level={5} style={{ marginTop: 16 }}>
        Explore Space
      </Typography.Title>
      {withVideos.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No virtual staging videos" />
      ) : (
        withVideos.map((group, gi) => (
          <div key={`${group.title}-${gi}`} style={{ marginBottom: 12 }}>
            <Typography.Text strong>{group.title}</Typography.Text>
            <Flex gap={8} style={{ overflowX: "auto", paddingBlock: 8 }}>
              {group.videos.map((video) => (
                <div
                  key={video.full_video}
                  onClick={() => setPlaying(video)}
                  title={video.alt}
                  style={{ flex: "0 0 auto", position: "relative", cursor: "pointer" }}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.alt}
                    style={{ height: 120, width: "auto", objectFit: "cover", borderRadius: 6, display: "block" }}
                  />
                  <PlayCircleFilled
                    style={{
                      position: "absolute",
                      inset: 0,
                      margin: "auto",
                      width: 40,
                      height: 40,
                      fontSize: 40,
                      color: "rgba(255, 255, 255, 0.9)",
                    }}
                  />
                </div>
              ))}
            </Flex>
          </div>
        ))
      )}
      <Modal
        open={!!playing}
        title={playing?.alt}
        footer={null}
        width={900}
        centered
        destroyOnClose
        onCancel={() => setPlaying(null)}
      >
        {playing && <HlsVideo src={playing.full_video} />}
      </Modal>
    </>
  );
}

export function IvyHomesTab() {
  const { data: listings = [], isLoading, error } = useIvyListings();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | undefined>();

  // Unique projects by project.id, with listing counts, sorted by name.
  const projectOptions = useMemo(() => {
    const byId = new Map<number, { name: string; count: number }>();
    for (const l of listings) {
      if (!l.project) continue;
      const entry = byId.get(l.project.id);
      if (entry) entry.count++;
      else byId.set(l.project.id, { name: l.project.project_name, count: 1 });
    }
    return [...byId.entries()]
      .sort((a, b) => a[1].name.localeCompare(b[1].name))
      .map(([id, { name, count }]) => ({ value: id, label: `${name} (${count})` }));
  }, [listings]);

  const filtered = projectId === undefined ? listings : listings.filter((l) => l.project?.id === projectId);
  const selected = listings.find((l) => l.id === selectedId);

  if (error)
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load Ivy Homes listings"
        description={errorMessage(error, "Unknown error")}
      />
    );

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          loading={isLoading}
          placeholder={`All projects (${projectOptions.length} unique)`}
          options={projectOptions}
          value={projectId}
          onChange={setProjectId}
          style={{ width: 360 }}
        />
      </Col>
      <Col xs={24} md={9}>
        <List
          loading={isLoading}
          bordered
          header={<Typography.Text strong>{filtered.length} listings</Typography.Text>}
          dataSource={filtered}
          style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}
          renderItem={(listing) => (
            <List.Item
              onClick={() => setSelectedId(listing.id)}
              style={{
                cursor: "pointer",
                paddingInline: 12,
                background: listing.id === selectedId ? "rgba(22, 119, 255, 0.08)" : undefined,
              }}
            >
              <List.Item.Meta
                avatar={<Avatar shape="square" size={56} src={listing.main_image?.thumbnail} />}
                title={listing.property_title}
                description={
                  <>
                    <div>Sales start: {listing.sales_start_date ?? "-"}</div>
                    <Tag color={listing.property_status === "For Sale" ? "green" : "orange"}>
                      {listing.property_status}
                    </Tag>
                    <Tag>{listing.engagement_model}</Tag>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Col>
      <Col xs={24} md={15}>
        {selected ? (
          <ListingDetails listing={selected} />
        ) : (
          <Card>
            <Empty description="Select a listing to see details" />
          </Card>
        )}
      </Col>
    </Row>
  );
}
