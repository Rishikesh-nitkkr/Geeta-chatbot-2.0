"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LogIn, LogOut, User } from "lucide-react";

type LocalProfile = { fullName?: string; profilePicture?: string };

export function UserMenu() {
  const { data: session, status } = useSession();
  const [local, setLocal] = useState<LocalProfile | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("krishna-ai-user-profile");
      if (raw) setLocal(JSON.parse(raw) as LocalProfile);
    } catch { /* ignore */ }
  }, []);

  const avatarSrc = session?.user?.image ?? local?.profilePicture ?? null;
  const displayName = session?.user?.name ?? local?.fullName ?? null;

  if (status === "loading") {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />;
  }

  if (status === "authenticated" || local) {
    return (
      <div className="relative">
        <button
          className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] p-1 pr-3 text-sm text-white/80 transition hover:border-yellow-400/40 hover:bg-yellow-400/8 hover:text-white"
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          <div className="h-8 w-8 overflow-hidden rounded-full border border-white/15">
            {avatarSrc ? (
              <img alt="User" className="h-full w-full object-cover" src={avatarSrc} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-yellow-400/12 text-base">🕉️</div>
            )}
          </div>
          <span className="hidden max-w-[120px] truncate sm:block">{displayName ?? "Profile"}</span>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-white/12 bg-[#0c0812] shadow-2xl backdrop-blur-xl">
              <div className="border-b border-white/8 px-4 py-3">
                {avatarSrc && <img alt="Avatar" className="mb-2 h-10 w-10 rounded-full border border-white/15" src={avatarSrc} />}
                <p className="text-sm font-semibold text-white">{displayName ?? "User"}</p>
                <p className="truncate text-xs text-white/46">{session?.user?.email ?? "Local Profile"}</p>
              </div>
              <Link
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-white/74 transition hover:bg-white/5 hover:text-white"
                href="/profile"
                onClick={() => setOpen(false)}
              >
                <User className="h-4 w-4" /> My Profile
              </Link>
              <button
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-400/80 transition hover:bg-red-500/8 hover:text-red-300"
                onClick={() => {
                  setOpen(false);
                  if (status === "authenticated") signOut({ callbackUrl: "/" });
                  else { localStorage.removeItem("krishna-ai-user-profile"); setLocal(null); }
                }}
                type="button"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      className="flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 text-xs font-semibold text-yellow-300 transition hover:bg-yellow-400/18"
      onClick={() => signIn("google", { callbackUrl: "/profile" })}
      type="button"
    >
      <LogIn className="h-3.5 w-3.5" /> Sign In
    </button>
  );
}
