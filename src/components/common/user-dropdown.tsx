import {
  ExclamationCircleFilled,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth0 } from "@auth0/auth0-react";
import { Button, Dropdown, Modal } from "antd";
import { Link } from "react-router-dom";

const { confirm } = Modal;

export function UserDropDown() {
  const { logout } = useAuth0();

  const showConfirm = () => {
    confirm({
      title: "Logout",
      icon: <ExclamationCircleFilled />,
      content: "Are you sure you want to logout ?",
      okText: "Logout",
      okType: "danger",
      cancelButtonProps: {
        type: "default",
        shape: "default",
      },
      onOk() {
        logout({
          logoutParams: {
            returnTo: window.location.origin,
          },
        });
      },
    });
  };

  const navLinks = [
    // { to: "/chroma-docs", label: "Chroma Docs" },
    // { to: "/global-knowledge", label: "Encyclopedia" },
    { to: "/config", label: "Config" },
    // { to: "/livindex-scores", label: "Livindex Scores" },
    // { to: "/ask", label: "Ask Liv", icon: <RobotOutlined /> },
    // { to: "/ask", label: "Ask Liv", icon: undefined },
    { to: "/users", label: "Users", icon: undefined },
  ];

  return (
    <Dropdown
      menu={{
        items: [
          ...navLinks.map(({ to, label, icon }) => ({
            key: to,
            label: (
              <Link to={to}>
                <Button
                  icon={icon}
                  type="link"
                  style={{
                    padding: 0,
                    height: 32,
                    width: 150,
                    textAlign: "left",
                    justifyContent: "flex-start",
                  }}
                >
                  {label}
                </Button>
              </Link>
            ),
          })),

          {
            key: "6",
            label: (
              <Button
                icon={<LogoutOutlined />}
                type="link"
                onClick={showConfirm}
                style={{
                  padding: 0,
                  height: 32,
                  width: 150,
                  textAlign: "left",
                  justifyContent: "flex-start",
                }}
              >
                Logout
              </Button>
            ),
          },
        ],
      }}
      placement="bottomRight"
    >
      <Button
        shape="circle"
        icon={<UserOutlined />}
        style={{
          marginRight: 16,
          marginLeft: "auto",
        }}
      ></Button>
    </Dropdown>
  );
}
