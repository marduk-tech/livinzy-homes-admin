import { UploadOutlined } from "@ant-design/icons";
import { Button, message, Upload, UploadFile } from "antd";
import { UploadChangeParam, UploadProps } from "antd/es/upload";
import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { baseApiUrl } from "../../libs/constants";

const MAX_IMAGE_SIZE_MB = 5;

interface MediaTabProps {
  onUploadComplete: (urls: string[]) => void;
  isMultiple?: boolean;
  showUploadList?: boolean;
  button?: {
    label?: string | ReactNode;
    type?: "primary" | "link" | "text" | "default" | "dashed" | undefined;
  };
}

export const ImgUpload: React.FC<MediaTabProps> = ({
  onUploadComplete,
  isMultiple = true,
  showUploadList = false,
  button = {
    label: "Upload",
    type: "primary",
  },
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadPending, setUploadPending] = useState<boolean>(false);

  const handleChange: UploadProps["onChange"] = ({ fileList }) => {
    setFileList(fileList);
    setUploadPending(!!fileList.find((file) => file.status !== "done"));
  };

  const handleProcessImages = useCallback(() => {
    const urls: string[] = [];

    fileList.forEach((file) => {
      if (file.response) {
        urls.push(file.response.results[0].Location);
      }
    });

    setFileList([]);
    onUploadComplete(urls);
  }, [fileList, onUploadComplete]);

  useEffect(() => {
    if (!uploadPending && fileList && fileList.length) {
      handleProcessImages();
    }
  }, [fileList, handleProcessImages, uploadPending]);

  const beforeUpload = (file: UploadFile, fileList: UploadFile[]) => {
    const isLt3M = file.size! / 1024 / 1024 < MAX_IMAGE_SIZE_MB;
    if (!isLt3M) {
      message.error(`${file.name} is larger than ${MAX_IMAGE_SIZE_MB}MB!`);
    }
    return isLt3M;
  };

  return (
    <>
      <Upload
        name="images"
        accept="image/*"
        listType="picture"
        fileList={fileList}
        action={`${baseApiUrl}upload/multiple`}
        beforeUpload={beforeUpload}
        onChange={handleChange}
        showUploadList={showUploadList}
        multiple={isMultiple}
        maxCount={!isMultiple ? 1 : undefined}
      >
        <Button
          icon={<UploadOutlined />}
          loading={uploadPending}
          type={button.type}
          style={{ marginRight: 16 }}
        >
          {button.label}
        </Button>
      </Upload>
    </>
  );
};
