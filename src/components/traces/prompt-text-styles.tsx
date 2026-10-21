import { Components } from "react-markdown";
import { FONT_SIZES } from "../../theme/font-sizes";

// Shared by the LLM calls view and the prompts tab - boxes for a prompt's
// raw text and its markdown rendering.
export const messageBox: React.CSSProperties = {
  padding: 10,
  backgroundColor: "#f5f5f5",
  borderRadius: 4,
  maxHeight: 400,
  overflowY: "auto",
  fontFamily: "monospace",
  fontSize: FONT_SIZES.SUB_TEXT,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  margin: "4px 0 10px",
};

export const markdownBox: React.CSSProperties = {
  ...messageBox,
  fontFamily: "inherit",
  fontSize: FONT_SIZES.PARA,
  whiteSpace: "normal",
  backgroundColor: "#fafafa",
  border: "1px solid #f0f0f0",
};

// Prompts often have unfenced JSON schemas or one-rule-per-line blocks that
// plain markdown would fold into a single run-on paragraph - keep paragraphs'
// own line breaks/indentation so they read the way they were written.
export const markdownComponents: Components = {
  p: ({ node: _node, ...props }) => (
    <p style={{ whiteSpace: "pre-wrap" }} {...props} />
  ),
};
