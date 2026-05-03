"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  User, Mail, Lock, Eye, EyeOff, Camera, Check, X,
  AlertCircle, ArrowLeft, Save, RefreshCw, LogOut, LogIn
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
type UserProfile = {
  fullName: string;
  username: string;
  email: string;
  passwordHash: string;
  profilePicture: string;
  authProvider: "local" | "google";
  googleId?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
};

type FormState = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  profilePicture: string;
};

type FieldError = Partial<Record<keyof FormState, string>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PROFILE_KEY = "krishna-ai-user-profile";

async function hashPassword(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch { return null; }
}

function saveProfileLocal(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRe = /^[a-zA-Z0-9_-]{3,24}$/;

function validateForm(form: FormState, isPasswordChange: boolean): FieldError {
  const errs: FieldError = {};
  if (!form.fullName.trim()) errs.fullName = "Full name is required.";
  if (!form.username.trim()) errs.username = "Username is required.";
  else if (!usernameRe.test(form.username)) errs.username = "3–24 chars: letters, numbers, _ or -";
  if (!form.email.trim()) errs.email = "Email is required.";
  else if (!emailRe.test(form.email)) errs.email = "Enter a valid email address.";
  if (isPasswordChange) {
    if (form.password.length < 8) errs.password = "Minimum 8 characters.";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";
  }
  return errs;
}

function passwordStrength(pwd: string) {
  return [pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^a-zA-Z0-9]/.test(pwd)].filter(Boolean).length;
}

// ─── Small Components ─────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} initial={{ opacity: 0, y: -24 }}
      className={`fixed right-4 top-4 z-[100] flex items-center gap-2.5 rounded-2xl border px-5 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-xl ${
        type === "success" ? "border-teal-400/40 bg-teal-950/90 text-teal-200" : "border-red-400/40 bg-red-950/90 text-red-200"
      }`}
    >
      {type === "success" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} {msg}
    </motion.div>
  );
}

function InputField({
  id, label, icon, type = "text", value, onChange, error, placeholder, right, disabled
}: {
  id: string; label: string; icon: React.ReactNode; type?: string; value: string;
  onChange: (v: string) => void; error?: string; placeholder?: string;
  right?: React.ReactNode; disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.22em] text-white/50" htmlFor={id}>{label}</label>
      <div className={`flex items-center overflow-hidden rounded-2xl border transition ${
        error ? "border-red-400/60 bg-red-500/5" : "border-white/12 bg-white/[0.04] focus-within:border-yellow-400/60 focus-within:ring-2 focus-within:ring-yellow-400/10"
      }`}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center text-white/36">{icon}</span>
        <input
          className="flex-1 bg-transparent py-3 pr-2 text-sm text-white outline-none placeholder:text-white/28 disabled:opacity-40"
          disabled={disabled} id={id} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} type={type} value={value}
        />
        {right && <div className="pr-3">{right}</div>}
      </div>
      {error && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
    </div>
  );
}

function AvatarUpload({ src, onChange }: { src: string; onChange: (b64: string) => void }) {
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const ACCEPTED = ["image/jpeg", "image/jpg", "image/png"];

  function process(file: File) {
    setErr("");
    if (!ACCEPTED.includes(file.type)) { setErr("Only JPG or PNG."); return; }
    if (file.size > 3 * 1024 * 1024) { setErr("Max 3 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative h-28 w-28 cursor-pointer overflow-hidden rounded-full border-2 transition-all ${drag ? "scale-105 border-yellow-400" : "border-white/20 hover:border-yellow-400/50"}`}
        onClick={() => ref.current?.click()}
        onDragLeave={() => setDrag(false)}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) process(f); }}
      >
        {src ? (
          <img alt="Profile" className="h-full w-full object-cover" src={src} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-yellow-400/10 text-5xl">🕉️</div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity hover:opacity-100">
          <Camera className="h-7 w-7 text-white" />
        </div>
      </div>
      <input accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) process(e.target.files[0]); }} ref={ref} type="file" />
      <div className="text-center">
        <p className="text-xs text-white/46">Click or drag to upload photo</p>
        <p className="text-xs text-white/28">JPG, PNG · Max 3 MB</p>
        {err && <p className="mt-1 text-xs text-red-400">{err}</p>}
      </div>
    </div>
  );
}

// ─── Google Sign-In Button ────────────────────────────────────────────────────
function GoogleButton({ label, onClick, loading }: { label: string; onClick: () => void; loading?: boolean }) {
  return (
    <button
      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.05] py-3.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/10 disabled:opacity-50"
      disabled={loading}
      onClick={onClick}
      type="button"
    >
      {loading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      )}
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormState>({ fullName: "", username: "", email: "", password: "", confirmPassword: "", profilePicture: "" });
  const [errors, setErrors] = useState<FieldError>({});
  const [showPwd, setShowPwd] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const isNew = !profile;

  // Load from localStorage on mount
  useEffect(() => {
    const stored = readProfile();
    // If Google session active and no local profile, auto-create from session
    if (!stored && session?.user) {
      const now = new Date().toISOString();
      const auto: UserProfile = {
        fullName: session.user.name ?? "",
        username: (session.user.email ?? "").split("@")[0],
        email: session.user.email ?? "",
        passwordHash: "",
        profilePicture: session.user.image ?? "",
        authProvider: "google",
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now
      };
      saveProfileLocal(auto);
      setProfile(auto);
      setForm({ fullName: auto.fullName, username: auto.username, email: auto.email, password: "", confirmPassword: "", profilePicture: auto.profilePicture });
    } else if (stored) {
      setProfile(stored);
      setForm({ fullName: stored.fullName, username: stored.username, email: stored.email, password: "", confirmPassword: "", profilePicture: stored.profilePicture });
    }
    setMounted(true);
  }, [session]);

  function msg(text: string, type: "success" | "error" = "success") {
    setToast({ msg: text, type });
    setTimeout(() => setToast(null), 3500);
  }

  function patch(key: keyof FormState, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function handleReset() {
    if (!profile) return;
    setForm({ fullName: profile.fullName, username: profile.username, email: profile.email, password: "", confirmPassword: "", profilePicture: profile.profilePicture });
    setErrors({});
    setChangePassword(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const isGoogleUser = profile?.authProvider === "google" || session?.user != null;
    const errs = validateForm(form, !isGoogleUser && (changePassword || isNew));
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      let hash = profile?.passwordHash ?? "";
      if (!isGoogleUser && (changePassword || isNew)) {
        hash = await hashPassword(form.password);
      }
      const now = new Date().toISOString();
      const updated: UserProfile = {
        fullName: form.fullName.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        passwordHash: hash,
        profilePicture: form.profilePicture,
        authProvider: profile?.authProvider ?? (session ? "google" : "local"),
        googleId: profile?.googleId,
        createdAt: profile?.createdAt ?? now,
        updatedAt: now,
        lastLoginAt: profile?.lastLoginAt ?? now
      };
      saveProfileLocal(updated);
      setProfile(updated);
      setChangePassword(false);
      setForm((p) => ({ ...p, password: "", confirmPassword: "" }));
      msg(isNew ? "Profile created! 🙏 Namaste" : "Profile updated successfully!");
    } catch {
      msg("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/profile" });
    } catch {
      msg("Google Sign-In failed. Check credentials.", "error");
      setGoogleLoading(false);
    }
  }

  async function handleSignOut() {
    localStorage.removeItem(PROFILE_KEY);
    await signOut({ callbackUrl: "/" });
  }

  const isGoogleUser = profile?.authProvider === "google" || (status === "authenticated");
  const pwdStrength = passwordStrength(form.password);
  const strColor = pwdStrength >= 4 ? "bg-teal-400" : pwdStrength >= 3 ? "bg-yellow-400" : "bg-orange-400";

  if (!mounted || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05020d]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05020d] font-['Inter',sans-serif] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-60 -top-60 h-[500px] w-[500px] rounded-full bg-purple-900/20 blur-[140px]" />
        <div className="absolute -right-40 top-1/2 h-96 w-96 rounded-full bg-yellow-900/12 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-900/15 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10">
        {/* Back */}
        <Link className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white" href="/">
          <ArrowLeft className="h-4 w-4" /> Back to App
        </Link>

        {/* Header */}
        <motion.div animate={{ opacity: 1, y: 0 }} className="mb-8 text-center" initial={{ opacity: 0, y: 12 }}>
          {/* Session badge */}
          {status === "authenticated" && session.user && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-sm font-semibold text-teal-300">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              Signed in as {session.user.name ?? session.user.email}
            </div>
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-yellow-400/70">Account</p>
          <h1 className="mt-3 text-4xl font-bold text-white">
            {isNew && status !== "authenticated" ? "Create Profile" : "My Profile"}
          </h1>
          <p className="mt-3 text-white/50">
            {isNew && status !== "authenticated"
              ? "Set up your Geeta AI profile to personalise your spiritual journey."
              : "Manage your personal details, photo, and account settings."}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Avatar */}
            <motion.div
              animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center rounded-[2rem] border border-white/8 bg-white/[0.03] p-8"
              initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.35 }}
            >
              <AvatarUpload onChange={(b64) => patch("profilePicture", b64)} src={form.profilePicture} />
            </motion.div>

            {/* Personal Info */}
            <motion.div
              animate={{ opacity: 1, y: 0 }} className="space-y-5 rounded-[2rem] border border-white/8 bg-white/[0.03] p-6"
              initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.35, delay: 0.05 }}
            >
              <h2 className="text-base font-semibold text-white">Personal Information</h2>
              <InputField
                error={errors.fullName} icon={<User className="h-4 w-4" />} id="fullName" label="Full Name"
                onChange={(v) => patch("fullName", v)} placeholder="Your full name" value={form.fullName}
              />
              <InputField
                error={errors.username} icon={<span className="text-xs font-bold text-white/40">@</span>} id="username" label="Username / User ID"
                onChange={(v) => patch("username", v)} placeholder="e.g. arjuna_seeker" value={form.username}
              />
              <InputField
                disabled={isGoogleUser} error={errors.email} icon={<Mail className="h-4 w-4" />} id="email" label="Email Address"
                onChange={(v) => patch("email", v)} placeholder="you@example.com" type="email" value={form.email}
              />
              {isGoogleUser && (
                <p className="text-xs text-white/36">✓ Email is managed by your Google account.</p>
              )}
            </motion.div>

            {/* Password — only for local users */}
            {!isGoogleUser && (
              <motion.div
                animate={{ opacity: 1, y: 0 }} className="space-y-5 rounded-[2rem] border border-white/8 bg-white/[0.03] p-6"
                initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.35, delay: 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white">Password</h2>
                  {!isNew && (
                    <button className="text-xs font-semibold text-yellow-400/80 hover:text-yellow-300" onClick={() => setChangePassword((v) => !v)} type="button">
                      {changePassword ? "Cancel" : "Change Password"}
                    </button>
                  )}
                </div>
                {(changePassword || isNew) ? (
                  <>
                    <InputField
                      error={errors.password} icon={<Lock className="h-4 w-4" />} id="password" label="New Password"
                      onChange={(v) => patch("password", v)} placeholder="Min. 8 characters" type={showPwd ? "text" : "password"} value={form.password}
                      right={<button className="text-white/40 hover:text-white" onClick={() => setShowPwd((v) => !v)} type="button">{showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
                    />
                    <InputField
                      error={errors.confirmPassword} icon={<Lock className="h-4 w-4" />} id="confirmPwd" label="Confirm Password"
                      onChange={(v) => patch("confirmPassword", v)} placeholder="Repeat your password" type={showCfm ? "text" : "password"} value={form.confirmPassword}
                      right={<button className="text-white/40 hover:text-white" onClick={() => setShowCfm((v) => !v)} type="button">{showCfm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
                    />
                    {form.password && (
                      <div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((l) => (
                            <div className={`h-1.5 flex-1 rounded-full transition-all ${pwdStrength >= l ? strColor : "bg-white/10"}`} key={l} />
                          ))}
                        </div>
                        <p className="mt-1.5 text-xs text-white/40">
                          {pwdStrength === 4 ? "Strong 🔒" : pwdStrength >= 3 ? "Good" : "Weak — add uppercase, numbers, symbols"}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-white/40">Password stored as SHA-256 hash. Click "Change Password" to update.</p>
                )}
              </motion.div>
            )}

            {/* Account Info */}
            {profile && (
              <motion.div
                animate={{ opacity: 1 }} className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-5"
                initial={{ opacity: 0 }} transition={{ duration: 0.35, delay: 0.15 }}
              >
                <h2 className="mb-4 text-sm font-semibold text-white">Account Details</h2>
                <div className="grid gap-2 text-xs">
                  {[
                    ["Auth Provider", profile.authProvider === "google" ? "🌐 Google OAuth" : "🔒 Local Account"],
                    ["Member Since", new Date(profile.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })],
                    ["Last Updated", new Date(profile.updatedAt).toLocaleDateString("en-IN", { dateStyle: "long" })],
                  ].map(([k, v]) => (
                    <div className="flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.025] px-4 py-2.5" key={k}>
                      <span className="text-white/46">{k}</span>
                      <span className="font-semibold text-white">{v}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Save / Reset */}
            <div className="flex flex-wrap gap-3">
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-yellow-400/40 bg-yellow-400/12 py-3.5 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-400/22 disabled:opacity-50"
                disabled={loading}
                type="submit"
              >
                {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-300 border-t-transparent" /> : <Save className="h-4 w-4" />}
                {isNew ? "Create Profile" : "Save Changes"}
              </button>
              {!isNew && (
                <button className="flex items-center gap-2 rounded-2xl border border-white/12 px-5 py-3.5 text-sm text-white/60 hover:text-white transition" onClick={handleReset} type="button">
                  <RefreshCw className="h-4 w-4" /> Reset
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-white/10" />
              <span className="text-xs text-white/36">or</span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            {/* Google Sign-In / Signed-in status */}
            {status === "authenticated" ? (
              <div className="flex items-center justify-between rounded-2xl border border-teal-400/20 bg-teal-500/8 p-4">
                <div className="flex items-center gap-3">
                  {session.user?.image && (
                    <img alt="Google avatar" className="h-9 w-9 rounded-full border border-teal-400/30" src={session.user.image} />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{session.user?.name}</p>
                    <p className="text-xs text-white/50">{session.user?.email}</p>
                  </div>
                </div>
                <button
                  className="flex items-center gap-1.5 rounded-xl border border-white/12 px-3 py-2 text-xs font-semibold text-white/60 transition hover:border-red-400/30 hover:text-red-300"
                  onClick={() => signOut({ callbackUrl: "/profile" })}
                  type="button"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            ) : (
              <GoogleButton
                label="Continue with Google"
                loading={googleLoading}
                onClick={handleGoogleSignIn}
              />
            )}

            {/* Sign Out / Delete */}
            {(profile || status === "authenticated") && (
              <button
                className="w-full rounded-2xl border border-red-400/15 py-3 text-sm text-red-400/60 transition hover:border-red-400/35 hover:text-red-300"
                onClick={handleSignOut}
                type="button"
              >
                <LogOut className="mr-2 inline h-4 w-4" />
                {status === "authenticated" ? "Sign Out & Clear Profile" : "Delete Local Profile"}
              </button>
            )}
          </div>
        </form>
      </div>

      <AnimatePresence>
        {toast && <Toast key="toast" msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
