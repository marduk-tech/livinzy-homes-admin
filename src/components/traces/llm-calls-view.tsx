import { Button, Collapse, Flex, Segmented, Spin, Tag, Typography } from "antd";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useGetLlmCallsForRun } from "../../hooks/brickchat-hooks";
import { errorMessage } from "../../libs/api-error";
import { FONT_SIZES } from "../../theme/font-sizes";
import { LlmCall, LlmCallMessage } from "../../types/brickchat-logger";
import { markdownBox, markdownComponents, messageBox } from "./prompt-text-styles";

// Message content is usually a string, but can be an array of content parts
// ({type: "text", text} etc) - show text parts as-is and anything else as JSON.
const contentToText = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part?.type === "text" && typeof part.text === "string"
          ? part.text
          : JSON.stringify(part, null, 2),
      )
      .join("\n");
  }
  if (content == null) return "";
  return JSON.stringify(content, null, 2);
};

const ROLE_COLORS: Record<string, string> = {
  SystemMessage: "purple",
  system: "purple",
  HumanMessage: "blue",
  human: "blue",
  user: "blue",
  AIMessage: "green",
  ai: "green",
  assistant: "green",
  ToolMessage: "orange",
  tool: "orange",
};

const isSystemRole = (role: string) => role === "SystemMessage" || role === "system";

function MessageBlock({ message }: { message: LlmCallMessage }) {
  // system prompts are written as markdown - render them by default, with
  // raw kept one click away to see the exact text that was sent
  const [view, setView] = useState<"markdown" | "raw">(
    isSystemRole(message.role) ? "markdown" : "raw",
  );
  const text = contentToText(message.content);
  const showMarkdown = view === "markdown" && !!text;

  return (
    <div>
      <Flex gap={8} align="center">
        <Tag color={ROLE_COLORS[message.role] || "default"}>{message.role}</Tag>
        {isSystemRole(message.role) && (
          <Segmented
            size="small"
            value={view}
            onChange={(v) => setView(v as "markdown" | "raw")}
            options={[
              { label: "Markdown", value: "markdown" },
              { label: "Raw", value: "raw" },
            ]}
          />
        )}
      </Flex>
      <div style={showMarkdown ? markdownBox : messageBox}>
        {showMarkdown ? (
          <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
        ) : (
          text || <Typography.Text type="secondary">(empty)</Typography.Text>
        )}
        {message.toolCalls?.length ? (
          <>
            {"\n\ntool calls:\n"}
            {JSON.stringify(message.toolCalls, null, 2)}
          </>
        ) : null}
      </div>
    </div>
  );
}

function LlmCallLabel({ call, index }: { call: LlmCall; index: number }) {
  const durationMs =
    call.endTime && call.startTime
      ? new Date(call.endTime).getTime() - new Date(call.startTime).getTime()
      : undefined;
  return (
    <Flex gap={8} align="center" wrap="wrap">
      <Typography.Text strong>
        #{index + 1} · {call.model || call.name}
      </Typography.Text>
      {call.error && <Tag color="red">error</Tag>}
      <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
        {call.messages.length} message(s)
        {call.promptTokens != null &&
          ` · ${call.promptTokens} in / ${call.completionTokens ?? 0} out tokens`}
        {durationMs != null && ` · ${(durationMs / 1000).toFixed(2)}s`}
      </Typography.Text>
    </Flex>
  );
}

function LlmCallDetails({ call }: { call: LlmCall }) {
  const { tools, response_format: responseFormat, temperature } =
    call.invocationParams || {};
  return (
    <>
      <Typography.Text
        type="secondary"
        style={{ fontSize: FONT_SIZES.SUB_TEXT, display: "block", marginBottom: 6 }}
      >
        run {call.runId}
        {temperature != null && ` · temperature ${String(temperature)}`}
        {responseFormat != null && ` · response_format ${JSON.stringify(responseFormat)}`}
      </Typography.Text>
      {call.error && (
        <Typography.Text type="danger" style={{ display: "block", marginBottom: 8 }}>
          {call.error}
        </Typography.Text>
      )}
      {call.messages.map((message, i) => (
        <MessageBlock key={i} message={message} />
      ))}
      {call.prompts?.map((prompt, i) => (
        <MessageBlock key={`p${i}`} message={{ role: "prompt", content: prompt }} />
      ))}
      {Array.isArray(tools) && tools.length > 0 && (
        <MessageBlock message={{ role: "tools", content: JSON.stringify(tools, null, 2) }} />
      )}
      {call.output != null && (
        <>
          <Typography.Text
            type="secondary"
            style={{ fontSize: FONT_SIZES.SUB_TEXT, display: "block" }}
          >
            Output
          </Typography.Text>
          <MessageBlock
            message={
              typeof call.output === "string"
                ? { role: "output", content: call.output }
                : call.output
            }
          />
        </>
      )}
    </>
  );
}

// Full prompts of every LLM call made inside one LangSmith run (a plan step,
// planning or synthesis) - fetched only on demand since each load goes out to
// LangSmith.
export function LlmCallsView({ runId }: { runId?: string }) {
  const [requested, setRequested] = useState(false);
  const { data, isLoading, isError, error } = useGetLlmCallsForRun(
    requested ? runId : null,
  );

  if (!runId) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
        No LangSmith run id recorded for this entry.
      </Typography.Text>
    );
  }

  if (!requested) {
    return (
      <Button size="small" onClick={() => setRequested(true)}>
        Show LLM calls
      </Button>
    );
  }

  if (isLoading) return <Spin size="small" />;

  if (isError) {
    return (
      <Typography.Text type="danger" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
        {errorMessage(error, "Failed to fetch LLM calls")}
      </Typography.Text>
    );
  }

  if (!data?.calls.length) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
        No LLM calls were made in this run.
      </Typography.Text>
    );
  }

  return (
    <Collapse
      size="small"
      items={data.calls.map((call, i) => ({
        key: call.runId,
        label: <LlmCallLabel call={call} index={i} />,
        children: <LlmCallDetails call={call} />,
      }))}
    />
  );
}
