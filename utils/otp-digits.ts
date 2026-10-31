/** Eastern Arabic numerals → ASCII 0–9; keeps ASCII digits; ignores other chars. */
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function sanitizeOtpInput(raw: string, maxLen = 6): string {
  let out = "";
  for (const ch of raw) {
    const idx = ARABIC_INDIC_DIGITS.indexOf(ch);
    if (idx !== -1) {
      out += String(idx);
    } else if (ch >= "0" && ch <= "9") {
      out += ch;
    }
  }
  return out.slice(0, maxLen);
}
