export type Lang = "EN" | "VI";

export const DEFAULT_LANG: Lang = "EN";
export const LANG_COOKIE = "site-lang";

export function isLang(value: string | undefined | null): value is Lang {
  return value === "EN" || value === "VI";
}

export function pickLang<T>(lang: Lang, en: T, vi: T): T {
  return lang === "VI" ? vi : en;
}
