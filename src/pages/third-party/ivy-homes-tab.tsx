import { PlayCircleFilled } from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Image,
  InputNumber,
  List,
  Modal,
  Row,
  Select,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import { useIvyListings } from "../../hooks/third-party-hooks";
import type { IvyListing, IvyStagingGroup, IvyVideo } from "../../libs/api/ivy-homes";
import { errorMessage } from "../../libs/api-error";
import { HlsVideo } from "./hls-video";
import { IvyProjectMapping } from "./ivy-project-mapping";

const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

const LAKH = 1e5;
const CRORE = 1e7;

// Matched on the leading number of property_config, so "2.5 BHK" counts as 2 BHK.
const CONFIG_OPTIONS = [
  { value: "studio", label: "Studio" },
  { value: "2", label: "2 BHK" },
  { value: "3", label: "3 BHK" },
  { value: "4", label: "4 BHK" },
];

const configKey = (listing: IvyListing) => {
  const config = listing.property_config?.toLowerCase() ?? "";
  if (config.includes("studio")) return "studio";
  const bhk = parseInt(config, 10);
  return String(Number.isNaN(bhk) ? listing.bedrooms : bhk);
};

// [min, max) in rupees
const PRICE_BUCKETS: { value: string; label: string; min: number; max: number }[] = [
  { value: "lt50l", label: "Less than 50 Lacs", min: 0, max: 50 * LAKH },
  { value: "50l-1cr", label: "50 Lacs - 1 Cr", min: 50 * LAKH, max: 1 * CRORE },
  { value: "1-1.5cr", label: "1 - 1.5 Cr", min: 1 * CRORE, max: 1.5 * CRORE },
  { value: "1.5-2cr", label: "1.5 - 2 Cr", min: 1.5 * CRORE, max: 2 * CRORE },
  { value: "2-2.5cr", label: "2 - 2.5 Cr", min: 2 * CRORE, max: 2.5 * CRORE },
  { value: "2.5-3cr", label: "2.5 - 3 Cr", min: 2.5 * CRORE, max: 3 * CRORE },
  { value: "3-4cr", label: "3 - 4 Cr", min: 3 * CRORE, max: 4 * CRORE },
  { value: "gt4cr", label: "Above 4 Cr", min: 4 * CRORE, max: Infinity },
];

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

function IvyListingsView() {
  const { data: listings = [], isLoading, error } = useIvyListings();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | undefined>();
  const [configs, setConfigs] = useState<string[]>([]);
  const [priceBuckets, setPriceBuckets] = useState<string[]>([]);
  const [minArea, setMinArea] = useState<number | null>(null);
  const [localities, setLocalities] = useState<string[]>([]);

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

  const localityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of listings) {
      const locality = l.project?.locality;
      if (locality) counts.set(locality, (counts.get(locality) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([locality, count]) => ({ value: locality, label: `${locality} (${count})` }));
  }, [listings]);

  const filtered = useMemo(() => {
    const buckets = PRICE_BUCKETS.filter((b) => priceBuckets.includes(b.value));
    return listings.filter(
      (l) =>
        (projectId === undefined || l.project?.id === projectId) &&
        (configs.length === 0 || configs.includes(configKey(l))) &&
        (buckets.length === 0 || buckets.some((b) => l.price >= b.min && l.price < b.max)) &&
        (minArea == null || l.area >= minArea) &&
        (localities.length === 0 || (!!l.project?.locality && localities.includes(l.project.locality))),
    );
  }, [listings, projectId, configs, priceBuckets, minArea, localities]);
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
      <Col span={24}>
        <Flex gap={8} wrap="wrap">
          <Select
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            placeholder="Config"
            options={CONFIG_OPTIONS}
            value={configs}
            onChange={setConfigs}
            style={{ width: 220 }}
          />
          <Select
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            placeholder="Price"
            options={PRICE_BUCKETS.map(({ value, label }) => ({ value, label }))}
            value={priceBuckets}
            onChange={setPriceBuckets}
            style={{ width: 260 }}
          />
          <InputNumber
            min={0}
            placeholder="Min area (sqft)"
            value={minArea}
            onChange={setMinArea}
            style={{ width: 160 }}
          />
          <Select
            mode="multiple"
            allowClear
            showSearch
            optionFilterProp="label"
            maxTagCount="responsive"
            loading={isLoading}
            placeholder="Locality"
            options={localityOptions}
            value={localities}
            onChange={setLocalities}
            style={{ width: 300 }}
          />
        </Flex>
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

export function IvyHomesTab() {
  return (
    <Tabs
      size="small"
      destroyInactiveTabPane
      items={[
        { key: "listings", label: "Listings", children: <IvyListingsView /> },
        { key: "project-mapping", label: "Project Mapping", children: <IvyProjectMapping /> },
      ]}
    />
  );
}
