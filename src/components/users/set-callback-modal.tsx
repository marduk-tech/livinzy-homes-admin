import { CalendarOutlined } from "@ant-design/icons";
import { useAuth0 } from "@auth0/auth0-react";
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
  const { user: authUser } = useAuth0();

  const handleOk = () => {
    if (!user) return;
    const now = new Date().toISOString();
    const newComment = {
      comment: `callback/followup rescheduled to ${selectedDatetime.toISOString()}`,
      dateAdded: now,
      dateOriginal: now,
      addedBy: authUser?.email,
    };
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
          leadTrail: {
            comments: [...(user.leadTrail?.comments ?? []), newComment],
          },
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
