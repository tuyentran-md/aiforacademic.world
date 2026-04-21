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
  
  return fetch(input, customInit);
}
