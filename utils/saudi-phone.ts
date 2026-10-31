const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EXT_ARABIC_INDIC_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function normalizePhoneDigits(raw: string): string {
  let out = "";
  for (const ch of raw) {
    const arIdx = ARABIC_INDIC_DIGITS.indexOf(ch);
    if (arIdx !== -1) {
      out += String(arIdx);
      continue;
    }
    const extIdx = EXT_ARABIC_INDIC_DIGITS.indexOf(ch);
    if (extIdx !== -1) {
      out += String(extIdx);
      continue;
    }
    if (ch >= "0" && ch <= "9") out += ch;
  }
  return out;
}

export function toSaudiNationalPhone(raw: string): string {
  let digits = normalizePhoneDigits(raw);
  if (digits.startsWith("00966")) digits = digits.slice(5);
  if (digits.startsWith("966")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function isValidSaudiMobile(raw: string): boolean {
  return /^5\d{8}$/.test(toSaudiNationalPhone(raw));
}
