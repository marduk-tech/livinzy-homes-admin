import { UploadOutlined } from "@ant-design/icons";
import { Button, message, Upload, UploadFile } from "antd";
import { UploadChangeParam, UploadProps } from "antd/es/upload";
import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { apiKey, baseApiUrl } from "../../libs/constants";

const MAX_FILE_SIZE_MB = 20;

interface MediaTabProps {
  onUploadComplete: (urls: string[], originalNames: string[]) => void;
  isMultiple?: boolean;
  showUploadList?: boolean;
  fileType?: "image" | "document";
  button?: {
    label?: string | ReactNode;
    type?: "primary" | "link" | "text" | "default" | "dashed" | undefined;
  };
}

export const FileUpload: React.FC<MediaTabProps> = ({
  onUploadComplete,
  isMultiple = true,
  showUploadList = false,
  fileType = "image",
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
    const originalNames: string[] = [];

    fileList.forEach((file) => {
      console.log(file);

      if (file.response) {
        urls.push(file.response.results[0].Location);
        originalNames.push(file.name);
      }
    });

    setFileList([]);
    onUploadComplete(urls, originalNames);
  }, [fileList, onUploadComplete]);

  useEffect(() => {
    if (!uploadPending && fileList && fileList.length) {
      handleProcessImages();
    }
  }, [fileList, handleProcessImages, uploadPending]);

  const beforeUpload = (file: UploadFile, fileList: UploadFile[]) => {
    const isUnderLimit = file.size! / 1024 / 1024 < MAX_FILE_SIZE_MB;
    if (!isUnderLimit) {
      message.error(`${file.name} is larger than ${MAX_FILE_SIZE_MB}MB!`);
    }
    return isUnderLimit;
  };

  return (
    <>
      <Upload
        name="files"
        accept={fileType === "image" ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx"}
        listType="picture"
        fileList={fileList}
        action={`${baseApiUrl}upload/multiple`}
        headers={{
          'x-api-key': apiKey,
          'client-type': 'admin',
        }}
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
