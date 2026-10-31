import { ThemedText } from "@/components/themed-text";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomDropdown } from "@/components/ui/custom-dropdown";
import CustomInput from "@/components/ui/custom-input";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Colors } from "@/constants/colors";
import {
  PREFERRED_INVESTMENT_TYPES,
  REQUIRED_PARTNER_TYPES,
  SAUDI_CITIES,
} from "@/constants/investor-onboarding-options";
import { projectService } from "@/services/project-service";
import { usePendingProjectStore } from "@/store/pending-project-store";
import { imageSourcesToRawBase64 } from "@/utils/image-base64";
import { Ionicons } from "@expo/vector-icons";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActionSheetIOS,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { parseCountField } from "@/utils/number-input";
import styles from "./styles";

// Cities without "all" for project location
const CITY_OPTIONS = SAUDI_CITIES.filter((c) => c.value !== "all");

async function pickerAssetToImageSource(
  asset: ImagePicker.ImagePickerAsset
): Promise<string | null> {
  const mime = (asset.mimeType || "").toLowerCase();
  const isAllowedMime =
    mime.includes("jpeg") ||
    mime.includes("jpg") ||
    mime.includes("png") ||
    mime.includes("gif") ||
    mime.includes("webp");

  if (asset.base64 && isAllowedMime) {
    const sub = mime.includes("png")
      ? "png"
      : mime.includes("gif")
        ? "gif"
        : mime.includes("webp")
          ? "webp"
          : "jpeg";
    return `data:image/${sub};base64,${asset.base64}`;
  }

  // Convert unsupported formats (e.g. HEIC) or uri-only assets to JPEG.
  if (asset.uri) {
    const converted = await manipulateAsync(
      asset.uri,
      [],
      { compress: 0.8, format: SaveFormat.JPEG, base64: true }
    );
    if (converted.base64) {
      return `data:image/jpeg;base64,${converted.base64}`;
    }
  }

  return null;
}

const getImageNameFromUri = (uri: string): string | null => {
  if (!uri || uri.startsWith("data:") || uri.startsWith("file://") || uri.startsWith("content://")) {
    return null;
  }

  const sanitize = (value: string) => {
    const withoutFragments = value.split("#")[0];
    const withoutQuery = withoutFragments.split("?")[0];
    const normalized = withoutQuery.replace(/\\/g, "/");
    const imagesMarker = "/images/";
    const imagesIndex = normalized.indexOf(imagesMarker);
    if (imagesIndex !== -1) {
      const relative = normalized.substring(imagesIndex + imagesMarker.length);
      return relative ? decodeURIComponent(relative) : null;
    }
    const leadingImagesMarker = "images/";
    if (normalized.startsWith(leadingImagesMarker)) {
      const relative = normalized.substring(leadingImagesMarker.length);
      return relative ? decodeURIComponent(relative) : null;
    }
    const segments = normalized.split("/").filter(Boolean);
    const candidate = segments.pop();
    return candidate ? decodeURIComponent(candidate) : null;
  };

  try {
    const parsed = new URL(uri);
    return sanitize(parsed.pathname);
  } catch {
    return sanitize(uri);
  }
};

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export default function AddInvestorProjectScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isRTL = i18n.language === "ar";
  const isEditMode = params.editMode === "true" && !!params.projectId;
  const editProjectId = params.projectId as string | undefined;

  const [projectField, setProjectField] = useState("");
  const [city, setCity] = useState("");
  const [detailedLocation, setDetailedLocation] = useState("");
  const [partnershipPct, setPartnershipPct] = useState("");
  const [investorCapital, setInvestorCapital] = useState("");
  const [requiredPartnerType, setRequiredPartnerType] = useState("");
  const [requirementsDescription, setRequirementsDescription] = useState("");
  const [investmentPartnershipType, setInvestmentPartnershipType] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [removedImageNames, setRemovedImageNames] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEditProject, setIsLoadingEditProject] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cityOptions = useMemo(
    () => CITY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  );
  const partnerTypeOptions = useMemo(
    () =>
      REQUIRED_PARTNER_TYPES.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  );
  const investmentTypeOptions = useMemo(
    () =>
      PREFERRED_INVESTMENT_TYPES.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  );

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!projectField.trim()) next.projectField = t("investor_project_field_required");
    if (!city) next.city = t("investor_city_required");
    if (!partnershipPct.trim()) {
      next.partnershipPct = t("investor_partnership_pct_required", {
        defaultValue: "Partnership % is required",
      });
    }
    const pct = parseCountField(partnershipPct.replace(/\D/g, ""));
    if (partnershipPct.trim() && (Number.isNaN(pct) || pct < 0 || pct > 100)) {
      next.partnershipPct = t("investor_partnership_pct_invalid");
    }
    const cap = parseFloat(investorCapital.replace(/[^\d.]/g, ""));
    if (Number.isNaN(cap) || cap < 1) {
      next.investorCapital = t("investor_capital_required");
    } else if (cap > 999999999.99) {
      next.investorCapital = t("investor_capital_max", {
        defaultValue: "Capital cannot exceed 999,999,999.99",
      });
    }
    if (!requiredPartnerType) next.requiredPartnerType = t("investor_partner_type_required");
    if (!requirementsDescription.trim() || requirementsDescription.trim().length < 20) {
      next.requirementsDescription = t("investor_requirements_min");
    }
    if (images.length === 0) {
      next.images = t("images_required", { defaultValue: "At least one image is required" });
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === "ios") {
      const options = [
        t("choose_from_gallery", { defaultValue: "Choose from gallery" }),
        t("take_photo", { defaultValue: "Take photo" }),
        t("cancel", { defaultValue: "Cancel" }),
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2 },
        (buttonIndex) => {
          if (buttonIndex === 0) pickFromGallery();
          else if (buttonIndex === 1) pickFromCamera();
        }
      );
    } else {
      Alert.alert(
        t("select_image_source", { defaultValue: "Select image source" }),
        "",
        [
          { text: t("take_photo", { defaultValue: "Take photo" }), onPress: pickFromCamera },
          { text: t("choose_from_gallery", { defaultValue: "Choose from gallery" }), onPress: pickFromGallery },
          { text: t("cancel", { defaultValue: "Cancel" }), style: "cancel" },
        ],
        { cancelable: true }
      );
    }
  };

  const showPermissionDeniedAlert = (messageKey: string) => {
    Alert.alert(t("error"), t(messageKey), [
      { text: t("cancel"), style: "cancel" },
      { text: t("open_settings"), onPress: () => Linking.openSettings() },
    ]);
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showPermissionDeniedAlert("camera_permission_required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset) {
      if (images.length >= MAX_IMAGE_COUNT) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("images_max_count", { defaultValue: "You can upload up to 5 images" }),
        });
        return;
      }
      if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("max_image_size_10mb", { defaultValue: "Each image must be smaller than 10MB" }),
        });
        return;
      }
      const source = await pickerAssetToImageSource(asset);
      if (source) {
        setImages((prev) => [...prev, source]);
        setErrors((e) => (e.images ? { ...e, images: "" } : e));
      } else {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("failed_to_process_image", {
            defaultValue: "Failed to process image",
          }),
        });
      }
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showPermissionDeniedAlert("gallery_permission_required");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets?.length) {
      if (images.length >= MAX_IMAGE_COUNT) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("images_max_count", { defaultValue: "You can upload up to 5 images" }),
        });
        return;
      }
      const remainingSlots = MAX_IMAGE_COUNT - images.length;
      const eligibleAssets = result.assets
        .filter((asset) => !asset.fileSize || asset.fileSize <= MAX_IMAGE_SIZE_BYTES)
        .slice(0, remainingSlots);
      if (eligibleAssets.length === 0) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("max_image_size_10mb", { defaultValue: "Each image must be smaller than 10MB" }),
        });
        return;
      }
      const converted = await Promise.all(
        eligibleAssets.map((asset) => pickerAssetToImageSource(asset))
      );
      const newSources = converted
        .filter((src): src is string => Boolean(src))
        .slice(0, remainingSlots);
      setImages((prev) => [...prev, ...newSources].slice(0, MAX_IMAGE_COUNT));
      if (newSources.length > 0) {
        setErrors((e) => (e.images ? { ...e, images: "" } : e));
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const imageToRemove = prev[index];
      if (!imageToRemove) return prev;

      const originalIndex = originalImages.findIndex((img) => img === imageToRemove);
      if (originalIndex !== -1) {
        setOriginalImages((current) => current.filter((_, i) => i !== originalIndex));
        const imageName = getImageNameFromUri(imageToRemove);
        if (imageName) {
          setRemovedImageNames((current) =>
            current.includes(imageName) ? current : [...current, imageName],
          );
        }
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  useEffect(() => {
    if (!isEditMode || !editProjectId) return;

    const loadProjectForEdit = async () => {
      try {
        setIsLoadingEditProject(true);
        const details = await projectService.getInvestorProjectById(editProjectId);

        setProjectField(details.projectField || "");
        setCity(details.city || "");
        setDetailedLocation(details.detailedLocation || "");
        setPartnershipPct(
          details.partnershipPercentageRequired != null
            ? String(details.partnershipPercentageRequired)
            : "",
        );
        setInvestorCapital(
          details.investorCapital != null ? String(details.investorCapital) : "",
        );
        setRequiredPartnerType(details.requiredPartnerType || "");
        setRequirementsDescription(details.requirementsDescription || "");
        setInvestmentPartnershipType(details.investmentPartnershipType || "");

        const existingImages = Array.isArray(details.images) ? details.images : [];
        setImages(existingImages);
        setOriginalImages(existingImages);
        setRemovedImageNames([]);
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2:
            error?.message ||
            t("failed_to_load_project", {
              defaultValue: "Failed to load project",
            }),
        });
      } finally {
        setIsLoadingEditProject(false);
      }
    };

    loadProjectForEdit();
  }, [isEditMode, editProjectId, t]);

  const handleSubmit = async () => {
    if (!validate()) {
      Toast.show({ type: "error", text1: t("error"), text2: t("validation_failed") });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      const originalImagesSet = new Set(originalImages);
      const imagesToUpload = images.filter((img) => !originalImagesSet.has(img));
      const processedImages = await imageSourcesToRawBase64(imagesToUpload.slice(0, 5));
      if (imagesToUpload.length > 0 && processedImages.length === 0) {
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("image_processing_failed", {
            defaultValue: "Could not process images. Please try again or pick different photos.",
          }),
        });
        return;
      }

      const payload = {
        project_field: projectField.trim(),
        city,
        detailed_location: detailedLocation.trim() || undefined,
        partnership_percentage_required: parseCountField(partnershipPct.replace(/\D/g, "")),
        investor_capital: parseFloat(investorCapital.replace(/[^\d.]/g, "")),
        required_partner_type: requiredPartnerType,
        requirements_description: requirementsDescription.trim(),
        investment_partnership_type: investmentPartnershipType.trim() || undefined,
        images: processedImages,
        ...(removedImageNames.length > 0 ? { remove_images: removedImageNames } : {}),
      };

      const result =
        isEditMode && editProjectId
          ? await projectService.updateInvestorProject(editProjectId, payload)
          : null;

      if (isEditMode && result?.success) {
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: isEditMode
            ? t("project_updated_successfully", {
                defaultValue: "Project updated successfully",
              })
            : t("investor_project_created"),
        });
        if (isEditMode) {
          router.back();
          return;
        }
        const projectId = result.project?.id ?? result.data?.id;
        if (projectId != null) {
          router.replace({
            pathname: "/project-details",
            params: { id: String(projectId), isOwnProject: "1" },
          });
        } else {
          router.replace("/home");
        }
      } else if (!isEditMode) {
        // Create flow uses payment first. Project is created by backend after successful payment.
        usePendingProjectStore.getState().setPendingProject({
          projectData: payload as unknown as Record<string, unknown>,
          projectType: "investor_seeking",
        });
        router.push({
          pathname: "/payment",
          params: {
            currency: "SAR",
            description: t("payment", { defaultValue: "Payment" }),
            paymentType: "project_publication",
            pendingProject: "1",
          },
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          error.message ||
          (isEditMode
            ? t("failed_to_update_project", {
                defaultValue: "Failed to update project",
              })
            : t("failed_to_create_project")),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <GradientOverlay />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.contentAbove}
      >
        <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Ionicons
              name={isRTL ? "arrow-forward" : "arrow-back"}
              size={24}
              color="#1A3A5C"
            />
          </Pressable>
          <ThemedText style={styles.title}>{t("investor_seeking_title")}</ThemedText>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("investor_project_field")}{" "}
              <Text style={styles.requiredAsterisk}>*</Text>
            </ThemedText>
            <CustomInput
              placeholder={t("investor_project_field_placeholder")}
              value={projectField}
              onChangeText={(v) => {
                setProjectField(v);
                if (errors.projectField) setErrors((e) => ({ ...e, projectField: "" }));
              }}
              containerStyle={{ marginBottom: 0 }}
            />
            {errors.projectField ? (
              <ThemedText style={styles.errorText}>{errors.projectField}</ThemedText>
            ) : null}
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("investor_city")}{" "}
              <Text style={styles.requiredAsterisk}>*</Text>
            </ThemedText>
            <CustomDropdown
              placeholder={t("investor_city_placeholder")}
              options={cityOptions}
              onSelect={(v) => {
                setCity(v);
                if (errors.city) setErrors((e) => ({ ...e, city: "" }));
              }}
              selectedValue={city}
              containerStyle={{ marginBottom: 0 }}
            />
            {errors.city ? (
              <ThemedText style={styles.errorText}>{errors.city}</ThemedText>
            ) : null}
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("investor_detailed_location")} ({t("onboarding_optional")})
            </ThemedText>
            <CustomInput
              placeholder={t("investor_detailed_location_placeholder")}
              value={detailedLocation}
              onChangeText={setDetailedLocation}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("investor_partnership_pct")}{" "}
              <Text style={styles.requiredAsterisk}>*</Text>
            </ThemedText>
            <CustomInput
              placeholder={t("investor_partnership_pct_placeholder")}
              value={partnershipPct}
              onChangeText={(v) => {
                setPartnershipPct(v.replace(/\D/g, "").slice(0, 3));
                if (errors.partnershipPct) setErrors((e) => ({ ...e, partnershipPct: "" }));
              }}
              keyboardType="number-pad"
              containerStyle={{ marginBottom: 0 }}
            />
            {errors.partnershipPct ? (
              <ThemedText style={styles.errorText}>{errors.partnershipPct}</ThemedText>
            ) : null}
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("investor_capital")}{" "}
              <Text style={styles.requiredAsterisk}>*</Text>
            </ThemedText>
            <CustomInput
              placeholder={t("investor_capital_placeholder")}
              value={investorCapital}
              onChangeText={(v) => {
                setInvestorCapital(v.replace(/[^\d.]/g, ""));
                if (errors.investorCapital) setErrors((e) => ({ ...e, investorCapital: "" }));
              }}
              keyboardType="decimal-pad"
              containerStyle={{ marginBottom: 0 }}
            />
            {errors.investorCapital ? (
              <ThemedText style={styles.errorText}>{errors.investorCapital}</ThemedText>
            ) : null}
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("investor_required_partner_type")}{" "}
              <Text style={styles.requiredAsterisk}>*</Text>
            </ThemedText>
            <CustomDropdown
              placeholder={t("investor_required_partner_type_placeholder")}
              options={partnerTypeOptions}
              onSelect={(v) => {
                setRequiredPartnerType(v);
                if (errors.requiredPartnerType)
                  setErrors((e) => ({ ...e, requiredPartnerType: "" }));
              }}
              selectedValue={requiredPartnerType}
              containerStyle={{ marginBottom: 0 }}
            />
            {errors.requiredPartnerType ? (
              <ThemedText style={styles.errorText}>{errors.requiredPartnerType}</ThemedText>
            ) : null}
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("investor_requirements_description")}{" "}
              <Text style={styles.requiredAsterisk}>*</Text>
            </ThemedText>
            <CustomInput
              placeholder={t("investor_requirements_placeholder")}
              value={requirementsDescription}
              onChangeText={(v) => {
                setRequirementsDescription(v);
                if (errors.requirementsDescription)
                  setErrors((e) => ({ ...e, requirementsDescription: "" }));
              }}
              multiline
              numberOfLines={4}
              containerStyle={{ marginBottom: 0 }}
            />
            {errors.requirementsDescription ? (
              <ThemedText style={styles.errorText}>{errors.requirementsDescription}</ThemedText>
            ) : null}
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("investor_investment_type")} ({t("onboarding_optional")})
            </ThemedText>
            <CustomDropdown
              placeholder={t("investor_investment_type_placeholder")}
              options={investmentTypeOptions}
              onSelect={setInvestmentPartnershipType}
              selectedValue={investmentPartnershipType}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("images_and_documents", { defaultValue: "Project Images" })}{" "}
              <Text style={styles.requiredAsterisk}>*</Text>
            </ThemedText>
            <Pressable style={styles.uploadBox} onPress={showImagePickerOptions}>
              <Ionicons name="images-outline" size={40} color={Colors.tagBg} />
              <ThemedText style={styles.uploadText}>
                {t("tap_to_upload_images", { defaultValue: "Tap to add images (up to 5)" })}
              </ThemedText>
              <ThemedText style={styles.uploadSubtext}>
                {t("max_image_size_10mb", { defaultValue: "Max 10MB per image" })}
              </ThemedText>
            </Pressable>
            {images.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                <ThemedText style={styles.imagePreviewTitle}>
                  {t("selected_images", { defaultValue: "Selected images" })} ({images.length})
                </ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imagePreviewScroll}
                  contentContainerStyle={styles.imagePreviewScrollContent}
                >
                  {images.map((uri, index) => (
                    <View key={index} style={styles.imagePreviewWrapper}>
                      <Image source={{ uri }} style={styles.imagePreview} resizeMode="cover" />
                      <Pressable style={styles.removeImageButton} onPress={() => removeImage(index)}>
                        <Ionicons name="close-circle" size={24} color={Colors.red} />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            {errors.images ? (
              <ThemedText style={styles.errorText}>{errors.images}</ThemedText>
            ) : null}
          </View>

            <CustomButton
            title={
              isLoadingEditProject
                ? t("loading")
                : isSubmitting
                  ? t("loading")
                  : isEditMode
                    ? t("update_project", { defaultValue: "Update Project" })
                    : t("submit")
            }
            onPress={handleSubmit}
            disabled={isSubmitting || isLoadingEditProject}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
