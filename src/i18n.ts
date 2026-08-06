import itCommon from "../public/locales/it/common.json";
import enCommon from "../public/locales/en/common.json";

export type Language = "it" | "en";

const translations = {
  it: itCommon,
  en: enCommon,
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.it;
}

export function t(lang: Language, key: string): string {
  const translation = getTranslation(lang);
  const keys = key.split(".");
  let value: any = translation;

  for (const k of keys) {
    value = value?.[k];
  }

  return typeof value === "string" ? value : key;
}
