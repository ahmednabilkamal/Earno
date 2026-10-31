export type MoyasarSdkLang = "ar" | "en";

const GLOBAL_KEY = "MOYASAR_LANG";

function writeGlobal(code: MoyasarSdkLang) {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: string };
  g[GLOBAL_KEY] = code === "en" ? "en" : "ar";
}

/** Run as early as possible so Moyasar’s module init sees Arabic before device locale. */
export function primeMoyasarSdkLanguage(code: MoyasarSdkLang = "ar") {
  writeGlobal(code);
}

/** Keep SDK strings in Arabic regardless of current app UI language (host copy stays independent). */
export function setMoyasarSdkLanguage(code: MoyasarSdkLang = "ar") {
  writeGlobal(code);
}

export function getMoyasarSdkLanguage(): MoyasarSdkLang {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: string };
  const v = (g[GLOBAL_KEY] ?? "ar").substring(0, 2).toLowerCase();
  return v === "en" ? "en" : "ar";
}
