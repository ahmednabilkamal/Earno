import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ProjectOwnerOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  onViewInterests: () => void;
  onEditProject: () => void;
  onStopProject: () => void;
  onRunAgain?: () => void;
  isPublished?: boolean;
  /** When true, hide "Run Project Again" (only show when suspended and not under review) */
  isUnderReview?: boolean;
  /** Show stop/run controls only when project is active and paid */
  canManagePublication?: boolean;
  isStopping?: boolean;
  isResuming?: boolean;
}

export const ProjectOwnerOptionsSheet = ({
  visible,
  onClose,
  onViewInterests,
  onEditProject,
  onStopProject,
  onRunAgain,
  isPublished = true,
  isUnderReview = false,
  canManagePublication = false,
  isStopping = false,
  isResuming = false,
}: ProjectOwnerOptionsSheetProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const isStopped = !isPublished;
  const showRunAgain = isStopped && !isUnderReview;

  const handleViewInterests = () => {
    onClose();
    onViewInterests();
  };

  const handleEditProject = () => {
    onClose();
    onEditProject();
  };

  const handleStopProject = () => {
    onClose();
    onStopProject();
  };

  const handleRunAgain = () => {
    onClose();
    onRunAgain?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={[styles.sheet, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
            <View style={styles.handle} />
            <Text style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}>
              {t("project_options", { defaultValue: "Project Options" })}
            </Text>

            <TouchableOpacity
              style={[styles.optionRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              onPress={handleViewInterests}
              activeOpacity={0.7}
              disabled={isStopping || isResuming}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="people" size={22} color={Colors.primary} />
              </View>
              <Text style={[styles.optionLabel, { textAlign: isRTL ? "right" : "left" }]}>
                {t("view_interests", { defaultValue: "View Interests" })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              onPress={handleEditProject}
              activeOpacity={0.7}
              disabled={isStopping || isResuming}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="pencil" size={22} color={Colors.primary} />
              </View>
              <Text style={[styles.optionLabel, { textAlign: isRTL ? "right" : "left" }]}>
                {t("edit_project")}
              </Text>
            </TouchableOpacity>

            {canManagePublication && (showRunAgain ? (
              <TouchableOpacity
                style={[
                  styles.optionRow,
                  styles.stopOptionRow,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
                onPress={handleRunAgain}
                activeOpacity={0.7}
                disabled={isResuming}
              >
                <View style={[styles.optionIcon, styles.runAgainIcon]}>
                  <Ionicons name="play-circle" size={22} color="#16a34a" />
                </View>
                {isResuming ? (
                  <ActivityIndicator size="small" color="#16a34a" style={isRTL ? { marginRight: 12 } : { marginLeft: 12 }} />
                ) : (
                  <Text style={[styles.optionLabel, styles.runAgainLabel, { textAlign: isRTL ? "right" : "left" }]}>
                    {t("run_project_again", { defaultValue: "Run Project Again" })}
                  </Text>
                )}
              </TouchableOpacity>
            ) : isStopped ? null : (
              <TouchableOpacity
                style={[
                  styles.optionRow,
                  styles.stopOptionRow,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
                onPress={handleStopProject}
                activeOpacity={0.7}
                disabled={isStopping}
              >
                <View style={[styles.optionIcon, styles.stopIcon]}>
                  <Ionicons name="stop-circle" size={22} color="#FF3B30" />
                </View>
                {isStopping ? (
                  <ActivityIndicator size="small" color="#FF3B30" style={isRTL ? { marginRight: 12 } : { marginLeft: 12 }} />
                ) : (
                  <Text style={[styles.optionLabel, styles.stopLabel, { textAlign: isRTL ? "right" : "left" }]}>
                    {t("stop_project")}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.CairoBold,
    color: "#002347",
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  stopOptionRow: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 8,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  stopIcon: {
    backgroundColor: "rgba(255,59,48,0.12)",
  },
  runAgainIcon: {
    backgroundColor: "rgba(22,163,74,0.12)",
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: Fonts.CairoSemiBold,
    color: "#002347",
    marginLeft: 14,
    marginRight: 14,
  },
  stopLabel: {
    color: "#FF3B30",
  },
  runAgainLabel: {
    color: "#16a34a",
  },
});
