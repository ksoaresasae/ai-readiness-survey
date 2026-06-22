import { useState, useRef } from "react";
import Head from "next/head";
import { sections, openEnded, demographics, SURVEY_VERSION } from "../lib/surveyData";

function ScaleQuestion({ question, value, onChange }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between gap-1">
        {question.labels.map((label, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            className="flex-1 flex flex-col items-center gap-1 group transition-all duration-150"
          >
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all duration-150 ${
              value === i + 1
                ? "bg-slate-700 border-slate-700 text-white scale-110"
                : "border-slate-300 text-slate-400 hover:border-slate-500 hover:text-slate-600"
            }`}>
              {i + 1}
            </div>
            <span className={`text-center leading-tight transition-colors duration-150 ${value === i + 1 ? "text-slate-700 font-medium" : "text-slate-400"}`}
              style={{ fontSize: "0.65rem" }}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoiceQuestion({ question, value, onChange }) {
  return (
    <div className="space-y-2">
      {question.options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onChange(i + 1)}
          className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150 ${
            value === i + 1
              ? "border-slate-700 bg-slate-700 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function Survey() {
  const [step, setStep] = useState("intro");
  const [sectionIdx, setSectionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [openAnswers, setOpenAnswers] = useState({});
  const [demoAnswers, setDemoAnswers] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const topRef = useRef(null);

  const currentSection = sections[sectionIdx];
  const scrollTop = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  const setAnswer = (qid, val) => setAnswers(prev => ({ ...prev, [qid]: val }));
  const setOpen = (qid, val) => setOpenAnswers(prev => ({ ...prev, [qid]: val }));
  const setDemo = (qid, val) => setDemoAnswers(prev => ({ ...prev, [qid]: val }));

  const sectionComplete = () => currentSection.questions.every(q => answers[q.id] !== undefined);

  const advanceSection = () => {
    if (sectionIdx < sections.length - 1) {
      setSectionIdx(i => i + 1);
      scrollTop();
    } else {
      setStep("open");
      scrollTop();
    }
  };

  const buildSummary = () => {
    let lines = [`Survey responses (${SURVEY_VERSION}):\n`];
    sections.forEach(s => {
      lines.push(`\n[${s.title}]`);
      s.questions.forEach(q => {
        const val = answers[q.id];
        const label = q.type === "scale"
          ? `${val}/5 — "${q.labels[val - 1]}"`
          : `Option ${val}: "${q.options[val - 1]}"`;
        lines.push(`Q(${q.id}): ${q.text}\nA: ${label}`);
      });
    });
    lines.push("\n[Open-ended]");
    openEnded.forEach(q => {
      lines.push(`Q: ${q.text}\nA: ${openAnswers[q.id] || "(skipped)"}`);
    });
    return lines.join("\n");
  };

  const submitAndAnalyze = async () => {
    setAnalyzing(true);
    setStep("submitted");
    setSubmitError(null);

    // Save to database
    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          openAnswers,
          demoAnswers,
          surveyVersion: SURVEY_VERSION,
        }),
      });
    } catch (e) {
      setSubmitError("Your responses could not be saved. Please contact your survey administrator.");
    }

    // Generate AI snapshot
    try {
      const summary = buildSummary();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
      });
      const data = await res.json();
      setAnalysis(data.analysis || "Thank you for completing the survey.");
    } catch (e) {
      setAnalysis("We weren't able to generate a personalized summary right now, but your responses have been recorded. Thank you.");
    }

    setAnalyzing(false);
  };

  const progress = step === "survey"
    ? Math.round((sectionIdx / sections.length) * 80)
    : step === "open" ? 80
    : step === "demo" ? 90
    : step === "submitted" ? 100
    : 0;

  const renderMarkdown = (text) =>
    text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n- /g, "<br/>• ")
      .replace(/\n/g, "<br/>");

  return (
    <>
      <Head>
        <title>AI Readiness Survey — ASAE</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-slate-50" ref={topRef}>
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/asae-logo.svg" alt="ASAE" className="h-8 w-auto" />
              <div className="border-l border-slate-200 pl-4">
                <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">AI Readiness Survey</div>
                <div className="text-xs text-slate-400">{SURVEY_VERSION}</div>
              </div>
            </div>
            {step !== "intro" && (
              <div className="flex items-center gap-3">
                <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-700 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-slate-400">{progress}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* INTRO */}
          {step === "intro" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-slate-800 mb-2">Where are we with AI?</h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  This survey helps us understand where our organization stands — not to evaluate individuals, but to shape how we invest in learning, tools, and support. There are no right answers. Honest responses are far more useful than optimistic ones.
                </p>
              </div>
              <div className="bg-slate-100 rounded-xl p-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3"><span className="text-slate-400 mt-0.5">⏱</span><span>Takes about 8–12 minutes</span></div>
                <div className="flex items-start gap-3"><span className="text-slate-400 mt-0.5">🔄</span><span>We'll run this again in 6 months to track how things change</span></div>
                <div className="flex items-start gap-3"><span className="text-slate-400 mt-0.5">🔒</span><span>Individual responses are confidential — results are reviewed in aggregate</span></div>
                <div className="flex items-start gap-3"><span className="text-slate-400 mt-0.5">💬</span><span>After you finish, you'll receive a brief personal snapshot of your responses</span></div>
              </div>
              <button onClick={() => { setStep("survey"); scrollTop(); }}
                className="w-full bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-700 transition-colors">
                Begin Survey →
              </button>
            </div>
          )}

          {/* SURVEY SECTIONS */}
          {step === "survey" && (
            <div className="space-y-8">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-1">
                  Section {sectionIdx + 1} of {sections.length}
                </div>
                <h2 className="text-xl font-semibold text-slate-800">{currentSection.title}</h2>
                <p className="text-sm text-slate-500 mt-1">{currentSection.description}</p>
              </div>
              <div className="space-y-8">
                {currentSection.questions.map((q, qi) => (
                  <div key={q.id} className="space-y-4">
                    <div className="flex gap-3">
                      <span className="text-slate-300 font-mono text-sm mt-0.5 shrink-0">{qi + 1}.</span>
                      <p className="text-slate-700 text-sm leading-relaxed font-medium">{q.text}</p>
                    </div>
                    {q.type === "scale"
                      ? <ScaleQuestion question={q} value={answers[q.id]} onChange={v => setAnswer(q.id, v)} />
                      : <ChoiceQuestion question={q} value={answers[q.id]} onChange={v => setAnswer(q.id, v)} />}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                {sectionIdx > 0 && (
                  <button onClick={() => { setSectionIdx(i => i - 1); scrollTop(); }}
                    className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                    ← Back
                  </button>
                )}
                <button onClick={advanceSection} disabled={!sectionComplete()}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    sectionComplete() ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}>
                  {sectionIdx < sections.length - 1 ? `Continue to ${sections[sectionIdx + 1].title} →` : "Continue →"}
                </button>
              </div>
            </div>
          )}

          {/* OPEN-ENDED */}
          {step === "open" && (
            <div className="space-y-8">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-1">Open Questions</div>
                <h2 className="text-xl font-semibold text-slate-800">In your own words</h2>
                <p className="text-sm text-slate-500 mt-1">These are optional but genuinely useful. Write as little or as much as you want.</p>
              </div>
              {openEnded.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 leading-relaxed block">{i + 1}. {q.text}</label>
                  <textarea value={openAnswers[q.id] || ""} onChange={e => setOpen(q.id, e.target.value)}
                    rows={3} placeholder="Optional — skip if you prefer"
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-slate-400 resize-none" />
                </div>
              ))}
              <div className="flex gap-3">
                <button onClick={() => { setSectionIdx(sections.length - 1); setStep("survey"); scrollTop(); }}
                  className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                  ← Back
                </button>
                <button onClick={() => { setStep("demo"); scrollTop(); }}
                  className="flex-1 bg-slate-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* DEMOGRAPHICS */}
          {step === "demo" && (
            <div className="space-y-8">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-1">Almost done — Optional</div>
                <h2 className="text-xl font-semibold text-slate-800">A few optional details</h2>
                <p className="text-sm text-slate-500 mt-1">These help us look at patterns across teams and tenure — all optional.</p>
              </div>
              {demographics.map(d => (
                <div key={d.id} className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{d.label}</label>
                  {d.type === "text" ? (
                    <input type="text" value={demoAnswers[d.id] || ""} onChange={e => setDemo(d.id, e.target.value)}
                      placeholder={d.placeholder}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-slate-400" />
                  ) : (
                    <div className="space-y-2">
                      {d.options.map((opt, i) => (
                        <button key={i} onClick={() => setDemo(d.id, opt)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                            demoAnswers[d.id] === opt
                              ? "border-slate-700 bg-slate-700 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-3">
                <button onClick={() => { setStep("open"); scrollTop(); }}
                  className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                  ← Back
                </button>
                <button onClick={submitAndAnalyze}
                  className="flex-1 bg-slate-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
                  Submit & See My Snapshot →
                </button>
              </div>
            </div>
          )}

          {/* SUBMITTED */}
          {step === "submitted" && (
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-1">Complete</div>
                <h2 className="text-xl font-semibold text-slate-800">Thank you for your honesty.</h2>
                <p className="text-sm text-slate-500 mt-1">Your responses have been recorded. Here's a brief snapshot based on what you shared.</p>
              </div>
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{submitError}</div>
              )}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                {analyzing ? (
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                    Generating your personalized snapshot…
                  </div>
                ) : analysis ? (
                  <div className="text-sm text-slate-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }} />
                ) : null}
              </div>
              <div className="bg-slate-100 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
                We'll run this survey again in approximately six months. Individual results are kept confidential — leadership reviews aggregate patterns to inform training and support investments.
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
