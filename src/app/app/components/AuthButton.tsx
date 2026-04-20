"use client";

import { useState, useRef, useEffect } from "react";
import type { AuthState } from "@/lib/firebase/auth";

interface AuthButtonProps {
  auth: AuthState;
  language: "EN" | "VI";
}

export default function AuthButton({ auth, language }: AuthButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Not configured — show nothing
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;

  // Loading skeleton
  if (auth.loading) {
    return (
      <div className="w-7 h-7 rounded-full bg-stone-100 animate-pulse" />
    );
  }

  // Signed out state
  if (!auth.user) {
    return (
      <button
        onClick={() => void auth.signIn()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-black/10 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-200 transition-colors"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3">
          <circle cx="8" cy="5" r="3" />
          <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" strokeLinecap="round" />
        </svg>
        {language === "EN" ? "Sign in" : "Đăng nhập"}
      </button>
    );
  }

  // Signed in state — avatar + dropdown
  const initials = auth.user.displayName
    ? auth.user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1.5 group"
        title={auth.user.displayName ?? auth.user.email ?? ""}
      >
        {auth.user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={auth.user.photoURL}
            alt={auth.user.displayName ?? ""}
            className="w-7 h-7 rounded-full border border-black/10"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-stone-700 flex items-center justify-center text-white text-[10px] font-bold">
            {initials}
          </div>
        )}
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className={`w-2.5 h-2.5 text-stone-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-black/[0.08] bg-white shadow-lg z-50 overflow-hidden">
          {/* User info */}
          <div className="px-3.5 py-3 border-b border-black/[0.06]">
            <p className="text-xs font-semibold text-stone-900 truncate">
              {auth.user.displayName}
            </p>
            <p className="text-[11px] text-stone-400 truncate">
              {auth.user.email}
            </p>
          </div>

          {/* Actions */}
          <div className="p-1">
            <button
              onClick={() => {
                setMenuOpen(false);
                void auth.signOut();
              }}
              className="w-full text-left px-3 py-2 text-xs text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
            >
              {language === "EN" ? "Sign out" : "Đăng xuất"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
