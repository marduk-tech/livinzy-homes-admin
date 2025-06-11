import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  List,
  Modal,
  Row,
  Space,
  Typography,
} from "antd";

import React, { useState } from "react";

interface UnitConfig {
  config: string;
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
  const [selectedFloorplans, setSelectedFloorplans] = useState<string[]>([]);
  const [form] = Form.useForm();

  const resetModalState = () => {
    form.resetFields();
    setSelectedFloorplans([]);
    form.setFieldValue("floorplans", []);
  };

  const handleAdd = () => {
    setEditingIndex(null);
    setIsModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      config: undefined,
      price: undefined,
      floorplans: [],
    });
    setSelectedFloorplans([]);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    form.setFieldsValue(value[index]);
    setSelectedFloorplans(value[index]?.floorplans || []);
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
      const newValue = [...value];

      if (editingIndex === null) {
        newValue.push({
          ...data,
          floorplans: data.floorplans || [],
        });
      } else {
        newValue[editingIndex] = {
          ...data,
          floorplans: data.floorplans || [],
        };
      }

      onChange?.(newValue);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <Button icon={<PlusOutlined />} onClick={handleAdd}>
          Add Unit Configuration
        </Button>
      </div>

      <List
        itemLayout="horizontal"
        dataSource={value}
        style={{
          maxHeight: "500px",
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
            {/* left section - price and config */}
            <div style={{ flex: "0 0 200px" }}>
              <Typography.Text strong={true} style={{ fontSize: "18px" }}>
                Rs. {item.price.toLocaleString()}
              </Typography.Text>
              <div>
                <Typography.Text
                  style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}
                >
                  {item.config}
                </Typography.Text>
              </div>
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
            name="config"
            label="Size"
            rules={[
              { required: true, message: "Please input the unit config!" },
            ]}
          >
            <Input placeholder="e.g., 2 BHK - 1200 sq ft" />
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
                      return (
                        <Col span={12} key={item._id}>
                          <div
                            onClick={() => {
                              const imageUrl = item.image?.url;
                              if (!imageUrl) return;

                              const currentSelected =
                                form.getFieldValue("floorplans") || [];
                              const newValue = currentSelected.includes(
                                imageUrl
                              )
                                ? currentSelected.filter(
                                    (v: string) => v !== imageUrl
                                  )
                                : [...currentSelected, imageUrl];

                              form.setFieldValue("floorplans", newValue);
                              setSelectedFloorplans(newValue);
                            }}
                            style={{
                              border: `1px solid ${
                                isSelected ? "#1890ff" : "#d9d9d9"
                              }`,
                              padding: "16px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                              cursor: "pointer",
                              transition: "all 0.3s",
                              backgroundColor: isSelected
                                ? "#e6f7ff"
                                : "#ffffff",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "#1890ff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = isSelected
                                ? "#1890ff"
                                : "#d9d9d9";
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
                              }}
                            />
                            <div
                              style={{
                                flex: 1,
                                marginLeft: "16px",
                                minWidth: 0,
                              }}
                            >
                              <div style={{ fontSize: "14px" }}>
                                {item.image?.caption ||
                                  `Floorplan ${media.indexOf(item) + 1}`}
                              </div>
                            </div>
                            <Checkbox
                              checked={isSelected}
                              value={item.image?.url}
                            />
                          </div>
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
