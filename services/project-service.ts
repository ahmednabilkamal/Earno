import { API_CONFIG } from "../constants/api";
import apiClient from "../utils/api";
import i18n from "../utils/i18n";

export interface Tag {
  text: string;
  color: string;
  textColor: string;
}

export interface Category {
  id: number;
  name: string;
  name_ar?: string | null;
  localized_name?: string | null;
}

export interface City {
  id: number;
  name: string;
  name_ar?: string | null;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: Tag[];
  investmentSize: string;
  opportunityType: string;
  projectType?: ProjectTypeValue;
  isFavourite?: boolean;
  status?: string;
  isPublished?: boolean;
  paymentStatus?: string;
  rejectionReason?: string;
}

export interface ProjectDetails extends Project {
  projectStatus?: string; // Kept for project details page (not shown on card)
  slug: string;
  sector: string;
  location: string;
  timeline: string;
  businessModel: string;
  useOfFunds: string;
  riskFactors: string;
  isPublished: boolean;
  featured: boolean;
  viewsCount: number;
  images: string[];
  funding: {
    goal: string;
    current: string;
    percentage: number;
    remaining: number;
  };
  investment: {
    min: string;
    max: string;
  };
  owner: {
    id: number;
    name: string;
    company: string;
    verified: boolean;
    phone: string;
    secondary_phone: string;
  };
  stats: {
    interestsCount: number;
    favoritesCount: number;
    investorCount: number;
  };
  dates: {
    createdAt: string;
    updatedAt: string;
    approvedAt: string;
  };
  urls: {
    view: string;
    api: string;
    share?: string;
  };
  payment?: {
    status: string;
    isOwner: boolean;
    amount: number;
    currency: string;
    transaction_id: string | null;
    paid_at: string | null;
    /** Required publication fee (from admin settings, per project type) */
    fee_required?: boolean;
    fee_amount?: number;
  };
  isFavourite?: boolean;
  categoryId?: number;
  city?: string;
  cityLabel?: string;
  cityLabelAr?: string;
  detailedLocation?: string;
  establishmentDate?: string;
  branchesCount?: number;
  announcementGoalType?: string;
  /** Localized label for commercial announcement goal (from API) */
  announcementGoalLabel?: string;
  investmentNeeded?: string;
  projectValue?: string;
  approximateSales?: string;
  employeesCount?: number;
  operationalYears?: number;
  // Project type and real estate
  projectType?: ProjectTypeValue;
  propertyTypeLabel?: string;
  propertyTypeLabelAr?: string;
  deedNumber?: string;
  deedDocument?: string;
  propertyType?: PropertyTypeValue;
  neighborhood?: string;
  areaSqm?: number;
  streetCount?: number;
  floorCount?: number;
  shopCount?: number;
  apartmentCount?: number;
  bedroomCount?: number;
  bathroomCount?: number;
  kitchenCount?: number;
  livingRoomCount?: number;
  hasCourtyard?: boolean;
  propertyAgeYears?: number;
  saleReason?: string;
  hasDeed?: boolean;
  annualIncome?: number;
  requestedAmount?: number;
  // Investor-seeking
  projectField?: string;
  partnershipPercentageRequired?: number;
  investorCapital?: number;
  requiredPartnerType?: string;
  requiredPartnerTypeLabel?: string;
  requirementsDescription?: string;
  investmentPartnershipType?: string;
  /** Raw status: pending, under_review, re_review, rejected, active */
  status?: string;
  rejectionReason?: string;
  /** Whether the current user has expressed interest in this project */
  hasInterest?: boolean;
  /** Whether the current user has already reported this project */
  userHasReported?: boolean;
  minInvestment?: number;
  maxInvestment?: number | null;
}

export interface ProjectsResponse {
  projects: Project[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export type ProjectTypeValue =
  | "commercial"
  | "real_estate"
  | "investor_seeking";
export type PropertyTypeValue =
  | "commercial_building"
  | "hotel"
  | "land"
  | "other";

export interface CreateProjectRequest {
  project_type?: ProjectTypeValue;
  title: string;
  business_model?: string;
  category_id?: number; // Required for commercial; optional for real_estate
  investment_needed?: number;
  project_value?: number;
  city: string;
  detailed_location?: string;
  established_date?: string;
  branches_count?: number;
  announcement_goal?: string;
  approximate_sales?: number;
  employees_count?: number;
  operational_years?: number;
  images: string[];
  remove_images?: string[];

  // Real estate fields (when project_type === "real_estate")
  deed_number?: string;
  deed_document?: string;
  property_type?: PropertyTypeValue;
  neighborhood?: string;
  area_sqm?: number;
  street_count?: number;
  floor_count?: number;
  shop_count?: number;
  apartment_count?: number;
  bedroom_count?: number;
  bathroom_count?: number;
  kitchen_count?: number;
  living_room_count?: number;
  has_courtyard?: boolean;
  property_age_years?: number;
  sale_reason?: string;
  has_deed?: boolean;
  annual_income?: number;
  requested_amount?: number;

  description?: string;
  sector?: string;
  activity_type?: string;
  funding_goal?: string;
  min_investment?: number;
  max_investment?: number;
  location?: string;
  timeline?: string;
  use_of_funds?: string;
  risk_factors?: string;
}

export interface CreateProjectResponse {
  success: boolean;
  message: string;
  project?: ProjectDetails;
  data?: ProjectDetails;
}

export interface CreateInvestorProjectRequest {
  project_field: string;
  city: string;
  detailed_location?: string;
  partnership_percentage_required: number;
  investor_capital: number;
  required_partner_type: string;
  requirements_description: string;
  investment_partnership_type?: string;
  /** Raw base64 strings (no `data:image/...;base64,` prefix), sent to POST /investor/projects */
  images?: string[];
  remove_images?: string[];
}

export const getCategoryDisplayName = (
  category?: {
    name?: string | null;
    name_ar?: string | null;
    localized_name?: string | null;
  },
  locale: string = i18n.language,
): string => {
  if (!category) {
    return "";
  }

  const englishName = category.name ?? "";
  const arabicName = category.name_ar ?? "";
  const localizedName = category.localized_name ?? "";

  if (locale === "ar") {
    return arabicName || localizedName || englishName;
  }

  return englishName || localizedName || arabicName;
};

const toAbsoluteAssetUrl = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  if (trimmedValue.startsWith("http://") || trimmedValue.startsWith("https://")) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith("data:")) {
    return trimmedValue;
  }

  const baseUrl = API_CONFIG.BASE_URL.replace("/api", "");
  const normalizedValue = trimmedValue.replace(/^\/+/, "");

  if (trimmedValue.startsWith("/storage/")) {
    return `${baseUrl}${trimmedValue}`;
  }

  if (normalizedValue.startsWith("storage/")) {
    return `${baseUrl}/${normalizedValue}`;
  }

  const looksLikeStoredMediaPath =
    /\.(jpe?g|png|gif|webp|bmp|svg|mp4|mov|m4v|webm|pdf)$/i.test(normalizedValue) &&
    !normalizedValue.startsWith("api/") &&
    !normalizedValue.startsWith("public/");

  if (looksLikeStoredMediaPath && !trimmedValue.startsWith("/")) {
    return `${baseUrl}/storage/${normalizedValue}`;
  }

  return trimmedValue.startsWith("/")
    ? `${baseUrl}${trimmedValue}`
    : `${baseUrl}/${normalizedValue}`;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.replace(/[\s,،]/g, "").trim();
  if (!normalizedValue) {
    return null;
  }

  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatAmount = (value: unknown): string | null => {
  const amount = toNumber(value);
  return amount == null ? null : amount.toLocaleString();
};

const PROPERTY_TYPE_LABELS: Record<
  string,
  { ar: string; en: string }
> = {
  commercial_building: {
    ar: "عمارة تجارية",
    en: "Commercial Building",
  },
  hotel: {
    ar: "فندق",
    en: "Hotel",
  },
  land: {
    ar: "أرض",
    en: "Land",
  },
  other: {
    ar: "أخرى",
    en: "Other",
  },
};

const localizeRawOpportunityValue = (
  value: unknown,
  type: "commercial" | "real_estate" | "investor_seeking",
): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  if (type === "commercial") {
    return i18n.t(normalizedValue, { defaultValue: normalizedValue }).trim();
  }

  if (type === "real_estate") {
    const mapped = PROPERTY_TYPE_LABELS[normalizedValue];
    if (mapped) {
      return i18n.language === "ar" ? mapped.ar : mapped.en;
    }

    return normalizedValue;
  }

  if (type === "investor_seeking") {
    const partnerTypeKeyMap: Record<string, string> = {
      full_time: "partner_full_time",
      experience: "partner_experience",
      management_operations: "partner_management_operations",
    };

    const translationKey = partnerTypeKeyMap[normalizedValue];
    if (translationKey) {
      return i18n.t(translationKey, { defaultValue: normalizedValue }).trim();
    }

    return normalizedValue;
  }

  return normalizedValue;
};

const getProjectCardImage = (apiProject: any): string => {
  const imageCandidates: unknown[] = [];

  const pushMediaCandidates = (mediaValue: unknown) => {
    if (Array.isArray(mediaValue) && mediaValue.length > 0) {
      const firstMediaValue = mediaValue[0];
      if (typeof firstMediaValue === "string") {
        imageCandidates.push(firstMediaValue);
      } else if (firstMediaValue && typeof firstMediaValue === "object") {
        imageCandidates.push(
          firstMediaValue.url,
          firstMediaValue.src,
          firstMediaValue.uri,
          firstMediaValue.image,
          firstMediaValue.image_url,
          firstMediaValue.path,
          firstMediaValue.file_path,
          firstMediaValue.original,
          firstMediaValue.original_url,
          firstMediaValue.full_url,
          firstMediaValue.thumbnail,
          firstMediaValue.thumbnail_url,
        );
      }
      return;
    }

    if (typeof mediaValue !== "string") {
      return;
    }

    const trimmedMediaValue = mediaValue.trim();
    if (!trimmedMediaValue) {
      return;
    }

    if (trimmedMediaValue.startsWith("[")) {
      try {
        const parsedMediaValue = JSON.parse(trimmedMediaValue);
        pushMediaCandidates(parsedMediaValue);
        return;
      } catch {
        return;
      }
    }

    imageCandidates.push(trimmedMediaValue);
  };

  pushMediaCandidates(apiProject.images);
  pushMediaCandidates(apiProject.media);
  pushMediaCandidates(apiProject.attachments);

  imageCandidates.push(
    apiProject.image,
    apiProject.src,
    apiProject.uri,
    apiProject.image_url,
    apiProject.image_path,
    apiProject.cover_image,
    apiProject.coverImage,
    apiProject.featured_image,
    apiProject.featuredImage,
    apiProject.thumbnail,
    apiProject.thumbnail_url,
    apiProject.path,
    apiProject.file_path,
    apiProject.original_url,
    apiProject.full_url,
    apiProject.project_image,
    apiProject.project_image_url,
    apiProject.project_thumbnail,
    apiProject.project_thumbnail_url,
    apiProject.photo,
    apiProject.photo_url,
  );

  for (const candidate of imageCandidates) {
    const resolved = toAbsoluteAssetUrl(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return "";
};

const getInvestmentSizeLabel = (apiProject: any): string => {
  const minAmount = formatAmount(
    apiProject.investment?.min ??
      apiProject.min_investment ??
      apiProject.minimum_investment,
  );
  const maxAmount = formatAmount(
    apiProject.investment?.max ??
      apiProject.max_investment ??
      apiProject.maximum_investment,
  );

  if (minAmount && maxAmount) {
    return `${minAmount} - ${maxAmount} SAR`;
  }

  const singleAmount = formatAmount(
    apiProject.financial?.investment_needed ??
      apiProject.financial?.funding_goal ??
      apiProject.funding?.goal ??
      apiProject.investment_needed ??
      apiProject.funding_goal ??
      apiProject.requested_amount ??
      apiProject.investor_capital,
  );

  if (singleAmount) {
    return `${singleAmount} SAR`;
  }

  if (minAmount) {
    return `${minAmount} SAR`;
  }

  if (maxAmount) {
    return `${maxAmount} SAR`;
  }

  return i18n.t("not_applicable", { defaultValue: "N/A" });
};

/**
 * "Opportunity type" for cards: not the category — commercial uses announcement goal,
 * real estate uses property type, investor-seeking uses project field (then fallbacks).
 */
const getOpportunityTypeLabel = (apiProject: any): string => {
  const rawType = apiProject.project_type;
  const pt =
    (typeof rawType === "object" && rawType !== null && "value" in rawType
      ? (rawType as { value?: string }).value
      : null) ||
    (typeof rawType === "string" ? rawType : null) ||
    (apiProject.property_type || apiProject.property_type_label
      ? "real_estate"
      : apiProject.project_field || apiProject.required_partner_type
        ? "investor_seeking"
        : null) ||
    "commercial";

  if (pt === "commercial") {
    const directCommercialLabel =
      i18n.language === "ar"
        ? apiProject.announcement_goal_arabic_label ??
          apiProject.announcement_goal_label_ar ??
          apiProject.announcement_goal_label
        : apiProject.announcement_goal_label ??
          apiProject.announcement_goal_label_en ??
          apiProject.announcement_goal_arabic_label;
    if (typeof directCommercialLabel === "string" && directCommercialLabel.trim()) {
      return directCommercialLabel.trim();
    }

    const ag = apiProject.announcement_goal;
    if (ag && typeof ag === "object") {
      const arLabel =
        (ag as { arabic_label?: string }).arabic_label ??
        (ag as { arabicLabel?: string }).arabicLabel;
      const enLabel =
        (ag as { label?: string; translatedLabel?: string }).label ??
        (ag as { translatedLabel?: string }).translatedLabel;
      if (i18n.language === "ar") {
        return (arLabel || enLabel || (ag as { type?: string }).type || "")
          .trim() || i18n.t("not_applicable", { defaultValue: "N/A" });
      }
      return (enLabel || arLabel || (ag as { type?: string }).type || "")
        .trim() || i18n.t("not_applicable", { defaultValue: "N/A" });
    }
    if (typeof ag === "string" && ag.trim()) {
      return (
        localizeRawOpportunityValue(ag, "commercial") ??
        ag.trim()
      );
    }
    return i18n.t("not_applicable", { defaultValue: "N/A" });
  }

  if (pt === "real_estate") {
    const directPropertyLabel =
      i18n.language === "ar"
        ? apiProject.property_type_label_ar ??
          apiProject.property_type_arabic_label ??
          apiProject.property_type_label
        : apiProject.property_type_label ??
          apiProject.property_type_label_en ??
          apiProject.property_type_arabic_label;
    if (typeof directPropertyLabel === "string" && directPropertyLabel.trim()) {
      return directPropertyLabel.trim();
    }

    const prop = apiProject.property_type;
    if (prop && typeof prop === "object") {
      const arLabel =
        (prop as { arabic_label?: string }).arabic_label ??
        (prop as { arabicLabel?: string }).arabicLabel;
      const enLabel =
        (prop as { label?: string; translatedLabel?: string }).label ??
        (prop as { translatedLabel?: string }).translatedLabel;
      if (i18n.language === "ar") {
        return (arLabel || enLabel || (prop as { value?: string }).value || "")
          .trim() || i18n.t("not_applicable", { defaultValue: "N/A" });
      }
      return (enLabel || arLabel || (prop as { value?: string }).value || "")
        .trim() || i18n.t("not_applicable", { defaultValue: "N/A" });
    }
    if (typeof prop === "string" && prop.trim()) {
      return (
        localizeRawOpportunityValue(prop, "real_estate") ??
        prop.trim()
      );
    }
    return i18n.t("not_applicable", { defaultValue: "N/A" });
  }

  if (pt === "investor_seeking") {
    const field = apiProject.project_field;
    if (field != null && String(field).trim()) {
      return String(field).trim();
    }
    const ipt = apiProject.investment_partnership_type;
    if (ipt != null && String(ipt).trim()) {
      return String(ipt).trim();
    }
    const directPartnerLabel =
      i18n.language === "ar"
        ? apiProject.required_partner_type_label_ar ??
          apiProject.required_partner_type_arabic_label ??
          apiProject.required_partner_type_label
        : apiProject.required_partner_type_label ??
          apiProject.required_partner_type_label_en ??
          apiProject.required_partner_type_arabic_label;
    if (typeof directPartnerLabel === "string" && directPartnerLabel.trim()) {
      return directPartnerLabel.trim();
    }

    const rpt = apiProject.required_partner_type;
    if (rpt && typeof rpt === "object") {
      const arLabel =
        (rpt as { arabic_label?: string }).arabic_label ??
        (rpt as { arabicLabel?: string }).arabicLabel;
      const enLabel =
        (rpt as { label?: string; translatedLabel?: string }).label ??
        (rpt as { translatedLabel?: string }).translatedLabel;
      if (i18n.language === "ar") {
        return (arLabel || enLabel || (rpt as { value?: string }).value || "")
          .trim() || i18n.t("not_applicable", { defaultValue: "N/A" });
      }
      return (enLabel || arLabel || (rpt as { value?: string }).value || "")
        .trim() || i18n.t("not_applicable", { defaultValue: "N/A" });
    }

    if (typeof rpt === "string" && rpt.trim()) {
      return (
        localizeRawOpportunityValue(rpt, "investor_seeking") ??
        rpt.trim()
      );
    }

    return i18n.t("not_applicable", { defaultValue: "N/A" });
  }

  return i18n.t("not_applicable", { defaultValue: "N/A" });
};

// Helper function to map API response to Project interface (list items)
const mapApiProjectToProject = (apiProject: any): Project => {
  // Create tags (category from new API, or sector from old)
  const tags: Tag[] = [];
  const categoryDisplayName = getCategoryDisplayName(apiProject.category);

  if (categoryDisplayName) {
    tags.push({
      text: categoryDisplayName,
      color: apiProject.category.color || "#DCE788",
      textColor: "#FFFFFF",
    });
  } else if (apiProject.sector) {
    tags.push({
      text: apiProject.sector,
      color: "#DCE788",
      textColor: "#FFFFFF",
    });
  }

  if (apiProject.featured) {
    tags.push({
      text: i18n.t("featured", { defaultValue: "Featured" }),
      color: "#FFF3E0",
      textColor: "#E65100",
    });
  }

  // Format status
  const formatStatus = (status: string) => {
    if (!status) return "N/A";
    if (status === "re_review") return "Re-review";
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  return {
    id: apiProject.id?.toString() || "",
    title: apiProject.title || "",
    description: apiProject.description || "",
    image: getProjectCardImage(apiProject),
    tags: tags,
    investmentSize: getInvestmentSizeLabel(apiProject),
    opportunityType: getOpportunityTypeLabel(apiProject),
    projectType: (apiProject.project_type?.value ??
      apiProject.project_type ??
      undefined) as ProjectTypeValue | undefined,
    isFavourite: apiProject.is_favourite ?? apiProject.is_favorite ?? false,
    status:
      typeof apiProject.status === "string"
        ? apiProject.status
        : (apiProject.status?.value ?? ""),
    isPublished: Boolean(apiProject.is_published),
    paymentStatus: apiProject.payment?.status ?? undefined,
    rejectionReason: apiProject.rejection_reason ?? undefined,
  };
};

// Helper function to map API response to ProjectDetails interface
const mapApiProjectToProjectDetails = (apiProject: any): ProjectDetails => {
  if (apiProject == null || typeof apiProject !== "object") {
    throw new Error("Invalid project data: expected an object");
  }
  // Map images (API can return array of strings or array of { url, thumbnail, filename, ... })
  const images: string[] = [];
  if (apiProject.images && Array.isArray(apiProject.images)) {
    apiProject.images.forEach((img: any) => {
      const url =
        typeof img === "string"
          ? img.startsWith("http")
            ? img
            : `${API_CONFIG.BASE_URL.replace("/api", "")}${img}`
          : img?.url
            ? img.url.startsWith("http")
              ? img.url
              : `${API_CONFIG.BASE_URL.replace("/api", "")}${img.url}`
            : "";
      if (url.trim().length > 0) images.push(url);
    });
  }

  const image = images.length > 0 ? images[0] : "";

  // Create tags (category from new API, or sector from old)
  const tags: Tag[] = [];
  const categoryDisplayName = getCategoryDisplayName(apiProject.category);
  if (categoryDisplayName) {
    tags.push({
      text: categoryDisplayName,
      color: apiProject.category.color || "#DCE788",
      textColor: "#FFFFFF",
    });
  } else if (apiProject.sector) {
    tags.push({
      text: apiProject.sector,
      color: "#DCE788",
      textColor: "#FFFFFF",
    });
  }
  if (apiProject.featured) {
    tags.push({
      text: i18n.t("featured", { defaultValue: "Featured" }),
      color: "#FFF3E0",
      textColor: "#E65100",
    });
  }

  // Format investment size
  let investmentSize = "N/A";
  // Check for investment range in different structures
  const minInvestment = apiProject.investment?.min ?? apiProject.min_investment;
  const maxInvestment = apiProject.investment?.max ?? apiProject.max_investment;

  if (minInvestment && maxInvestment) {
    const minAmount = parseFloat(minInvestment).toLocaleString();
    const maxAmount = parseFloat(maxInvestment).toLocaleString();
    investmentSize = `${minAmount} - ${maxAmount} SAR`;
  } else {
    // New API: financial.investment_needed; old: funding_goal / funding.goal
    const fundingGoal =
      apiProject.financial?.investment_needed ??
      apiProject.financial?.funding_goal ??
      apiProject.funding?.goal ??
      apiProject.funding_goal;
    if (fundingGoal) {
      investmentSize = `${parseFloat(
        String(fundingGoal),
      ).toLocaleString()} SAR`;
    }
  }

  const formatStatus = (status: string) => {
    if (!status) return "N/A";
    if (status === "re_review") return "Re-review";
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const formatTimeline = (timeline: string) => {
    if (!timeline) return "N/A";
    return timeline
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const rawCity =
    apiProject.location?.city ?? apiProject.city ?? apiProject.location_city ?? "";
  const cityLabel =
    apiProject.location?.city_label ??
    apiProject.city_label ??
    rawCity ??
    "";
  const cityLabelAr =
    apiProject.location?.city_label_ar ??
    apiProject.city_label_ar ??
    cityLabel ??
    rawCity ??
    "";
  const cityDisplay =
    i18n.language === "ar"
      ? cityLabelAr || cityLabel || rawCity
      : cityLabel || rawCity;
  const detailedLocationValue =
    apiProject.location?.detailed ??
    apiProject.detailed_location ??
    apiProject.location_detailed ??
    "";

  return {
    id: apiProject.id?.toString() || "",
    title: apiProject.title || "",
    slug: apiProject.slug || "",
    description: apiProject.description || "",
    image: image,
    images: images,
    tags: tags,
    sector: categoryDisplayName || apiProject.sector || "",
    location: [cityDisplay, detailedLocationValue].filter(Boolean).join(", ") || "N/A",
    timeline: formatTimeline(apiProject.timeline),
    businessModel: apiProject.business_model || "",
    useOfFunds: apiProject.use_of_funds || "",
    riskFactors: apiProject.risk_factors || "",
    isPublished: apiProject.is_published != null ? Boolean(apiProject.is_published) : true,
    featured: apiProject.featured || false,
    viewsCount: apiProject.views_count || 0,
    investmentSize: investmentSize,
    opportunityType: getOpportunityTypeLabel(apiProject),
    status:
      typeof apiProject.status === "string"
        ? apiProject.status
        : (apiProject.status?.value ?? ""),
    projectStatus: formatStatus(
      typeof apiProject.status === "string"
        ? apiProject.status
        : (apiProject.status?.value ?? ""),
    ),
    funding: {
      goal:
        apiProject.financial?.investment_needed ??
        apiProject.financial?.funding_goal ??
        apiProject.funding?.goal ??
        apiProject.funding_goal ??
        "0",
      current:
        apiProject.financial?.current_funding ??
        apiProject.funding?.current ??
        apiProject.current_funding ??
        "0",
      percentage:
        apiProject.financial?.percentage ??
        apiProject.funding?.percentage ??
        (apiProject.funding_goal && apiProject.current_funding
          ? Math.round(
              (parseFloat(apiProject.current_funding) /
                parseFloat(apiProject.funding_goal)) *
                100,
            )
          : 0),
      remaining:
        apiProject.financial?.remaining ??
        apiProject.funding?.remaining ??
        (apiProject.funding_goal && apiProject.current_funding
          ? parseFloat(apiProject.funding_goal) -
            parseFloat(apiProject.current_funding)
          : 0),
    },
    investment: {
      min: apiProject.investment?.min ?? apiProject.min_investment ?? "0",
      max: apiProject.investment?.max ?? apiProject.max_investment ?? "0",
    },
    owner: {
      id: apiProject.owner?.id || 0,
      name: apiProject.owner?.name || "",
      company: apiProject.owner?.company || "",
      verified: apiProject.owner?.verified || false,
      phone: apiProject.owner?.phone || "",
      secondary_phone: apiProject.owner?.secondary_phone || "",
    },
    stats: {
      interestsCount: apiProject.stats?.interests_count || 0,
      favoritesCount: apiProject.stats?.favorites_count || 0,
      investorCount: apiProject.stats?.investor_count || 0,
    },
    dates: {
      createdAt: apiProject.dates?.created_at || apiProject.created_at || "",
      updatedAt: apiProject.dates?.updated_at || apiProject.updated_at || "",
      approvedAt: apiProject.dates?.approved_at || apiProject.approved_at || "",
    },
    urls: {
      view: apiProject.urls?.view || "",
      api: apiProject.urls?.api || "",
      share: apiProject.urls?.share || "",
    },
    payment: apiProject.payment
      ? {
          status: apiProject.payment.status ?? "unpaid",
          isOwner: apiProject.payment.isOwner ?? false,
          amount: apiProject.payment.amount ?? 0,
          currency: apiProject.payment.currency ?? "SAR",
          transaction_id: apiProject.payment.transaction_id ?? null,
          paid_at: apiProject.payment.paid_at ?? null,
          fee_required: apiProject.payment.fee_required ?? false,
          fee_amount: apiProject.payment.fee_amount ?? undefined,
        }
      : undefined,
    isFavourite: apiProject.is_favourite ?? apiProject.is_favorite ?? false,
    // For edit form
    categoryId: apiProject.category?.id,
    city: rawCity || undefined,
    cityLabel: cityLabel || undefined,
    cityLabelAr: cityLabelAr || undefined,
    detailedLocation: detailedLocationValue || undefined,
    establishmentDate: apiProject.establishment?.date ?? undefined,
    branchesCount: apiProject.establishment?.branches_count ?? undefined,
    announcementGoalType: apiProject.announcement_goal?.type ?? undefined,
    announcementGoalLabel:
      i18n.language === "ar"
        ? apiProject.announcement_goal?.arabic_label ??
          apiProject.announcement_goal?.label
        : apiProject.announcement_goal?.label ??
          apiProject.announcement_goal?.arabic_label,
    investmentNeeded:
      apiProject.financial?.investment_needed != null
        ? String(apiProject.financial.investment_needed)
        : apiProject.funding?.goal != null
          ? String(apiProject.funding.goal)
          : undefined,
    projectValue:
      apiProject.financial?.project_value != null
        ? String(apiProject.financial.project_value)
        : undefined,
    approximateSales: apiProject.financial?.approximate_sales ?? undefined,
    employeesCount: apiProject.operational?.employees_count ?? undefined,
    operationalYears: apiProject.operational?.operational_years ?? undefined,
    projectType: apiProject.project_type?.value ?? undefined,
    propertyTypeLabel: apiProject.property_type?.label ?? undefined,
    propertyTypeLabelAr: apiProject.property_type?.arabic_label ?? undefined,
    deedNumber: apiProject.deed_number ?? undefined,
    deedDocument: apiProject.deed_document ?? undefined,
    propertyType: apiProject.property_type?.value ?? undefined,
    neighborhood: apiProject.neighborhood ?? undefined,
    areaSqm: apiProject.area_sqm ?? undefined,
    streetCount: apiProject.street_count ?? undefined,
    floorCount: apiProject.floor_count ?? undefined,
    shopCount: apiProject.shop_count ?? undefined,
    apartmentCount: apiProject.apartment_count ?? undefined,
    bedroomCount: apiProject.bedroom_count ?? undefined,
    bathroomCount: apiProject.bathroom_count ?? undefined,
    kitchenCount: apiProject.kitchen_count ?? undefined,
    livingRoomCount: apiProject.living_room_count ?? undefined,
    hasCourtyard: apiProject.has_courtyard ?? undefined,
    propertyAgeYears: apiProject.property_age_years ?? undefined,
    saleReason: apiProject.sale_reason ?? undefined,
    hasDeed: apiProject.has_deed ?? undefined,
    annualIncome: apiProject.annual_income ?? undefined,
    requestedAmount: apiProject.requested_amount ?? undefined,
    projectField: apiProject.project_field ?? undefined,
    partnershipPercentageRequired:
      apiProject.partnership_percentage_required ?? undefined,
    investorCapital: apiProject.investor_capital ?? undefined,
    requiredPartnerType:
      apiProject.required_partner_type?.value ??
      apiProject.required_partner_type ??
      undefined,
    rejectionReason: apiProject.rejection_reason ?? undefined,
    requiredPartnerTypeLabel:
      apiProject.required_partner_type?.label ??
      apiProject.required_partner_type?.arabic_label,
    requirementsDescription: apiProject.requirements_description ?? undefined,
    investmentPartnershipType:
      apiProject.investment_partnership_type ?? undefined,
    hasInterest: apiProject.has_interest ?? false,
    userHasReported: apiProject.user_has_reported ?? false,
    minInvestment:
      apiProject.min_investment ??
      apiProject.financial?.investment_needed ??
      undefined,
    maxInvestment: apiProject.max_investment ?? undefined,
  };
};

export const projectService = {
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.PROJECT_CATEGORIES,
      );

      // Handle different response structures
      if (response.data.categories && Array.isArray(response.data.categories)) {
        return response.data.categories;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },

  getCities: async (): Promise<City[]> => {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.CITIES);
      if (response.data.cities && Array.isArray(response.data.cities)) {
        return response.data.cities;
      }
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    }
  },

  getProjects: async (
    page = 1,
    perPage = 15,
    search = "",
    status = "all",
    categoryId: string | number = "all",
    options?: {
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      projectType?: string;
      investmentMin?: number;
      investmentMax?: number;
    },
  ): Promise<ProjectsResponse> => {
    try {
      const params: Record<string, string | number> = {
        page,
        per_page: perPage,
        search,
      };

      // Only add status if it's not "all"
      if (status && status !== "all") {
        params.status = status;
      }
      // Only add category if it's not "all"
      if (categoryId && categoryId !== "all") {
        params.category_id = categoryId;
      }

      if (options?.sortBy) {
        params.sort_by = options.sortBy;
      }
      if (options?.sortOrder) {
        params.sort_order = options.sortOrder;
      }
      if (options?.projectType && options.projectType !== "all") {
        params.project_type = options.projectType;
      }
      if (options?.investmentMin != null) {
        params.investment_needed_min = options.investmentMin;
      }
      if (options?.investmentMax != null) {
        params.investment_needed_max = options.investmentMax;
      }

      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PROJECTS, {
        params,
      });

      // Handle different response structures
      let projects: Project[] = [];

      if (response.data.data && Array.isArray(response.data.data)) {
        // Laravel pagination response: { data: [...], meta: {...} }
        projects = response.data.data.map(mapApiProjectToProject);
      } else if (Array.isArray(response.data.projects)) {
        // { projects: [...] }
        projects = response.data.projects.map(mapApiProjectToProject);
      } else if (Array.isArray(response.data)) {
        // Direct array response
        projects = response.data.map(mapApiProjectToProject);
      }

      return {
        projects,
        meta: response.data.meta || response.data.pagination,
      };
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  },

  getInvestorProjectById: async (
    id: string | number,
  ): Promise<ProjectDetails> => {
    try {
      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.INVESTOR_PROJECTS}/${id}`,
      );

      let projectData = response.data;
      if (response.data.response?.data) {
        projectData = response.data.response.data;
      } else if (response.data.data) {
        projectData = response.data.data;
      }

      if (projectData == null || typeof projectData !== "object") {
        throw new Error("Project data is missing or invalid");
      }

      return mapApiProjectToProjectDetails(projectData);
    } catch (error) {
      console.error("Error fetching investor project details:", error);
      throw error;
    }
  },

  getInvestorProjects: async (
    page: number = 1,
    perPage: number = 15,
  ): Promise<ProjectsResponse> => {
    try {
      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.INVESTOR_PROJECTS,
        { params: { page, per_page: perPage } },
      );

      let projectsData: any[] = [];
      let meta = null;

      if (response.data.data && Array.isArray(response.data.data)) {
        projectsData = response.data.data;
        meta = response.data.meta;
      }

      const projects: Project[] = projectsData
        .map((apiProject: any) => mapApiProjectToProject(apiProject))
        .filter((p: Project | null) => p !== null);

      return { projects, meta: meta || response.data.pagination };
    } catch (error) {
      console.error("Error fetching investor projects:", error);
      throw error;
    }
  },

  getProjectById: async (
    id: string | number,
    isOwner = false,
    isInvestorOwnProject = false,
  ): Promise<ProjectDetails> => {
    try {
      // Investor's own investor-seeking project: GET /investor/projects/{id}
      if (isInvestorOwnProject) {
        const response = await apiClient.get(
          `${API_CONFIG.ENDPOINTS.INVESTOR_PROJECTS}/${id}`,
        );
        let projectData =
          response.data?.response?.data ?? response.data?.data ?? response.data;
        if (projectData == null || typeof projectData !== "object") {
          throw new Error("Project data is missing or invalid");
        }
        return mapApiProjectToProjectDetails(projectData);
      }
      // For project owners, first try owner-only endpoint.
      // If the project is not owned by current user, backend returns 404,
      // so we fallback to the public details endpoint.
      const ownerEndpoint = `${API_CONFIG.ENDPOINTS.PROJECTS}/${id}/details`;
      const publicEndpoint = `${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`;
      let response;

      if (isOwner) {
        try {
          response = await apiClient.get(ownerEndpoint);
        } catch (error: any) {
          const status = error?.response?.status;
          if (status === 404 || status === 403) {
            response = await apiClient.get(publicEndpoint);
          } else {
            throw error;
          }
        }
      } else {
        response = await apiClient.get(publicEndpoint);
      }

      // Handle different response structures
      let projectData = response.data;
      if (response.data.response?.data) {
        // New API structure: { response: { data: {...} } }
        projectData = response.data.response.data;
      } else if (response.data.data) {
        // Laravel structure: { data: {...} }
        projectData = response.data.data;
      } else if (response.data.project) {
        // Alternative structure: { project: {...} }
        projectData = response.data.project;
      }

      if (projectData == null || typeof projectData !== "object") {
        throw new Error("Project data is missing or invalid");
      }

      return mapApiProjectToProjectDetails(projectData);
    } catch (error) {
      console.error("Error fetching project details:", error);
      throw error;
    }
  },

  getPublicationFee: async (projectType: string): Promise<number> => {
    try {
      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.PUBLICATION_FEE}?project_type=${encodeURIComponent(projectType)}`,
      );
      const fee = response.data?.fee_amount ?? response.data?.fee_amount ?? 0;
      return typeof fee === "number" ? fee : parseFloat(fee) || 0;
    } catch {
      return 0;
    }
  },

  createProjectWithPayment: async (
    projectData: CreateProjectRequest,
    paymentData: {
      transaction_id: string;
      amount: number;
      fee: number;
      net_amount?: number;
      currency: string;
      status: string;
      payment_method: string;
      payment_gateway: string;
      notes: string;
      coupon_id?: number | null;
      discount_amount?: number | null;
    },
  ): Promise<CreateProjectResponse> => {
    try {
      const response = await apiClient.post(
        `${API_CONFIG.ENDPOINTS.PROJECTS}/create-with-payment`,
        { ...projectData, ...paymentData },
      );
      let createdProject = null;
      if (response.data.project) {
        createdProject = mapApiProjectToProjectDetails(response.data.project);
      } else if (response.data.data) {
        createdProject = mapApiProjectToProjectDetails(response.data.data);
      }
      return {
        success: response.data.success !== false,
        message: response.data.message || "Project created successfully",
        project: createdProject || undefined,
        data: createdProject || undefined,
      };
    } catch (error: any) {
      console.error("Error creating project with payment:", error);
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to create project",
      );
    }
  },

  createProject: async (
    projectData: CreateProjectRequest,
  ): Promise<CreateProjectResponse> => {
    try {
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.CREATE_PROJECT,
        projectData,
      );

      console.log(
        "Create Project Response:",
        JSON.stringify(response.data, null, 2),
      );

      // Handle different response structures
      let createdProject = null;
      if (response.data.project) {
        createdProject = mapApiProjectToProjectDetails(response.data.project);
      } else if (response.data.data) {
        createdProject = mapApiProjectToProjectDetails(response.data.data);
      }

      return {
        success: response.data.success !== false,
        message: response.data.message || "Project created successfully",
        project: createdProject || undefined,
        data: createdProject || undefined,
      };
    } catch (error: any) {
      console.error("Error creating project:", error);

      // Extract error message from response if available
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to create project";

      throw new Error(errorMessage);
    }
  },

  createInvestorProject: async (
    data: CreateInvestorProjectRequest,
  ): Promise<CreateProjectResponse> => {
    try {
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.INVESTOR_PROJECTS,
        data,
      );

      let createdProject = null;
      if (response.data.project) {
        createdProject = mapApiProjectToProjectDetails(response.data.project);
      } else if (response.data.data) {
        createdProject = mapApiProjectToProjectDetails(response.data.data);
      }

      return {
        success: response.data.success !== false,
        message:
          response.data.message ||
          "Investment opportunity created successfully",
        project: createdProject || undefined,
        data: createdProject || undefined,
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to create investment opportunity";
      throw new Error(errorMessage);
    }
  },

  updateInvestorProject: async (
    projectId: string | number,
    data: CreateInvestorProjectRequest,
  ): Promise<CreateProjectResponse> => {
    try {
      const response = await apiClient.put(
        `${API_CONFIG.ENDPOINTS.INVESTOR_PROJECTS}/${projectId}`,
        data,
      );

      let updatedProject = null;
      if (response.data.project) {
        updatedProject = mapApiProjectToProjectDetails(response.data.project);
      } else if (response.data.data) {
        updatedProject = mapApiProjectToProjectDetails(response.data.data);
      }

      return {
        success: response.data.success !== false,
        message:
          response.data.message ||
          "Investment opportunity updated successfully",
        project: updatedProject || undefined,
        data: updatedProject || undefined,
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update investment opportunity";
      throw new Error(errorMessage);
    }
  },

  updateProject: async (
    projectId: string | number,
    projectData: CreateProjectRequest,
  ): Promise<CreateProjectResponse> => {
    try {
      const response = await apiClient.put(
        `${API_CONFIG.ENDPOINTS.PROJECTS}/${projectId}`,
        projectData,
      );

      // Handle different response structures
      let updatedProject = null;
      if (response.data.project) {
        updatedProject = mapApiProjectToProjectDetails(response.data.project);
      } else if (response.data.data) {
        updatedProject = mapApiProjectToProjectDetails(response.data.data);
      }

      return {
        success: response.data.success !== false,
        message: response.data.message || "Project updated successfully",
        project: updatedProject || undefined,
        data: updatedProject || undefined,
      };
    } catch (error: any) {
      console.error("Error updating project:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update project";

      const wrapped = new Error(errorMessage) as Error & {
        validationErrors?: Record<string, string[]>;
      };
      if (
        error.response?.data?.errors &&
        typeof error.response.data.errors === "object"
      ) {
        wrapped.validationErrors = error.response.data.errors;
      }
      throw wrapped;
    }
  },

  toggleFavorite: async (
    projectId: string | number,
    _currentlyFavorite: boolean,
  ): Promise<{ success: boolean; message: string; isFavorite: boolean }> => {
    try {
      // Use toggle endpoint to avoid 409 when state is out of sync
      const url = `${API_CONFIG.ENDPOINTS.PROJECT_FAVORITE}/${projectId}/toggle-favorite`;
      const response = await apiClient.post(url);

      const rawResponse = response.data ?? {};
      const responseData =
        rawResponse.response?.data ??
        rawResponse.response ??
        rawResponse.data ??
        rawResponse;

      const responseIsFavorite =
        responseData?.is_favorited ??
        responseData?.is_favourite ??
        responseData?.is_favorite ??
        responseData?.isFavorite ??
        responseData?.favorite ??
        rawResponse.response?.is_favorited ??
        rawResponse.response?.is_favourite ??
        rawResponse.response?.is_favorite ??
        rawResponse.response?.isFavorite ??
        rawResponse.data?.is_favorited ??
        rawResponse.data?.is_favourite ??
        rawResponse.data?.is_favorite ??
        rawResponse.data?.isFavorite ??
        rawResponse.is_favorited ??
        rawResponse.is_favourite ??
        rawResponse.is_favorite ??
        rawResponse.isFavorite;

      const nextFavorite =
        typeof responseIsFavorite === "boolean"
          ? responseIsFavorite
          : !_currentlyFavorite;

      return {
        success: true,
        message:
          responseData?.message ||
          rawResponse?.message ||
          "Favorite status updated",
        isFavorite: nextFavorite,
      };
    } catch (error: any) {
      console.error("Error toggling favorite:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update favorite status";

      throw new Error(errorMessage);
    }
  },

  stopProject: async (
    projectId: string | number,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post(
        `${API_CONFIG.ENDPOINTS.PROJECTS}/${projectId}/stop`,
      );

      // Handle different response structures
      let responseData = response.data;
      if (response.data.response) {
        responseData = response.data.response;
      } else if (response.data.data) {
        responseData = response.data.data;
      }

      const success = responseData.success !== false;
      const message = responseData.message || "Project stopped successfully";

      return { success, message };
    } catch (error: any) {
      console.error("Error stopping project:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to stop project";

      throw new Error(errorMessage);
    }
  },

  togglePublication: async (
    projectId: string | number,
  ): Promise<{ success: boolean; message: string; isPublished: boolean }> => {
    try {
      const response = await apiClient.post(
        `${API_CONFIG.ENDPOINTS.PROJECTS}/${projectId}/toggle-publication`,
      );

      let responseData = response.data;
      if (response.data.response) {
        responseData = response.data.response;
      } else if (response.data.data) {
        responseData = response.data.data;
      }

      const success = responseData.success !== false;
      const isPublished = responseData.is_published ?? true;
      const message =
        responseData.message ||
        (isPublished
          ? "Project published successfully"
          : "Project unpublished successfully");

      return { success, message, isPublished };
    } catch (error: any) {
      console.error("Error toggling project publication:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update project";
      throw new Error(errorMessage);
    }
  },

  getFavorites: async (search = ""): Promise<ProjectsResponse> => {
    try {
      const params: any = {};

      if (search) {
        params.search = search;
      }

      const response = await apiClient.get(API_CONFIG.ENDPOINTS.FAVORITES, {
        params,
      });

      console.log(
        "Favorites Response:",
        JSON.stringify(response.data, null, 2),
      );

      // Handle different response structures
      let favoritesData: any[] = [];
      let meta = null;

      // Extract favorites array from response
      if (
        response.data.response?.data &&
        Array.isArray(response.data.response.data)
      ) {
        // New API structure: { response: { data: [...], meta: {...} } }
        favoritesData = response.data.response.data;
        meta = response.data.response.meta;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Laravel pagination response: { data: [...], meta: {...} }
        favoritesData = response.data.data;
        meta = response.data.meta;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        favoritesData = response.data;
      }

      // Extract projects from favorites (each favorite has a 'project' property)
      const projects: Project[] = favoritesData
        .map((favorite: any) => {
          // Some favorite endpoints split fields across the wrapper and nested project.
          if (favorite.project) {
            return mapApiProjectToProject({
              ...favorite,
              ...favorite.project,
              images:
                favorite.project.images ??
                favorite.images ??
                favorite.project_images ??
                favorite.projectImages,
              media:
                favorite.project.media ??
                favorite.media ??
                favorite.project_media ??
                favorite.projectMedia,
              attachments:
                favorite.project.attachments ??
                favorite.attachments ??
                favorite.project_attachments ??
                favorite.projectAttachments,
              image:
                favorite.project.image ??
                favorite.image ??
                favorite.project_image,
              image_url:
                favorite.project.image_url ??
                favorite.image_url ??
                favorite.project_image_url,
              cover_image:
                favorite.project.cover_image ??
                favorite.cover_image ??
                favorite.project_cover_image,
              thumbnail:
                favorite.project.thumbnail ??
                favorite.thumbnail ??
                favorite.project_thumbnail,
              thumbnail_url:
                favorite.project.thumbnail_url ??
                favorite.thumbnail_url ??
                favorite.project_thumbnail_url,
            });
          }
          // Fallback: if the item itself is a project (for backward compatibility)
          return mapApiProjectToProject(favorite);
        })
        .filter((project: Project | null) => project !== null);

      return {
        projects,
        meta: meta || response.data.pagination,
      };
    } catch (error) {
      console.error("Error fetching favorites:", error);
      throw error;
    }
  },

  getOwnerProjects: async (
    page: number = 1,
    perPage: number = 15,
    status?: string,
    isPublished?: boolean,
    search?: string,
  ): Promise<ProjectsResponse> => {
    try {
      const params: any = {
        page,
        per_page: perPage,
      };

      if (status) {
        params.status = status;
      }

      if (isPublished !== undefined) {
        params.is_published = isPublished;
      }

      if (search) {
        params.search = search;
      }

      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.OWNER_PROJECTS,
        {
          params,
        },
      );

      // Handle different response structures
      let projectsData: any[] = [];
      let meta = null;

      if (
        response.data.response?.data &&
        Array.isArray(response.data.response.data)
      ) {
        projectsData = response.data.response.data;
        meta = response.data.response.meta;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        projectsData = response.data.data;
        meta = response.data.meta;
      } else if (Array.isArray(response.data)) {
        projectsData = response.data;
      }

      const projects: Project[] = projectsData
        .map((apiProject: any) => {
          // Some owner endpoints may wrap the project under a 'project' key
          const projectPayload = apiProject.project ?? apiProject;
          return mapApiProjectToProject(projectPayload);
        })
        .filter((project: Project | null) => project !== null);

      return {
        projects,
        meta: meta || response.data.pagination,
      };
    } catch (error) {
      console.error("Error fetching owner projects:", error);
      throw error;
    }
  },
};
