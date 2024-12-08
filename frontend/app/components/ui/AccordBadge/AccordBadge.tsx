import React from "react";
import { accordColors, isLightColor } from "@/app/utils/accordColors";

interface AccordBadgeProps {
  name: string;
  className?: string;
}

export const AccordBadge: React.FC<AccordBadgeProps> = ({
  name,
  className = "",
}) => {
  const backgroundColor = accordColors[name.toLowerCase()] || "#e2e8f0";
  const textColor = isLightColor(backgroundColor) ? "black" : "white";

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm ${className}`}
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {name}
    </span>
  );
};
