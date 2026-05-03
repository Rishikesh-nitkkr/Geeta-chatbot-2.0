"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────
type MissingQuery = { query: string; timestamp: string; id: string };
type GrowthEntry = {
  id: string;
  date: string;
  moodBefore: number;
  moodAfter: number;
  meditationMinutes: number;
  reflection: string;
  lesson: string;
};
type FeedbackEntry = {
  id: string;
  date: string;
  name: string;
  email?: string;
  message: string;
  rating: number;
};
type QuizResult = {
  id: string;
  date: string;
  category: string;
  score: number;
  total: number;
};
type Stat = { label: string; value: string | number; icon: string; sub?: string; color: string };

// ── Helpers ──────────────────────────────────────────────────────────────────
function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function Badge({ children, color = "antique" }: { children: React.ReactNode; color?: string }) {
  const cls: Record<string, string> = {
    antique: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
    peacock: "border-teal-400/30 bg-teal-400/10 text-teal-300",
    red:     "border-red-400/30 bg-red-400/10 text-red-300",
    purple:  "border-purple-400/30 bg-purple-400/10 text-purple-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls[color] ?? cls.antique}`}>
      {children}
    </span>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ stat }: { stat: Stat }) {
  return (
    <motion.div
      className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{stat.icon}</span>
        <Badge color={stat.color}>{stat.label}</Badge>
      </div>
      <p className="text-4xl font-bold text-white">{stat.value}</p>
      {stat.sub && <p className="text-xs text-white/46">{stat.sub}</p>}
    </motion.div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 backdrop-blur">
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-white">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
function Empty({ msg }: { msg: string }) {
  return <p className="py-6 text-center text-sm text-white/36">{msg}</p>;
}

// ── Admin Panel ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "missing" | "growth" | "feedback" | "quiz">("overview");
  const [missing, setMissing] = useState<MissingQuery[]>([]);
  const [growth, setGrowth] = useState<GrowthEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);

  useEffect(() => {
    // Missing queries come from server API
    fetch("/api/admin/missing")
      .then((r) => r.json())
      .then((data) => setMissing(Array.isArray(data) ? data as MissingQuery[] : []))
      .catch(() => setMissing([]));

    setGrowth(readLS<GrowthEntry[]>("krishna-ai-growth", []));
    setFeedback(readLS<FeedbackEntry[]>("krishna-ai-feedback", []));
    setQuizResults(readLS<QuizResult[]>("krishna-ai-quiz-results", []));
    setMounted(true);
  }, []);

  const stats = useMemo<Stat[]>(() => [
    {
      label: "Missing Queries",
      value: missing.length,
      icon: "⚠️",
      sub: "Queries with low confidence",
      color: "red"
    },
    {
      label: "Growth Entries",
      value: growth.length,
      icon: "🌱",
      sub: `Total meditation: ${growth.reduce((a, e) => a + e.meditationMinutes, 0)} min`,
      color: "peacock"
    },
    {
      label: "Feedback",
      value: feedback.length,
      icon: "💬",
      sub: feedback.length ? `Avg rating: ${(feedback.reduce((a, f) => a + f.rating, 0) / feedback.length).toFixed(1)} ⭐` : "No feedback yet",
      color: "antique"
    },
    {
      label: "Quiz Attempts",
      value: quizResults.length,
      icon: "🧪",
      sub: quizResults.length ? `Avg score: ${(quizResults.reduce((a, q) => a + q.score / q.total, 0) / quizResults.length * 100).toFixed(0)}%` : "No attempts yet",
      color: "purple"
    }
  ], [missing, growth, feedback, quizResults]);

  const avgMood = useMemo(() => {
    if (!growth.length) return 0;
    const lifts = growth.map((e) => e.moodAfter - e.moodBefore);
    return (lifts.reduce((a, b) => a + b, 0) / lifts.length).toFixed(2);
  }, [growth]);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "missing", label: "Missing Queries", icon: "⚠️" },
    { id: "growth", label: "Growth Log", icon: "🌱" },
    { id: "feedback", label: "Feedback", icon: "💬" },
    { id: "quiz", label: "Quiz Results", icon: "🧪" },
  ] as const;

  function clearMissing() {
    fetch("/api/admin/missing", { method: "DELETE" })
      .then(() => setMissing([]))
      .catch(() => setMissing([]));
  }

  if (!mounted) {
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
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-yellow-900/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-teal-900/15 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-xl border border-yellow-400/20">
                ⚙️
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Geeta AI — Admin Panel</h1>
                <p className="text-xs text-white/46">Monitor queries, growth data, feedback & quiz performance</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-300">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              Live
            </span>
            <a
              className="rounded-xl border border-white/12 px-4 py-2 text-sm text-white/70 transition hover:border-yellow-400/40 hover:text-white"
              href="/"
            >
              ← Back to App
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "border-yellow-400/50 bg-yellow-400/12 text-yellow-300"
                  : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:text-white"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: 8 }}
            key={activeTab}
            transition={{ duration: 0.3 }}
          >
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Section title="Quick Summary" icon="📈">
                  <div className="grid gap-3">
                    {[
                      ["Total users' reflections", growth.length],
                      ["Average mood lift per session", `+${avgMood}`],
                      ["Total meditation minutes logged", `${growth.reduce((a, e) => a + e.meditationMinutes, 0)} min`],
                      ["Feedback messages received", feedback.length],
                      ["Unanswered / low-match queries", missing.length],
                      ["Quiz attempts recorded", quizResults.length],
                    ].map(([label, val]) => (
                      <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3" key={String(label)}>
                        <span className="text-sm text-white/64">{label}</span>
                        <span className="text-sm font-semibold text-white">{val}</span>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Recent Missing Queries" icon="⚠️">
                  {missing.length === 0 ? (
                    <Empty msg="No missing queries — all content covered!" />
                  ) : (
                    <div className="space-y-2">
                      {missing.slice(0, 5).map((q) => (
                        <div className="rounded-xl border border-red-400/15 bg-red-500/[0.06] p-3" key={q.id}>
                          <p className="text-sm text-white/80">{q.query}</p>
                          <p className="mt-1 text-xs text-white/36">{q.timestamp ? fmt(q.timestamp) : "—"}</p>
                        </div>
                      ))}
                      {missing.length > 5 && (
                        <p className="text-center text-xs text-white/36">+{missing.length - 5} more — view the Missing Queries tab</p>
                      )}
                    </div>
                  )}
                </Section>

                <Section title="Recent Growth Entries" icon="🌱">
                  {growth.length === 0 ? (
                    <Empty msg="No growth entries yet." />
                  ) : (
                    <div className="space-y-2">
                      {growth.slice(0, 4).map((e) => (
                        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3" key={e.id}>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-white/46">{fmt(e.date)}</p>
                            <Badge color={e.moodAfter > e.moodBefore ? "peacock" : "red"}>
                              Mood {e.moodBefore} → {e.moodAfter}
                            </Badge>
                          </div>
                          {e.lesson && <p className="mt-2 text-sm text-white/74 line-clamp-1">"{e.lesson}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Section title="Recent Feedback" icon="💬">
                  {feedback.length === 0 ? (
                    <Empty msg="No feedback submitted yet." />
                  ) : (
                    <div className="space-y-2">
                      {feedback.slice(0, 4).map((f) => (
                        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3" key={f.id}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-white">{f.name || "Anonymous"}</span>
                            <span className="text-sm text-yellow-400">{"⭐".repeat(Math.min(f.rating, 5))}</span>
                          </div>
                          <p className="mt-1 text-sm text-white/64 line-clamp-2">{f.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              </div>
            )}

            {/* MISSING QUERIES */}
            {activeTab === "missing" && (
              <Section title="Low-Confidence / Missing Queries" icon="⚠️">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-white/50">{missing.length} queries need verse coverage</p>
                  {missing.length > 0 && (
                    <button
                      className="rounded-xl border border-red-400/30 px-4 py-1.5 text-sm text-red-300 transition hover:bg-red-500/10"
                      onClick={clearMissing}
                      type="button"
                    >
                      🗑️ Clear All
                    </button>
                  )}
                </div>
                {missing.length === 0 ? (
                  <Empty msg="No missing queries logged. All content matches well! ✨" />
                ) : (
                  <div className="space-y-3">
                    {missing.map((q, i) => (
                      <motion.div
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 rounded-2xl border border-red-400/15 bg-red-500/[0.06] p-4"
                        initial={{ opacity: 0, x: -8 }}
                        key={q.id}
                        transition={{ delay: i * 0.04 }}
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10 text-xs font-bold text-red-300">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm leading-6 text-white/82">{q.query}</p>
                          <p className="mt-1 text-xs text-white/36">{q.timestamp ? fmt(q.timestamp) : "Timestamp unavailable"}</p>
                        </div>
                        <Badge color="red">Needs verse</Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* GROWTH LOG */}
            {activeTab === "growth" && (
              <Section title="User Growth & Meditation Log" icon="🌱">
                {growth.length === 0 ? (
                  <Empty msg="No growth entries recorded yet." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                          <th className="pb-3 pr-4">Date</th>
                          <th className="pb-3 pr-4">Mood Before</th>
                          <th className="pb-3 pr-4">Mood After</th>
                          <th className="pb-3 pr-4">Lift</th>
                          <th className="pb-3 pr-4">Meditation</th>
                          <th className="pb-3">Lesson</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {growth.map((e) => {
                          const lift = e.moodAfter - e.moodBefore;
                          return (
                            <tr className="text-white/74" key={e.id}>
                              <td className="py-3 pr-4 text-xs text-white/46">{fmt(e.date)}</td>
                              <td className="py-3 pr-4">
                                <span className="font-semibold text-white">{e.moodBefore}</span>/5
                              </td>
                              <td className="py-3 pr-4">
                                <span className="font-semibold text-white">{e.moodAfter}</span>/5
                              </td>
                              <td className="py-3 pr-4">
                                <Badge color={lift > 0 ? "peacock" : lift < 0 ? "red" : "purple"}>
                                  {lift > 0 ? "+" : ""}{lift}
                                </Badge>
                              </td>
                              <td className="py-3 pr-4">{e.meditationMinutes} min</td>
                              <td className="max-w-xs truncate py-3 text-xs text-white/56">{e.lesson || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            )}

            {/* FEEDBACK */}
            {activeTab === "feedback" && (
              <Section title="User Feedback" icon="💬">
                {feedback.length === 0 ? (
                  <Empty msg="No feedback submitted yet." />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {feedback.map((f, i) => (
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                        initial={{ opacity: 0, y: 10 }}
                        key={f.id}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-white">{f.name || "Anonymous"}</p>
                            {f.email && <p className="text-xs text-white/40">{f.email}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-yellow-400">{"⭐".repeat(Math.min(f.rating, 5))}</p>
                            <p className="text-xs text-white/36">{fmt(f.date)}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/72">{f.message}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* QUIZ RESULTS */}
            {activeTab === "quiz" && (
              <Section title="Quiz Attempt Results" icon="🧪">
                {quizResults.length === 0 ? (
                  <Empty msg="No quiz results recorded yet." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                          <th className="pb-3 pr-4">Date</th>
                          <th className="pb-3 pr-4">Category</th>
                          <th className="pb-3 pr-4">Score</th>
                          <th className="pb-3">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {quizResults.map((r) => {
                          const pct = Math.round((r.score / r.total) * 100);
                          return (
                            <tr className="text-white/74" key={r.id}>
                              <td className="py-3 pr-4 text-xs text-white/46">{fmt(r.date)}</td>
                              <td className="py-3 pr-4 font-semibold text-white">{r.category}</td>
                              <td className="py-3 pr-4">{r.score}/{r.total}</td>
                              <td className="py-3">
                                <Badge color={pct >= 80 ? "peacock" : pct >= 50 ? "antique" : "red"}>
                                  {pct}%
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <p className="mt-10 text-center text-xs text-white/24">
          Geeta AI Admin · Data is stored locally in browser localStorage · Last refreshed on load
        </p>
      </div>
    </div>
  );
}
