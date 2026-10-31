import {
  AddPaymentMethodSheet,
  AddPaymentMethodSheetRef,
} from "@/components/ui/add-payment-method-sheet";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomDropdown } from "@/components/ui/custom-dropdown";
import CustomInput from "@/components/ui/custom-input";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { SuccessModal } from "@/components/ui/success-modal";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import {
  Category,
  CreateProjectRequest,
  projectService,
  PropertyTypeValue,
} from "@/services/project-service";
import { parseCountField } from "@/utils/number-input";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ImgToBase64 from "react-native-image-base64";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import styles from "./styles";

const getImageNameFromUri = (uri: string): string | null => {
  if (
    !uri ||
    uri.startsWith("data:") ||
    uri.startsWith("file://") ||
    uri.startsWith("content://")
  ) {
    return null;
  }

  const sanitize = (value: string) => {
    const withoutFragments = value.split("#")[0];
    const withoutQuery = withoutFragments.split("?")[0];
    const normalized = withoutQuery.replace(/\\/g, "/");
    const imagesMarker = "/images/";
    const imagesIndex = normalized.indexOf(imagesMarker);
    if (imagesIndex !== -1) {
      const relative = normalized.substring(
        imagesIndex + imagesMarker.length
      );
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

const parseAmountField = (raw: string | number | null | undefined): number => {
  if (raw === null || raw === undefined) return Number.NaN;
  const cleaned = String(raw).trim().replace(/,/g, "");
  if (!cleaned) return Number.NaN;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : Number.NaN;
};

export default function AddProjectScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isRTL = i18n.language === "ar";

  const initialStep = params.step ? parseInt(params.step as string) : 1;
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [projectType, setProjectType] = useState<"commercial" | "real_estate" | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const hasNavigatedToPayment = useRef(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string; name_ar?: string | null }[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPaused, setUploadPaused] = useState(false);
  const addPaymentMethodSheetRef = useRef<AddPaymentMethodSheetRef>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isEditMode = params.editMode === "true" && !!params.projectId;
  const editProjectId = params.projectId as string | undefined;
  const [isLoadingEditProject, setIsLoadingEditProject] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const cardScaleCommercial = useRef(new Animated.Value(1)).current;
  const cardScaleRealEstate = useRef(new Animated.Value(1)).current;
  const formFadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch categories and cities on component mount
  useEffect(() => {
    fetchCategories();
    fetchCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard show/hide listeners to toggle footer button
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Fade in form when user chooses project type (not in edit mode)
  useEffect(() => {
    if (projectType !== null) {
      formFadeAnim.setValue(0);
      if (isEditMode) {
        formFadeAnim.setValue(1);
      } else {
        Animated.timing(formFadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }).start();
      }
    } else {
      formFadeAnim.setValue(0);
    }
  }, [projectType, isEditMode, formFadeAnim]);

  // Load project data when in edit mode
  useEffect(() => {
    if (!isEditMode || !editProjectId || categories.length === 0) return;

    const loadProjectForEdit = async () => {
      try {
        setIsLoadingEditProject(true);
        const details = await projectService.getProjectById(editProjectId, true);

        const formatDateForForm = (isoDate: string | undefined): string => {
          if (!isoDate) return "";
          const [y, m, d] = isoDate.split(/[-T]/);
          if (!d) return "";
          const day = d.padStart(2, "0");
          const month = String(parseInt(m, 10)).padStart(2, "0");
          const year = y;
          return `${day} / ${month} / ${year}`;
        };

        const existingImages = Array.isArray(details.images)
          ? [...details.images]
          : [];

        const isRealEstate = details.projectType === "real_estate";
        setProjectType(isRealEstate ? "real_estate" : "commercial");
        setFormData((prev) => ({
          ...prev,
          projectName: details.title || "",
          activityType:
            details.categoryId != null ? String(details.categoryId) : "",
          categoryId: details.categoryId ?? 0,
          city: details.city ?? "",
          detailedLocation: details.detailedLocation ?? "",
          yearOfEstablishment: formatDateForForm(details.establishmentDate),
          numberOfBranches:
            details.branchesCount != null ? String(details.branchesCount) : "",
          goalOfAdvertisement: details.announcementGoalType ?? "",
          requiredInvestment: details.investmentNeeded ?? details.funding?.goal ?? "",
          approximateProjectValue: details.projectValue ?? "",
          approximateSales: details.approximateSales ?? "",
          businessModel: details.businessModel ?? "",
          useOfFunds: details.useOfFunds ?? "",
          riskFactors: details.riskFactors ?? "",
          numberOfEmployees:
            details.employeesCount != null ? String(details.employeesCount) : "",
          operationalAge:
            details.operationalYears != null
              ? String(details.operationalYears)
              : "",
          timeline: details.timeline ?? "",
          images: existingImages,
          deedNumber: details.deedNumber ?? "",
          propertyType: details.propertyType ?? "",
          neighborhood: details.neighborhood ?? "",
          areaSqm: details.areaSqm != null ? String(details.areaSqm) : "",
          streetCount: details.streetCount != null ? String(details.streetCount) : "",
          floorCount: details.floorCount != null ? String(details.floorCount) : "",
          shopCount: details.shopCount != null ? String(details.shopCount) : "",
          apartmentCount: details.apartmentCount != null ? String(details.apartmentCount) : "",
          bedroomCount: details.bedroomCount != null ? String(details.bedroomCount) : "",
          bathroomCount: details.bathroomCount != null ? String(details.bathroomCount) : "",
          kitchenCount: details.kitchenCount != null ? String(details.kitchenCount) : "",
          livingRoomCount: details.livingRoomCount != null ? String(details.livingRoomCount) : "",
          hasCourtyard: details.hasCourtyard != null ? (details.hasCourtyard ? "yes" : "no") : "",
          propertyAgeYears: details.propertyAgeYears != null ? String(details.propertyAgeYears) : "",
          saleReason: details.saleReason ?? "",
          hasDeed: details.hasDeed != null ? (details.hasDeed ? "yes" : "no") : "",
          annualIncome: details.annualIncome != null ? String(details.annualIncome) : "",
          requestedAmount: details.requestedAmount != null ? String(details.requestedAmount) : "",
        }));

        setOriginalImages(existingImages);
        setRemovedImageNames([]);

        if (details.establishmentDate) {
          const [y, m, d] = details.establishmentDate.split(/[-T]/);
          if (y && m && d) {
            setSelectedDate(
              new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10))
            );
          }
        }
      } catch (error) {
        console.error("Error loading project for edit:", error);
        Alert.alert(t("error"), t("failed_to_load_project"));
      } finally {
        setIsLoadingEditProject(false);
      }
    };

    loadProjectForEdit();
  }, [isEditMode, editProjectId, categories.length, t]);

  useEffect(() => {
    if (!isEditMode) {
      setOriginalImages([]);
      setRemovedImageNames([]);
    }
  }, [isEditMode]);

  // Handle payment params - if coming from project details for payment
  useEffect(() => {
    if (
      params.paymentAmount &&
      params.projectId &&
      initialStep === 3 &&
      !hasNavigatedToPayment.current
    ) {
      const amount = parseFloat(params.paymentAmount as string);
      if (!isNaN(amount)) {
        hasNavigatedToPayment.current = true;
        setCreatedProjectId(params.projectId as string);
        router.push({
          pathname: "/payment",
          params: {
            amount: amount.toString(),
            currency: (params.paymentCurrency as string) || "SAR",
            description: t("payment", { defaultValue: "Payment" }),
            projectId: params.projectId as string,
            paymentType: "investment",
          },
        });
      }
    }
  }, [params.paymentAmount, params.projectId, params.paymentCurrency, initialStep, router, t]);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const fetchedCategories = await projectService.getCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert(t("error"), t("failed_to_load_categories"));
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchCities = async () => {
    try {
      const list = await projectService.getCities();
      setCities(list);
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
    }
  };

  const [formData, setFormData] = useState({
    projectName: "",
    sector: "",
    activityType: "",
    categoryId: 0,
    fundingGoal: "",
    minInvestment: "",
    maxInvestment: "",
    location: "",
    city: "",
    detailedLocation: "",
    yearOfEstablishment: "",
    numberOfBranches: "",
    goalOfAdvertisement: "",
    requiredInvestment: "",
    approximateProjectValue: "",
    timeline: "",
    businessModel: "",
    useOfFunds: "",
    riskFactors: "",
    numberOfEmployees: "",
    operationalAge: "",
    approximateSales: "",
    email: "",
    mobileNumber: "",
    paymentMethod: "",
    images: [] as string[],
    // Real estate
    deedNumber: "",
    propertyType: "" as PropertyTypeValue | "",
    neighborhood: "",
    areaSqm: "",
    streetCount: "",
    floorCount: "",
    shopCount: "",
    apartmentCount: "",
    bedroomCount: "",
    bathroomCount: "",
    kitchenCount: "",
    livingRoomCount: "",
    hasCourtyard: "",
    propertyAgeYears: "",
    saleReason: "",
    hasDeed: "",
    annualIncome: "",
    requestedAmount: "",
  });

  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [removedImageNames, setRemovedImageNames] = useState<string[]>([]);

  const updateFormData = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field when user starts typing
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
      // Format date as DD / MM / YYYY
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const formattedDate = `${day} / ${month} / ${year}`;
      updateFormData("yearOfEstablishment", formattedDate);
    }
  };

  const validateStep = (): {
    valid: boolean;
    errors: Record<string, string>;
  } => {
    const errors: Record<string, string> = {};
    const isCommercial = projectType === "commercial";
    const isRealEstate = projectType === "real_estate";

    // Commercial Step 1
    if (isCommercial && currentStep === 1) {
      if (!formData.projectName.trim()) errors.projectName = t("project_name_required");
      if (!formData.activityType || !formData.categoryId) errors.activityType = t("activity_type_required", { defaultValue: "Activity type is required" });
      if (!formData.city.trim()) errors.city = t("city_required", { defaultValue: "City is required" });
      if (!formData.detailedLocation.trim()) errors.detailedLocation = t("detailed_location_required", { defaultValue: "Detailed location is required" });
      if (!formData.yearOfEstablishment.trim()) errors.yearOfEstablishment = t("year_of_establishment_required", { defaultValue: "Year of establishment is required" });
      if (!formData.numberOfBranches.trim()) errors.numberOfBranches = t("number_of_branches_required", { defaultValue: "Number of branches is required" });
      else {
        const n = parseCountField(formData.numberOfBranches);
        if (isNaN(n) || n <= 0) errors.numberOfBranches = t("number_of_branches_invalid", { defaultValue: "Number of branches must be a valid number" });
        else if (n > 1000) errors.numberOfBranches = t("number_of_branches_max", { defaultValue: "Number of branches cannot exceed 1,000" });
      }
      if (!formData.goalOfAdvertisement.trim()) errors.goalOfAdvertisement = t("goal_of_advertisement_required", { defaultValue: "Goal of advertisement is required" });
      if (!formData.requiredInvestment.trim()) errors.requiredInvestment = t("required_investment_required", { defaultValue: "Required investment is required" });
      else {
        const v = parseAmountField(formData.requiredInvestment);
        if (isNaN(v) || v <= 0) errors.requiredInvestment = t("required_investment_invalid", { defaultValue: "Required investment must be a valid number" });
        else if (v < 1000) errors.requiredInvestment = t("investment_minimum_1000");
        else if (v > 100000000) errors.requiredInvestment = t("investment_exceeds_limit");
      }
      if (!formData.approximateProjectValue.trim()) errors.approximateProjectValue = t("approximate_project_value_required", { defaultValue: "Approximate project value is required" });
      else {
        const v = parseAmountField(formData.approximateProjectValue);
        if (isNaN(v)) errors.approximateProjectValue = t("approximate_project_value_invalid", { defaultValue: "Approximate project value must be a valid number" });
        else if (v < 0.01) errors.approximateProjectValue = t("project_value_minimum", { defaultValue: "Project value must be at least 0.01" });
        else if (v > 100000000) errors.approximateProjectValue = t("project_value_exceeds_limit", { defaultValue: "Project value cannot exceed 100,000,000" });
      }
    }

    // Commercial Step 2
    if (isCommercial && currentStep === 2) {
      if (!formData.businessModel.trim()) errors.businessModel = t("business_model_required");
      else if (formData.businessModel.trim().length < 50) errors.businessModel = t("business_model_min_chars", { count: 50, current: formData.businessModel.trim().length });
      if (!formData.numberOfEmployees.trim()) errors.numberOfEmployees = t("number_of_employees_required", { defaultValue: "Number of employees is required" });
      else {
        const n = parseCountField(formData.numberOfEmployees);
        if (isNaN(n) || n <= 0) errors.numberOfEmployees = t("number_of_employees_invalid", { defaultValue: "Number of employees must be a valid number" });
        else if (n > 10000) errors.numberOfEmployees = t("number_of_employees_max", { defaultValue: "Number of employees cannot exceed 10,000" });
      }
      if (!formData.operationalAge.trim()) errors.operationalAge = t("operational_age_required", { defaultValue: "Operational age is required" });
      else {
        const n = parseCountField(formData.operationalAge);
        if (isNaN(n) || n < 0) errors.operationalAge = t("operational_age_invalid", { defaultValue: "Operational age must be a valid number" });
        else if (n > 100) errors.operationalAge = t("operational_age_max", { defaultValue: "Operational age cannot exceed 100" });
      }
      if (!formData.approximateSales.trim()) errors.approximateSales = t("approximate_sales_required", { defaultValue: "Approximate sales is required" });
      else {
        const v = parseAmountField(formData.approximateSales);
        if (isNaN(v)) errors.approximateSales = t("approximate_sales_invalid", { defaultValue: "Approximate sales must be a valid number" });
        else if (v < 0.01) errors.approximateSales = t("approximate_sales_minimum", { defaultValue: "Approximate sales must be at least 0.01" });
        else if (v > 100000000) errors.approximateSales = t("sales_exceeds_limit");
      }
      if (formData.images.length === 0) errors.images = t("images_required", { defaultValue: "At least one image is required" });
    }

    // Real estate Step 1 (deed + property type)
    if (isRealEstate && currentStep === 1) {
      if (!formData.deedNumber.trim()) errors.deedNumber = t("deed_number_required", { defaultValue: "Deed number is required" });
      if (!formData.propertyType) errors.propertyType = t("property_type_required", { defaultValue: "Property type is required" });
      if (!formData.projectName.trim()) errors.projectName = t("project_name_required");
    }

    // Real estate Step 2 (property data)
    if (isRealEstate && currentStep === 2) {
      if (!formData.city.trim()) errors.city = t("city_required", { defaultValue: "City is required" });
      if (!formData.neighborhood.trim()) errors.neighborhood = t("neighborhood_required", { defaultValue: "Neighborhood is required" });
      if (!formData.areaSqm.trim()) {
        errors.areaSqm = t("area_required", { defaultValue: "Area is required" });
      } else {
        const area = parseAmountField(formData.areaSqm);
        if (isNaN(area) || area < 0) errors.areaSqm = t("area_invalid", { defaultValue: "Area must be a valid non-negative number" });
        else if (area > 999999.99) errors.areaSqm = t("area_max", { defaultValue: "Area cannot exceed 999,999.99" });
      }
      if (!formData.streetCount.trim()) errors.streetCount = t("street_count_required", { defaultValue: "Number of streets is required" });
      else {
        const value = parseCountField(formData.streetCount);
        if (isNaN(value) || value < 0) errors.streetCount = t("street_count_invalid", { defaultValue: "Street count must be a valid number" });
        else if (value > 1000) errors.streetCount = t("street_count_max", { defaultValue: "Street count cannot exceed 1,000" });
      }
      if (!formData.floorCount.trim()) errors.floorCount = t("floor_count_required", { defaultValue: "Number of floors is required" });
      else {
        const value = parseCountField(formData.floorCount);
        if (isNaN(value) || value < 0) errors.floorCount = t("floor_count_invalid", { defaultValue: "Floor count must be a valid number" });
        else if (value > 500) errors.floorCount = t("floor_count_max", { defaultValue: "Floor count cannot exceed 500" });
      }
      if (!formData.shopCount.trim()) errors.shopCount = t("shop_count_required", { defaultValue: "Number of shops is required" });
      else {
        const value = parseCountField(formData.shopCount);
        if (isNaN(value) || value < 0) errors.shopCount = t("shop_count_invalid", { defaultValue: "Shop count must be a valid number" });
        else if (value > 10000) errors.shopCount = t("shop_count_max", { defaultValue: "Shop count cannot exceed 10,000" });
      }
      if (!formData.apartmentCount.trim()) errors.apartmentCount = t("apartment_count_required", { defaultValue: "Number of apartments is required" });
      else {
        const value = parseCountField(formData.apartmentCount);
        if (isNaN(value) || value < 0) errors.apartmentCount = t("apartment_count_invalid", { defaultValue: "Apartment count must be a valid number" });
        else if (value > 10000) errors.apartmentCount = t("apartment_count_max", { defaultValue: "Apartment count cannot exceed 10,000" });
      }
      if (!formData.bedroomCount.trim()) errors.bedroomCount = t("bedroom_count_required", { defaultValue: "Number of bedrooms is required" });
      else {
        const value = parseCountField(formData.bedroomCount);
        if (isNaN(value) || value < 0) errors.bedroomCount = t("bedroom_count_invalid", { defaultValue: "Bedroom count must be a valid number" });
        else if (value > 500) errors.bedroomCount = t("bedroom_count_max", { defaultValue: "Bedroom count cannot exceed 500" });
      }
      if (!formData.bathroomCount.trim()) errors.bathroomCount = t("bathroom_count_required", { defaultValue: "Number of bathrooms is required" });
      else {
        const value = parseCountField(formData.bathroomCount);
        if (isNaN(value) || value < 0) errors.bathroomCount = t("bathroom_count_invalid", { defaultValue: "Bathroom count must be a valid number" });
        else if (value > 500) errors.bathroomCount = t("bathroom_count_max", { defaultValue: "Bathroom count cannot exceed 500" });
      }
      if (!formData.kitchenCount.trim()) errors.kitchenCount = t("kitchen_count_required", { defaultValue: "Number of kitchens is required" });
      else {
        const value = parseCountField(formData.kitchenCount);
        if (isNaN(value) || value < 0) errors.kitchenCount = t("kitchen_count_invalid", { defaultValue: "Kitchen count must be a valid number" });
        else if (value > 500) errors.kitchenCount = t("kitchen_count_max", { defaultValue: "Kitchen count cannot exceed 500" });
      }
      if (!formData.livingRoomCount.trim()) errors.livingRoomCount = t("living_room_count_required", { defaultValue: "Number of living rooms is required" });
      else {
        const value = parseCountField(formData.livingRoomCount);
        if (isNaN(value) || value < 0) errors.livingRoomCount = t("living_room_count_invalid", { defaultValue: "Living room count must be a valid number" });
        else if (value > 500) errors.livingRoomCount = t("living_room_count_max", { defaultValue: "Living room count cannot exceed 500" });
      }
      if (!formData.hasCourtyard) errors.hasCourtyard = t("has_courtyard_required", { defaultValue: "Please specify if there is a courtyard" });
      if (!formData.propertyAgeYears.trim()) errors.propertyAgeYears = t("property_age_required", { defaultValue: "Property age is required" });
      else {
        const value = parseCountField(formData.propertyAgeYears);
        if (isNaN(value) || value < 0) errors.propertyAgeYears = t("property_age_invalid", { defaultValue: "Property age must be a valid number" });
        else if (value > 500) errors.propertyAgeYears = t("property_age_max", { defaultValue: "Property age cannot exceed 500" });
      }
      if (!formData.saleReason.trim()) errors.saleReason = t("sale_reason_required", { defaultValue: "Reason for sale is required" });
      if (!formData.hasDeed) errors.hasDeed = t("has_deed_required", { defaultValue: "Please specify if deed exists" });
      if (!formData.annualIncome.trim()) errors.annualIncome = t("annual_income_required", { defaultValue: "Annual income is required" });
      else {
        const value = parseAmountField(formData.annualIncome);
        if (isNaN(value) || value < 0) errors.annualIncome = t("annual_income_invalid", { defaultValue: "Annual income must be a valid non-negative number" });
        else if (value > 999999999.99) errors.annualIncome = t("annual_income_max", { defaultValue: "Annual income cannot exceed 999,999,999.99" });
      }
      if (!formData.requestedAmount.trim()) {
        errors.requestedAmount = t("requested_amount_required", { defaultValue: "Requested amount is required" });
      } else {
        const v = parseAmountField(formData.requestedAmount);
        if (isNaN(v) || v < 0) {
          errors.requestedAmount = t("requested_amount_invalid", { defaultValue: "Requested amount must be a valid number" });
        } else if (v < 1000) {
          errors.requestedAmount = t("investment_minimum_1000");
        } else if (v > 999999999.99) {
          errors.requestedAmount = t("requested_amount_max", { defaultValue: "Requested amount cannot exceed 999,999,999.99" });
        }
      }
    }

    // Real estate Step 3 (images)
    if (isRealEstate && currentStep === 3) {
      if (formData.images.length === 0) errors.images = t("images_required", { defaultValue: "At least one image is required" });
    }

    setFieldErrors(errors);
    const valid = Object.keys(errors).length === 0;
    return { valid, errors };
  };

  const handleNext = async () => {
    const { valid, errors } = validateStep();
    if (!valid) {
      const messages = Object.values(errors);
      Toast.show({
        type: "error",
        text1: t("missing_required_fields_title", {
          defaultValue: "Required fields",
        }),
        text2:
          messages[0] ||
          t("form_check_highlighted_fields", {
            defaultValue: "Please complete the highlighted fields.",
          }),
      });
      return;
    }

    const isCommercial = projectType === "commercial";
    const isRealEstate = projectType === "real_estate";

    if (isCommercial) {
      if (currentStep < 2) {
        setCurrentStep(currentStep + 1);
        if (currentStep === 1) setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true }), 100);
      } else if (currentStep === 2) {
        await handleSubmit();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else if (isRealEstate) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
        setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true }), 100);
      } else if (currentStep === 3) {
        await handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Format the date to YYYY-MM-DD format
      const formatDateForAPI = (dateString: string): string => {
        if (!dateString) return "";
        // Convert "DD / MM / YYYY" to "YYYY-MM-DD"
        const parts = dateString.split(" / ");
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
        return dateString;
      };

      // Prepare the request body with only required fields from step 1 and step 2
      // Process images: convert to base64 strings using react-native-image-base64
      const originalImagesSet = new Set(originalImages);
      const imagesToUpload = formData.images.filter(
        (img) =>
          img &&
          typeof img === "string" &&
          img.length > 0 &&
          !originalImagesSet.has(img)
      );

      const processedImagesPromises = imagesToUpload.map(async (img) => {
        try {
          if (img.startsWith("data:image")) {
            const parts = img.split(",");
            if (parts.length > 1 && parts[1].length > 0) {
              return parts[1];
            }
            const commaIndex = img.indexOf(",");
            if (commaIndex !== -1 && commaIndex < img.length - 1) {
              return img.substring(commaIndex + 1);
            }
          }

          if (
            img.startsWith("file://") ||
            img.startsWith("content://") ||
            img.startsWith("/")
          ) {
            const base64String = await ImgToBase64.getBase64String(img);
            return base64String;
          }

          return img;
        } catch (error) {
          console.error("Error processing image to base64:", error);
          if (img.startsWith("data:image")) {
            const parts = img.split(",");
            if (parts.length > 1) return parts[1];
          }
          return null;
        }
      });

      const processedImagesResults = await Promise.all(processedImagesPromises);
      const processedImages = processedImagesResults.filter(
        (img): img is string => typeof img === "string" && img.length > 0
      ); // Filter out any null or empty strings

      const categoryId = formData.categoryId || parseInt(formData.activityType?.toString() || "0", 10) || 0;

      // In edit mode, project_type is immutable — omit from update payload
      const projectData: CreateProjectRequest =
        projectType === "real_estate"
          ? {
            ...(isEditMode ? {} : { project_type: "real_estate" }),
            title: formData.projectName,
            ...(categoryId > 0 ? { category_id: categoryId } : {}),
            city: formData.city,
            detailed_location: formData.detailedLocation || undefined,
            deed_number: formData.deedNumber.trim(),
            property_type: formData.propertyType as PropertyTypeValue,
            neighborhood: formData.neighborhood.trim(),
            area_sqm: parseAmountField(formData.areaSqm),
            street_count: parseCountField(formData.streetCount),
            floor_count: parseCountField(formData.floorCount),
            shop_count: parseCountField(formData.shopCount),
            apartment_count: parseCountField(formData.apartmentCount),
            bedroom_count: parseCountField(formData.bedroomCount),
            bathroom_count: parseCountField(formData.bathroomCount),
            kitchen_count: parseCountField(formData.kitchenCount),
            living_room_count: parseCountField(formData.livingRoomCount),
            has_courtyard: formData.hasCourtyard === "yes",
            property_age_years: parseCountField(formData.propertyAgeYears),
            sale_reason: formData.saleReason.trim(),
            has_deed: formData.hasDeed === "yes",
            annual_income: parseAmountField(formData.annualIncome),
            requested_amount: parseAmountField(formData.requestedAmount),
            business_model: formData.businessModel?.trim() || undefined,
            investment_needed: parseAmountField(formData.requestedAmount),
            project_value: parseAmountField(formData.requestedAmount),
            images: processedImages,
            ...(isEditMode && removedImageNames.length > 0 ? { remove_images: removedImageNames } : {}),
          }
          : {
            ...(isEditMode ? {} : { project_type: "commercial" }),
            title: formData.projectName,
            city: formData.city,
            detailed_location: formData.detailedLocation,
            established_date: formatDateForAPI(formData.yearOfEstablishment),
            branches_count: parseCountField(formData.numberOfBranches),
            announcement_goal: formData.goalOfAdvertisement,
            investment_needed: parseAmountField(formData.requiredInvestment),
            project_value: parseAmountField(formData.approximateProjectValue),
            category_id: categoryId,
            business_model: formData.businessModel,
            approximate_sales: parseAmountField(formData.approximateSales),
            employees_count: parseCountField(formData.numberOfEmployees),
            operational_years: parseCountField(formData.operationalAge),
            images: processedImages,
            ...(isEditMode && removedImageNames.length > 0 ? { remove_images: removedImageNames } : {}),
          };

      if (isEditMode && editProjectId) {
        // Edit: update project
        const response = await projectService.updateProject(editProjectId, projectData);
        if (response.success) {
          Toast.show({
            type: "success",
            text1: t("success"),
            text2: t("project_updated_successfully", {
              defaultValue: "Project updated successfully",
            }),
          });
          router.back();
        } else {
          Alert.alert(
            t("error"),
            response.message ||
              t("failed_to_update_project", {
                defaultValue: "Failed to update project",
              }),
          );
        }
        return;
      }

      // Create first, then proceed to publication payment for the created project.
      const createResponse = await projectService.createProject(projectData);
      if (!createResponse.success) {
        throw new Error(
          createResponse.message ||
            t("failed_to_create_project", { defaultValue: "Failed to create project" })
        );
      }

      const createdId = createResponse.project?.id ?? createResponse.data?.id;
      if (!createdId) {
        throw new Error(
          t("failed_to_create_project", { defaultValue: "Failed to create project" })
        );
      }

      router.push({
        pathname: "/payment",
        params: {
          projectId: String(createdId),
          currency: "SAR",
          description: t("payment", { defaultValue: "Payment" }),
          paymentType: "project_publication",
        },
      });
    } catch (error: any) {
      console.error(isEditMode ? "Error updating project:" : "Error creating project:", error);
      const ve = error?.validationErrors as
        | Record<string, string[]>
        | undefined;
      const invErr = ve?.investment_needed?.[0];
      if (invErr && isEditMode) {
        if (projectType === "real_estate") {
          setFieldErrors((prev) => ({ ...prev, requestedAmount: invErr }));
          setCurrentStep(2);
        } else {
          setFieldErrors((prev) => ({ ...prev, requiredInvestment: invErr }));
          setCurrentStep(1);
        }
        setTimeout(
          () => scrollViewRef.current?.scrollTo({ y: 0, animated: true }),
          100
        );
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: invErr,
        });
        return;
      }
      Alert.alert(
        t("error"),
        error.message || (isEditMode ? t("failed_to_update_project", { defaultValue: "Failed to update project" }) : t("failed_to_create_project"))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewProject = () => {
    setShowSuccessModal(false);
    // Navigate to the project detail page if we have an ID, otherwise go to home
    if (createdProjectId) {
      router.replace({
        pathname: "/project-details",
        params: { id: createdProjectId },
      });
    } else {
      router.push("/(tabs)/home");
    }
  };

  const handleBack = () => {
    if (projectType && currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (projectType && currentStep === 1 && !isEditMode) {
      setProjectType(null);
    } else {
      router.back();
    }
  };

  const showDiscardWarningAndLeave = () => {
    setShowDiscardModal(true);
  };

  const handleDiscardOk = () => {
    setShowDiscardModal(false);
    router.replace("/(tabs)/home");
  };

  useEffect(() => {
    if (currentStep !== 2) return;

    const onBack = () => {
      showDiscardWarningAndLeave();
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [currentStep, t]);

  // Image picker functions
  const calculateTotalSize = (images: string[]): number => {
    // Calculate size of base64 strings (approximate)
    const totalBytes = images.reduce((sum, img) => {
      // Remove data:image/...;base64, prefix if present
      const base64Data = img.split(",")[1] || img;
      // Base64 size is approximately (string length * 3) / 4
      return sum + (base64Data.length * 3) / 4;
    }, 0);
    return totalBytes / (1024 * 1024); // Convert to MB
  };

  const showPermissionDeniedAlert = (messageKey: string, openSettingsKey: string) => {
    Alert.alert(t("error"), t(messageKey), [
      { text: t("cancel"), style: "cancel" },
      { text: t(openSettingsKey), onPress: () => Linking.openSettings() },
    ]);
  };

  const pickerAssetToUploadDataUrl = async (
    asset: ImagePicker.ImagePickerAsset
  ): Promise<string | null> => {
    const mime = (asset.mimeType || "").toLowerCase();
    const isAllowedMime =
      mime.includes("jpeg") ||
      mime.includes("jpg") ||
      mime.includes("png") ||
      mime.includes("gif") ||
      mime.includes("webp");

    if (asset.base64 && isAllowedMime) {
      const subtype = mime.includes("png")
        ? "png"
        : mime.includes("gif")
          ? "gif"
          : mime.includes("webp")
            ? "webp"
            : "jpeg";
      return `data:image/${subtype};base64,${asset.base64}`;
    }

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
  };

  const pickImageFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showPermissionDeniedAlert("camera_permission_required", "open_settings");
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
        if (formData.images.length >= MAX_IMAGE_COUNT) {
          Alert.alert(
            t("error"),
            t("images_max_count", { defaultValue: "You can upload up to 5 images" })
          );
          return;
        }
        if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
          Alert.alert(
            t("error"),
            t("max_image_size_10mb", {
              defaultValue: "Each image must be smaller than 10MB",
            })
          );
          return;
        }
        const uploadImage = await pickerAssetToUploadDataUrl(asset);
        if (uploadImage) {
          // Start showing progress after image is selected
          setIsUploading(true);
          setUploadProgress(0);

          // Simulate upload progress
          for (let i = 0; i <= 100; i += 10) {
            if (uploadPaused) {
              await new Promise((resolve) => {
                const checkPause = setInterval(() => {
                  if (!uploadPaused) {
                    clearInterval(checkPause);
                    resolve(true);
                  }
                }, 100);
              });
            }
            setUploadProgress(i);
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          const newImages = [...formData.images, uploadImage];

          setFormData((prev) => ({ ...prev, images: newImages }));
          // Clear images error when images are added
          if (fieldErrors.images) {
            setFieldErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors.images;
              return newErrors;
            });
          }
          setUploadProgress(100);
          setTimeout(() => setIsUploading(false), 500);
        } else {
          Alert.alert(
            t("error"),
            t("failed_to_process_image", {
              defaultValue: "Failed to process image",
            })
          );
        }
      }
    } catch (error: any) {
      console.error("Error picking image from camera:", error);
      const errorMessage = error?.message || t("failed_to_pick_image");
      Alert.alert(t("error"), errorMessage);
      setIsUploading(false);
    }
  };

  const pickImagesFromGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showPermissionDeniedAlert("gallery_permission_required", "open_settings");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        if (formData.images.length >= MAX_IMAGE_COUNT) {
          Alert.alert(
            t("error"),
            t("images_max_count", { defaultValue: "You can upload up to 5 images" })
          );
          return;
        }
        // Start showing progress after images are selected
        setIsUploading(true);
        setUploadProgress(0);

        const remainingSlots = MAX_IMAGE_COUNT - formData.images.length;
        const eligibleAssets = result.assets
          .filter((asset) => !asset.fileSize || asset.fileSize <= MAX_IMAGE_SIZE_BYTES)
          .slice(0, remainingSlots);
        if (eligibleAssets.length === 0) {
          Alert.alert(
            t("error"),
            t("max_image_size_10mb", {
              defaultValue: "Each image must be smaller than 10MB",
            })
          );
          setIsUploading(false);
          return;
        }
        const totalImages = eligibleAssets.length;
        const newImages: string[] = [];

        // Process images one by one with progress
        for (let i = 0; i < eligibleAssets.length; i++) {
          if (uploadPaused) {
            await new Promise((resolve) => {
              const checkPause = setInterval(() => {
                if (!uploadPaused) {
                  clearInterval(checkPause);
                  resolve(true);
                }
              }, 100);
            });
          }

          const asset = eligibleAssets[i];
          const uploadImage = await pickerAssetToUploadDataUrl(asset);
          if (uploadImage) {
            newImages.push(uploadImage);
            const progress = ((i + 1) / totalImages) * 100;
            setUploadProgress(progress);
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        const allImages = [...formData.images, ...newImages].slice(0, MAX_IMAGE_COUNT);
        setFormData((prev) => ({ ...prev, images: allImages }));
        setUploadProgress(100);
        setTimeout(() => setIsUploading(false), 500);
      }
    } catch (error) {
      console.error("Error picking images from gallery:", error);
      Alert.alert(t("error"), t("failed_to_pick_image"));
      setIsUploading(false);
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
            pickImagesFromGallery();
          }
        }
      );
    } else {
      Alert.alert(
        t("select_image_source"),
        "",
        [
          { text: t("take_photo"), onPress: pickImageFromCamera },
          { text: t("choose_from_gallery"), onPress: pickImagesFromGallery },
          { text: t("cancel"), style: "cancel" },
        ],
        { cancelable: true }
      );
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = formData.images[index];
    if (!imageToRemove) return;

    const remainingCount = formData.images.length - 1;

    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));

    const originalIndex = originalImages.findIndex(
      (img) => img === imageToRemove
    );
    if (originalIndex !== -1) {
      setOriginalImages((prev) =>
        prev.filter((_, i) => i !== originalIndex)
      );

      const imageName = getImageNameFromUri(imageToRemove);
      if (imageName) {
        setRemovedImageNames((prev) =>
          prev.includes(imageName) ? prev : [...prev, imageName]
        );
      }
    }

    if (remainingCount > 0 && fieldErrors.images) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };

  const cancelUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadPaused(false);
  };

  const togglePauseUpload = () => {
    setUploadPaused(!uploadPaused);
  };

  const renderUploadProgress = () => {
    if (!isUploading) return null;

    const remainingTime = Math.ceil(((100 - uploadProgress) / 100) * 30);

    return (
      <View style={styles.uploadProgressCard}>
        <View
          style={[
            styles.uploadProgressContent,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <View style={styles.uploadProgressInfo}>
            <Text
              style={[
                styles.uploadProgressTitle,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {uploadPaused ? t("upload_paused") : t("uploading")}
            </Text>
            <Text
              style={[
                styles.uploadProgressSubtitle,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {t("remaining")} {remainingTime} {t("seconds")} •{" "}
              {Math.round(uploadProgress)}%
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${uploadProgress}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.uploadProgressButtons}>
            <Pressable style={styles.pauseButton} onPress={togglePauseUpload}>
              <Ionicons
                name={uploadPaused ? "play" : "pause"}
                size={20}
                color="#FFF"
              />
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={cancelUpload}>
              <Ionicons name="close" size={20} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  // Convert categories to dropdown options
  const activityTypes = categories.map((category) => ({
    label:
      isRTL
        ? category.name_ar || category.localized_name || category.name
        : category.name || category.localized_name || category.name_ar || "",
    value: category.id.toString(),
  }));

  // Convert cities to dropdown options
  const cityOptions = cities.map((c) => ({
    label: isRTL && c.name_ar ? c.name_ar : c.name,
    value: c.name,
  }));

  const totalSteps = projectType === "real_estate" ? 3 : projectType === "commercial" ? 2 : 1;
  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <View
          key={step}
          style={[
            styles.progressSegment,
            step <= currentStep && styles.progressSegmentActive,
          ]}
        />
      ))}
    </View>
  );

  const chooseProjectType = (type: "commercial" | "real_estate") => {
    const scaleAnim = type === "commercial" ? cardScaleCommercial : cardScaleRealEstate;
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.delay(100),
    ]).start(() => {
      setProjectType(type);
      setCurrentStep(1);
      scaleAnim.setValue(1);
    });
  };

  const renderProjectTypeChoice = () => (
    <View style={styles.projectTypeChoiceContainer}>
      <Text style={[styles.projectTypeChoiceTitle, { textAlign: isRTL ? "right" : "left" }]}>
        {t("choose_project_type", { defaultValue: "Choose project type" })}
      </Text>
      <Text style={[styles.projectTypeChoiceSubtitle, { textAlign: isRTL ? "right" : "left" }]}>
        {t("choose_project_type_hint", { defaultValue: "Select the type of project you want to add" })}
      </Text>
      <Pressable onPress={() => chooseProjectType("commercial")}>
        <Animated.View
          style={[
            styles.projectTypeCard,
            { flexDirection: isRTL ? "row-reverse" : "row", transform: [{ scale: cardScaleCommercial }] },
          ]}
        >
          <View style={[styles.projectTypeCardIconWrap, isRTL ? { marginLeft: 18 } : { marginRight: 18 }]}>
            <Ionicons name="business-outline" size={30} color={Colors.primary} />
          </View>
          <View style={styles.projectTypeCardContent}>
            <Text style={[styles.projectTypeCardTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("project_type_commercial", { defaultValue: "Commercial Project" })}
            </Text>
            <Text style={[styles.projectTypeCardSubtitle, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
              {t("project_type_commercial_desc", { defaultValue: "Present your business and attract investors or sell a stake" })}
            </Text>
          </View>
          <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={22} color={Colors.text.light} />
        </Animated.View>
      </Pressable>
      <Pressable onPress={() => chooseProjectType("real_estate")}>
        <Animated.View
          style={[
            styles.projectTypeCard,
            { flexDirection: isRTL ? "row-reverse" : "row", transform: [{ scale: cardScaleRealEstate }] },
          ]}
        >
          <View style={[styles.projectTypeCardIconWrap, isRTL ? { marginLeft: 18 } : { marginRight: 18 }]}>
            <Ionicons name="home-outline" size={30} color={Colors.primary} />
          </View>
          <View style={styles.projectTypeCardContent}>
            <Text style={[styles.projectTypeCardTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("project_type_real_estate", { defaultValue: "Real Estate Project" })}
            </Text>
            <Text style={[styles.projectTypeCardSubtitle, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
              {t("project_type_real_estate_desc", { defaultValue: "List property for sale or investment with full details" })}
            </Text>
          </View>
          <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={22} color={Colors.text.light} />
        </Animated.View>
      </Pressable>
    </View>
  );

  const propertyTypeOptions: { value: PropertyTypeValue; labelAr: string; labelEn: string }[] = [
    { value: "commercial_building", labelAr: "عمارة تجارية", labelEn: "Commercial building" },
    { value: "hotel", labelAr: "فندق", labelEn: "Hotel" },
    { value: "land", labelAr: "أرض", labelEn: "Land" },
    { value: "other", labelAr: "أخرى", labelEn: "Other" },
  ];

  const renderRealEstateStep1 = () => (
    <>
      <CustomInput
        label={`${t("project_name")} *`}
        placeholder={t("enter_project_name")}
        value={formData.projectName}
        onChangeText={(val) => updateFormData("projectName", val)}
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={fieldErrors.projectName ? Colors.red : Colors.border}
        labelColor={Colors.create_project_title}
        error={fieldErrors.projectName}
      />
      <CustomInput
        label={`${t("deed_number")} *`}
        placeholder={t("deed_number_placeholder", { defaultValue: "Enter deed number" })}
        value={formData.deedNumber}
        onChangeText={(val) => updateFormData("deedNumber", val)}
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={fieldErrors.deedNumber ? Colors.red : Colors.border}
        labelColor={Colors.create_project_title}
        error={fieldErrors.deedNumber}
      />
      <View style={styles.radioSection}>
        <Text style={[styles.radioTitle, { textAlign: isRTL ? "right" : "left" }]}>
          {t("property_type")} <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        {fieldErrors.propertyType && (
          <Text style={[{ color: Colors.red, fontSize: 12, marginTop: 4 }, { textAlign: isRTL ? "right" : "left" }]}>{fieldErrors.propertyType}</Text>
        )}
        {propertyTypeOptions.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.radioItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}
            onPress={() => updateFormData("propertyType", opt.value)}
          >
            <View style={[styles.radioCircle, formData.propertyType === opt.value && styles.radioCircleSelected]}>
              {formData.propertyType === opt.value && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.radioLabel, isRTL ? { marginRight: 12 } : { marginLeft: 12 }]}>
              {isRTL ? opt.labelAr : opt.labelEn}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );

  const renderRealEstateStep2 = () => {
    const inputProps = {
      containerStyle: styles.input,
      inputBackgroundColor: Colors.white,
      labelColor: Colors.create_project_title,
    };
    const currencyIcon = <View style={{ marginRight: 8 }}><Image source={require("@/assets/images/real_currency.png")} style={{ width: 20, height: 20 }} resizeMode="contain" /></View>;
    return (
      <>
        {/* Location */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
            {t("re_step2_section_location")}
          </Text>
          <CustomDropdown label={`${t("city")} *`} placeholder={t("enter_city")} options={cityOptions} onSelect={(val) => updateFormData("city", val)} selectedValue={formData.city} borderColor={fieldErrors.city ? Colors.red : Colors.border} error={fieldErrors.city} searchable {...inputProps} />
          <CustomInput label={`${t("neighborhood")} *`} placeholder={t("neighborhood_placeholder")} value={formData.neighborhood} onChangeText={(val) => updateFormData("neighborhood", val)} borderColor={fieldErrors.neighborhood ? Colors.red : Colors.border} error={fieldErrors.neighborhood} {...inputProps} />
        </View>

        {/* Property details */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
            {t("re_step2_section_property")}
          </Text>
          <CustomInput label={`${t("area_sqm")} *`} placeholder={t("area_placeholder")} value={formData.areaSqm} onChangeText={(val) => updateFormData("areaSqm", val)} keyboardType="decimal-pad" borderColor={fieldErrors.areaSqm ? Colors.red : Colors.border} error={fieldErrors.areaSqm} {...inputProps} />
        </View>

        {/* Units & rooms - two columns where it fits */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
            {t("re_step2_section_units")}
          </Text>
          <View style={[styles.rowInputs, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <CustomInput label={`${t("street_count")} *`} value={formData.streetCount} onChangeText={(val) => updateFormData("streetCount", val)} keyboardType="number-pad" containerStyle={[styles.input, { flex: 1, marginBottom: 0 }]} inputBackgroundColor={Colors.white} borderColor={fieldErrors.streetCount ? Colors.red : Colors.border} labelColor={Colors.create_project_title} error={fieldErrors.streetCount} />
            <CustomInput label={`${t("floor_count")} *`} value={formData.floorCount} onChangeText={(val) => updateFormData("floorCount", val)} keyboardType="number-pad" containerStyle={[styles.input, { flex: 1, marginBottom: 0 }]} inputBackgroundColor={Colors.white} borderColor={fieldErrors.floorCount ? Colors.red : Colors.border} labelColor={Colors.create_project_title} error={fieldErrors.floorCount} />
          </View>
          <View style={[styles.rowInputs, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <CustomInput label={`${t("shop_count")} *`} value={formData.shopCount} onChangeText={(val) => updateFormData("shopCount", val)} keyboardType="number-pad" containerStyle={[styles.input, { flex: 1, marginBottom: 0 }]} inputBackgroundColor={Colors.white} borderColor={fieldErrors.shopCount ? Colors.red : Colors.border} labelColor={Colors.create_project_title} error={fieldErrors.shopCount} />
            <CustomInput label={`${t("apartment_count")} *`} value={formData.apartmentCount} onChangeText={(val) => updateFormData("apartmentCount", val)} keyboardType="number-pad" containerStyle={[styles.input, { flex: 1, marginBottom: 0 }]} inputBackgroundColor={Colors.white} borderColor={fieldErrors.apartmentCount ? Colors.red : Colors.border} labelColor={Colors.create_project_title} error={fieldErrors.apartmentCount} />
          </View>
          <View style={[styles.rowInputs, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <CustomInput label={`${t("bedroom_count")} *`} value={formData.bedroomCount} onChangeText={(val) => updateFormData("bedroomCount", val)} keyboardType="number-pad" containerStyle={[styles.input, { flex: 1, marginBottom: 0 }]} inputBackgroundColor={Colors.white} borderColor={fieldErrors.bedroomCount ? Colors.red : Colors.border} labelColor={Colors.create_project_title} error={fieldErrors.bedroomCount} />
            <CustomInput label={`${t("bathroom_count")} *`} value={formData.bathroomCount} onChangeText={(val) => updateFormData("bathroomCount", val)} keyboardType="number-pad" containerStyle={[styles.input, { flex: 1, marginBottom: 0 }]} inputBackgroundColor={Colors.white} borderColor={fieldErrors.bathroomCount ? Colors.red : Colors.border} labelColor={Colors.create_project_title} error={fieldErrors.bathroomCount} />
          </View>
          <View style={[styles.rowInputs, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <CustomInput label={`${t("kitchen_count")} *`} value={formData.kitchenCount} onChangeText={(val) => updateFormData("kitchenCount", val)} keyboardType="number-pad" containerStyle={[styles.input, { flex: 1, marginBottom: 0 }]} inputBackgroundColor={Colors.white} borderColor={fieldErrors.kitchenCount ? Colors.red : Colors.border} labelColor={Colors.create_project_title} error={fieldErrors.kitchenCount} />
            <CustomInput label={`${t("living_room_count")} *`} value={formData.livingRoomCount} onChangeText={(val) => updateFormData("livingRoomCount", val)} keyboardType="number-pad" containerStyle={[styles.input, { flex: 1, marginBottom: 0 }]} inputBackgroundColor={Colors.white} borderColor={fieldErrors.livingRoomCount ? Colors.red : Colors.border} labelColor={Colors.create_project_title} error={fieldErrors.livingRoomCount} />
          </View>
        </View>

        {/* Additional info */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
            {t("re_step2_section_other")}
          </Text>
          <View style={styles.radioSection}>
            <Text style={[styles.radioTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("has_courtyard")}{" "}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            {fieldErrors.hasCourtyard ? (
              <Text
                style={[
                  { color: Colors.red, fontSize: 12, marginTop: 4, marginBottom: 4 },
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {fieldErrors.hasCourtyard}
              </Text>
            ) : null}
            {["yes", "no"].map((opt) => (
              <Pressable key={opt} style={[styles.radioItem, { flexDirection: isRTL ? "row-reverse" : "row" }]} onPress={() => updateFormData("hasCourtyard", opt)}>
                <View style={[styles.radioCircle, formData.hasCourtyard === opt && styles.radioCircleSelected]}>{formData.hasCourtyard === opt && <View style={styles.radioInner} />}</View>
                <Text style={[styles.radioLabel, isRTL ? { marginRight: 12 } : { marginLeft: 12 }]}>{opt === "yes" ? t("yes") : t("no")}</Text>
              </Pressable>
            ))}
          </View>
          <CustomInput label={`${t("property_age")} *`} placeholder="0" value={formData.propertyAgeYears} onChangeText={(val) => updateFormData("propertyAgeYears", val)} keyboardType="number-pad" borderColor={fieldErrors.propertyAgeYears ? Colors.red : Colors.border} error={fieldErrors.propertyAgeYears} {...inputProps} />
          <CustomInput label={`${t("sale_reason")} *`} value={formData.saleReason} onChangeText={(val) => updateFormData("saleReason", val)} containerStyle={styles.input} multiline inputBackgroundColor={Colors.white} borderColor={fieldErrors.saleReason ? Colors.red : Colors.border} labelColor={Colors.create_project_title} error={fieldErrors.saleReason} />
          <View style={styles.radioSection}>
            <Text style={[styles.radioTitle, { textAlign: isRTL ? "right" : "left" }]}>
              {t("has_deed")}{" "}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            {fieldErrors.hasDeed ? (
              <Text
                style={[
                  { color: Colors.red, fontSize: 12, marginTop: 4, marginBottom: 4 },
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {fieldErrors.hasDeed}
              </Text>
            ) : null}
            {["yes", "no"].map((opt) => (
              <Pressable key={opt} style={[styles.radioItem, { flexDirection: isRTL ? "row-reverse" : "row" }]} onPress={() => updateFormData("hasDeed", opt)}>
                <View style={[styles.radioCircle, formData.hasDeed === opt && styles.radioCircleSelected]}>{formData.hasDeed === opt && <View style={styles.radioInner} />}</View>
                <Text style={[styles.radioLabel, isRTL ? { marginRight: 12 } : { marginLeft: 12 }]}>{opt === "yes" ? t("yes") : t("no")}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Financial */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, { textAlign: isRTL ? "right" : "left" }]}>
            {t("re_step2_section_financial")}
          </Text>
          <CustomInput label={`${t("annual_income")} *`} value={formData.annualIncome} onChangeText={(val) => updateFormData("annualIncome", val)} keyboardType="decimal-pad" borderColor={fieldErrors.annualIncome ? Colors.red : Colors.border} error={fieldErrors.annualIncome} rightComponent={currencyIcon} {...inputProps} />
          <CustomInput label={`${t("requested_amount")} *`} value={formData.requestedAmount} onChangeText={(val) => updateFormData("requestedAmount", val)} keyboardType="decimal-pad" borderColor={fieldErrors.requestedAmount ? Colors.red : Colors.border} error={fieldErrors.requestedAmount} rightComponent={currencyIcon} {...inputProps} />
        </View>
      </>
    );
  };

  const renderRealEstateStep3 = () => (
    <>
      <View style={styles.uploadSection}>
        <Text style={[styles.uploadTitle, { textAlign: isRTL ? "right" : "left" }]}>
          {t("images_and_documents")}{" "}
          <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        {fieldErrors.images && <Text style={[{ color: Colors.red, fontSize: 12, marginTop: 4 }, { textAlign: isRTL ? "right" : "left" }]}>{fieldErrors.images}</Text>}
        <Pressable style={styles.uploadBox} onPress={showImagePickerOptions}>
          <Ionicons name="cloud-upload-outline" size={56} color="#5BA8B5" />
          <Text style={styles.uploadText}>{t("tap_to_upload")}</Text>
          <Text style={styles.uploadSubtext}>{t("max_image_size_10mb", { defaultValue: "Max 10MB per image" })} ({calculateTotalSize(formData.images).toFixed(2)} MB {t("used")})</Text>
        </Pressable>
        {renderUploadProgress()}
        {formData.images.length > 0 && (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.imagePreviewTitle}>{t("selected_images")} ({formData.images.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScroll}>
              {formData.images.map((image, index) => (
                <View key={index} style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />
                  <Pressable style={styles.removeImageButton} onPress={() => removeImage(index)}>
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </>
  );

  const renderStep1 = () => (
    <>
      <CustomInput
        label={`${t("project_name")} *`}
        placeholder={t("enter_project_name")}
        value={formData.projectName}
        onChangeText={(val) => updateFormData("projectName", val)}
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={fieldErrors.projectName ? Colors.red : Colors.border}
        labelColor={Colors.create_project_title}
        error={fieldErrors.projectName}
      />

      <CustomDropdown
        label={`${t("activity_type")} *`}
        placeholder={isLoadingCategories ? t("loading") : t("select_type")}
        options={activityTypes}
        onSelect={(val) => {
          updateFormData("activityType", val);
          updateFormData("categoryId", val);
        }}
        selectedValue={formData.activityType}
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={fieldErrors.activityType ? Colors.red : Colors.border}
        labelColor={Colors.create_project_title}
        disabled={isLoadingCategories}
        error={fieldErrors.activityType}
        searchable
      />

      <CustomDropdown
        label={`${t("city")} *`}
        placeholder={t("enter_city")}
        options={cityOptions}
        onSelect={(val) => updateFormData("city", val)}
        selectedValue={formData.city}
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={fieldErrors.city ? Colors.red : Colors.border}
        labelColor={Colors.create_project_title}
        error={fieldErrors.city}
        searchable
      />

      <CustomInput
        label={`${t("detailed_location")} *`}
        placeholder={t("enter_detailed_location")}
        value={formData.detailedLocation}
        onChangeText={(val) => updateFormData("detailedLocation", val)}
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={fieldErrors.detailedLocation ? Colors.red : Colors.border}
        labelColor={Colors.create_project_title}
        error={fieldErrors.detailedLocation}
      />

      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <CustomInput
          label={`${t("year_of_establishment")} *`}
          placeholder="DD / MM / YYYY"
          value={formData.yearOfEstablishment}
          onChangeText={(val) => updateFormData("yearOfEstablishment", val)}
          containerStyle={styles.input}
          inputBackgroundColor={Colors.white}
          borderColor={
            fieldErrors.yearOfEstablishment ? Colors.red : Colors.border
          }
          labelColor={Colors.create_project_title}
          editable={false}
          pointerEvents="none"
          error={fieldErrors.yearOfEstablishment}
          rightComponent={
            <View style={{ marginRight: 10 }}>
              <Ionicons
                name="calendar-outline"
                size={22}
                color={Colors.text.light}
              />
            </View>
          }
        />
      </TouchableOpacity>

      <CustomInput
        label={`${t("number_of_branches")} *`}
        placeholder={t("enter_number_of_branches")}
        value={formData.numberOfBranches}
        onChangeText={(val) => updateFormData("numberOfBranches", val)}
        keyboardType="number-pad"
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={fieldErrors.numberOfBranches ? Colors.red : Colors.border}
        labelColor={Colors.create_project_title}
        error={fieldErrors.numberOfBranches}
      />

      <View style={styles.radioSection}>
        <Text
          style={[styles.radioTitle, { textAlign: isRTL ? "right" : "left" }]}
        >
          {t("goal_of_advertisement")}{" "}
          <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        {fieldErrors.goalOfAdvertisement && (
          <Text
            style={[
              {
                color: Colors.red,
                fontSize: 12,
                marginTop: 4,
                fontFamily: Fonts.AlmaraiRegular,
              },
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {fieldErrors.goalOfAdvertisement}
          </Text>
        )}
        {[
          { value: "selling_percentage", label: t("selling_percentage") },
          { value: "selling_whole_project", label: t("selling_whole_project") },
          {
            value: "seeking_investors",
            label: t("seeking_investors"),
          },
        ].map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.radioItem,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
            onPress={() => updateFormData("goalOfAdvertisement", option.value)}
          >
            <View
              style={[
                styles.radioCircle,
                formData.goalOfAdvertisement === option.value &&
                styles.radioCircleSelected,
              ]}
            >
              {formData.goalOfAdvertisement === option.value && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text
              style={[
                styles.radioLabel,
                isRTL ? { marginRight: 12 } : { marginLeft: 12 },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <CustomInput
        label={`${t("required_investment")} *`}
        placeholder={t("enter_amount")}
        value={formData.requiredInvestment}
        onChangeText={(val) => {
          updateFormData("requiredInvestment", val);
        }}
        keyboardType="decimal-pad"
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={
          fieldErrors.requiredInvestment ? Colors.red : Colors.border
        }
        labelColor={Colors.create_project_title}
        error={fieldErrors.requiredInvestment}
        rightComponent={
          <View style={{ marginRight: 8 }}>
            <Image
              source={require("@/assets/images/real_currency.png")}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          </View>
        }
      />

      <CustomInput
        label={`${t("approximate_project_value")} *`}
        placeholder={t("enter_amount")}
        value={formData.approximateProjectValue}
        onChangeText={(val) => updateFormData("approximateProjectValue", val)}
        keyboardType="decimal-pad"
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={
          fieldErrors.approximateProjectValue ? Colors.red : Colors.border
        }
        labelColor={Colors.create_project_title}
        error={fieldErrors.approximateProjectValue}
        rightComponent={
          <View style={{ marginRight: 8 }}>
            <Image
              source={require("@/assets/images/real_currency.png")}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          </View>
        }
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <CustomInput
        label={`${t("business_model")} *`}
        placeholder={t("enter_business_model")}
        value={formData.businessModel}
        onChangeText={(val) => updateFormData("businessModel", val)}
        containerStyle={styles.input}
        multiline
        numberOfLines={4}
        style={{
          height: 100,
          textAlignVertical: "top",
        }}
        inputBackgroundColor={Colors.white}
        borderColor={fieldErrors.businessModel ? Colors.red : Colors.border}
        labelColor={Colors.create_project_title}
        error={fieldErrors.businessModel}
      />
      {!fieldErrors.businessModel && (
        <Text style={styles.helperText}>
          {t("minimum_50_chars")} ({formData.businessModel.trim().length}{" "}
          {t("characters")})
        </Text>
      )}

      <CustomInput
        label={`${t("number_of_employees")} *`}
        placeholder={t("enter_number_of_employees")}
        value={formData.numberOfEmployees}
        onChangeText={(val) => updateFormData("numberOfEmployees", val)}
        keyboardType="number-pad"
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={fieldErrors.numberOfEmployees ? Colors.red : Colors.border}
        labelColor={Colors.create_project_title}
        error={fieldErrors.numberOfEmployees}
      />

      <CustomInput
        label={`${t("operational_age")} *`}
        placeholder={t("enter_operational_age")}
        value={formData.operationalAge}
        onChangeText={(val) => updateFormData("operationalAge", val)}
        keyboardType="number-pad"
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={fieldErrors.operationalAge ? Colors.red : Colors.border}
        labelColor={Colors.create_project_title}
        error={fieldErrors.operationalAge}
      />

      <CustomInput
        label={`${t("approximate_sales")} *`}
        placeholder={t("enter_amount")}
        value={formData.approximateSales}
        onChangeText={(val) => {
          updateFormData("approximateSales", val);
        }}
        keyboardType="decimal-pad"
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={fieldErrors.approximateSales ? Colors.red : Colors.border}
        labelColor={Colors.create_project_title}
        error={fieldErrors.approximateSales}
        rightComponent={
          <View style={{ marginRight: 8 }}>
            <Image
              source={require("@/assets/images/real_currency.png")}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          </View>
        }
      />

      <View style={styles.uploadSection}>
        <Text
          style={[styles.uploadTitle, { textAlign: isRTL ? "right" : "left" }]}
        >
          {t("images_and_documents")}{" "}
          <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        {fieldErrors.images && (
          <Text
            style={[
              {
                color: Colors.red,
                fontSize: 12,
                marginTop: 4,
                fontFamily: Fonts.AlmaraiRegular,
              },
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {fieldErrors.images}
          </Text>
        )}
        <Pressable style={styles.uploadBox} onPress={showImagePickerOptions}>
          <Ionicons name="cloud-upload-outline" size={56} color="#5BA8B5" />
          <Text style={styles.uploadText}>{t("tap_to_upload")}</Text>
          <Text style={styles.uploadSubtext}>
            {t("max_image_size_10mb", { defaultValue: "Max 10MB per image" })} (
            {calculateTotalSize(formData.images).toFixed(2)} MB {t("used")})
          </Text>
        </Pressable>

        {renderUploadProgress()}

        {formData.images.length > 0 && (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.imagePreviewTitle}>
              {t("selected_images")} ({formData.images.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagePreviewScroll}
            >
              {formData.images.map((image, index) => (
                <View key={index} style={styles.imagePreviewWrapper}>
                  <Image
                    source={{ uri: image }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <Pressable
                    style={[styles.removeImageButton, {}]}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <CustomInput
        label={`${t("email_address")} *`}
        placeholder="example@email.com"
        value={formData.email}
        onChangeText={(val) => updateFormData("email", val)}
        keyboardType="email-address"
        autoCapitalize="none"
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={Colors.border}
        labelColor={Colors.create_project_title}
      />

      <CustomInput
        label={`${t("mobile_number")} *`}
        placeholder="100 864 9607"
        value={formData.mobileNumber}
        onChangeText={(val) => updateFormData("mobileNumber", val)}
        keyboardType="phone-pad"
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={Colors.border}
        labelColor={Colors.create_project_title}
        leftComponent={
          <View style={styles.phoneCodeContainer}>
            <Text style={styles.phoneCode}>🇪🇬 +20</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.text.light} />
          </View>
        }
      />

      <View style={styles.paymentSection}>
        <View
          style={[
            styles.paymentHeader,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={styles.paymentTitle}>{t("payment_method")}</Text>
          <Pressable onPress={() => addPaymentMethodSheetRef.current?.open()}>
            <Text style={styles.addNewMethod}>+ {t("add_new_method")}</Text>
          </Pressable>
        </View>

        {["paypal", "visa"].map((method) => (
          <Pressable
            key={method}
            style={[
              styles.paymentOption,
              formData.paymentMethod === method && styles.paymentOptionSelected,
            ]}
            onPress={() => updateFormData("paymentMethod", method)}
          >
            {/* Logo on the left */}
            <View style={styles.paymentIconContainer}>
              <Ionicons
                name={method === "paypal" ? "logo-paypal" : "card"}
                size={32}
                color={method === "paypal" ? "#003087" : "#1A1F71"}
              />
            </View>

            {/* Right side content */}
            <View style={styles.paymentContent}>
              {/* Top row: Card number and radio button */}
              <View
                style={[
                  styles.paymentTopRow,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <View
                  style={[
                    styles.paymentRadio,
                    formData.paymentMethod === method &&
                    styles.paymentRadioSelected,
                  ]}
                >
                  {formData.paymentMethod === method && (
                    <View style={styles.paymentRadioInner} />
                  )}
                </View>
                <Text style={styles.paymentNumber}>**** 8304</Text>
              </View>

              {/* Bottom row: Delete and payment name */}
              <View
                style={[
                  styles.paymentBottomRow,
                  { flexDirection: isRTL ? "row" : "row-reverse" },
                ]}
              >
                <Text style={styles.paymentName}>
                  {method === "paypal" ? "Paypal" : "Visa"}
                </Text>
                <Text style={styles.paymentDot}> • </Text>
                <Text style={styles.deleteText}>{t("delete")}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <CustomInput
        label={`${t("cardholder_name")} *`}
        placeholder={t("enter_cardholder_name")}
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={Colors.border}
        labelColor={Colors.create_project_title}
      />

      <CustomInput
        label={`${t("billing_address")} *`}
        placeholder={t("enter_billing_address")}
        containerStyle={styles.input}
        inputBackgroundColor={Colors.white}
        borderColor={Colors.border}
        labelColor={Colors.create_project_title}
      />

      <View
        style={[
          styles.rowInputs,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <CustomInput
          label={`${t("postal_code")} *`}
          placeholder={t("enter_postal_code")}
          keyboardType="number-pad"
          containerStyle={{ flex: 1, marginBottom: 0 }}
          inputBackgroundColor={Colors.white}
          borderColor={Colors.border}
          labelColor={Colors.create_project_title}
        />

        <CustomInput
          label={`${t("city")} *`}
          placeholder={t("enter_city")}
          containerStyle={{
            flex: 1,
            marginBottom: 0,
            marginRight: isRTL ? 0 : 10,
            marginLeft: isRTL ? 10 : 0,
          }}
          inputBackgroundColor={Colors.white}
          borderColor={Colors.border}
          labelColor={Colors.create_project_title}
        />
      </View>
    </>
  );

  return (
    <>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.contentAbove}
        >
          <View style={[styles.header, !isEditMode && projectType === null && styles.headerChoiceStep]}>
            <GradientOverlay />
            <Pressable
              style={[styles.backButton, { [isRTL ? "right" : "left"]: 20 }]}
              onPress={handleBack}
            >
              <Ionicons
                name={isRTL ? "chevron-forward" : "chevron-back"}
                size={24}
                color={Colors.apple}
              />
            </Pressable>
            <Text style={[styles.title, !isEditMode && projectType === null && styles.titleChoiceStep]}>
              {isEditMode ? t("edit_project") : t("add_new_project")}
            </Text>
            {!(projectType === null && !isEditMode) && renderProgressBar()}
          </View>

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {isEditMode && isLoadingEditProject ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={{ marginTop: 12, color: Colors.text.secondary }}>
                    {t("loading", { defaultValue: "Loading..." })}
                  </Text>
                </View>
              ) : !isEditMode && projectType === null ? (
                renderProjectTypeChoice()
              ) : (
                <Animated.View style={{ opacity: formFadeAnim, flex: 1 }}>
                  {projectType === "real_estate" ? (
                    <>
                      {currentStep === 1 && renderRealEstateStep1()}
                      {currentStep === 2 && renderRealEstateStep2()}
                      {currentStep === 3 && renderRealEstateStep3()}
                    </>
                  ) : (
                    <>
                      {currentStep === 1 && renderStep1()}
                      {currentStep === 2 && renderStep2()}
                      {currentStep === 3 &&
                        !(params.paymentAmount && params.projectId) &&
                        renderStep3()}
                    </>
                  )}
                </Animated.View>
              )}
            </View>
          </ScrollView>

          {!isKeyboardVisible && projectType !== null && (
            <View style={styles.footer}>
              <CustomButton
                title={
                  (projectType === "real_estate" && currentStep === 3) ||
                    (projectType === "commercial" && currentStep === 2)
                    ? isEditMode
                      ? t("update_project", { defaultValue: "Update Project" })
                      : t("publish_project", { defaultValue: "Publish Project" })
                    : currentStep === 3
                      ? t("publish_project_for")
                      : t("next")
                }
                onPress={handleNext}
                style={styles.nextButton}
                disabled={isSubmitting}
                isLoading={isSubmitting}
              />
            </View>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              themeVariant={Platform.OS === "ios" ? "light" : undefined}
              textColor={Platform.OS === "ios" ? "#1A3A5C" : undefined}
              onChange={onDateChange}
              maximumDate={new Date()}
              onTouchCancel={() => setShowDatePicker(false)}
            />
          )}

          {Platform.OS === "ios" && showDatePicker && (
            <View style={styles.datePickerButtons}>
              <Pressable
                onPress={() => setShowDatePicker(false)}
                style={styles.datePickerButton}
              >
                <Text style={styles.datePickerButtonText}>{t("done")}</Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      <AddPaymentMethodSheet ref={addPaymentMethodSheetRef} />

      <SuccessModal
        visible={showSuccessModal}
        title={t("project_published_successfully")}
        message={t("project_published_message")}
        buttonText={t("view_project")}
        onClose={() => setShowSuccessModal(false)}
        onButtonPress={handleViewProject}
      />

      <ConfirmModal
        visible={showDiscardModal}
        title={t("discard_project_title")}
        message={t("discard_project_message")}
        cancelText={t("cancel")}
        okText={t("ok")}
        onCancel={() => setShowDiscardModal(false)}
        onOk={handleDiscardOk}
        okDanger
        isRTL={isRTL}
      />
    </>
  );
}
