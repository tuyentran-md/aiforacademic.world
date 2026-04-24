import { auth } from "./firebase/client";

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const customInit = { ...init };
  customInit.headers = new Headers(customInit.headers);

  if (auth && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      (customInit.headers as Headers).set("Authorization", `Bearer ${token}`);
    } catch (err) {
      console.warn("[apiFetch] Failed to get ID token:", err);
    }
  }

  const response = await fetch(input, customInit);

  if (response.status === 429 && typeof window !== "undefined") {
    try {
      const body = await response.clone().json();
      if (body?.error === "quota_exceeded") {
        window.dispatchEvent(
          new CustomEvent("afa:quota-exceeded", {
            detail: { resetAt: body.resetAt, upgradeUrl: body.upgradeUrl },
          })
        );
      }
    } catch {
      /* not JSON, ignore */
    }
  }

  return response;
}
