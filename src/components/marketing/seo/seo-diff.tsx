import { Card, Col, Empty, Flex, Row, Typography } from "antd";

// Live vs draft, side by side. HTML is shown as text (parsed with
// DOMParser, which never runs scripts) - the published page is Ghost's
// rendering of the same HTML.

const htmlToText = (html?: string) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("h1,h2,h3,h4,p,li,tr,br").forEach((el) => {
    el.insertAdjacentText("afterend", "\n");
    if (/^H[1-4]$/.test(el.tagName)) el.insertAdjacentText("beforebegin", "\n## ");
    if (el.tagName === "LI") el.insertAdjacentText("afterbegin", "• ");
  });
  return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
};

const FIELDS: { key: string; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "metaTitle", label: "Meta title" },
  { key: "metaDescription", label: "Meta description" },
];

function Side({ value, title }: { value: any; title: string }) {
  if (!value) {
    return (
      <Card size="small" title={title}>
        <Empty description="New page - nothing live yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }
  return (
    <Card size="small" title={title} styles={{ body: { maxHeight: 520, overflowY: "auto" } }}>
      <Flex vertical gap={10}>
        {FIELDS.filter((f) => value[f.key]).map((f) => (
          <div key={f.key}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {f.label} ({String(value[f.key]).length} chars)
            </Typography.Text>
            <div>{value[f.key]}</div>
          </div>
        ))}
        {Array.isArray(value.faq) && value.faq.length > 0 && (
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              FAQ ({value.faq.length})
            </Typography.Text>
            {value.faq.map((q: any, i: number) => (
              <div key={i} style={{ marginTop: 6 }}>
                <b>{q.question}</b>
                <div>{q.answer}</div>
              </div>
            ))}
          </div>
        )}
        {value.html && (
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Body
            </Typography.Text>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{htmlToText(value.html)}</div>
          </div>
        )}
        {Array.isArray(value.links) && (
          <div>
            {value.links.map((l: any, i: number) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <a href={l.sourceUrl} target="_blank" rel="noreferrer">
                  {l.sourceUrl}
                </a>
                <div style={{ fontSize: 13 }}>
                  “{l.sentence}” → link text <b>{l.anchorText}</b>
                  {l.applied === false && <Typography.Text type="danger"> (not applied: {l.reason})</Typography.Text>}
                </div>
              </div>
            ))}
          </div>
        )}
        {Array.isArray(value.redirects) && value.redirects.length > 0 && (
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              301 redirects
            </Typography.Text>
            {value.redirects.map((r: any, i: number) => (
              <div key={i} style={{ fontSize: 13 }}>
                {r.from} → {r.to}
              </div>
            ))}
          </div>
        )}
      </Flex>
    </Card>
  );
}

export function SeoDiff({ before, after }: { before: any; after: any }) {
  return (
    <Flex vertical gap={8}>
      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Side value={before} title="Live" />
        </Col>
        <Col xs={24} md={12}>
          <Side value={after} title="Draft" />
        </Col>
      </Row>
      {Array.isArray(after?.changeSummary) && after.changeSummary.length > 0 && (
        <Card size="small" title="What changed">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {after.changeSummary.map((c: string, i: number) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          {Array.isArray(after.sources) && after.sources.length > 0 && (
            <>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Sources
              </Typography.Text>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
                {after.sources.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}
    </Flex>
  );
}
