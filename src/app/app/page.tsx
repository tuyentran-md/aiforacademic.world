import { redirect } from "next/navigation";

// /app/* → /workspace (301 handled in next.config.ts; this is runtime fallback)
export default function LegacyAppPage() {
  redirect("/workspace");
}
