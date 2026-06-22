import { useState } from "react";
import Head from "next/head";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { sections } from "../lib/surveyData";

const SCALE_LABELS = ["", "1", "2", "3", "4", "5"];

function downloadCSV(responses) {
  if (!responses.length) return;

  // Build header row
  const allAnswerKeys = Object.keys(responses[0].answers || {});
  const allOpenKeys = Object.keys(responses[0].open_answers || {});
  const allDemoKeys = Object.keys(responses[0].demo_answers || {});

  const headers = ["submitted_at", "survey_version", ...allAnswerKeys, ...allOpenKeys, ...allDemoKeys];

  const rows = responses.map(r => [
    r.submitted_at,
    r.survey_version,
    ...allAnswerKeys.map(k => r.answers?.[k] ?? ""),
    ...allOpenKeys.map(k => `"${(r.open_answers?.[k] || "").replace(/"/g, '""')}"`),
    ...allDemoKeys.map(k => `"${(r.demo_answers?.[k] || "").replace(/"/g, '""')}"`),
  ]);

  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ai-readiness-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ScaleChart({ question, responses }) {
  const counts = [1, 2, 3, 4, 5].map(v => ({
    label: question.labels[v - 1].split(" ").slice(0, 3).join(" "),
    value: v,
    count: responses.filter(r => r.answers?.[question.id] === v).length,
  }));

  const avg = responses.reduce((sum, r) => sum + (r.answers?.[question.id] || 0), 0) / responses.length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-slate-700 leading-snug">{question.text}</p>
        <div className="shrink-0 text-right">
          <div className="text-xl font-semibold text-slate-800">{avg.toFixed(1)}</div>
          <div className="text-xs text-slate-400">avg / 5</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={counts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="value" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip formatter={(val) => [val, "responses"]} labelFormatter={(v) => `Score ${v}`} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {counts.map((_, i) => <Cell key={i} fill={i < 2 ? "#cbd5e1" : i === 2 ? "#94a3b8" : "#475569"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChoiceChart({ question, responses }) {
  const counts = question.options.map((opt, i) => ({
    label: opt.length > 40 ? opt.slice(0, 40) + "…" : opt,
    fullLabel: opt,
    count: responses.filter(r => r.answers?.[question.id] === i + 1).length,
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <p className="text-sm font-medium text-slate-700 leading-snug">{question.text}</p>
      <div className="space-y-2">
        {counts.map((item, i) => {
          const pct = responses.length ? Math.round((item.count / responses.length) * 100) : 0;
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span className="truncate pr-2">{item.fullLabel}</span>
                <span className="shrink-0 font-medium">{item.count} ({pct}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [responses, setResponses] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(sections[0].id);

  const login = async () => {
    setLoading(true);
    setAuthError(false);
    try {
      const res = await fetch("/api/responses", {
        headers: { "x-admin-key": password },
      });
      if (res.status === 401) {
        setAuthError(true);
      } else {
        const data = await res.json();
        setResponses(data.responses || []);
        setAuthed(true);
      }
    } catch (e) {
      setAuthError(true);
    }
    setLoading(false);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/responses", {
        headers: { "x-admin-key": password },
      });
      const data = await res.json();
      setResponses(data.responses || []);
    } catch (e) {}
    setLoading(false);
  };

  const currentSection = sections.find(s => s.id === activeSection);

  // Department breakdown
  const deptCounts = {};
  (responses || []).forEach(r => {
    const dept = r.demo_answers?.d1 || "Not specified";
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  // Tenure breakdown
  const tenureCounts = {};
  (responses || []).forEach(r => {
    const tenure = r.demo_answers?.d2 || "Not specified";
    tenureCounts[tenure] = (tenureCounts[tenure] || 0) + 1;
  });

  return (
    <>
      <Head><title>Admin — AI Readiness Survey</title></Head>
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/asae-logo.svg" alt="ASAE" className="h-8 w-auto" />
              <div className="border-l border-slate-200 pl-4">
                <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">Survey Admin</div>
              </div>
            </div>
            {authed && (
              <div className="flex gap-3">
                <button onClick={refresh} disabled={loading}
                  className="px-4 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                  {loading ? "Refreshing…" : "↻ Refresh"}
                </button>
                <button onClick={() => downloadCSV(responses)}
                  className="px-4 py-1.5 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                  ↓ Export CSV
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* LOGIN */}
          {!authed && (
            <div className="max-w-sm mx-auto mt-20 space-y-4">
              <h1 className="text-xl font-semibold text-slate-800">Admin Access</h1>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && login()}
                placeholder="Enter admin password"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400"
              />
              {authError && <p className="text-sm text-red-600">Incorrect password.</p>}
              <button onClick={login} disabled={loading}
                className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
                {loading ? "Checking…" : "View Results"}
              </button>
            </div>
          )}

          {/* DASHBOARD */}
          {authed && responses && (
            <div className="space-y-8">

              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Responses", value: responses.length },
                  { label: "Departments", value: Object.keys(deptCounts).filter(k => k !== "Not specified").length },
                  { label: "Latest Response", value: responses[0] ? new Date(responses[0].submitted_at).toLocaleDateString() : "—" },
                  { label: "Completion Rate", value: "100%" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="text-2xl font-semibold text-slate-800">{stat.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Demographics */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">By Department</h3>
                  {Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
                    <div key={dept} className="flex justify-between text-sm text-slate-600">
                      <span>{dept}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">By Tenure</h3>
                  {["Less than 1 year", "1–3 years", "4–7 years", "8–15 years", "15+ years"].map(tenure => (
                    <div key={tenure} className="flex justify-between text-sm text-slate-600">
                      <span>{tenure}</span>
                      <span className="font-medium">{tenureCounts[tenure] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section tabs */}
              <div>
                <div className="flex gap-2 flex-wrap mb-6">
                  {sections.map(s => (
                    <button key={s.id} onClick={() => setActiveSection(s.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === s.id ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}>
                      {s.title}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {currentSection.questions.map(q =>
                    q.type === "scale"
                      ? <ScaleChart key={q.id} question={q} responses={responses} />
                      : <ChoiceChart key={q.id} question={q} responses={responses} />
                  )}
                </div>
              </div>

              {/* Open-ended responses */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-slate-800">Open-ended Responses</h3>
                {[
                  { id: "open1", text: "Work task where AI could help" },
                  { id: "open2", text: "What leadership should better understand" },
                ].map(q => (
                  <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">{q.text}</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {responses.filter(r => r.open_answers?.[q.id]).map((r, i) => (
                        <div key={i} className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                          "{r.open_answers[q.id]}"
                        </div>
                      ))}
                      {responses.filter(r => r.open_answers?.[q.id]).length === 0 && (
                        <p className="text-sm text-slate-400 italic">No responses yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
