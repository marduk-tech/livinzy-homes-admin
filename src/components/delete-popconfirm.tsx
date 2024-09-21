import { Button, Popconfirm } from "antd";
import React, { ReactElement, ReactNode, useState } from "react";

export interface DeletePopconfirmProps {
  children: ReactElement | ReactElement[];
  title: string;
  description: string;
  handleOk: () => Promise<void>;
  isLoading: boolean;
}

export function DeletePopconfirm({
  children,
  title,
  description,
  handleOk,
  isLoading
}: DeletePopconfirmProps) {
  const [open, setOpen] = useState(false);

  const showPopconfirm = () => {
    setOpen(true);
  };

  const _handleOk = async () => {
    await handleOk();
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Popconfirm
      title={title}
      description={description}
      open={open}
      onConfirm={_handleOk}
      okButtonProps={{ loading: isLoading }}
      onCancel={handleCancel}
      placement="right"
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          onClick: showPopconfirm
        })
      )}
    </Popconfirm>
  );
}
