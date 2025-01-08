import React, { useState, useEffect } from "react";

type IconSetKey =
  | "fa"
  | "bi"
  | "fc"
  | "fa6"
  | "md"
  | "gi"
  | "ai"
  | "io"
  | "io5"
  | "tb"
  | "si"
  | "ri"
  | "fi"
  | "hi"
  | "bs"
  | "pi";

interface IconProps {
  iconSet: IconSetKey;
  iconName: string;
  size?: number;
  color?: string;
}

// Mapping for dynamic imports of icon sets
const dynamicImportMap = {
  fa: () => import("react-icons/fa"),
  bi: () => import("react-icons/bi"),
  fc: () => import("react-icons/fc"),
  fa6: () => import("react-icons/fa6"),
  md: () => import("react-icons/md"),
  gi: () => import("react-icons/gi"),
  ai: () => import("react-icons/ai"),
  io: () => import("react-icons/io"),
  io5: () => import("react-icons/io5"),
  tb: () => import("react-icons/tb"),
  si: () => import("react-icons/si"),
  ri: () => import("react-icons/ri"),
  fi: () => import("react-icons/fi"),
  hi: () => import("react-icons/hi"),
  bs: () => import("react-icons/bs"),
  pi: () => import("react-icons/pi"),
};

const DynamicReactIcon: React.FC<IconProps> = ({
  iconSet,
  iconName,
  size = 24,
  color = "black",
}) => {
  const [IconComponent, setIconComponent] = useState<React.ComponentType<{
    size?: number;
    color?: string;
  }> | null>(null);

  useEffect(() => {
    const loadIcon = async () => {
      if (!iconSet || !dynamicImportMap[iconSet]) {
        console.warn(`Icon set ${iconSet} not found.`);
        return;
      }

      try {
        // Dynamically import the icon set
        const iconSetModule = await dynamicImportMap[iconSet]();

        // Retrieve the specific icon from the module
        const SelectedIcon = (iconSetModule as any)[iconName];
        if (SelectedIcon) {
          setIconComponent(() => SelectedIcon); // Set the icon component dynamically
        } else {
          console.warn(`Icon ${iconName} not found in set ${iconSet}.`);
        }
      } catch (error) {
        console.error(
          `Error loading icon ${iconName} from set ${iconSet}:`,
          error
        );
      }
    };

    loadIcon();
  }, [iconSet, iconName]);

  if (!IconComponent) return null; // Render nothing while loading

  return <IconComponent size={size} color={color} />;
};

export default DynamicReactIcon;
