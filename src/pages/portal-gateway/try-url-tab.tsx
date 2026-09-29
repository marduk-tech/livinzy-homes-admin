import { Alert, Button, Card, Checkbox, Descriptions, Flex, Input, Segmented, Tabs, Tag, Typography } from "antd";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useScrapeUrl } from "../../hooks/portal-gateway-hooks";

// Handy for checking a new portal adapter or a suspicious page by hand.
export function TryUrlTab() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"auto" | "html" | "structured">("auto");
  const [noCache, setNoCache] = useState(false);
  const scrape = useScrapeUrl();
  const result = scrape.data;

  return (
    <Flex vertical gap={12}>
      <Flex gap={8} wrap>
        <Input
          style={{ flex: 1, minWidth: 320 }}
          placeholder="https://housing.com/in/buy/projects/page/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={() => url && scrape.mutate({ url, mode, noCache })}
        />
        <Segmented value={mode} onChange={(v) => setMode(v as typeof mode)} options={["auto", "structured", "html"]} />
        <Checkbox checked={noCache} onChange={(e) => setNoCache(e.target.checked)}>
          Skip cache
        </Checkbox>
        <Button type="primary" disabled={!url} loading={scrape.isPending} onClick={() => scrape.mutate({ url, mode, noCache })}>
          Scrape
        </Button>
      </Flex>

      {result && (
        <Card size="small">
          <Descriptions size="small" column={4}>
            <Descriptions.Item label="Status">
              <Tag color={result.status === "ok" ? "green" : "red"}>{result.status}</Tag>
              {result.cached && <Tag color="cyan">cached</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Portal">{result.portal ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Kind">{result.kind}</Descriptions.Item>
            <Descriptions.Item label="Time">{(result.ms / 1000).toFixed(1)}s</Descriptions.Item>
          </Descriptions>
          {result.error && <Alert type="error" showIcon message={result.error} style={{ marginTop: 8 }} />}

          <Tabs
            items={[
              result.markdown && {
                key: "md",
                label: "Markdown (what the LLM sees)",
                children: (
                  <div style={{ maxHeight: 600, overflow: "auto" }}>
                    <ReactMarkdown>{result.markdown}</ReactMarkdown>
                  </div>
                ),
              },
              result.data != null && {
                key: "data",
                label: "Data",
                children: (
                  <pre style={{ maxHeight: 600, overflow: "auto", fontSize: 12 }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                ),
              },
              result.html && {
                key: "html",
                label: `Raw HTML (${Math.round(result.html.length / 1024)} KB)`,
                children: (
                  <Typography.Paragraph>
                    <pre style={{ maxHeight: 600, overflow: "auto", fontSize: 11 }}>{result.html.slice(0, 20000)}</pre>
                  </Typography.Paragraph>
                ),
              },
            ].filter(Boolean) as { key: string; label: string; children: JSX.Element }[]}
          />
        </Card>
      )}
    </Flex>
  );
}
