import { TFunction } from "i18next";
import React from "react";

import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal-amount";
import { ProjectDetails } from "@/services/project-service";
import { SectionProps } from "../types";

type BuildSectionsArgs = {
  projectDetails: ProjectDetails;
  ownsProject: boolean;
  isRTL: boolean;
  t: TFunction;
};

const safeParseFloat = (value: string | undefined | null): number => {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

/** Localized amount + SAR / ر.س for investment detail rows */
const formatSar = (value: string | number, t: TFunction, isRTL: boolean) => {
  const n = typeof value === "string" ? safeParseFloat(value) : value;
  return React.createElement(SaudiRiyalAmount, {
    value: n,
    locale: "en-US",
    textStyle: {
      color: "#5C6F81",
      fontSize: 14,
    },
    containerStyle: {
      justifyContent: isRTL ? "flex-end" : "flex-start",
    },
  });
};

const humanizeStatus = (status: string): string => {
  if (!status) return "N/A";
  if (status === "re_review") return "Re-review";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const getTranslatedProjectStatus = (
  statusRaw: string | undefined,
  fallbackLabel: string | undefined,
  t: TFunction
): string => {
  if (!statusRaw) {
    return fallbackLabel || "N/A";
  }

  const normalizedKey = statusRaw.toLowerCase().replace(/[\s-]+/g, "_");
  const defaultValue = fallbackLabel || humanizeStatus(statusRaw);
  const translated = t(normalizedKey, { defaultValue });

  return translated === normalizedKey ? defaultValue : translated;
};

export function buildProjectSections({
  projectDetails,
  ownsProject,
  isRTL,
  t,
}: BuildSectionsArgs) {
  const isRealEstate = projectDetails.projectType === "real_estate";
  const isInvestorSeeking = projectDetails.projectType === "investor_seeking";
  const propertyTypeDisplay =
    isRTL && projectDetails.propertyTypeLabelAr
      ? projectDetails.propertyTypeLabelAr
      : projectDetails.propertyTypeLabel || projectDetails.propertyType || "N/A";

  const propertySections = isRealEstate
    ? [
        {
          title: t("section_basic_info", { defaultValue: "Basic Information" }),
          titleIcon: "document-text" as const,
          variant: "property" as const,
          details: [
            {
              label: t("project_name_label", { defaultValue: "Project Name" }),
              value: projectDetails.title || "N/A",
              icon: "document-text" as const,
            },
            {
              label: t("property_type_label", { defaultValue: "Property Type" }),
              value: propertyTypeDisplay,
              icon: "business" as const,
            },
            ...(ownsProject
              ? [
                  {
                    label: t("project_status_label", { defaultValue: "Status" }),
                    value: getTranslatedProjectStatus(
                      projectDetails.status,
                      projectDetails.projectStatus,
                      t
                    ),
                    icon: "checkmark-circle" as const,
                  },
                ]
              : []),
            {
              label: t("project_owner_label", { defaultValue: "Owner" }),
              value: projectDetails.owner?.name || "N/A",
              icon: "person" as const,
            },
          ],
        },
        {
          title: t("section_location", { defaultValue: "Location" }),
          titleIcon: "location" as const,
          variant: "property" as const,
          details: [
            {
              label: t("location_label", { defaultValue: "Location" }),
              value: projectDetails.location || "N/A",
              icon: "location" as const,
            },
            ...(projectDetails.neighborhood
              ? [
                  {
                    label: t("neighborhood_label", { defaultValue: "Neighborhood" }),
                    value: projectDetails.neighborhood,
                    icon: "map" as const,
                  },
                ]
              : []),
          ].filter(Boolean),
        },
        ...([
          projectDetails.areaSqm != null ||
          projectDetails.deedNumber ||
          projectDetails.floorCount != null ||
          projectDetails.apartmentCount != null ||
          (projectDetails.shopCount != null && projectDetails.shopCount > 0) ||
          projectDetails.propertyAgeYears != null
            ? {
                title: t("section_property_specs", {
                  defaultValue: "Property Specifications",
                }),
                titleIcon: "grid-outline" as const,
                variant: "property" as const,
                details: [
                  ...(projectDetails.areaSqm != null
                    ? [
                        {
                          label: t("area_sqm_label", { defaultValue: "Area (m²)" }),
                          value: `${projectDetails.areaSqm} m²`,
                          icon: "grid-outline" as const,
                        },
                      ]
                    : []),
                  ...(projectDetails.deedNumber
                    ? [
                        {
                          label: t("deed_number_label", {
                            defaultValue: "Deed Number",
                          }),
                          value: projectDetails.deedNumber,
                          icon: "document-attach" as const,
                        },
                      ]
                    : []),
                  ...(projectDetails.floorCount != null
                    ? [
                        {
                          label: t("floor_count_label", { defaultValue: "Floors" }),
                          value: String(projectDetails.floorCount),
                          icon: "layers" as const,
                        },
                      ]
                    : []),
                  ...(projectDetails.apartmentCount != null
                    ? [
                        {
                          label: t("apartment_count_label", {
                            defaultValue: "Apartments",
                          }),
                          value: String(projectDetails.apartmentCount),
                          icon: "business" as const,
                        },
                      ]
                    : []),
                  ...(projectDetails.shopCount != null && projectDetails.shopCount > 0
                    ? [
                        {
                          label: t("shop_count_label", { defaultValue: "Shops" }),
                          value: String(projectDetails.shopCount),
                          icon: "storefront" as const,
                        },
                      ]
                    : []),
                  ...(projectDetails.propertyAgeYears != null
                    ? [
                        {
                          label: t("property_age_label", {
                            defaultValue: "Property Age (years)",
                          }),
                          value: String(projectDetails.propertyAgeYears),
                          icon: "time" as const,
                        },
                      ]
                    : []),
                  ...(projectDetails.streetCount != null
                    ? [
                        {
                          label: t("street_count_label", {
                            defaultValue: "Street Count",
                          }),
                          value: String(projectDetails.streetCount),
                          icon: "map" as const,
                        },
                      ]
                    : []),
                  ...(projectDetails.hasDeed != null
                    ? [
                        {
                          label: t("has_deed_label", { defaultValue: "Has Deed" }),
                          value: projectDetails.hasDeed
                            ? t("yes", { defaultValue: "Yes" })
                            : t("no", { defaultValue: "No" }),
                          icon: "document-attach" as const,
                        },
                      ]
                    : []),
                  ...(projectDetails.hasCourtyard != null
                    ? [
                        {
                          label: t("has_courtyard_label", {
                            defaultValue: "Has Courtyard",
                          }),
                          value: projectDetails.hasCourtyard
                            ? t("yes", { defaultValue: "Yes" })
                            : t("no", { defaultValue: "No" }),
                          icon: "map" as const,
                        },
                      ]
                    : []),
                  ...(projectDetails.deedDocument
                    ? [
                        {
                          label: t("deed_document_label", {
                            defaultValue: "Deed Document",
                          }),
                          value: t("attached", { defaultValue: "Attached" }),
                          icon: "document-attach" as const,
                        },
                      ]
                    : []),
                ].filter(Boolean),
              }
            : null,
        ].filter(Boolean)),
        ...([
          projectDetails.bedroomCount != null ||
          projectDetails.bathroomCount != null ||
          projectDetails.kitchenCount != null ||
          projectDetails.livingRoomCount != null
            ? {
                title: t("section_rooms", { defaultValue: "Rooms" }),
                titleIcon: "bed" as const,
                variant: "property" as const,
                details: [
                  ...(projectDetails.bedroomCount != null
                    ? [
                        {
                          label: t("bedroom_count_label", {
                            defaultValue: "Bedrooms",
                          }),
                          value: String(projectDetails.bedroomCount),
                          icon: "bed" as const,
                        },
                      ]
                    : []),
                  ...(projectDetails.bathroomCount != null
                    ? [
                        {
                          label: t("bathroom_count_label", {
                            defaultValue: "Bathrooms",
                          }),
                          value: String(projectDetails.bathroomCount),
                          icon: "water" as const,
                        },
                      ]
                    : []),
                  ...(projectDetails.kitchenCount != null
                    ? [
                        {
                          label: t("kitchen_count_label", {
                            defaultValue: "Kitchens",
                          }),
                          value: String(projectDetails.kitchenCount),
                          icon: "restaurant" as const,
                        },
                      ]
                    : []),
                  ...(projectDetails.livingRoomCount != null
                    ? [
                        {
                          label: t("living_room_count_label", {
                            defaultValue: "Living Rooms",
                          }),
                          value: String(projectDetails.livingRoomCount),
                          icon: "people" as const,
                        },
                      ]
                    : []),
                ].filter(Boolean),
              }
            : null,
        ].filter(Boolean)),
        ...(projectDetails.saleReason
          ? [
              {
                title: t("section_additional_info", {
                  defaultValue: "Additional Information",
                }),
                titleIcon: "chatbox-ellipses-outline" as const,
                variant: "property" as const,
                details: [
                  {
                    label: t("sale_reason_label", { defaultValue: "Sale Reason" }),
                    value: projectDetails.saleReason,
                    icon: "chatbox-ellipses-outline" as const,
                  },
                ],
              },
            ]
          : []),
      ]
    : [];

  const investorSeekingDetails1: {
    label: string;
    value: string;
    icon:
      | "business"
      | "location"
      | "pie-chart"
      | "wallet"
      | "person"
      | "pricetag";
  }[] = [];

  if (isInvestorSeeking) {
    investorSeekingDetails1.push(
      {
        label: t("investor_project_field"),
        value: projectDetails.projectField || "N/A",
        icon: "business",
      },
      {
        label: t("investor_city"),
        value: projectDetails.cityLabel || projectDetails.location || "N/A",
        icon: "location",
      }
    );
    if (projectDetails.detailedLocation) {
      investorSeekingDetails1.push({
        label: t("detailed_location_label", { defaultValue: "Detailed Location" }),
        value: projectDetails.detailedLocation,
        icon: "location",
      });
    }
    if (projectDetails.requiredPartnerType) {
      investorSeekingDetails1.push({
        label: t("investor_required_partner_type"),
        value: t(`partner_${projectDetails.requiredPartnerType}`, {
          defaultValue:
            projectDetails.requiredPartnerTypeLabel ||
            projectDetails.requiredPartnerType,
        }),
        icon: "person",
      });
    }
    if (projectDetails.investmentPartnershipType) {
      investorSeekingDetails1.push({
        label: t("investor_investment_type"),
        value: t(projectDetails.investmentPartnershipType, {
          defaultValue: projectDetails.investmentPartnershipType,
        }),
        icon: "pricetag",
      });
    }
  }

  const investorSeekingSections = isInvestorSeeking
    ? [
        {
          title: t("investor_seeking_title"),
          titleIcon: "briefcase" as const,
          variant: "property" as const,
          details: investorSeekingDetails1,
        },
        ...(projectDetails.requirementsDescription
          ? [
              {
                title: t("investor_requirements_description"),
                titleIcon: "document-text" as const,
                variant: "property" as const,
                content: projectDetails.requirementsDescription,
              },
            ]
          : []),
      ]
    : [];

  const projectInfo: SectionProps | null =
    !isRealEstate && !isInvestorSeeking
      ? {
          title: t("project_info_title", { defaultValue: "Project Information" }),
          details: [
            {
              label: t("project_name_label", { defaultValue: "Project Name" }),
              value: projectDetails.title || "N/A",
              icon: "document-text" as const,
            },
            {
              label: t("category_label", { defaultValue: "Category" }),
              value: projectDetails.sector || "N/A",
              icon: "pricetag" as const,
            },
            {
              label: t("location_label", { defaultValue: "Location" }),
              value: projectDetails.location || projectDetails.cityLabel || "N/A",
              icon: "location" as const,
            },
            ...(ownsProject
              ? [
                  {
                    label: t("project_status_label", { defaultValue: "Status" }),
                    value: getTranslatedProjectStatus(
                      projectDetails.status,
                      projectDetails.projectStatus,
                      t
                    ),
                    icon: "checkmark-circle" as const,
                  },
                ]
              : []),
            {
              label: t("project_owner_label", { defaultValue: "Owner" }),
              value: projectDetails.owner?.name || "N/A",
              icon: "person" as const,
            },
            ...(projectDetails.establishmentDate
              ? [
                  {
                    label: t("established_date_label", {
                      defaultValue: "Established Date",
                    }),
                    value: projectDetails.establishmentDate,
                    icon: "calendar" as const,
                  },
                ]
              : []),
            ...(projectDetails.branchesCount != null
              ? [
                  {
                    label: t("branches_label", { defaultValue: "Branches" }),
                    value: String(projectDetails.branchesCount),
                    icon: "layers" as const,
                  },
                ]
              : []),
            ...(projectDetails.employeesCount != null
              ? [
                  {
                    label: t("employees_label", { defaultValue: "Employees" }),
                    value: String(projectDetails.employeesCount),
                    icon: "people" as const,
                  },
                ]
              : []),
            ...(projectDetails.operationalYears != null
              ? [
                  {
                    label: t("operational_years_label", {
                      defaultValue: "Operational Years",
                    }),
                    value: String(projectDetails.operationalYears),
                    icon: "time" as const,
                  },
                ]
              : []),
          ],
        }
      : null;

  const investmentDetailRows: SectionProps["details"] = [];

  if (isRealEstate) {
    if (projectDetails.requestedAmount != null) {
      investmentDetailRows.push({
        label: t("requested_amount_label", {
          defaultValue: "Requested Amount",
        }),
        value: formatSar(projectDetails.requestedAmount, t, isRTL),
        icon: "cash" as const,
      });
    }
    if (projectDetails.annualIncome != null) {
      investmentDetailRows.push({
        label: t("annual_income_label", { defaultValue: "Annual Income" }),
        value: formatSar(projectDetails.annualIncome, t, isRTL),
        icon: "trending-up" as const,
      });
    }
  } else if (isInvestorSeeking) {
    if (projectDetails.investorCapital != null) {
      investmentDetailRows.push({
        label: t("investor_capital_label", {
          defaultValue: "Investor capital",
        }),
        value: formatSar(projectDetails.investorCapital, t, isRTL),
        icon: "wallet" as const,
      });
    }
    if (projectDetails.partnershipPercentageRequired != null) {
      investmentDetailRows.push({
        label: t("partnership_percentage_label", {
          defaultValue: "Partnership Percentage Required",
        }),
        value: `${projectDetails.partnershipPercentageRequired}%`,
        icon: "pie-chart" as const,
      });
    }
  } else {
    if (projectDetails.investmentNeeded) {
      investmentDetailRows.push({
        label: t("investment_needed_label", {
          defaultValue: "Investment Needed",
        }),
        value: formatSar(projectDetails.investmentNeeded, t, isRTL),
        icon: "cash" as const,
      });
    }
    if (projectDetails.announcementGoalLabel || projectDetails.announcementGoalType) {
      investmentDetailRows.push({
        label: t("announcement_goal_label", { defaultValue: "Announcement Goal" }),
        value:
          projectDetails.announcementGoalLabel ||
          projectDetails.announcementGoalType ||
          t("not_applicable", { defaultValue: "N/A" }),
        icon: "pricetag" as const,
      });
    }
    if (projectDetails.projectValue != null) {
      investmentDetailRows.push({
        label: t("project_value_label", { defaultValue: "Project Value" }),
        value: formatSar(projectDetails.projectValue, t, isRTL),
        icon: "cash" as const,
      });
    }
    if (projectDetails.approximateSales != null) {
      investmentDetailRows.push({
        label: t("approximate_sales_label", {
          defaultValue: "Approximate Sales",
        }),
        value: formatSar(projectDetails.approximateSales, t, isRTL),
        icon: "trending-up" as const,
      });
    }
  }

  const investmentDetails: SectionProps = {
    title: t("investment_details_title", { defaultValue: "Investment Details" }),
    titleIcon: "wallet" as const,
    details: investmentDetailRows,
  };

  const keyFigures: SectionProps = {
    title: t("key_figures_title", { defaultValue: "Key Statistics" }),
    titleIcon: "stats-chart" as const,
    details: [
      {
        label: t("views_label", { defaultValue: "Views" }),
        value: (typeof projectDetails.viewsCount === "number"
          ? projectDetails.viewsCount
          : 0
        ).toLocaleString(),
        icon: "eye" as const,
      },
      {
        label: t("interested_investors_label", {
          defaultValue: "Interested Investors",
        }),
        value: (typeof projectDetails.stats?.interestsCount === "number"
          ? projectDetails.stats.interestsCount
          : 0
        ).toString(),
        icon: "people" as const,
      },
      {
        label: t("favorites_label", { defaultValue: "Favorites" }),
        value: (typeof projectDetails.stats?.favoritesCount === "number"
          ? projectDetails.stats.favoritesCount
          : 0
        ).toString(),
        icon: "heart" as const,
      },
      {
        label: t("investor_count_label", { defaultValue: "Investor Count" }),
        value: (typeof projectDetails.stats?.investorCount === "number"
          ? projectDetails.stats.investorCount
          : 0
        ).toString(),
        icon: "people-circle" as const,
      },
    ],
  };

  return {
    investmentDetails,
    investorSeekingSections,
    isInvestorSeeking,
    isRealEstate,
    keyFigures,
    projectInfo,
    propertySections,
  };
}
