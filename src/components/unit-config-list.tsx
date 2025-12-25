import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Col,
  Flex,
  Form,
  Image,
  Input,
  InputNumber,
  List,
  Modal,
  Row,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import React, { useState } from "react";

interface UnitConfig {
  config: string;
  sizeBuiltup?: number;
  sizeCarpet?: number;
  type?: string;
  price: number;
  floorplans?: string[];
}

interface UnitConfigListProps {
  value?: UnitConfig[];
  onChange?: (value: UnitConfig[]) => void;
  media?: Array<{
    _id: string;
    image?: {
      url: string;
      tags: string[];
      caption?: string;
    };
  }>;
}

export const UnitConfigList: React.FC<UnitConfigListProps> = ({
  value = [],
  onChange,
  media = [],
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form] = Form.useForm();

  // Helper function to get which unit config is using each floorplan
  const getFloorplanUsage = () => {
    const usage: Record<string, { config: string; index: number }> = {};
    value.forEach((unitConfig, index) => {
      if (unitConfig.floorplans) {
        unitConfig.floorplans.forEach((floorplanUrl) => {
          usage[floorplanUrl] = {
            config: unitConfig.config,
            index: index,
          };
        });
      }
    });
    return usage;
  };

  // Helper function to check if a floorplan should be disabled
  const isFloorplanDisabled = (floorplanUrl: string) => {
    const usage = getFloorplanUsage();
    const usedBy = usage[floorplanUrl];

    if (!usedBy) return false;

    // If editing and it's used by the current unit being edited, it's available
    if (editingIndex !== null && usedBy.index === editingIndex) return false;

    return true;
  };

  const getDisabledTooltipText = (floorplanUrl: string) => {
    const usage = getFloorplanUsage();
    const usedBy = usage[floorplanUrl];
    return usedBy ? `Already assigned to "${usedBy.config}"` : "";
  };

  const resetModalState = () => {
    form.resetFields();
    form.setFieldValue("floorplans", []);
  };

  const handleAdd = () => {
    setEditingIndex(null);
    setIsModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      sizeBuiltup: undefined,
      sizeCarpet: undefined,
      type: undefined,
      price: undefined,
      floorplans: [],
    });
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    form.resetFields();
    form.setFieldsValue({
      sizeBuiltup: value[index].sizeBuiltup || undefined,
      sizeCarpet: value[index].sizeCarpet || undefined,
      type: value[index].type || undefined,
      price: value[index].price || undefined,
      floorplans: value[index].floorplans || [],
    });
    setIsModalVisible(true);
  };

  const handleDelete = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange?.(newValue);
  };

  const handleModalOk = async () => {
    try {
      const data = await form.validateFields();

      // Generate backward-compatible config string
      const configString = `${data.type} - ${data.sizeBuiltup} sq ft`;

      const unitConfig = {
        ...data,
        config: configString, // Backward compatibility
        floorplans: data.floorplans || [],
      };

      const newValue = [...value];

      if (editingIndex === null) {
        newValue.push(unitConfig);
      } else {
        newValue[editingIndex] = unitConfig;
      }

      onChange?.(newValue);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <div>
      <Flex
        
        align="center"
        style={{
          marginBottom: 16,
        }}
        gap={8}
      >
        <Typography.Text style={{fontSize: 14}}>Total {value.length} configurations</Typography.Text>
        <Button style={{marginLeft: "auto"}} icon={<PlusOutlined />} onClick={handleAdd}>
          Add Unit Configuration
        </Button>
      </Flex>

      <List
        itemLayout="horizontal"
        dataSource={value}
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          padding: "4px",
        }}
        renderItem={(item, index) => (
          <List.Item
            style={{
              display: "flex",
              alignItems: "center",
              padding: "16px",
              marginBottom: "12px",
              border: "1px solid #f0f0f0",
              borderRadius: "8px",
              backgroundColor: "#fff",
            }}
          >
            {/* left section - price and details */}
            <div>
              <Typography.Text strong={true} style={{ fontSize: "18px" }}>
                Rs. {item.price.toLocaleString()}
              </Typography.Text>
              <Flex align="flex-end" style={{ marginTop: "4px" }}>
                {item.type && (
                  <Tag
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      display: "block",
                       marginRight: 4
                    }}
                  >
                    {item.type}
                  </Tag>
                )}
                {item.sizeBuiltup && (
                  <Typography.Text
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      display: "block",
                    }}
                  >
                    Built-up: {item.sizeBuiltup} sq ft
                  </Typography.Text>
                )}
                {item.sizeCarpet && (
                  <Typography.Text
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      display: "block",
                      marginLeft: 4
                    }}
                  >
                  | Carpet: {item.sizeCarpet} sq ft
                  </Typography.Text>
                )}
                {/* Fallback to old config field if new fields are not available */}
                {!item.type && !item.sizeBuiltup && item.config && (
                  <Typography.Text
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginTop: "4px",
                    }}
                  >
                    {item.config}
                  </Typography.Text>
                )}
              </Flex>
            </div>

            {/* middle section floorplan images */}
            <div
              style={{ flex: "1", display: "flex", justifyContent: "center" }}
            >
              {Array.isArray(item.floorplans) && item.floorplans.length > 0 && (
                <Image.PreviewGroup>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      justifyContent: "center",
                      maxWidth: "440px",
                    }}
                  >
                    {item.floorplans.map((url, i) => (
                      <Image
                        key={i}
                        src={url}
                        alt={`Floorplan ${i + 1}`}
                        width={80}
                        height={60}
                        style={{
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                      />
                    ))}
                  </div>
                </Image.PreviewGroup>
              )}
            </div>

            {/* Actions */}
            <div
              style={{
                flex: "0 0 100px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEdit(index)}
              />
              <Button
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(index)}
                danger
              />
            </div>
          </List.Item>
        )}
      />

      <Modal
        title={
          editingIndex === null
            ? "Add Unit Configuration"
            : "Edit Unit Configuration"
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          resetModalState();
        }}
        width={800}
        destroyOnClose={true}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          key={editingIndex === null ? "add" : `edit-${editingIndex}`}
          initialValues={{
            floorplans: [],
            ...(editingIndex !== null ? value[editingIndex] : {}),
          }}
        >
          <Form.Item
            name="sizeBuiltup"
            label="Super Built Up Area (sq ft)"
            rules={[
              {
                required: false,
                message: "Please input the super built up area!",
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="e.g., 1200"
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="sizeCarpet"
            label="Carpet Area (sq ft)"
            rules={[
              { required: false, message: "Please input the carpet area!" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="e.g., 900"
              min={0}
            />
          </Form.Item>
           <Form.Item
            name="sizePlot"
            label="Plot Area (sq ft)"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="e.g., 900"
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: "Please input the unit type!" }]}
          >
            <Input placeholder="e.g., 2 BHK, 3 BHK" />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: "Please input the price!" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/Rs.\s?|(,*)/g, "")}
              placeholder="Enter price"
            />
          </Form.Item>
          <Form.Item
            name="floorplans"
            label="Choose Floor Plans"
            extra={
              media.filter((item) => item.image?.tags.includes("floorplan"))
                .length === 0
                ? "Please add floor plans in media tab if no images are listed here"
                : undefined
            }
          >
            <Checkbox.Group style={{ width: "100%" }}>
              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  padding: "4px",
                  width: "100%",
                }}
              >
                <Row gutter={[16, 16]}>
                  {media
                    .filter((item) => item.image?.tags.includes("floorplan"))
                    .map((item) => {
                      const url = item.image?.url;
                      const currentFloorplans =
                        form.getFieldValue("floorplans") || [];
                      const isSelected = url
                        ? currentFloorplans.includes(url)
                        : false;
                      const isDisabled = url ? isFloorplanDisabled(url) : false;
                      const tooltipText = url
                        ? getDisabledTooltipText(url)
                        : "";

                      const floorplanContent = (
                        <div
                          onClick={() => {
                            const imageUrl = item.image?.url;
                            if (!imageUrl || isDisabled) return;

                            const currentSelected =
                              form.getFieldValue("floorplans") || [];
                            const newValue = currentSelected.includes(imageUrl)
                              ? currentSelected.filter(
                                  (v: string) => v !== imageUrl
                                )
                              : [...currentSelected, imageUrl];

                            form.setFieldValue("floorplans", newValue);
                          }}
                          style={{
                            border: `1px solid ${
                              isSelected
                                ? "#1890ff"
                                : isDisabled
                                ? "#f0f0f0"
                                : "#d9d9d9"
                            }`,
                            padding: "16px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            cursor: isDisabled ? "not-allowed" : "pointer",
                            transition: "all 0.3s",
                            backgroundColor: isSelected
                              ? "#e6f7ff"
                              : isDisabled
                              ? "#f9f9f9"
                              : "#ffffff",
                            opacity: isDisabled ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!isDisabled) {
                              e.currentTarget.style.borderColor = "#1890ff";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isDisabled) {
                              e.currentTarget.style.borderColor = isSelected
                                ? "#1890ff"
                                : "#d9d9d9";
                            }
                          }}
                        >
                          <Image
                            src={item.image?.url}
                            alt="Floorplan"
                            style={{
                              width: "120px",
                              height: "90px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              flexShrink: 0,
                              filter: isDisabled ? "grayscale(50%)" : "none",
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              marginLeft: "16px",
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                fontSize: "14px",
                                color: isDisabled ? "#999" : "inherit",
                              }}
                            >
                              {item.image?.caption ||
                                `Floorplan ${media.indexOf(item) + 1}`}
                            </div>
                          </div>
                          <Checkbox
                            checked={isSelected}
                            disabled={isDisabled}
                            value={item.image?.url}
                          />
                        </div>
                      );

                      return (
                        <Col span={12} key={item._id}>
                          {isDisabled ? (
                            <Tooltip title={tooltipText} placement="top">
                              {floorplanContent}
                            </Tooltip>
                          ) : (
                            floorplanContent
                          )}
                        </Col>
                      );
                    })}
                </Row>
              </div>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
