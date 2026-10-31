import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActionSheetIOS,
    Alert,
    Image,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import styles from "./styles";

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";
  const { user, updateUser } = useAuthStore();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: "",
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authService.getProfile();
        if (response && response.user) {
          updateUser(response.user);
          setFormData({
            name: response.user.name || "",
            email: response.user.email || "",
            phone: response.user.phone || "",
            avatar: response.user.avatar || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile in profile screen:", error);
      }
    };

    fetchProfile();
  }, [updateUser]);

  const showPermissionDeniedAlert = (messageKey: string) => {
    Alert.alert(
      t("error"),
      t(messageKey),
      [
        { text: t("cancel"), style: "cancel" },
        { text: t("open_settings"), onPress: () => Linking.openSettings() },
      ]
    );
  };

  const pickImageFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showPermissionDeniedAlert("camera_permission_required");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          setSelectedImage(asset.uri);
          if (asset.base64) {
            setSelectedImageBase64(asset.base64);
          } else {
            // If base64 is not available, try to get it from the URI
            console.warn("Base64 not available, using URI only");
          }
        }
      }
    } catch (error: any) {
      console.error("Error picking image from camera:", error);
      const errorMessage =
        error?.message || t("failed_to_pick_image");
      Alert.alert(t("error"), errorMessage);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showPermissionDeniedAlert("gallery_permission_required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          setSelectedImage(asset.uri);
          if (asset.base64) {
            setSelectedImageBase64(asset.base64);
          } else {
            // If base64 is not available, try to get it from the URI
            console.warn("Base64 not available, using URI only");
          }
        }
      }
    } catch (error: any) {
      console.error("Error picking image from gallery:", error);
      const errorMessage =
        error?.message || t("failed_to_pick_image");
      Alert.alert(t("error"), errorMessage);
    }
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t("cancel"), t("take_photo"), t("choose_from_gallery")],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImageFromCamera();
          } else if (buttonIndex === 2) {
            pickImageFromGallery();
          }
        }
      );
    } else {
      Alert.alert(
        t("select_image_source"),
        "",
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("take_photo"),
            onPress: pickImageFromCamera,
          },
          {
            text: t("choose_from_gallery"),
            onPress: pickImageFromGallery,
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsUploading(true);

      const body = {
        name: formData.name,
        email: formData.email || undefined,
        avatar: selectedImageBase64 ?? "",
      };

      const result = await authService.updateProfile(body);
      if (result && result.user) {
        updateUser(result.user);
        // Update form data with the response from API
        setFormData({
          name: result.user.name || "",
          email: result.user.email || "",
          phone: result.user.phone || "",
          avatar: result.user.avatar || "",
        });
        setSelectedImage(null);
        setSelectedImageBase64(null);
        Toast.show({
          type: "success",
          text1: t("success"),
          text2: t("profile_updated_successfully", {
            defaultValue: "Profile updated successfully",
          }),
        });
      }
      setIsUploading(false);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setIsUploading(false);
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          error.response?.data?.message ||
          t("failed_to_update_profile", {
            defaultValue: "Failed to update profile",
          }),
      });
    }
  };

  return (
    <View style={styles.container}>
      <GradientOverlay />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.contentAbove}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View
            style={[
              styles.header,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Text style={styles.headerTitle}>{t("personal_account")}</Text>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#002347"
              />
            </TouchableOpacity>
          </View>

          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <View style={styles.imageWrapper}>
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.profileImage}
                />
              ) : user?.avatar || user?.profile_photo_url ? (
                <Image
                  source={{
                    uri: user.avatar || user.profile_photo_url,
                  }}
                  style={styles.profileImage}
                />
              ) : (
                <View
                  style={[
                    styles.profileImage,
                    {
                      backgroundColor: "#EEE",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <Ionicons name="person" size={60} color="#999" />
                </View>
              )}
              {isUploading && (
                <View
                  style={[
                    styles.profileImage,
                    {
                      position: "absolute",
                      backgroundColor: "rgba(0,0,0,0.5)",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <Text style={{ color: "#FFF" }}>{t("uploading")}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.editImageIcon,
                  isRTL ? { left: 0 } : { right: 0 },
                ]}
                onPress={showImagePickerOptions}
                disabled={isUploading}
              >
                <MaterialCommunityIcons
                  name="image-plus-outline"
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("name")}
              </Text>
              <TextInput
                style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                textContentType="none"
                autoComplete="off"
                importantForAutofill="no"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("email")}
              </Text>
              <TextInput
                style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
                value={formData.email}
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                autoComplete="email"
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("phone_number")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    textAlign: isRTL ? "right" : "left",
                    writingDirection: "ltr",
                    opacity: 0.85,
                  },
                ]}
                value={formData.phone}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                editable={false}
              />
              <Text
                style={[
                  { fontSize: 12, color: "#888", marginTop: 4 },
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("mobile_number_cannot_change")}
              </Text>
            </View>
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.8}
            onPress={handleSaveProfile}
            disabled={isUploading}
          >
            <Text style={styles.editButtonText}>
              {isUploading ? t("uploading") : t("edit")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
