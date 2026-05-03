"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  Brain,
  ChevronDown,
  Download,
  ExternalLink,
  Flame,
  Heart,
  Loader2,
  Menu,
  Moon,
  Pause,
  Play,
  Save,
  Send,
  Share2,
  Shield,
  Sparkles,
  Timer,
  User,
  Volume2,
  Wind,
  X
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { chapters, galleryImages, situationMap, wisdomQuotes } from "@/lib/gita-data";
import { getDailyVerse, getNextVerse } from "@/lib/guidance";
import type { GitaVerse, GrowthEntry, GuidanceResponse, SituationKey } from "@/lib/types";
import { GalleryManager } from "./GalleryManager";
import { UserMenu } from "./UserMenu";

const navItems = [
  { href: "#ask", label: "Ask" },
  { href: "#situations", label: "Situations" },
  { href: "#reader", label: "Gita" },
  { href: "#meditation", label: "Meditation" },
  { href: "#growth", label: "Growth" },
  { href: "#feedback", label: "Feedback" },
  { href: "#profile", label: "Profile" },
  { href: "#quiz", label: "Quiz" }
];

const moodLabels = ["Heavy", "Low", "Steady", "Light", "Radiant"];

type ProfileForm = {
  preferences: string;
};

const defaultProfile: ProfileForm = {
  preferences: "Calm guidance, slower voice, OM ambience."
};

type MediaStatus = "idle" | "ready" | "playing" | "paused" | "blocked" | "error";

function readStoredArray<T>(key: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T[]) : [];
  } catch {
    return [];
  }
}

function readStoredProfile(): ProfileForm {
  if (typeof window === "undefined") {
    return defaultProfile;
  }

  try {
    const saved = window.localStorage.getItem("krishna-ai-profile");
    return saved ? { ...defaultProfile, ...(JSON.parse(saved) as Partial<ProfileForm>) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

function useRevealAnimations(refreshKey: unknown) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.16 }
    );

    elements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 6, 5) * 0.1}s`;
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [refreshKey]);
}

function useSacredAudio({
  omEnabled,
  fluteEnabled,
  omVolume,
  fluteVolume
}: {
  omEnabled: boolean;
  fluteEnabled: boolean;
  omVolume: number;
  fluteVolume: number;
}) {
  const omRef = useRef<HTMLAudioElement | null>(null);
  const fluteRef = useRef<HTMLAudioElement | null>(null);
  const [omStatus, setOmStatus] = useState<MediaStatus>("idle");
  const [fluteStatus, setFluteStatus] = useState<MediaStatus>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    // ⚠️ Do NOT set crossOrigin="anonymous" for same-origin files —
    // it triggers a CORS preflight and causes MEDIA_ERR_SRC_NOT_SUPPORTED
    function createTrack(src: string, onStatus: (s: MediaStatus) => void) {
      const audio = new Audio(src);
      audio.loop = true;
      audio.preload = "metadata";
      const markReady = () => onStatus("ready");
      const markError = () => onStatus("error");
      audio.addEventListener("canplay", markReady);
      audio.addEventListener("error", markError);
      return { audio, markReady, markError };
    }

    const om = createTrack("/assets/user-media/om-108.mp3", setOmStatus);
    const flute = createTrack("/assets/user-media/krishna-flute.mp3", setFluteStatus);
    omRef.current = om.audio;
    fluteRef.current = flute.audio;

    return () => {
      om.audio.pause();
      flute.audio.pause();
      om.audio.removeEventListener("canplay", om.markReady);
      om.audio.removeEventListener("error", om.markError);
      flute.audio.removeEventListener("canplay", flute.markReady);
      flute.audio.removeEventListener("error", flute.markError);
      omRef.current = null;
      fluteRef.current = null;
    };
  }, []);

  useEffect(() => {
    async function syncTrack(
      audio: HTMLAudioElement | null,
      enabled: boolean,
      volume: number,
      onStatus: (s: MediaStatus) => void
    ) {
      if (!audio) { onStatus("error"); return; }
      audio.volume = Math.max(0, Math.min(volume, 1));
      if (!enabled) { audio.pause(); onStatus("paused"); return; }
      try {
        await audio.play();
        onStatus("playing");
      } catch {
        onStatus("blocked");
      }
    }
    void syncTrack(omRef.current, omEnabled, omVolume, setOmStatus);
    void syncTrack(fluteRef.current, fluteEnabled, fluteVolume, setFluteStatus);
  }, [fluteEnabled, fluteVolume, omEnabled, omVolume]);

  return { fluteStatus, omStatus };
}

function SectionHeading({
  eyebrow,
  title,
  copy
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="mx-auto mb-8 max-w-3xl text-center" data-reveal>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.34em] text-antique/80">{eyebrow}</p>
      <h2 className="gold-text text-3xl font-semibold leading-tight md:text-5xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-white/68 md:text-base">{copy}</p>
    </div>
  );
}

function ChakraMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`chakra-spin relative grid shrink-0 place-items-center rounded-full border border-antique/50 bg-antique/10 shadow-divine ${
        compact ? "h-12 w-12" : "h-16 w-16"
      }`}
      aria-hidden="true"
    >
      <div className="absolute inset-1 rounded-full border border-dashed border-antique/70" />
      <div className="absolute h-[2px] w-[78%] bg-antique/80" />
      <div className="absolute h-[78%] w-[2px] bg-antique/80" />
      <div className="absolute h-[2px] w-[78%] rotate-45 bg-antique/60" />
      <div className="absolute h-[2px] w-[78%] -rotate-45 bg-antique/60" />
      <div className="h-3 w-3 rounded-full bg-antique shadow-[0_0_18px_rgba(246,208,122,0.8)]" />
    </div>
  );
}

function DivineButton({
  children,
  onClick,
  disabled,
  type = "button",
  variant = "primary",
  className = "",
  ariaLabel,
  testId
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "soft";
  className?: string;
  ariaLabel?: string;
  testId?: string;
}) {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-antique/70 focus:ring-offset-2 focus:ring-offset-night disabled:opacity-55";
  const variants = {
    primary: "bg-antique text-night shadow-divine hover:-translate-y-0.5 hover:bg-[#ffe2a0]",
    ghost: "border border-white/14 bg-white/[0.05] text-white hover:border-antique/50 hover:bg-white/[0.1]",
    soft: "border border-antique/20 bg-antique/10 text-antique hover:bg-antique/16"
  };

  return (
    <button aria-label={ariaLabel} className={`${base} ${variants[variant]} ${className}`} data-testid={testId} disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  );
}

function AudioController({
  title,
  description,
  enabled,
  volume,
  status,
  icon,
  onToggle,
  onVolumeChange,
  testId
}: {
  title: string;
  description: string;
  enabled: boolean;
  volume: number;
  status: MediaStatus;
  icon: ReactNode;
  onToggle: () => void;
  onVolumeChange: (value: number) => void;
  testId: string;
}) {
  const statusLabel: Record<MediaStatus, string> = {
    blocked: "Tap Play",
    error: "Unavailable",
    idle: "Ready",
    paused: "Paused",
    playing: "Playing",
    ready: "Ready"
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_14px_38px_rgba(0,0,0,0.18)]" data-testid={testId}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-antique/18 bg-antique/10 text-antique">{icon}</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${
                status === "error"
                  ? "border border-red-300/25 bg-red-500/10 text-red-100"
                  : status === "playing"
                    ? "border border-peacock/25 bg-peacock/10 text-peacock"
                    : "border border-white/10 bg-white/[0.05] text-white/50"
              }`}>
                {statusLabel[status]}
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-white/58">{description}</p>
          </div>
        </div>
        <DivineButton className="w-full sm:w-auto" onClick={onToggle} testId={`${testId}-toggle`} variant={enabled ? "primary" : "ghost"}>
          {enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {enabled ? "Pause" : "Play"}
        </DivineButton>
      </div>

      <label className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-night/50 px-3 py-2 text-sm text-white/66">
        <Volume2 className="h-4 w-4 text-antique" />
        <span className="min-w-14">{Math.round(volume * 100)}%</span>
        <input
          aria-label={`${title} volume`}
          className="w-full accent-antique"
          data-testid={`${testId}-volume`}
          max={1}
          min={0}
          disabled={status === "error"}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          step={0.05}
          type="range"
          value={volume}
        />
      </label>
    </div>
  );
}

function AvatarStage({
  response,
  isSpeaking
}: {
  response: GuidanceResponse | null;
  isSpeaking: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  // Always start muted — required by all modern browsers for autoPlay
  const [avatarMuted, setAvatarMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Sync play/pause only — keep muted separate to avoid re-triggering play
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoError) return;
    video.playbackRate = 0.75;
    if (isVideoPlaying) {
      void video.play().catch(() => setIsVideoPlaying(false));
    } else {
      video.pause();
    }
  }, [isVideoPlaying, videoError]);

  // Sync mute state without restarting video
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = avatarMuted;
  }, [avatarMuted]);

  return (
    <div className="glass-card krishna-card relative overflow-hidden rounded-[1.75rem] p-4 sm:p-5" data-reveal>
      <div className="absolute inset-0">
        <img alt="" className="h-full w-full object-cover opacity-28" src="/krishna-bg.jpg" />
        <div className="absolute inset-0 bg-gradient-to-b from-night/28 via-night/54 to-night/95" />
      </div>

      <div className="relative z-10 flex min-h-full flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-antique/75">Speaking Avatar</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Krishna Guidance Presence</h3>
          </div>
          <span className="rounded-full border border-peacock/30 bg-peacock/10 px-3 py-1 text-xs font-semibold text-peacock self-start">
            {isSpeaking ? "Speaking softly" : "Looping presence"}
          </span>
        </div>

        <div
          className="avatar-stage-media relative min-h-[420px] overflow-hidden rounded-2xl border border-antique/24 bg-black/35 sm:min-h-[520px] xl:min-h-[640px]"
          data-testid="avatar-video-container"
        >
          <img alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-55" src="/krishna-bg.jpg" />
          <div className="absolute inset-0 bg-gradient-to-b from-night/36 via-night/48 to-night/88" />

          <div className="absolute inset-[3%] overflow-hidden rounded-2xl border border-antique/30 bg-night/70 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
            {videoError ? (
              <div className="absolute inset-0 z-10 grid place-items-center bg-night/80 p-6 text-center">
                <div>
                  <Sparkles className="mx-auto h-10 w-10 text-antique" />
                  <p className="mt-4 text-lg font-semibold text-white">Avatar video unavailable</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/62">Place krishna-avatar.mp4 in public/assets/user-media/ and refresh.</p>
                  <img
                    alt="Krishna avatar fallback"
                    className="mx-auto mt-4 h-48 w-48 rounded-full object-cover opacity-80"
                    src="/assets/user-media/krishna-face-flute.jpg"
                  />
                </div>
              </div>
            ) : null}
            <video
              ref={videoRef}
              aria-label="Looping Krishna avatar presence"
              autoPlay
              className="avatar-video h-full w-full object-cover"
              data-testid="avatar-video"
              loop
              muted
              onCanPlay={() => setVideoError(false)}
              onError={() => {
                setVideoError(true);
                setIsVideoPlaying(false);
              }}
              playsInline
              poster="/assets/user-media/krishna-face-flute.jpg"
              preload="auto"
              src="/assets/user-media/krishna-avatar.mp4"
            />
            <div className="avatar-eye-reflection pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_32%,rgba(5,2,13,0.28))]" />
          </div>

          <div className="absolute inset-x-4 bottom-4 z-20 sm:inset-x-8 sm:bottom-8">
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-lg bg-antique px-4 py-2 text-sm font-semibold text-night transition hover:bg-[#ffe2a0] disabled:opacity-50"
                data-testid="avatar-playback-toggle"
                disabled={videoError}
                onClick={() => setIsVideoPlaying((c) => !c)}
                type="button"
              >
                {isVideoPlaying ? "Pause" : "Play"}
              </button>
              <button
                className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:border-antique hover:text-antique disabled:opacity-50"
                data-testid="avatar-mute-toggle"
                disabled={videoError}
                onClick={() => setAvatarMuted((c) => !c)}
                type="button"
              >
                {avatarMuted ? "Unmute" : "Mute"}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-night/58 p-4">
          <p className="text-sm leading-6 text-white/74">
            {response
              ? response.krishnaGuidance
              : "Ask a question and this presence will speak the shloka, meaning, and personal guidance with voice and sacred ambience."}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResponseCard({
  response,
  isSpeaking,
  onSpeak,
  onPause,
  onShare,
  onCard
}: {
  response: GuidanceResponse | null;
  isSpeaking: boolean;
  onSpeak: () => void;
  onPause: () => void;
  onShare: () => void;
  onCard: () => void;
}) {
  if (!response) {
    return (
      <div className="glass-card krishna-card rounded-[1.75rem] p-6" data-reveal>
        <div className="grid min-h-[340px] place-items-center text-center">
          <div>
            <Sparkles className="mx-auto h-10 w-10 text-antique" />
            <h3 className="mt-5 text-2xl font-semibold">Your answer will appear here</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/66">
              Ask with honesty. The system will match your question to Gita wisdom, then prepare voice, sacred video presence, and practical guidance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="glass-card krishna-card rounded-[1.75rem] p-6"
      data-reveal
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-antique/75">Matched Shloka</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Bhagavad Gita {response.verse.chapter}.{response.verse.verse}
          </h3>
        </div>
        <span className="rounded-full border border-peacock/25 bg-peacock/10 px-3 py-1 text-xs font-semibold text-peacock">
          {Math.round(response.confidence * 100)}% relevance
        </span>
      </div>

      <div className="space-y-4">
        <div className={`shloka-speak-panel rounded-2xl border border-antique/18 bg-antique/[0.07] p-4 ${isSpeaking ? "is-speaking" : ""}`}>
          <p className="text-xl font-semibold leading-9 text-antique md:text-2xl">
            {response.verse.sanskrit.split(/\s+/).map((word, index) => (
              <span
                className={`shloka-word ${isSpeaking ? "is-reading" : ""}`}
                key={`${word}-${index}`}
                style={{ animationDelay: `${index * 0.32}s` }}
              >
                {word}
              </span>
            ))}
          </p>
          <p className="mt-3 text-sm italic leading-6 text-white/68">{response.verse.transliteration}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/46">Simple Meaning</p>
            <p className="text-sm leading-7 text-white/78">{response.verse.meaning}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/46">Krishna Guidance for You</p>
            <p className="text-sm leading-7 text-white/82">{response.krishnaGuidance}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-peacock/18 bg-peacock/[0.07] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-peacock/80">Practical Real-Life Advice</p>
          <div className="grid gap-3">
            {response.practicalAdvice.map((item) => (
              <div className="flex gap-3 rounded-xl bg-night/36 p-3 text-sm leading-6 text-white/78" key={item}>
                <Shield className="mt-1 h-4 w-4 shrink-0 text-antique" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <DivineButton onClick={isSpeaking ? onPause : onSpeak}>
            {isSpeaking ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {isSpeaking ? "Pause Voice" : "Speak"}
          </DivineButton>
          <DivineButton onClick={onShare} variant="ghost">
            <Share2 className="h-4 w-4" />
            WhatsApp Share
          </DivineButton>
          <DivineButton onClick={onCard} variant="soft">
            <Download className="h-4 w-4" />
            Instagram Card
          </DivineButton>
        </div>
      </div>
    </motion.div>
  );
}

function DailyMessage({ verse, onNext }: { verse: GitaVerse; onNext: () => void }) {
  return (
    <div className="glass-card krishna-card rounded-[1.75rem] p-6" data-reveal>
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-antique/12 text-antique">
          <Flame className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-antique/72">Today&apos;s Divine Message</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Gita {verse.chapter}.{verse.verse}</h3>
        </div>
      </div>
      <p className="mt-5 text-lg font-medium leading-8 text-antique">{verse.quote}</p>
      <p className="mt-3 text-sm leading-6 text-white/66">{verse.meaning}</p>
      <DivineButton className="mt-5" onClick={onNext} variant="ghost">
        <Sparkles className="h-4 w-4" />
        Next Message
      </DivineButton>
    </div>
  );
}

function QuotesCarousel() {
  const repeated = [...wisdomQuotes, ...wisdomQuotes];

  return (
    <section className="overflow-hidden py-12" id="wisdom">
      <SectionHeading
        copy="A moving line of concise Gita-inspired reflections for quick spiritual grounding."
        eyebrow="Krishna Wisdom"
        title="Quotes That Keep The Heart Awake"
      />
      <div className="relative overflow-hidden">
        <div className="quote-track flex w-max gap-4 px-4">
          {repeated.map((quote, index) => (
            <div className="glass-card krishna-card w-[320px] rounded-2xl p-5 sm:w-[420px]" data-reveal key={`${quote.id}-${index}`}>
              <Sparkles className="mb-5 h-5 w-5 text-antique" />
              <p className="text-base leading-7 text-white/82">{quote.text}</p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-antique/66">{quote.reference}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GitaReader() {
  const [activeChapter, setActiveChapter] = useState(2);
  const [openVerse, setOpenVerse] = useState<string | null>("2-47");
  const [bookmarks, setBookmarks] = useState<string[]>(() => readStoredArray<string>("krishna-ai-bookmarks"));

  function toggleBookmark(id: string) {
    setBookmarks((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      window.localStorage.setItem("krishna-ai-bookmarks", JSON.stringify(next));
      return next;
    });
  }

  const chapter = chapters.find((item) => item.number === activeChapter) ?? chapters[1];

  return (
    <section className="px-4 py-16" id="reader">
      <SectionHeading
        copy="Chapter navigation, expandable verses, transliteration, meanings, and bookmarks for returning to the verses that speak to you."
        eyebrow="Full Gita Reading"
        title="Chapter-Wise Sacred Reader"
      />

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <div className="glass-card krishna-card rounded-[1.75rem] p-4" data-reveal>
          <div className="max-h-[640px] space-y-2 overflow-auto pr-1">
            {chapters.map((item) => (
              <button
                className={`w-full rounded-lg px-4 py-3 text-left transition ${
                  item.number === activeChapter ? "bg-antique text-night" : "bg-white/[0.045] text-white/72 hover:bg-white/[0.09]"
                }`}
                key={item.number}
                onClick={() => {
                  setActiveChapter(item.number);
                  setOpenVerse(item.verses[0]?.id ?? null);
                }}
                type="button"
              >
                <span className="block text-xs font-semibold uppercase tracking-[0.18em]">Chapter {item.number}</span>
                <span className="mt-1 block text-sm font-semibold">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card krishna-card rounded-[1.75rem] p-5 md:p-7" data-reveal>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-antique/72">Chapter {chapter.number}</p>
            <h3 className="mt-2 text-3xl font-semibold text-white">{chapter.title}</h3>
            <p className="mt-3 text-sm leading-6 text-white/66">{chapter.summary}</p>
          </div>

          {chapter.verses.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-6 text-sm text-white/66">
              This chapter is ready for the complete verse import. Add more verses to <code className="text-antique">lib/gita-data.ts</code> and they will appear here automatically.
            </div>
          ) : (
            <div className="space-y-3">
              {chapter.verses.map((verse) => {
                const isOpen = openVerse === verse.id;
                const isBookmarked = bookmarks.includes(verse.id);

                return (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045]" key={verse.id}>
                    <div className="flex items-center gap-2 p-4">
                      <button
                        className="flex flex-1 items-center justify-between gap-3 text-left"
                        onClick={() => setOpenVerse(isOpen ? null : verse.id)}
                        type="button"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-white">Verse {verse.chapter}.{verse.verse}</span>
                          <span className="mt-1 block text-xs text-white/50">{verse.tags.slice(0, 4).join(" / ")}</span>
                        </span>
                        <ChevronDown className={`h-5 w-5 shrink-0 text-antique transition ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      <button
                        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark verse"}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-night/44 text-antique transition hover:bg-antique/12"
                        onClick={() => toggleBookmark(verse.id)}
                        type="button"
                      >
                        {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          animate={{ height: "auto", opacity: 1 }}
                          className="overflow-hidden"
                          exit={{ height: 0, opacity: 0 }}
                          initial={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                        >
                          <div className="border-t border-white/10 p-4">
                            <p className="text-lg font-semibold leading-8 text-antique">{verse.sanskrit}</p>
                            <p className="mt-3 text-sm italic leading-6 text-white/58">{verse.transliteration}</p>
                            <p className="mt-4 text-sm leading-7 text-white/76">{verse.meaning}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  return <GalleryManager />;
}

function MeditationModal({
  open,
  onClose,
  onStartAudio
}: {
  open: boolean;
  onClose: () => void;
  onStartAudio: () => void;
}) {
  const [minutes, setMinutes] = useState(5);
  const [remaining, setRemaining] = useState(5 * 60);
  const [running, setRunning] = useState(false);

  function selectMinutes(value: number) {
    const safeValue = Math.max(1, Math.min(60, value || 1));
    setMinutes(safeValue);
    if (!running) {
      setRemaining(safeValue * 60);
    }
  }

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  const formatted = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/86 p-3 backdrop-blur-xl"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            animate={{ scale: 1, y: 0 }}
            className="relative h-[86vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-antique/18 bg-night shadow-divine"
            initial={{ scale: 0.96, y: 28 }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          >
            <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" src="/assets/user-media/krishna-cosmic-blue.jpg" />
            <div className="absolute inset-0 bg-radial-aura" />
            <button
              aria-label="Close meditation"
              className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-lg border border-white/14 bg-black/42 text-white backdrop-blur"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.34em] text-antique/72">Meditation Mode</p>
              <h3 className="gold-text text-4xl font-semibold md:text-6xl">Enter The Inner Temple</h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
                OM ambience begins when you start. Let the breath become slow, the body become still, and the mind return gently.
              </p>

              <div className="relative my-8 grid h-72 w-72 place-items-center">
                <div className="breathing absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(246,208,122,0.35),transparent_65%)]" />
                <div className="mandala-ring absolute inset-2 rounded-full border border-dashed border-antique/40" />
                <div className="mandala-ring-reverse absolute inset-12 rounded-full border border-peacock/28" />
                <div className="grid h-40 w-40 place-items-center rounded-full border border-antique/40 bg-night/70 shadow-divine">
                  <span className="text-5xl font-semibold text-antique">ॐ</span>
                </div>
              </div>

              <div className="text-6xl font-semibold tabular-nums text-white md:text-7xl">{formatted}</div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {[1, 5, 10].map((value) => (
                  <button
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${minutes === value ? "bg-antique text-night" : "border border-white/14 bg-white/[0.06] text-white"}`}
                    key={value}
                    onClick={() => selectMinutes(value)}
                    type="button"
                  >
                    {value} min
                  </button>
                ))}
                <label className="flex items-center gap-2 rounded-lg border border-white/14 bg-white/[0.06] px-3 py-2 text-sm text-white/72">
                  Custom
                  <input
                    className="w-16 rounded-md border border-white/10 bg-night/70 px-2 py-1 text-white outline-none focus:border-antique"
                    max={60}
                    min={1}
                    onChange={(event) => selectMinutes(Number(event.target.value))}
                    type="number"
                    value={minutes}
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <DivineButton
                  onClick={() => {
                    onStartAudio();
                    setRunning((current) => !current);
                  }}
                >
                  {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {running ? "Pause Meditation" : "Start Meditation"}
                </DivineButton>
                <DivineButton
                  onClick={() => {
                    setRunning(false);
                    setRemaining(minutes * 60);
                  }}
                  variant="ghost"
                >
                  Reset Timer
                </DivineButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GrowthSystem() {
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<GrowthEntry[]>([]);
  const [moodBefore, setMoodBefore] = useState(3);
  const [moodAfter, setMoodAfter] = useState(4);
  const [minutes, setMinutes] = useState(5);
  const [reflection, setReflection] = useState("");
  const [lesson, setLesson] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    setEntries(readStoredArray<GrowthEntry>("krishna-ai-growth"));
    setNow(Date.now());
    setMounted(true);
  }, []);

  function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entry: GrowthEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      moodBefore,
      moodAfter,
      meditationMinutes: minutes,
      reflection: reflection.trim(),
      lesson: lesson.trim()
    };
    const next = [entry, ...entries].slice(0, 28);
    setEntries(next);
    window.localStorage.setItem("krishna-ai-growth", JSON.stringify(next));
    setReflection("");
    setLesson("");
  }

  const weekly = useMemo(() => {
    const since = now - 7 * 24 * 60 * 60 * 1000;
    const week = entries.filter((entry) => new Date(entry.date).getTime() >= since);
    const meditation = week.reduce((total, entry) => total + entry.meditationMinutes, 0);
    const uplift = week.reduce((total, entry) => total + (entry.moodAfter - entry.moodBefore), 0);
    return { count: week.length, meditation, uplift };
  }, [entries, now]);

  return (
    <section className="px-4 py-16" id="growth">
      <SectionHeading
        copy="Track reflection, mood shifts, meditation time, and lessons learned so guidance becomes lived transformation."
        eyebrow="Personal Growth"
        title="Weekly Dharma Dashboard"
      />

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <form className="glass-card krishna-card rounded-[1.75rem] p-6" data-reveal onSubmit={saveEntry}>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/46">Mood Before</span>
              <input className="mt-4 w-full accent-antique" max={5} min={1} onChange={(event) => setMoodBefore(Number(event.target.value))} type="range" value={moodBefore} />
              <span className="mt-2 block text-sm text-antique">{moodLabels[moodBefore - 1]}</span>
            </label>
            <label className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/46">Mood After</span>
              <input className="mt-4 w-full accent-antique" max={5} min={1} onChange={(event) => setMoodAfter(Number(event.target.value))} type="range" value={moodAfter} />
              <span className="mt-2 block text-sm text-antique">{moodLabels[moodAfter - 1]}</span>
            </label>
            <label className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/46">Meditation</span>
              <input className="mt-4 w-full rounded-lg border border-white/10 bg-night/62 px-3 py-2 text-white outline-none focus:border-antique" min={0} onChange={(event) => setMinutes(Number(event.target.value))} type="number" value={minutes} />
              <span className="mt-2 block text-sm text-antique">minutes</span>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/46">Daily Reflection</span>
            <textarea
              className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-night/62 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-white/36 focus:border-antique"
              onChange={(event) => setReflection(event.target.value)}
              placeholder="What did I feel today, and where did I need guidance?"
              required
              value={reflection}
            />
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/46">Lesson Learned</span>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-night/62 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/36 focus:border-antique"
              onChange={(event) => setLesson(event.target.value)}
              placeholder="One lesson Krishna helped me see..."
              required
              value={lesson}
            />
          </label>

          <DivineButton className="mt-5" type="submit">
            <Heart className="h-4 w-4" />
            Save Reflection
          </DivineButton>
        </form>

        <div className="glass-card krishna-card rounded-[1.75rem] p-6" data-reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/44">Entries</p>
              <p className="mt-2 text-3xl font-semibold text-antique" suppressHydrationWarning>
                {mounted ? weekly.count : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/44">Meditation</p>
              <p className="mt-2 text-3xl font-semibold text-antique" suppressHydrationWarning>
                {mounted ? `${weekly.meditation}m` : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/44">Mood Lift</p>
              <p className="mt-2 text-3xl font-semibold text-antique" suppressHydrationWarning>
                {mounted ? `+${weekly.uplift}` : "—"}
              </p>
            </div>
          </div>

          <div className="mt-5 max-h-[380px] space-y-3 overflow-auto pr-1">
            {entries.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 text-sm leading-6 text-white/62">
                No reflections yet. Save your first entry after guidance or meditation.
              </div>
            ) : (
              entries.map((entry) => (
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4" key={entry.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{new Date(entry.date).toLocaleDateString()}</p>
                    <p className="text-xs text-antique">
                      Mood {entry.moodBefore} to {entry.moodAfter} / {entry.meditationMinutes}m
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/68">{entry.lesson}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeedbackSection() {
  const [success, setSuccess] = useState(false);

  function handleFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setSuccess(true);
  }

  return (
    <section className="relative z-10 px-4 py-16" id="feedback">
      <SectionHeading
        copy="Share what felt helpful, what felt unclear, or what would make the guidance more useful for daily life."
        eyebrow="Feedback"
        title="Help Geeta AI Become More Useful"
      />
      <form className="glass-card krishna-card mx-auto max-w-3xl rounded-[1.75rem] p-6" data-reveal data-testid="feedback-form" onSubmit={handleFeedback}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/48">Name</span>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-night/62 p-4 text-sm text-white outline-none transition placeholder:text-white/36 focus:border-antique focus:ring-4 focus:ring-antique/10"
              maxLength={80}
              name="name"
              placeholder="Your name"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/48">Topic</span>
            <select
              className="mt-2 w-full rounded-2xl border border-white/10 bg-night/62 p-4 text-sm text-white outline-none transition placeholder:text-white/36 focus:border-antique focus:ring-4 focus:ring-antique/10"
              defaultValue="experience"
              name="topic"
            >
              <option value="experience">Experience</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
              <option value="guidance">Guidance</option>
            </select>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/48">Message</span>
          <textarea
            className="mt-2 min-h-36 w-full resize-y rounded-2xl border border-white/10 bg-night/62 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-white/36 focus:border-antique focus:ring-4 focus:ring-antique/10"
            maxLength={900}
            name="message"
            placeholder="Tell us what should feel calmer, clearer, or more personal."
            required
          />
        </label>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <DivineButton type="submit">
            <Send className="h-4 w-4" />
            Submit Feedback
          </DivineButton>
          {success && (
            <p className="rounded-full border border-peacock/25 bg-peacock/10 px-4 py-2 text-sm font-semibold text-peacock" role="status">
              Feedback received. Thank you.
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

function ProfileSection() {
  const [profile, setProfile] = useState<ProfileForm>(() => readStoredProfile());
  const [saved, setSaved] = useState(false);
  const [userProfile, setUserProfile] = useState<{ fullName?: string; profilePicture?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("krishna-ai-user-profile");
      if (raw) setUserProfile(JSON.parse(raw) as { fullName?: string; profilePicture?: string });
    } catch { /* ignore */ }
  }, []);

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem("krishna-ai-profile", JSON.stringify(profile));
    setSaved(true);
  }

  return (
    <section className="relative z-10 px-4 py-16" id="profile">
      <SectionHeading
        copy="Personalise your Geeta AI experience and manage your full account details."
        eyebrow="Profile"
        title="Experience Preferences"
      />

      {/* Full Profile Link Card */}
      <div className="mx-auto mb-8 max-w-4xl">
        <Link href="/profile">
          <motion.div
            className="glass-card krishna-card flex items-center justify-between rounded-[1.75rem] p-5 cursor-pointer"
            data-reveal
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-yellow-400/30">
                {userProfile?.profilePicture ? (
                  <img alt="Profile" className="h-full w-full object-cover" src={userProfile.profilePicture} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-yellow-400/10 text-2xl">🕉️</div>
                )}
              </div>
              <div>
                <p className="font-semibold text-white">{userProfile?.fullName ?? "Set up your profile"}</p>
                <p className="text-sm text-white/50">Manage name, email, photo, password, Google Sign-In</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
              <ExternalLink className="h-4 w-4" /> Full Profile
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Preferences form */}
      <form className="glass-card krishna-card mx-auto max-w-4xl rounded-[1.75rem] p-6" data-reveal data-testid="profile-form" onSubmit={saveProfile}>
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-antique/20 bg-antique/10 text-antique">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Guidance Style</h3>
            <p className="mt-1 text-sm text-white/58">Saved locally without contact details.</p>
          </div>
        </div>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/48">Preferences</span>
          <textarea
            className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-night/62 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-white/36 focus:border-antique focus:ring-4 focus:ring-antique/10"
            maxLength={700}
            onChange={(event) => setProfile((current) => ({ ...current, preferences: event.target.value }))}
            placeholder="Voice, ambience, guidance tone, meditation style..."
            value={profile.preferences}
          />
        </label>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <DivineButton type="submit">
            <Save className="h-4 w-4" />
            Save Preferences
          </DivineButton>
          {saved && (
            <p className="rounded-full border border-antique/20 bg-antique/10 px-4 py-2 text-sm font-semibold text-antique" role="status">
              Preferences saved.
            </p>
          )}
        </div>
      </form>
    </section>
  );
}


// ─── Quiz Data ────────────────────────────────────────────────────────────────

// ─── Quiz Data ────────────────────────────────────────────────────────────────
type QuizOption = { id: string; text: string };
type QuizQuestion = { id: string; question: string; options: QuizOption[]; correctId: string; explanation: string; verse: string; };
type QuizCategory = { id: string; title: string; icon: string; color: string; premium: boolean; questions: QuizQuestion[]; };

const quizCategories: QuizCategory[] = [
  {
    id: "karma",
    title: "Karma Yoga",
    icon: "⚡",
    color: "antique",
    premium: false,
    questions: [
      {
        id: "k1",
        question: "What does Krishna say is our right in Bhagavad Gita 2.47?",
        options: [
          { id: "a", text: "The right to enjoy the fruits of our actions" },
          { id: "b", text: "The right to action, never to its fruits" },
          { id: "c", text: "The right to choose between action and inaction" },
          { id: "d", text: "The right to seek rewards from the Divine" }
        ],
        correctId: "b",
        explanation: "Krishna teaches: perform your duty without attachment to results. Your right is only to act — not to the fruit of action.",
        verse: "Gita 2.47"
      },
      {
        id: "k2",
        question: "Which yoga is described as the 'Yoga of Action' in the Bhagavad Gita?",
        options: [
          { id: "a", text: "Jnana Yoga" },
          { id: "b", text: "Bhakti Yoga" },
          { id: "c", text: "Karma Yoga" },
          { id: "d", text: "Dhyana Yoga" }
        ],
        correctId: "c",
        explanation: "Karma Yoga (Chapter 3) is the path of selfless action — performing duties without ego or attachment to results.",
        verse: "Gita Chapter 3"
      },
      {
        id: "k3",
        question: "In Gita 3.8, Krishna says action is better than what?",
        options: [
          { id: "a", text: "Devotion" },
          { id: "b", text: "Knowledge" },
          { id: "c", text: "Inaction" },
          { id: "d", text: "Renunciation" }
        ],
        correctId: "c",
        explanation: "Perform your prescribed duty, for action is better than inaction. Even the maintenance of your body requires action.",
        verse: "Gita 3.8"
      },
      {
        id: "k4",
        question: "What is 'Nishkama Karma'?",
        options: [
          { id: "a", text: "Action done with desire" },
          { id: "b", text: "Renunciation of all action" },
          { id: "c", text: "Desireless action — acting without attachment to results" },
          { id: "d", text: "Action done for God alone" }
        ],
        correctId: "c",
        explanation: "Nishkama Karma means acting without desire for the fruits — the core teaching of Karma Yoga.",
        verse: "Gita 3.19"
      },
      {
        id: "k5",
        question: "According to Gita 3.27, who is deluded into thinking 'I am the doer'?",
        options: [
          { id: "a", text: "The wise seer" },
          { id: "b", text: "The one ignorant of the gunas" },
          { id: "c", text: "The devoted one" },
          { id: "d", text: "The renunciant" }
        ],
        correctId: "b",
        explanation: "All actions are performed by the three modes of material nature. The deluded — ignorant of the gunas — think themselves the doer.",
        verse: "Gita 3.27"
      }
    ]
  },
  {
    id: "bhakti",
    title: "Bhakti Yoga",
    icon: "🙏",
    color: "peacock",
    premium: false,
    questions: [
      {
        id: "b1",
        question: "What does Krishna promise to devotees in Gita 9.22?",
        options: [
          { id: "a", text: "He will give them wealth and success" },
          { id: "b", text: "He carries what they lack and preserves what they have" },
          { id: "c", text: "He will protect them from all enemies" },
          { id: "d", text: "He will grant them liberation immediately" }
        ],
        correctId: "b",
        explanation: "For those who worship Me with devotion, I carry what they lack and preserve what they have — a personal divine covenant.",
        verse: "Gita 9.22"
      },
      {
        id: "b2",
        question: "In Gita 9.26, what offering does Krishna say He will accept?",
        options: [
          { id: "a", text: "Gold, silver, and precious gems" },
          { id: "b", text: "A leaf, flower, fruit, or water offered with love" },
          { id: "c", text: "Grand temple ceremonies" },
          { id: "d", text: "Years of meditation and austerity" }
        ],
        correctId: "b",
        explanation: "If one offers Me with love a leaf, flower, fruit, or water — I accept it. What matters is the love, not the grandeur.",
        verse: "Gita 9.26"
      },
      {
        id: "b3",
        question: "What is the first quality of a devotee dear to Krishna (Gita 12.13)?",
        options: [
          { id: "a", text: "Great intelligence and scholarship" },
          { id: "b", text: "Non-hatred toward all beings" },
          { id: "c", text: "Perfect adherence to ritual" },
          { id: "d", text: "Physical renunciation" }
        ],
        correctId: "b",
        explanation: "One who is not hateful toward any being, who is friendly and compassionate — such a devotee is very dear to Me.",
        verse: "Gita 12.13"
      },
      {
        id: "b4",
        question: "What is the final instruction Krishna gives in Gita 18.65?",
        options: [
          { id: "a", text: "Renounce family and become a monk" },
          { id: "b", text: "Study all scriptures and perform rituals" },
          { id: "c", text: "Fix your mind on Me, be devoted to Me — you are dear to Me" },
          { id: "d", text: "Follow your caste duty perfectly" }
        ],
        correctId: "c",
        explanation: "Fix your mind on Me, be devoted to Me, worship Me — so shall you come to Me. I promise you truly, for you are dear to Me.",
        verse: "Gita 18.65"
      },
      {
        id: "b5",
        question: "What is the core message of Gita 18.66?",
        options: [
          { id: "a", text: "Fight the battle and claim your kingdom" },
          { id: "b", text: "Follow your own dharma above all else" },
          { id: "c", text: "Surrender to Me alone — I will free you from all sins" },
          { id: "d", text: "Renounce all actions and become a monk" }
        ],
        correctId: "c",
        explanation: "Abandon all varieties of religion and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.",
        verse: "Gita 18.66"
      }
    ]
  },
  {
    id: "jnana",
    title: "Jnana Yoga",
    icon: "📖",
    color: "lotus",
    premium: true,
    questions: []
  },
  {
    id: "dhyana",
    title: "Dhyana Yoga",
    icon: "🧘",
    color: "peacock",
    premium: true,
    questions: []
  },
  {
    id: "atma",
    title: "Self-Knowledge",
    icon: "✨",
    color: "antique",
    premium: true,
    questions: []
  }
];

function QuizModal({ category, onClose }: { category: QuizCategory; onClose: () => void }) {
  const questions = category.questions;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const question = questions[current];
  const isAnswered = !!answered[question?.id];
  const chosenId = answered[question?.id] ?? selected;
  const isCorrect = chosenId === question?.correctId;
  const score = questions.filter((q) => answered[q.id] === q.correctId).length;
  const progress = ((current + (isAnswered ? 1 : 0)) / questions.length) * 100;

  function handleNext() {
    if (current < questions.length - 1) { setCurrent((c) => c + 1); setSelected(null); }
    else setShowResult(true);
  }

  function handleRestart() { setCurrent(0); setSelected(null); setAnswered({}); setShowResult(false); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-night/82 backdrop-blur-md" onClick={onClose} />
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-antique/20 bg-[#0b0718] shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        style={{ maxHeight: "88vh" }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-antique/72">{category.icon} {category.title}</p>
            <p className="mt-0.5 text-sm text-white/50">{questions.length} Questions</p>
          </div>
          <button className="rounded-xl border border-white/12 px-4 py-2 text-sm text-white/60 hover:text-white transition" onClick={onClose} type="button">✕ Close</button>
        </div>

        <div className="overflow-y-auto p-6 md:p-8" style={{ flex: 1 }}>
          {showResult ? (
            <motion.div animate={{ opacity: 1, y: 0 }} className="text-center" initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.5 }}>
              <ChakraMark />
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-antique/75">Quiz Complete</p>
              <h3 className="mt-3 text-5xl font-bold text-white">{score} <span className="text-antique/60 text-3xl">/ {questions.length}</span></h3>
              <p className="mt-4 text-base leading-7 text-white/65 max-w-lg mx-auto">
                {score === questions.length ? "Perfect! Your Gita wisdom shines bright. Krishna is pleased." :
                 score >= Math.floor(questions.length * 0.6) ? "Well done, seeker. Reflect on the verses you missed." :
                 "Every question missed is a verse waiting to be read. Study and return."}
              </p>
              <div className="mt-8 space-y-2 text-left">
                {questions.map((q, idx) => {
                  const correct = answered[q.id] === q.correctId;
                  return (
                    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${correct ? "border border-peacock/25 bg-peacock/8 text-peacock" : "border border-red-300/18 bg-red-500/8 text-red-200"}`} key={q.id}>
                      <span className="shrink-0 font-bold">{correct ? "✓" : "✗"}</span>
                      <span className="text-white/70">Q{idx + 1}:</span>
                      <span className="truncate">{q.question.slice(0, 55)}…</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <DivineButton onClick={handleRestart}><Sparkles className="h-4 w-4" />Retake Quiz</DivineButton>
                <DivineButton onClick={onClose} variant="ghost">Close</DivineButton>
              </div>
            </motion.div>
          ) : (
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 16 }} key={question.id} transition={{ duration: 0.4 }}>
              {/* Progress */}
              <div className="mb-6 flex items-center gap-4">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-antique transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-white/46">{current + 1} / {questions.length}</span>
              </div>
              {/* Question */}
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-antique/65">{question.verse}</p>
                <h3 className="mt-3 text-xl font-semibold leading-8 text-white md:text-2xl">{question.question}</h3>
              </div>
              {/* Options */}
              <div className="grid gap-3 md:grid-cols-2">
                {question.options.map((opt) => {
                  const isSel = chosenId === opt.id;
                  const isCorrectOpt = opt.id === question.correctId;
                  let cls = "relative flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 text-sm leading-6 transition-all text-left w-full ";
                  if (!isAnswered) cls += isSel ? "border-antique/70 bg-antique/12 text-white" : "border-white/10 bg-white/[0.04] text-white/78 hover:border-antique/40 hover:bg-antique/7";
                  else if (isCorrectOpt) cls += "border-peacock/40 bg-peacock/10 text-peacock";
                  else if (isSel) cls += "border-red-400/40 bg-red-500/10 text-red-200";
                  else cls += "border-white/6 bg-white/[0.03] text-white/36";
                  return (
                    <button className={cls} disabled={isAnswered} key={opt.id} onClick={() => !isAnswered && setSelected(opt.id)} type="button">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${isAnswered && isCorrectOpt ? "border-peacock bg-peacock text-night" : isAnswered && isSel ? "border-red-400 text-red-200" : isSel ? "border-antique bg-antique text-night" : "border-white/30 text-white/50"}`}>
                        {isAnswered && isCorrectOpt ? "✓" : isAnswered && isSel && !isCorrectOpt ? "✗" : opt.id.toUpperCase()}
                      </span>
                      <span className="flex-1 text-left">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
              {/* Explanation */}
              {isAnswered && (
                <motion.div animate={{ opacity: 1, height: "auto" }} className="mt-5 overflow-hidden" initial={{ opacity: 0, height: 0 }} transition={{ duration: 0.45 }}>
                  <div className={`rounded-2xl border p-4 ${isCorrect ? "border-peacock/25 bg-peacock/[0.08]" : "border-red-300/20 bg-red-500/[0.07]"}`}>
                    <p className={`mb-1 text-xs font-semibold uppercase tracking-[0.22em] ${isCorrect ? "text-peacock/80" : "text-red-300/80"}`}>{isCorrect ? "Correct ✓" : "The right answer"}</p>
                    <p className="text-sm leading-6 text-white/78">{question.explanation}</p>
                  </div>
                </motion.div>
              )}
              {/* Actions */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {!isAnswered ? (
                  <DivineButton disabled={!selected} onClick={() => { if (selected) setAnswered((p) => ({ ...p, [question.id]: selected })); setSelected(null); }}>
                    <Shield className="h-4 w-4" />Confirm Answer
                  </DivineButton>
                ) : (
                  <DivineButton onClick={handleNext}>
                    <Sparkles className="h-4 w-4" />{current < questions.length - 1 ? "Next Question" : "See Results"}
                  </DivineButton>
                )}
                <span className="text-xs text-white/40">Score: {score} / {Object.keys(answered).length}</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function QuizSection() {
  const [activeCategory, setActiveCategory] = useState<QuizCategory | null>(null);

  return (
    <section className="relative z-10 px-4 py-16" id="quiz">
      <SectionHeading
        eyebrow="Gita Knowledge Quiz"
        title="Test Your Bhagavad Gita Wisdom"
        copy="Choose a category and dive deep into Krishna's eternal teachings. Free categories available now — premium unlocks advanced wisdom."
      />

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quizCategories.map((cat) => (
            <motion.div
              className={`glass-card krishna-card relative flex flex-col overflow-hidden rounded-[1.75rem] p-6 ${cat.premium ? "opacity-85" : ""}`}
              data-reveal
              key={cat.id}
              whileHover={{ scale: 1.015, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              {cat.premium && (
                <div className="absolute right-4 top-4 rounded-full border border-antique/40 bg-antique/12 px-2.5 py-1 text-xs font-bold text-antique">
                  👑 Premium
                </div>
              )}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-antique/10 text-2xl border border-antique/20">
                {cat.icon}
              </div>
              <h3 className="text-xl font-semibold text-white">{cat.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-white/58">
                {cat.premium ? "Advanced questions unlock with a premium subscription. Coming soon." : `${cat.questions.length} questions on the path of ${cat.title}.`}
              </p>
              <div className="mt-5">
                {cat.premium ? (
                  <button className="w-full rounded-xl border border-white/12 py-3 text-sm font-semibold text-white/50 transition cursor-not-allowed" disabled type="button">
                    🔒 Unlock Premium
                  </button>
                ) : (
                  <DivineButton className="w-full justify-center" onClick={() => setActiveCategory(cat)}>
                    <Sparkles className="h-4 w-4" />Start Quiz
                  </DivineButton>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {activeCategory && (
        <QuizModal category={activeCategory} onClose={() => setActiveCategory(null)} />
      )}
    </section>
  );
}

export default function GeetaAiApp() {
  const [query, setQuery] = useState("");
  const [selectedSituation, setSelectedSituation] = useState<SituationKey | "">("");
  const [response, setResponse] = useState<GuidanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [omEnabled, setOmEnabled] = useState(true);
  const [fluteEnabled, setFluteEnabled] = useState(false);
  const [omVolume, setOmVolume] = useState(0.34);
  const [fluteVolume, setFluteVolume] = useState(0.22);
  const [dailyVerse, setDailyVerse] = useState<GitaVerse>(() => getDailyVerse());
  const [meditationOpen, setMeditationOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { fluteStatus, omStatus } = useSacredAudio({ fluteEnabled, fluteVolume, omEnabled, omVolume });
  useRevealAnimations(response?.verse.id ?? "initial");

  async function handleAsk(event?: FormEvent<HTMLFormElement>, situationOverride?: SituationKey) {
    event?.preventDefault();
    const activeQuery = situationOverride
      ? `I need guidance for ${situationMap[situationOverride].label.toLowerCase()}. ${situationMap[situationOverride].mantra}`
      : query;

    if (activeQuery.trim().length < 2) {
      setError("Please write at least a word or two so the guidance can be meaningful.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const guidanceResponse = await fetch("/api/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: activeQuery, situation: situationOverride || selectedSituation || undefined })
      });

      if (!guidanceResponse.ok) {
        const data = (await guidanceResponse.json()) as { error?: string };
        throw new Error(data.error || "Guidance could not be generated.");
      }

      const data = (await guidanceResponse.json()) as GuidanceResponse & { isLowConfidence?: boolean };
      setResponse(data);
      setQuery(situationOverride ? activeQuery : query);

      // Show soft notification for low-confidence / missing content
      if (data.isLowConfidence) {
        setError("⚠️ We found a partial match for your question. This topic will be added to our verse library soon — we will update you!");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }


  async function playGuidance() {
    if (!response) {
      return;
    }

    setOmEnabled(true);
    setIsSpeaking(true);
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();

    try {
      const ttsResponse = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: response.audioScript })
      });

      const contentType = ttsResponse.headers.get("Content-Type") || "";
      if (ttsResponse.ok && contentType.includes("audio")) {
        const blob = await ttsResponse.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = 0.9;
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => setIsSpeaking(false);
        audioRef.current = audio;
        await audio.play();
        return;
      }
    } catch {
      // Browser speech fallback below keeps the product usable without paid keys.
    }

    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(response.audioScript);
      utterance.rate = 0.78;
      utterance.pitch = 0.72;
      utterance.volume = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
      setError("Voice playback is not supported in this browser.");
    }
  }

  function pauseGuidance() {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }

  function shareWhatsApp() {
    const verse = response?.verse ?? dailyVerse;
    const text = `Krishna message for today: ${verse.quote} - Bhagavad Gita ${verse.chapter}.${verse.verse}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  function downloadShareCard() {
    const verse = response?.verse ?? dailyVerse;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, "#05020d");
    gradient.addColorStop(0.45, "#25104b");
    gradient.addColorStop(1, "#0a0614");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = "rgba(246, 208, 122, 0.18)";
    ctx.beginPath();
    ctx.arc(820, 260, 260, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(246, 208, 122, 0.45)";
    ctx.lineWidth = 3;
    ctx.strokeRect(70, 70, 940, 1210);
    ctx.fillStyle = "#f6d07a";
    ctx.font = "700 52px Segoe UI, sans-serif";
    ctx.fillText("GEETA AI", 110, 170);
    ctx.font = "700 42px Segoe UI, sans-serif";
    ctx.fillText(`Bhagavad Gita ${verse.chapter}.${verse.verse}`, 110, 270);
    ctx.fillStyle = "#fff7df";
    ctx.font = "600 48px Segoe UI, sans-serif";

    const words = verse.quote.split(" ");
    let line = "";
    let y = 430;
    words.forEach((word) => {
      const test = `${line}${word} `;
      if (ctx.measureText(test).width > 810) {
        ctx.fillText(line.trim(), 110, y);
        line = `${word} `;
        y += 66;
      } else {
        line = test;
      }
    });
    ctx.fillText(line.trim(), 110, y);

    ctx.fillStyle = "rgba(255, 247, 223, 0.72)";
    ctx.font = "400 32px Segoe UI, sans-serif";
    ctx.fillText("A daily divine reflection for courage, calm, and dharma.", 110, 1170);

    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = "krishna-ai-message.png";
    anchor.click();
  }

  const situationEntries = Object.entries(situationMap) as Array<[SituationKey, (typeof situationMap)[SituationKey]]>;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <img alt="" className="h-full w-full scale-105 object-cover opacity-100" src="/krishna-bg.jpg" />
        <div className="absolute inset-0 bg-gradient-to-b from-night/40 via-night/60 to-night/80" />
        <div className="float-light absolute left-[8%] top-[18%] h-28 w-28 rounded-full bg-antique/18 blur-3xl" />
        <div className="float-light absolute right-[12%] top-[22%] h-36 w-36 rounded-full bg-lotus/20 blur-3xl [animation-delay:1.4s]" />
        <div className="float-light absolute bottom-[18%] left-[18%] h-32 w-32 rounded-full bg-peacock/16 blur-3xl [animation-delay:2.4s]" />
      </div>
      <div className="sacred-particle-layer" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            className="sacred-particle"
            key={index}
            style={{
              animationDelay: `${index * 0.72}s`,
              left: `${7 + ((index * 17) % 88)}%`,
              top: `${18 + ((index * 23) % 74)}%`
            }}
          />
        ))}
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-night/58 backdrop-blur-2xl">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 lg:pr-4">
          <a className="flex min-w-0 items-center gap-3" href="#top">
            <ChakraMark compact />
            <span>
              <span className="block text-base font-semibold tracking-[0.18em] text-white">GEETA AI</span>
              <span className="hidden text-xs uppercase tracking-[0.26em] text-antique/64 sm:block">Divine Life Guidance</span>
            </span>
          </a>

          <nav className="hidden items-center justify-end gap-1 lg:flex xl:gap-2" aria-label="Primary navigation">
            {navItems.map((item) => (
              <a className="rounded-lg px-3 py-2 text-sm font-medium text-white/66 transition hover:bg-white/[0.07] hover:text-white" href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
            <UserMenu />
          </nav>

          <button
            aria-label="Toggle navigation"
            className="mobile-nav-toggle absolute right-4 top-4 z-50 grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-antique/35 bg-antique/10 text-antique shadow-divine backdrop-blur lg:hidden"
            onClick={() => setMobileNavOpen((current) => !current)}
            type="button"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.nav
              animate={{ height: "auto", opacity: 1 }}
              className="overflow-hidden border-t border-white/10 lg:hidden"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="grid gap-2 px-4 py-3">
                {navItems.map((item) => (
                  <a
                    className="rounded-lg bg-white/[0.05] px-3 py-3 text-sm font-medium text-white/74"
                    href={item.href}
                    key={item.href}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="pt-1">
                  <UserMenu />
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <section className="relative z-10 px-4 pb-12 pt-10 md:pb-20 md:pt-16" id="top">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="hero-arrival min-w-0">
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-antique/20 bg-antique/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-antique sm:tracking-[0.2em]">
              <Sparkles className="h-4 w-4" />
              <span className="sm:hidden">Voice and Gita wisdom</span>
              <span className="hidden sm:inline">Voice, avatar, meditation, and Gita wisdom</span>
            </div>
            <h1 className="gold-text max-w-5xl text-5xl font-semibold leading-[1.02] md:text-7xl lg:text-8xl">GEETA AI</h1>
            <p className="mt-5 max-w-[21rem] break-words text-base leading-8 text-white/72 sm:max-w-2xl sm:text-lg md:text-xl">
              Ask a life question and receive a relevant shloka, transliteration, meaning, personal guidance, practical advice, sacred voice playback, and immersive meditation support.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ["24", "Gita insights"],
                ["5", "Situation paths"],
                ["∞", "Inner returns"]
              ].map(([value, label]) => (
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4" key={label}>
                  <p className="text-3xl font-semibold text-antique">{value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/48">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <DailyMessage verse={dailyVerse} onNext={() => setDailyVerse((current) => getNextVerse(current.id))} />
        </div>
      </section>

      <section className="relative z-10 px-4 py-12" id="ask">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1fr_0.92fr]">
          <div className="space-y-6">
            <form className="glass-card krishna-card rounded-[1.75rem] p-6" data-reveal onSubmit={handleAsk}>
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-lotus/14 text-aura">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-antique/72">Ask Krishna Anything</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">Share what is heavy in your heart</h2>
                </div>
              </div>

              <textarea
                className="min-h-40 w-full resize-y rounded-2xl border border-white/12 bg-night/68 p-4 text-base leading-7 text-white outline-none transition placeholder:text-white/36 focus:border-antique focus:ring-4 focus:ring-antique/10"
                maxLength={1200}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Example: Krishna, I am afraid of failing my career and I keep overthinking every decision..."
                value={query}
              />


              {/* Emotion mood tags */}
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/40">How are you feeling?</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { emoji: "😊", label: "Happy", q: "I am feeling happy and want to stay positive, grow, and deepen my spiritual practice." },
                    { emoji: "😢", label: "Sad", q: "I am feeling very sad and need comfort, inner strength, and hope to carry on." },
                    { emoji: "😰", label: "Anxious", q: "I am feeling anxious and overthinking everything. I need peace and clarity." },
                    { emoji: "😠", label: "Angry", q: "I am feeling angry and need guidance to control my emotions and respond wisely." },
                    { emoji: "😕", label: "Confused", q: "I am confused and need clarity on my path and purpose in life." },
                    { emoji: "😔", label: "Lonely", q: "I am feeling deeply lonely and disconnected from people and purpose." },
                    { emoji: "💪", label: "Motivated", q: "I am feeling motivated and want to channel this energy into meaningful action." },
                    { emoji: "😞", label: "Hopeless", q: "I am feeling hopeless and struggling to see any way forward. I need hope." },
                    { emoji: "🙏", label: "Grateful", q: "I am feeling deeply grateful and want to deepen my devotion and spiritual practice." },
                    { emoji: "😓", label: "Stressed", q: "I am under a lot of stress and pressure from many directions. I need relief." },
                    { emoji: "😨", label: "Fearful", q: "I am afraid of the future and fear of failure is stopping me from moving forward." },
                    { emoji: "💔", label: "Heartbroken", q: "I am heartbroken from a relationship ending and need healing and wisdom." },
                    { emoji: "🌟", label: "Lost", q: "I feel lost in life and do not know my purpose or which direction to take." },
                    { emoji: "⚡", label: "Jealous", q: "I am feeling jealous and comparing myself to others and it is making me unhappy." },
                    { emoji: "🔥", label: "Negative", q: "I am stuck in negative thoughts and feelings and need to shift my state." },
                    { emoji: "☀️", label: "Positive", q: "I want to cultivate a positive mindset and live with more joy and gratitude." }
                  ].map(({ emoji, label, q }) => (
                    <button
                      className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-sm font-semibold text-white/74 transition hover:border-antique/60 hover:bg-antique/10 hover:text-white active:scale-95"
                      key={label}
                      onClick={() => setQuery(q)}
                      type="button"
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100" role="alert">
                  {error}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <DivineButton disabled={loading} type="submit">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? "Finding Shloka..." : "Receive Guidance"}
                </DivineButton>
                <DivineButton onClick={() => setMeditationOpen(true)} variant="ghost">
                  <Moon className="h-4 w-4" />
                  Start Meditation
                </DivineButton>
              </div>
            </form>

            <div className="glass-card krishna-card rounded-[1.75rem] p-5" data-reveal>
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-antique/70">Sacred Audio</p>
                <p className="mt-1 text-sm text-white/62">OM and flute are now separate, so the atmosphere can stay meditative without becoming crowded.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AudioController
                  description="Default ambience for meditation and guidance."
                  enabled={omEnabled}
                  icon={<Volume2 className="h-5 w-5" />}
                  onToggle={() => setOmEnabled((current) => !current)}
                  onVolumeChange={setOmVolume}
                  status={omStatus}
                  testId="om-audio-controller"
                  title="OM Chant"
                  volume={omVolume}
                />
                <AudioController
                  description="Optional music layer when you want a softer devotional mood."
                  enabled={fluteEnabled}
                  icon={<Wind className="h-5 w-5" />}
                  onToggle={() => setFluteEnabled((current) => !current)}
                  onVolumeChange={setFluteVolume}
                  status={fluteStatus}
                  testId="flute-audio-controller"
                  title="Flute Music"
                  volume={fluteVolume}
                />
              </div>
            </div>

            <ResponseCard
              isSpeaking={isSpeaking}
              onCard={downloadShareCard}
              onPause={pauseGuidance}
              onShare={shareWhatsApp}
              onSpeak={playGuidance}
              response={response}
            />
          </div>

          <AvatarStage isSpeaking={isSpeaking} response={response} />
        </div>
      </section>

      <section className="relative z-10 px-4 py-16" id="situations">
        <SectionHeading
          copy="Choose a situation and the app instantly asks the guidance engine with the right context."
          eyebrow="Find Guidance By Situation"
          title="Life Problems, Met With Dharma"
        />
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {situationEntries.map(([key, situation]) => (
            <button
              className="glass-card krishna-card group rounded-[1.25rem] p-5 text-left transition hover:-translate-y-1 hover:border-antique/45"
              data-reveal
              key={key}
              onClick={() => {
                setSelectedSituation(key);
                void handleAsk(undefined, key);
                document.getElementById("ask")?.scrollIntoView({ behavior: "smooth" });
              }}
              type="button"
            >
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-lg bg-antique/12 text-antique transition group-hover:bg-antique group-hover:text-night">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">{situation.label}</h3>
              <p className="mt-3 text-sm leading-6 text-white/62">{situation.mantra}</p>
            </button>
          ))}
        </div>
      </section>

      <QuotesCarousel />
      <GitaReader />

      <section className="relative z-10 px-4 py-16" id="meditation">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.85fr_1fr] lg:items-center">
          <div className="glass-card krishna-card rounded-[1.75rem] p-6" data-reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-antique/72">Immersive Practice</p>
            <h2 className="gold-text mt-3 text-4xl font-semibold md:text-5xl">Meditation Mode</h2>
            <p className="mt-4 text-sm leading-7 text-white/68">
              Open a focused 80% immersive space with a glowing mandala, OM ambience, optional flute controls, and timer presets for one, five, ten, or custom minutes.
            </p>
            <DivineButton className="mt-6" onClick={() => setMeditationOpen(true)}>
              <Timer className="h-4 w-4" />
              Start Meditation
            </DivineButton>
          </div>
          <div className="relative grid min-h-[360px] place-items-center overflow-hidden rounded-[1.75rem] border border-antique/18 bg-night/72">
            <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-28" src="/assets/user-media/krishna-cosmic-blue.jpg" />
            <div className="mandala-ring absolute h-72 w-72 rounded-full border border-dashed border-antique/36" />
            <div className="mandala-ring-reverse absolute h-48 w-48 rounded-full border border-peacock/30" />
            <div className="breathing relative grid h-36 w-36 place-items-center rounded-full bg-antique/10 text-6xl text-antique shadow-divine">ॐ</div>
          </div>
        </div>
      </section>

      <Gallery />
      <GrowthSystem />
      <FeedbackSection />
      <ProfileSection />
      <QuizSection />

      <footer className="relative z-10 border-t border-white/10 px-4 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-white/54 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ChakraMark compact />
            <span>GEETA AI - Divine Life Guidance System</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <a className="hover:text-antique" href="#ask">
              Ask
            </a>
            <a className="hover:text-antique" href="#reader">
              Gita Reader
            </a>
            <a className="hover:text-antique" href="#growth">
              Growth
            </a>
            <a className="hover:text-antique" href="#feedback">
              Feedback
            </a>
            <a className="hover:text-antique" href="#profile">
              Profile
            </a>
            <a className="hover:text-antique" href="#quiz">
              Quiz
            </a>
          </div>
        </div>
      </footer>

      <MeditationModal
        onClose={() => setMeditationOpen(false)}
        onStartAudio={() => {
          setOmEnabled(true);
          setFluteEnabled(false);
        }}
        open={meditationOpen}
      />
    </main>
  );
}
