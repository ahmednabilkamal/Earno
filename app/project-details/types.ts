import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";

export type IconName = keyof typeof Ionicons.glyphMap;

export type SectionDetail = {
  label: string;
  value: ReactNode;
  icon?: IconName;
  subheader?: boolean;
};

export type SectionProps = {
  title: string;
  titleIcon?: IconName;
  details?: SectionDetail[];
  items?: string[];
  content?: string;
  variant?: "default" | "property";
};

export type ApiLikeError = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
};
