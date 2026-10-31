import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal-amount";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CategoryItemProps {
  item: {
    id: string;
    name: string;
    icon: string | null;
  };
  isActive: boolean;
  onPress: (id: string) => void;
}

export const CategoryItem = ({
  item,
  isActive,
  onPress,
}: CategoryItemProps) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language.startsWith("ar");

  return (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        isActive && styles.activeCategoryItem,
        { flexDirection: isRTL ? "row-reverse" : "row" },
      ]}
      onPress={() => onPress(item.id)}
    >
      {item.icon && (
        <Image
          source={{ uri: item.icon }}
          style={[
            styles.categoryIcon,
            isRTL ? { marginLeft: 8 } : { marginRight: 8 },
          ]}
        />
      )}
      <Text
        style={[styles.categoryText, isActive && styles.activeCategoryText]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
};

interface Tag {
  text: string;
  color: string;
  textColor: string;
}

interface ProjectItemProps {
  item: {
    id: string;
    title: string;
    description: string;
    image: string;
    tags: Tag[];
    investmentSize: string;
    opportunityType: string;
    projectType?: "commercial" | "real_estate" | "investor_seeking";
    isFavourite?: boolean;
    status?: string;
    isPublished?: boolean;
    paymentStatus?: string;
    rejectionReason?: string;
  };
  isFavorite?: boolean;
  openedFromFavorites?: boolean;
  isOwnProject?: boolean;
  /** When true, cards align edge-to-edge with parent list padding (e.g. search screen). */
  omitHorizontalMargin?: boolean;
  onFavoriteChange?: (projectId: string, isFavorite: boolean) => void;
}

export const ProjectItem = ({
  item,
  isFavorite: isFavoriteProp,
  openedFromFavorites = false,
  isOwnProject = false,
  omitHorizontalMargin = false,
}: ProjectItemProps) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language.startsWith("ar");
  const [imageError, setImageError] = React.useState(false);
  const ownerStatusNote = React.useMemo(() => {
    if (!isOwnProject) return null;

    const status = item.status ?? "";
    const paymentStatus = item.paymentStatus ?? "";

    const isUnpaid =
      paymentStatus !== "paid" &&
      paymentStatus !== "authorized";

    if (status === "rejected") {
      return {
        text: t("rejected_by_admin", {
          defaultValue: "Rejected by admin",
        }),
        backgroundColor: "#FEE2E2",
        borderColor: "#FCA5A5",
        textColor: "#991B1B",
      };
    }

    if (isUnpaid && status !== "active") {
      return {
        text: t("project_card_unpaid_pending", {
          defaultValue: "Unpaid: pay publication fee to send your project for review",
        }),
        backgroundColor: "#FEF3C7",
        borderColor: "#FCD34D",
        textColor: "#92400E",
      };
    }

    if (status === "active" && item.isPublished === false) {
      return {
        text: t("project_card_stopped", {
          defaultValue: "Stopped - this project is not visible to others",
        }),
        backgroundColor: "#F3F4F6",
        borderColor: "#D1D5DB",
        textColor: "#374151",
      };
    }

    if (status === "under_review" || status === "re_review") {
      return {
        text:
          status === "re_review"
            ? t("project_card_re_review", {
                defaultValue: "Under re-review after editing",
              })
            : t("project_card_under_review", {
                defaultValue: "Under review by admin",
              }),
        backgroundColor: "#DBEAFE",
        borderColor: "#93C5FD",
        textColor: "#1E40AF",
      };
    }

    return null;
  }, [isOwnProject, item.status, item.paymentStatus, item.isPublished, t]);

  const defaultImage = require("@/assets/images/no_project_default.jpeg");
  const imageSource = !item.image || imageError
    ? defaultImage
    : { uri: item.image };

  return (
    <TouchableOpacity
      style={[styles.card, omitHorizontalMargin && styles.cardNoHorizontalMargin]}
      onPress={() =>
        router.push({
          pathname: "/project-details",
          params: {
            id: item.id,
            fromFavorites: openedFromFavorites ? "1" : undefined,
            isOwnProject: isOwnProject ? "1" : undefined,
          },
        })
      }
      activeOpacity={0.9}
    >
      <View style={styles.cardImageContainer}>
        <Image
          source={imageSource}
          style={styles.cardImage}
          onError={() => setImageError(true)}
          defaultSource={defaultImage}
        />
        {item.projectType && (
          <View
            style={[
              styles.typeBadge,
              { top: 15, [isRTL ? "left" : "right"]: 15 },
            ]}
          >
            <Text style={styles.typeBadgeText}>
              {item.projectType === "commercial"
                ? t("project_type_commercial")
                : item.projectType === "real_estate"
                  ? t("project_type_real_estate")
                  : t("project_type_investor_seeking")}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        {item.tags && item.tags.length > 0 && (
          <View
            style={[
              styles.tagsContainer,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            {item.tags.map((tag, index) => (
              <View
                key={index}
                style={[
                  styles.tag,
                  { backgroundColor: tag.color || "#E0E0E0" },
                ]}
              >
                <Text
                  style={[styles.tagText, { color: tag.textColor || "#666" }]}
                >
                  {tag.text}
                </Text>
              </View>
            ))}
          </View>
        )}
        <Text
          style={[styles.cardTitle, { textAlign: isRTL ? "right" : "left" }]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.cardDescription,
            { textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {item.description}
        </Text>
        {ownerStatusNote && (
          <View
            style={[
              styles.ownerStatusNote,
              {
                backgroundColor: ownerStatusNote.backgroundColor,
                borderColor: ownerStatusNote.borderColor,
              },
            ]}
          >
            <Text
              style={[
                styles.ownerStatusNoteText,
                { color: ownerStatusNote.textColor, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {ownerStatusNote.text}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.detailsContainer,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t("investment_size")}</Text>
            <SaudiRiyalAmount
              value={item.investmentSize}
              textStyle={styles.detailValue}
              containerStyle={styles.detailValueAmount}
              locale={isRTL ? "ar-SA" : undefined}
            />
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t("opportunity_type")}</Text>
            <Text style={styles.detailValue}>{item.opportunityType}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardNoHorizontalMargin: {
    marginHorizontal: 0,
  },
  cardImageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  typeBadge: {
    position: "absolute",
    zIndex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(79,169,184,0.95)",
  },
  typeBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.CairoSemiBold,
    color: "#FFFFFF",
  },
  favoriteButton: {
    position: "absolute",
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: 15,
  },
  tagsContainer: {
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    fontFamily: Fonts.AlmaraiRegular,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Fonts.CairoSemiBold,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: Fonts.AlmaraiRegular,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 15,
  },
  ownerStatusNote: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  ownerStatusNoteText: {
    fontSize: 12,
    fontFamily: Fonts.CairoSemiBold,
  },
  detailsContainer: {
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    paddingTop: 15,
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: Fonts.CairoSemiBold,
    color: Colors.placeholder,
    marginBottom: 4,
    textAlign: "center",
  },
  detailValue: {
    fontSize: 12,
    fontFamily: Fonts.CairoMedium,
    color: Colors.placeholder,
    opacity: 0.5,
    textAlign: "center",
  },
  detailValueAmount: {
    justifyContent: "center",
  },
  categoryItem: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  activeCategoryItem: {
    backgroundColor: "#DCE788",
    borderColor: "#DCE788",
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: Fonts.AlmaraiRegular,
    color: Colors.text.primary,
  },
  activeCategoryText: {
    color: "#FFFFFF",
  },
});
