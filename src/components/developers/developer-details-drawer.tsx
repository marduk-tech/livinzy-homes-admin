import {
  Collapse,
  Drawer,
  Empty,
  Flex,
  Table,
  TableColumnType,
  Tabs,
  Tag,
  Typography,
} from "antd";
import ReactJson from "react-json-view";
import ReactMarkdown from "react-markdown";
import {
  Developer,
  DeveloperBioField,
  DeveloperCitation,
  DeveloperGenProject,
} from "../../types/developer";

// Same fallback the services side uses (developer-markdown.utils.js) - old
// documents store these as plain strings.
const bioText = (value?: DeveloperBioField): string => {
  if (!value) return "";
  return typeof value === "string" ? value : value.text || "";
};

const bioSources = (value?: DeveloperBioField): number[] =>
  typeof value === "object" && value ? (value.sources ?? []) : [];

// Old services-generated citations have no `index`, so fall back to 1-based
// array position.
const citationNumber = (citation: DeveloperCitation, i: number): number =>
  citation.index ?? i + 1;

const findCitation = (
  citations: DeveloperCitation[],
  n: number
): DeveloperCitation | undefined =>
  citations.find((c, i) => citationNumber(c, i) === n);

interface CitationRefsProps {
  sources?: number[];
  citations: DeveloperCitation[];
}

function CitationRefs({ sources, citations }: CitationRefsProps) {
  if (!sources?.length) return null;
  return (
    <sup style={{ marginLeft: 4 }}>
      {sources.map((n) => {
        const citation = findCitation(citations, n);
        return citation ? (
          <Typography.Link
            key={n}
            href={citation.url}
            target="_blank"
            title={citation.title}
            style={{ marginRight: 3 }}
          >
            [{n}]
          </Typography.Link>
        ) : (
          <span key={n} style={{ marginRight: 3 }}>
            [{n}]
          </span>
        );
      })}
    </sup>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div>
      <Typography.Title level={5} style={{ marginBottom: 4 }}>
        {title}
      </Typography.Title>
      {children}
    </div>
  );
}

interface DeveloperDetailsDrawerProps {
  developer?: Developer;
  onClose: () => void;
}

export function DeveloperDetailsDrawer({
  developer,
  onClose,
}: DeveloperDetailsDrawerProps) {
  const genDetails = developer?.genDetails;
  const details = genDetails?.details;
  const citations = genDetails?.citations ?? [];
  const info = developer?.info;

  const projectColumns: TableColumnType<DeveloperGenProject>[] = [
    {
      title: "Name",
      dataIndex: "name",
      render: (name: string, record) => (
        <Flex vertical>
          <Typography.Text strong>{name}</Typography.Text>
          <CitationRefs sources={record.sources} citations={citations} />
        </Flex>
      ),
    },
    { title: "Location", dataIndex: "location", render: (v) => v || "-" },
    {
      title: "Type",
      key: "type",
      width: 170,
      render: (_, record) =>
        record.type || record.subType ? (
          <Flex gap={4} wrap>
            {record.type && <Tag>{record.type}</Tag>}
            {record.subType && <Tag color="blue">{record.subType}</Tag>}
          </Flex>
        ) : (
          "-"
        ),
    },
    {
      title: "Units",
      dataIndex: "unitVariations",
      render: (v) => v || "-",
    },
    { title: "Timeline", dataIndex: "timeline", render: (v) => v || "-" },
  ];

  const bioFields: [string, DeveloperBioField | undefined][] = [
    ["Management", details?.management],
    ["Financials", details?.financials],
    ["Feedback", details?.feedback],
    ["Other Details", details?.otherDetails],
  ];

  const generated = (
    <Flex vertical gap={20}>
      {info?.oneLiner && (
        <Section title="Summary">
          <Typography.Paragraph>{info.oneLiner}</Typography.Paragraph>
        </Section>
      )}

      {info?.credibility && (
        <Section title="Credibility">
          <Flex vertical gap={10}>
            {(
              [
                ["Experience over time", info.credibility.experienceTime],
                ["Project themes", info.credibility.projectsTheme],
                ["Financials", info.credibility.financials],
              ] as [string, string | undefined][]
            )
              .filter(([, text]) => !!text)
              .map(([label, text]) => (
                <div key={label}>
                  <Typography.Text type="secondary">{label}</Typography.Text>
                  <Typography.Paragraph style={{ marginBottom: 0 }}>
                    {text}
                  </Typography.Paragraph>
                </div>
              ))}
          </Flex>
        </Section>
      )}

      {!!info?.faq?.length && (
        <Section title="FAQ">
          <Collapse
            size="small"
            items={info.faq.map((entry, i) => ({
              key: String(i),
              label: entry.question,
              children: <ReactMarkdown>{entry.answer}</ReactMarkdown>,
            }))}
          />
        </Section>
      )}

      {!!details?.projects?.length && (
        <Section title={`Projects (${details.projects.length})`}>
          <Table
            rowKey={(record, i) => `${record.name}-${i}`}
            size="small"
            dataSource={details.projects}
            columns={projectColumns}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
          />
        </Section>
      )}

      {bioFields
        .filter(([, value]) => !!bioText(value))
        .map(([label, value]) => (
          <Section key={label} title={label}>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              {bioText(value)}
              <CitationRefs sources={bioSources(value)} citations={citations} />
            </Typography.Paragraph>
          </Section>
        ))}

      {details?.brand && (details.brand.website || details.brand.brandNames) && (
        <Section title="Brand">
          <Flex vertical gap={4}>
            {details.brand.website && (
              <Typography.Link href={details.brand.website} target="_blank">
                {details.brand.website}
              </Typography.Link>
            )}
            {details.brand.brandNames && (
              <Typography.Text>{details.brand.brandNames}</Typography.Text>
            )}
          </Flex>
        </Section>
      )}

      {!!citations.length && (
        <Section title={`Sources (${citations.length})`}>
          <Flex vertical gap={4}>
            {citations.map((citation, i) => (
              <Typography.Text key={citation.url ?? i} style={{ fontSize: 12 }}>
                [{citationNumber(citation, i)}]{" "}
                <Typography.Link href={citation.url} target="_blank">
                  {citation.title || citation.url}
                </Typography.Link>
              </Typography.Text>
            ))}
          </Flex>
        </Section>
      )}
    </Flex>
  );

  return (
    <Drawer
      open={!!developer}
      onClose={onClose}
      width={880}
      title={developer ? `${developer.name} — generated details` : "Details"}
    >
      {!genDetails && !info ? (
        <Empty description="Nothing generated for this developer yet." />
      ) : (
        <Tabs
          items={[
            { key: "generated", label: "Generated", children: generated },
            {
              key: "raw",
              label: "Raw",
              children: (
                <ReactJson
                  src={{ info, genDetails } as object}
                  collapsed={2}
                  displayDataTypes={false}
                  enableClipboard={false}
                  name={false}
                />
              ),
            },
          ]}
        />
      )}
    </Drawer>
  );
}
