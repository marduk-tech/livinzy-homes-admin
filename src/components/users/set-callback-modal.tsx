import { CalendarOutlined } from "@ant-design/icons";
import { DatePicker, Modal, Typography } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import { useUpdateUserMutation } from "../../hooks/user-hooks";
import { User } from "../../types/user";

interface SetCallbackModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

export function SetCallbackModal({ user, open, onClose }: SetCallbackModalProps) {
  const defaultDatetime = dayjs().hour(10).minute(0).second(0).millisecond(0);
  const [selectedDatetime, setSelectedDatetime] = useState<Dayjs>(defaultDatetime);
  const updateUserMutation = useUpdateUserMutation();

  const handleOk = () => {
    if (!user) return;
    updateUserMutation.mutate(
      {
        userId: user._id,
        userData: {
          mobile: user.mobile,
          countryCode: user.countryCode,
          profile: {
            ...user.profile,
            preferredCallbackTimestamp: selectedDatetime.toISOString(),
          },
          savedLvnzyProjects: user.savedLvnzyProjects,
          status: user.status,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      title={
        <span>
          <CalendarOutlined style={{ marginRight: 8 }} />
          Set Preferred Callback — {user?.profile?.name || user?.mobile || "User"}
        </span>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Set Callback"
      okButtonProps={{ loading: updateUserMutation.isPending }}
      destroyOnClose
    >
      <div style={{ padding: "16px 0" }}>
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Pick a date and time for the preferred callback.
        </Typography.Text>
        <DatePicker
          showTime={{ format: "HH:mm", defaultValue: dayjs().hour(10).minute(0) }}
          format="DD MMM YYYY, HH:mm"
          value={selectedDatetime}
          onChange={(date) => setSelectedDatetime(date ?? defaultDatetime)}
          defaultValue={defaultDatetime}
          style={{ width: "100%" }}
          allowClear={false}
        />
      </div>
    </Modal>
  );
}
