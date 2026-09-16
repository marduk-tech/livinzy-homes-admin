import React from "react";
import { Flex } from "antd";

// Shared rendering for a scored {rating, reasoning[]} pillar sub-section -
// used by both the brick360 project score page and the micro-pocket score
// page, which store their score data in the same {rating, reasoning} shape.
export const containerStyle: React.CSSProperties = {
  backgroundColor: "#f8f9fa",
  padding: "1.5rem",
  borderRadius: "8px",
  marginBottom: "2rem",
};

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: "bold",
  marginBottom: "1rem",
  textTransform: "capitalize",
};

const subsectionStyle: React.CSSProperties = {
  marginBottom: "1.25rem",
};

const ratingStyle: React.CSSProperties = {
  fontStyle: "italic",
  color: "#555",
};

export const HtmlList = ({
  title,
  rating,
  items,
}: {
  title: string;
  rating?: number;
  items: string[];
}) => (
  <div style={subsectionStyle}>
    <h4 style={{ marginBottom: 8 }}>{title}</h4>
    <Flex
      vertical
      style={{ backgroundColor: "#eee", padding: 4, borderRadius: 8 }}
    >
      {rating && <p style={ratingStyle}>Rating: {rating}/100</p>}
      <Flex vertical className="reasoning">
        {items?.map((html, idx) => (
          <div
            key={idx}
            dangerouslySetInnerHTML={{ __html: html }}
            style={{ marginBottom: "0.75rem" }}
          />
        ))}
      </Flex>
    </Flex>
  </div>
);
