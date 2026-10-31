// Matches backend InvestorOnboardingOptions - used for dropdown/checkbox options
export const INVESTMENT_RANGES = [
  { value: "less_than_50k", labelKey: "inv_range_less_50k" },
  { value: "50k_200k", labelKey: "inv_range_50k_200k" },
  { value: "200k_500k", labelKey: "inv_range_200k_500k" },
  { value: "500k_1m", labelKey: "inv_range_500k_1m" },
  { value: "more_than_1m", labelKey: "inv_range_more_1m" },
];

export const ANNUAL_BUDGETS = [
  { value: "less_than_100k", labelKey: "annual_less_100k" },
  { value: "100k_500k", labelKey: "annual_100k_500k" },
  { value: "500k_1m", labelKey: "annual_500k_1m" },
  { value: "more_than_1m", labelKey: "annual_more_1m" },
];

export const SECTORS = [
  { value: "technology", labelKey: "sector_technology" },
  { value: "food", labelKey: "sector_food" },
  { value: "real_estate", labelKey: "sector_real_estate" },
  { value: "ecommerce", labelKey: "sector_ecommerce" },
  { value: "healthcare", labelKey: "sector_healthcare" },
  { value: "retail", labelKey: "sector_retail" },
  { value: "manufacturing", labelKey: "sector_manufacturing" },
  { value: "services", labelKey: "sector_services" },
  { value: "agriculture", labelKey: "sector_agriculture" },
  { value: "energy", labelKey: "sector_energy" },
  { value: "finance", labelKey: "sector_finance" },
  { value: "education", labelKey: "sector_education" },
];

export const PROJECT_STAGES = [
  { value: "idea", labelKey: "stage_idea" },
  { value: "existing_project", labelKey: "stage_existing" },
  { value: "scaling_company", labelKey: "stage_scaling" },
];

export const INVESTOR_PERSONAS = [
  { value: "angel", labelKey: "persona_angel" },
  { value: "vc", labelKey: "persona_vc" },
  { value: "institutional", labelKey: "persona_institutional" },
];

export const GEOGRAPHIC_PREFERENCES = [
  { value: "city_only", labelKey: "geo_city" },
  { value: "kingdom_wide", labelKey: "geo_kingdom" },
  { value: "gulf_region", labelKey: "geo_gulf" },
];

// City list used by investor project creation form.
export const SAUDI_CITIES = [
  { value: "all", labelKey: "all" },
  { value: "Riyadh", labelKey: "city_riyadh" },
  { value: "Jeddah", labelKey: "city_jeddah" },
  { value: "Mecca", labelKey: "city_mecca" },
  { value: "Medina", labelKey: "city_medina" },
  { value: "Dammam", labelKey: "city_dammam" },
  { value: "Khobar", labelKey: "city_khobar" },
  { value: "Taif", labelKey: "city_taif" },
  { value: "Buraidah", labelKey: "city_buraidah" },
  { value: "Tabuk", labelKey: "city_tabuk" },
  { value: "Abha", labelKey: "city_abha" },
  { value: "Najran", labelKey: "city_najran" },
  { value: "Jazan", labelKey: "city_jazan" },
  { value: "Hail", labelKey: "city_hail" },
  { value: "Arar", labelKey: "city_arar" },
] as const;

export const VALUE_ADD_OPTIONS = [
  { value: "public_relations", labelKey: "public_relations" },
  { value: "technical_expertise", labelKey: "technical_expertise" },
  { value: "mentorship", labelKey: "mentorship" },
];

// Q7: Preferred partnership type (multi-select, optional)
export const PARTNERSHIP_TYPES = [
  { value: "smart_investor", labelKey: "partnership_type_smart" },
  { value: "silent_investor", labelKey: "partnership_type_silent" },
  { value: "professional_fit", labelKey: "partnership_type_professional" },
];

// Q8: Preferred investment type (required)
export const PREFERRED_INVESTMENT_TYPES = [
  { value: "acquisition", labelKey: "acquisition" },
  { value: "partnership", labelKey: "partnership" },
  { value: "merger", labelKey: "merger" },
  { value: "other", labelKey: "other" },
];

// Q4: Partnership percentage options (optional)
export const PARTNERSHIP_PERCENTAGE_OPTIONS = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
];

// Investor project: required partner type (طلب شراكة)
export const REQUIRED_PARTNER_TYPES = [
  { value: "full_time", labelKey: "partner_full_time" },
  { value: "experience", labelKey: "partner_experience" },
  { value: "management_operations", labelKey: "partner_management_operations" },
];

