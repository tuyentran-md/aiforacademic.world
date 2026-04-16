import "server-only";

import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, type Lang, isLang } from "@/lib/i18n";

export async function getCurrentLang(): Promise<Lang> {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LANG_COOKIE)?.value;
  return isLang(cookieLang) ? cookieLang : DEFAULT_LANG;
}
