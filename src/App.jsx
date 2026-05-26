import { useState, useRef, useEffect, useCallback } from "react";

// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://lqypjbgphjvvwnjihurk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxeXBqYmdwaGp2dnduamlodXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDI4ODIsImV4cCI6MjA5NTMxODg4Mn0.t-Oz-H1u6MEdSxhS_Qng_YeVu8tL9vcdY_G-x5s9W18";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function getAllCodes() {
  try {
    const data = await sbFetch("property_codes?select=*");
    const map = {};
    (data || []).forEach(r => {
      map[r.code] = {
        code: r.code,
        propertyName: r.property_name,
        contactName: r.contact_name,
        email: r.email,
        plan: r.plan,
        hrPin: r.hr_pin,
        used: r.used,
        freeLimit: r.free_limit,
        createdAt: r.created_at,
        lastUsed: r.last_used,
      };
    });
    return map;
  } catch { return {}; }
}

async function getCodeFromDB(code) {
  try {
    const data = await sbFetch(`property_codes?code=eq.${encodeURIComponent(code.toUpperCase())}&select=*`);
    if (!data || data.length === 0) return null;
    const r = data[0];
    return {
      code: r.code, propertyName: r.property_name, contactName: r.contact_name,
      email: r.email, plan: r.plan, hrPin: r.hr_pin, used: r.used,
      freeLimit: r.free_limit, createdAt: r.created_at, lastUsed: r.last_used,
    };
  } catch { return null; }
}

async function createCode(rec) {
  return sbFetch("property_codes", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify({
      code: rec.code, property_name: rec.propertyName, contact_name: rec.contactName,
      email: rec.email, plan: rec.plan, hr_pin: rec.hrPin,
      used: 0, free_limit: rec.freeLimit,
    }),
  });
}

async function deleteCodeFromDB(code) {
  return sbFetch(`property_codes?code=eq.${encodeURIComponent(code)}`, { method: "DELETE", prefer: "" });
}

async function resetUsageInDB(code) {
  return sbFetch(`property_codes?code=eq.${encodeURIComponent(code)}`, {
    method: "PATCH", body: JSON.stringify({ used: 0 }),
  });
}

async function upgradeCodeInDB(code) {
  return sbFetch(`property_codes?code=eq.${encodeURIComponent(code)}`, {
    method: "PATCH", body: JSON.stringify({ plan: "unlimited", free_limit: 9999 }),
  });
}

async function incrementUsageInDB(code) {
  try {
    const rec = await getCodeFromDB(code);
    if (!rec) return;
    await sbFetch(`property_codes?code=eq.${encodeURIComponent(code.toUpperCase())}`, {
      method: "PATCH",
      body: JSON.stringify({ used: (rec.used || 0) + 1, last_used: new Date().toISOString() }),
    });
  } catch {}
}

const FREE_LIMIT = 10;
const ADMIN_PIN = "CDAT2025";
const WARN_AT = 5;

function genPin() { return String(Math.floor(1000 + Math.random() * 9000)); }

const C = {
  navy: "#0e1a2b", navyMid: "#152338", navyLt: "#1e3050",
  gold: "#c9a84c", goldLt: "#e3c478",
  cream: "#f7f2e8", text: "#d4c9b0", muted: "#8a9db5",
  success: "#2E7D32", warn: "#E65100", danger: "#C62828",
};

const SUITE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Playfair+Display:ital,wght@0,700;1,400&family=Source+Sans+3:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Source Sans 3',sans-serif;background:#0e1a2b;color:#f7f2e8;min-height:100vh}
  .hdr{background:#152338;padding:22px 48px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(201,168,76,.2)}
  .hdr-eyebrow{font-family:'Cinzel',serif;font-size:.58rem;letter-spacing:.4em;color:#c9a84c;text-transform:uppercase;margin-bottom:4px}
  .hdr-title{font-family:'Playfair Display',serif;color:#f7f2e8;font-size:20px;font-weight:700}
  .hdr-badge{background:#c9a84c;color:#0e1a2b;font-family:'Cinzel',serif;font-size:.58rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;padding:5px 12px}
  .content{padding:48px;max-width:1000px;margin:0 auto}
  .btn{padding:11px 26px;font-size:.72rem;font-weight:700;letter-spacing:.15em;cursor:pointer;font-family:'Cinzel',serif;border:none;transition:all .18s;text-transform:uppercase}
  .btn-gold{background:#c9a84c;color:#0e1a2b}.btn-gold:hover{background:#e3c478}
  .btn-navy{background:#152338;color:#c9a84c;border:1px solid rgba(201,168,76,.3)}.btn-navy:hover{border-color:#c9a84c}
  .btn-ghost{background:transparent;color:#d4c9b0;border:1px solid rgba(201,168,76,.25)}.btn-ghost:hover{border-color:#c9a84c;color:#c9a84c}
  .btn-danger{background:rgba(198,40,40,.1);color:#ef4444;border:1px solid rgba(198,40,40,.2)}
  .gate-wrap{min-height:100vh;background:#0e1a2b;display:flex;flex-direction:column}
  .gate-center{flex:1;display:flex;align-items:center;justify-content:center;padding:40px 16px}
  .gate-card{background:#152338;border:1px solid rgba(201,168,76,.2);width:100%;max-width:440px}
  .gate-card-hdr{background:#1e3050;padding:24px 28px;border-bottom:1px solid rgba(201,168,76,.15)}
  .gate-card-body{padding:28px}
  .gate-input{width:100%;background:#0e1a2b;border:1.5px solid rgba(201,168,76,.3);padding:13px 16px;font-size:20px;letter-spacing:6px;text-align:center;font-family:'Playfair Display',serif;color:#f7f2e8;outline:none;transition:border-color .2s}
  .gate-input:focus{border-color:#c9a84c}
  .gate-error{color:#ef4444;font-size:.82rem;margin-top:8px;text-align:center;font-family:'Cinzel',serif;letter-spacing:.05em}
  .suite-welcome{text-align:center;margin-bottom:48px}
  .suite-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:40px}
  .suite-card{background:#152338;border:1px solid rgba(201,168,76,.2);padding:36px;cursor:pointer;transition:all .2s}
  .suite-card:hover{border-color:#c9a84c;transform:translateY(-3px)}
  .suite-card.featured{border-color:#c9a84c;background:linear-gradient(135deg,#1e3050 0%,#152338 100%)}
  .suite-card-badge{font-family:'Cinzel',serif;font-size:.55rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;padding:4px 10px;margin-bottom:16px;display:inline-block;background:#c9a84c;color:#0e1a2b}
  .suite-card-name{font-family:'Playfair Display',serif;font-size:2rem;font-weight:700;color:#f7f2e8;margin-bottom:4px}
  .suite-card-sub{font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:.18em;color:#c9a84c;text-transform:uppercase;margin-bottom:16px}
  .suite-card-desc{font-size:.88rem;color:#d4c9b0;line-height:1.8;margin-bottom:20px}
  .suite-card-features{list-style:none;margin-bottom:24px}
  .suite-card-features li{font-size:.82rem;color:#d4c9b0;padding:6px 0;border-bottom:1px solid rgba(201,168,76,.07);display:flex;gap:8px;align-items:flex-start;line-height:1.5}
  .suite-card-features li::before{content:'◆';color:#c9a84c;font-size:.4rem;flex-shrink:0;margin-top:5px}
  .usage-bar-wrap{background:rgba(14,26,43,.6);border:1px solid rgba(201,168,76,.15);padding:14px 18px;margin-bottom:32px}
  .usage-bar{height:4px;background:rgba(201,168,76,.15);margin:8px 0}
  .usage-bar-fill{height:4px;background:#c9a84c;transition:width .5s}
  .admin-wrap{min-height:100vh;background:#0e1a2b}
  .admin-table{width:100%;border-collapse:collapse}
  .admin-table th{font-family:'Cinzel',serif;font-size:.58rem;letter-spacing:.2em;text-transform:uppercase;color:#c9a84c;padding:12px 16px;border-bottom:1px solid rgba(201,168,76,.2);text-align:left}
  .admin-table td{font-size:.85rem;color:#d4c9b0;padding:12px 16px;border-bottom:1px solid rgba(201,168,76,.06)}
  .admin-table tr:hover td{background:rgba(201,168,76,.03)}
  .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px}
  .stat-card{background:#152338;border:1px solid rgba(201,168,76,.15);padding:20px;text-align:center}
  .stat-num{font-family:'Playfair Display',serif;font-size:2rem;font-weight:700;color:#c9a84c;display:block}
  .stat-lbl{font-family:'Cinzel',serif;font-size:.55rem;letter-spacing:.2em;color:#8a9db5;text-transform:uppercase;margin-top:4px;display:block}
  .upgrade-wrap{min-height:100vh;background:#0e1a2b;display:flex;flex-direction:column}
  .field{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
  .field label{font-family:'Cinzel',serif;font-size:.55rem;letter-spacing:.2em;color:#8a9db5;text-transform:uppercase}
  .field input,.field select{background:#0e1a2b;border:1px solid rgba(201,168,76,.2);color:#f7f2e8;padding:9px 13px;font-size:13px;outline:none;font-family:inherit}
  .field input:focus,.field select:focus{border-color:#c9a84c}
  .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .q-wrap{min-height:100vh;background:#F7F8FA;display:flex;flex-direction:column}
  .q-progress{height:4px;background:#E8EAED}
  .q-progress-fill{height:4px;background:#B8860B;transition:width .4s}
  .q-center{flex:1;display:flex;align-items:center;justify-content:center;padding:40px 20px}
  .q-card{background:#fff;border:1px solid #E8EAED;border-radius:16px;box-shadow:0 10px 15px rgba(0,0,0,.06);width:100%;max-width:640px;padding:48px}
  .q-num{font-size:12px;font-weight:600;color:#B8860B;letter-spacing:1px;text-transform:uppercase;margin-bottom:20px}
  .q-text{font-family:'Playfair Display',serif;font-size:1.35rem;font-weight:700;color:#111827;line-height:1.6;margin-bottom:36px}
  .q-options{display:flex;flex-direction:column;gap:10px}
  .q-option{background:#fff;border:1.5px solid #D1D5DB;border-radius:10px;padding:14px 20px;font-size:15px;color:#374151;cursor:pointer;transition:all .12s;text-align:left;font-family:'Source Sans 3',sans-serif;display:flex;align-items:center;gap:16px}
  .q-option:hover{border-color:#B8860B;background:#FDF8EC;color:#111827}
  .q-option.selected{border-color:#B8860B;background:#FDF8EC;color:#B8860B;font-weight:700}
  .q-option-dot{width:20px;height:20px;border-radius:50%;border:2px solid #D1D5DB;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .12s}
  .q-option.selected .q-option-dot{background:#B8860B;border-color:#B8860B}
  .q-option-dot-inner{width:8px;height:8px;border-radius:50%;background:#fff}
  .report-wrap{background:#0e1a2b;min-height:100vh}
  .report-content{max-width:760px;margin:0 auto;padding:48px 32px}
  .tier-badge{display:inline-block;padding:8px 24px;font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;margin-bottom:16px}
  .score-bar-row{display:flex;align-items:center;gap:16px;margin-bottom:14px}
  .score-bar-label{font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:.12em;color:#8a9db5;text-transform:uppercase;width:180px;flex-shrink:0}
  .score-bar-track{flex:1;height:6px;background:rgba(201,168,76,.1);border-radius:3px}
  .score-bar-fill{height:6px;border-radius:3px;transition:width .8s}
  .score-bar-pct{font-family:'Cinzel',serif;font-size:.62rem;color:#c9a84c;width:36px;text-align:right}
  .flag-item{background:rgba(198,40,40,.08);border:1px solid rgba(198,40,40,.2);padding:12px 16px;margin-bottom:8px;font-size:.85rem;color:#d4c9b0;display:flex;gap:10px;align-items:flex-start}
  .pin-gate{background:#152338;border:1px solid rgba(201,168,76,.2);padding:32px;text-align:center;max-width:400px;margin:0 auto 40px}
  .pin-input{background:#0e1a2b;border:1.5px solid rgba(201,168,76,.3);padding:13px 16px;font-size:24px;letter-spacing:8px;text-align:center;font-family:'Playfair Display',serif;color:#f7f2e8;outline:none;width:100%;margin:12px 0}
  .pin-input:focus{border-color:#c9a84c}
`;

// ── CDAT QUESTIONS ────────────────────────────────────────────────────────────
const TRAITS = [
  "Interaction & Friendliness",
  "Patience & Emotional Control",
  "Communication & Listening",
  "Attention to Detail & Focus",
  "Teamwork & Dependability",
];

const QUESTIONS = [
  // Interaction & Friendliness (8 questions, 2 reverse)
  { id: 1, trait: 0, text: "I enjoy making conversation with people I've just met.", reverse: false },
  { id: 2, trait: 0, text: "I find it easy to make guests feel welcome and at ease.", reverse: false },
  { id: 3, trait: 0, text: "I prefer to focus on my work rather than chat with people around me.", reverse: true },
  { id: 4, trait: 0, text: "I genuinely enjoy working in a people-facing environment every day.", reverse: false },
  { id: 5, trait: 0, text: "I can maintain a warm, professional attitude even when I'm tired.", reverse: false },
  { id: 6, trait: 0, text: "I find it draining to be friendly and upbeat for extended periods.", reverse: true },
  { id: 7, trait: 0, text: "I naturally smile and make eye contact when greeting someone new.", reverse: false },
  { id: 8, trait: 0, text: "I take pride in creating a positive experience for every person I interact with.", reverse: false },
  // Patience & Emotional Control (8 questions, 2 reverse)
  { id: 9, trait: 1, text: "I remain calm when a guest becomes frustrated or raises their voice.", reverse: false },
  { id: 10, trait: 1, text: "I can handle repeated questions without showing irritation.", reverse: false },
  { id: 11, trait: 1, text: "When things go wrong, I tend to feel flustered or overwhelmed.", reverse: true },
  { id: 12, trait: 1, text: "I can maintain composure even when I disagree with someone's behavior.", reverse: false },
  { id: 13, trait: 1, text: "I rarely let stress from one situation carry over into the next interaction.", reverse: false },
  { id: 14, trait: 1, text: "I sometimes snap or become short-tempered when under pressure.", reverse: true },
  { id: 15, trait: 1, text: "I am patient even in slow-moving or repetitive situations.", reverse: false },
  { id: 16, trait: 1, text: "I can reset my mindset quickly after a difficult guest interaction.", reverse: false },
  // Communication & Listening (8 questions, 2 reverse)
  { id: 17, trait: 2, text: "I listen carefully before responding, even when I think I know the answer.", reverse: false },
  { id: 18, trait: 2, text: "I can explain rules or procedures clearly to someone unfamiliar with them.", reverse: false },
  { id: 19, trait: 2, text: "I sometimes interrupt people because I already know what they need.", reverse: true },
  { id: 20, trait: 2, text: "I adjust how I communicate based on who I'm speaking with.", reverse: false },
  { id: 21, trait: 2, text: "I ask clarifying questions when instructions are unclear.", reverse: false },
  { id: 22, trait: 2, text: "I tend to talk more than I listen in most conversations.", reverse: true },
  { id: 23, trait: 2, text: "I can deliver clear information calmly even in a noisy or busy environment.", reverse: false },
  { id: 24, trait: 2, text: "I make sure the other person understands before I move on.", reverse: false },
  // Attention to Detail & Focus (8 questions, 2 reverse)
  { id: 25, trait: 3, text: "I naturally notice small errors or inconsistencies that others might miss.", reverse: false },
  { id: 26, trait: 3, text: "I can stay focused on a task even when there are distractions around me.", reverse: false },
  { id: 27, trait: 3, text: "I sometimes lose track of details when I'm managing multiple things at once.", reverse: true },
  { id: 28, trait: 3, text: "I double-check my work before considering it complete.", reverse: false },
  { id: 29, trait: 3, text: "I find it easy to keep track of numbers, sequences, or procedural steps.", reverse: false },
  { id: 30, trait: 3, text: "I tend to work fast and sometimes sacrifice accuracy for speed.", reverse: true },
  { id: 31, trait: 3, text: "I take procedures seriously and follow them consistently, not just when supervised.", reverse: false },
  { id: 32, trait: 3, text: "I notice when something is off, even if no one else has pointed it out.", reverse: false },
  // Teamwork & Dependability (8 questions, 2 reverse)
  { id: 33, trait: 4, text: "I show up on time and follow through on my commitments consistently.", reverse: false },
  { id: 34, trait: 4, text: "I am willing to help a coworker even when it's outside my assigned duties.", reverse: false },
  { id: 35, trait: 4, text: "I prefer working independently rather than relying on others.", reverse: true },
  { id: 36, trait: 4, text: "My coworkers and supervisors know they can count on me.", reverse: false },
  { id: 37, trait: 4, text: "I communicate proactively when I anticipate a problem that affects the team.", reverse: false },
  { id: 38, trait: 4, text: "I sometimes avoid taking on extra responsibility when things get busy.", reverse: true },
  { id: 39, trait: 4, text: "I take ownership of mistakes rather than deflecting blame.", reverse: false },
  { id: 40, trait: 4, text: "I contribute positively to team morale, especially during difficult shifts.", reverse: false },
];

const LABELS = ["Never", "Rarely", "Sometimes", "Often", "Always"];

function scoreAnswers(answers) {
  const traitScores = TRAITS.map(() => ({ raw: 0, max: 0 }));
  QUESTIONS.forEach(q => {
    const val = answers[q.id];
    if (val === undefined) return;
    const score = q.reverse ? (5 - val) : val;
    traitScores[q.trait].raw += score;
    traitScores[q.trait].max += 5;
  });
  return traitScores.map((t, i) => ({
    trait: TRAITS[i],
    raw: t.raw,
    max: t.max,
    pct: Math.round((t.raw / t.max) * 100),
  }));
}

function getTier(overall) {
  if (overall >= 85) return { label: "Eagle Dealer™", color: "#c9a84c", bg: "rgba(201,168,76,.12)", desc: "Exceptional candidate — top-tier behavioral profile." };
  if (overall >= 70) return { label: "Strong Candidate", color: "#4caf50", bg: "rgba(76,175,80,.1)", desc: "Above average across key dealer traits." };
  if (overall >= 55) return { label: "Moderate Fit", color: "#E65100", bg: "rgba(230,81,0,.1)", desc: "Some strengths, but notable gaps to address." };
  return { label: "Not Recommended", color: "#C62828", bg: "rgba(198,40,40,.1)", desc: "Significant behavioral gaps for dealer role." };
}

function getRedFlags(scores, answers) {
  const flags = [];
  scores.forEach(s => { if (s.pct < 50) flags.push(`Low score in ${s.trait} (${s.pct}%) — may struggle in this area.`); });
  // Consistency check — reverse scored items
  const reverseQs = QUESTIONS.filter(q => q.reverse);
  let inconsistent = 0;
  reverseQs.forEach(q => {
    const fwd = QUESTIONS.find(f => f.trait === q.trait && !f.reverse && Math.abs(f.id - q.id) < 6);
    if (fwd && answers[q.id] !== undefined && answers[fwd.id] !== undefined) {
      const fwdScore = answers[fwd.id];
      const revScore = 6 - answers[q.id];
      if (Math.abs(fwdScore - revScore) >= 3) inconsistent++;
    }
  });
  if (inconsistent >= 3) flags.push("Response inconsistency detected — candidate may not have answered thoughtfully.");
  return flags;
}

function getInterviewQs(scores) {
  const qs = [];
  const sorted = [...scores].sort((a, b) => a.pct - b.pct);
  sorted.slice(0, 2).forEach(s => {
    if (s.trait === "Patience & Emotional Control") qs.push("Tell me about a time a guest or customer became upset with you. How did you handle it?");
    if (s.trait === "Attention to Detail & Focus") qs.push("Describe a situation where catching a small error made a big difference. How do you stay focused during repetitive tasks?");
    if (s.trait === "Interaction & Friendliness") qs.push("How do you stay energetic and personable at the end of a long shift?");
    if (s.trait === "Communication & Listening") qs.push("Give an example of when you had to explain something complex to someone unfamiliar with it.");
    if (s.trait === "Teamwork & Dependability") qs.push("Tell me about a time you went above and beyond to support a coworker or team.");
  });
  return qs;
}

// ── TIMER ─────────────────────────────────────────────────────────────────────
function Timer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) { onExpire(); return; }
    const id = setInterval(() => setLeft(l => l - 1), 1000);
    return () => clearInterval(id);
  }, [left]);
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  const urgent = left <= 60;
  const pct = (left / seconds) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: urgent ? "rgba(198,40,40,.15)" : "rgba(201,168,76,.1)", border: `1px solid ${urgent ? "rgba(198,40,40,.3)" : "rgba(201,168,76,.25)"}`, padding: "6px 14px" }}>
      <svg viewBox="0 0 32 32" style={{ width: 24, height: 24, transform: "rotate(-90deg)", flexShrink: 0 }}>
        <circle cx="16" cy="16" r="12" fill="none" stroke={urgent ? "rgba(198,40,40,.2)" : "rgba(201,168,76,.2)"} strokeWidth="2.5" />
        <circle cx="16" cy="16" r="12" fill="none" stroke={urgent ? "#C62828" : "#c9a84c"} strokeWidth="2.5"
          strokeDasharray={`${2 * Math.PI * 12}`}
          strokeDashoffset={`${2 * Math.PI * 12 * (1 - pct / 100)}`}
          style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <span style={{ fontFamily: "'Courier New',monospace", fontSize: 18, fontWeight: 700, color: urgent ? "#ef4444" : "#c9a84c", letterSpacing: 2 }}>{m}:{s}</span>
    </div>
  );
}

const CDAT_POSITIONS = [
  "Casino Dealer – Table Games","Casino Dealer – Blackjack","Casino Dealer – Poker",
  "Casino Dealer – Roulette","Casino Dealer – Baccarat","Casino Dealer – Craps",
  "Dual-Rate Dealer","Other / Not Listed",
];

// ── CDAT ASSESSMENT ───────────────────────────────────────────────────────────
function CDATAssessment({ onComplete, onBack }) {
  const [phase, setPhase] = useState("welcome");
  const [candName, setCandName] = useState("");
  const [candPosition, setCandPosition] = useState("");
  const [nameError, setNameError] = useState("");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const topRef = useRef(null);
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const q = QUESTIONS[current];
  const progress = Math.round((current / QUESTIONS.length) * 100);

  function handleBegin() {
    if (!candName.trim()) { setNameError("Please enter the candidate's full name."); return; }
    if (!candPosition) { setNameError("Please select a position."); return; }
    setNameError("");
    setPhase("questions");
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleExpire() { onComplete(answers, candName, candPosition); }

  function selectAnswer(val) {
    const newAnswers = { ...answers, [q.id]: val };
    setAnswers(newAnswers);
    setTimeout(() => {
      if (current < QUESTIONS.length - 1) {
        setCurrent(current + 1);
        topRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        onComplete(newAnswers, candName, candPosition);
      }
    }, 300);
  }

  if (phase === "welcome") return (
    <><style>{SUITE_STYLES}</style>
    <style>{`
      .welcome-page{min-height:100vh;background:#F7F8FA;display:flex;flex-direction:column;font-family:'Source Sans 3',sans-serif}
      .welcome-hdr{background:#fff;border-bottom:1px solid #E8EAED;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
      .welcome-card{background:#fff;border-radius:16px;border:1px solid #E8EAED;box-shadow:0 10px 15px rgba(0,0,0,.06);padding:36px;width:100%;max-width:520px}
      .welcome-label{font-size:11px;font-weight:600;color:#6B7280;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;display:block}
      .welcome-input{width:100%;border:1.5px solid #D4CFC4;border-radius:8px;padding:11px 14px;font-size:14px;color:#1a1a2e;background:#fff;outline:none;transition:border-color .2s;font-family:inherit}
      .welcome-input:focus{border-color:#B8860B}
      .welcome-select{width:100%;border:1.5px solid #D4CFC4;border-radius:8px;padding:11px 14px;font-size:14px;color:#1a1a2e;background:#fff;outline:none;cursor:pointer;font-family:inherit;appearance:none;transition:border-color .2s}
      .welcome-select:focus{border-color:#B8860B}
      .before-box{background:#FDF8EC;border:1px solid #E8D5A3;border-radius:10px;padding:16px 20px;margin-bottom:20px}
      .before-title{font-size:14px;font-weight:700;color:#B8860B;margin-bottom:10px}
      .before-item{display:flex;gap:10px;margin-bottom:6px;align-items:flex-start;font-size:13px;color:#374151;line-height:1.5}
      .before-icon{color:#B8860B;font-size:12px;margin-top:2px;flex-shrink:0}
      .note-box{background:#FDF8EC;border:1px solid #E8D5A3;border-radius:8px;padding:12px 16px;margin-bottom:20px}
      .note-text{font-size:12px;color:#374151;line-height:1.6;font-style:italic}
      .welcome-btn{width:100%;background:#B8860B;color:#fff;border:none;border-radius:10px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Playfair Display',serif;letter-spacing:1px;box-shadow:0 4px 14px rgba(184,134,11,.3);transition:all .15s}
      .welcome-btn:hover{background:#9A7209}
    `}</style>
    <div className="welcome-page" ref={topRef}>
      <div className="welcome-hdr">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🃏</span>
          <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 17, fontWeight: 700, color: "#B8860B", letterSpacing: 2 }}>CDAT</span>
          <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 4 }}>Casino Dealer Aptitude Assessment</span>
        </div>
        <button onClick={onBack} style={{ background: "none", border: "1px solid #E8EAED", borderRadius: 6, padding: "5px 14px", fontSize: 12, color: "#6B7280", cursor: "pointer" }}>← Back</button>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 32, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Welcome</h1>
            <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>Please complete the fields below to begin your assessment.</p>
          </div>
          <div className="welcome-card">
            <div style={{ marginBottom: 18 }}>
              <label className="welcome-label">Full Name</label>
              <input className="welcome-input" type="text" placeholder="e.g. Jordan M. Rivers" value={candName}
                onChange={e => { setCandName(e.target.value); setNameError(""); }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="welcome-label">Position Applied For</label>
              <div style={{ position: "relative" }}>
                <select className="welcome-select" value={candPosition} onChange={e => { setCandPosition(e.target.value); setNameError(""); }}>
                  <option value="">Select a position...</option>
                  {CDAT_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="12" height="8" viewBox="0 0 12 8">
                  <path d="M1 1l5 5 5-5" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="welcome-label">Date</label>
              <input className="welcome-input" type="text" value={today} readOnly style={{ color: "#6B7280", background: "#F9FAFB", cursor: "default" }} />
            </div>
            <div className="before-box">
              <div className="before-title">Before You Begin</div>
              {[
                "40 questions — answered one at a time",
                "Once you move to the next question, you cannot go back",
                "7 minutes to complete the full assessment",
                "Frequency scale: Never · Rarely · Sometimes · Often · Always",
                "Answer each question honestly and independently",
              ].map((t, i) => (
                <div className="before-item" key={i}>
                  <span className="before-icon">✦</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <div className="note-box">
              <p className="note-text"><strong style={{ fontStyle: "normal", color: "#B8860B" }}>Note:</strong> This assessment is one part of the hiring process and should be used alongside the dealer audition, structured interview, math evaluation, and reference checks. It is not a standalone hiring decision tool.</p>
            </div>
            {nameError && <p style={{ fontSize: 12, color: "#DC2626", marginBottom: 12 }}>⚠ {nameError}</p>}
            <button className="welcome-btn" onClick={handleBegin}>Continue →</button>
          </div>
        </div>
      </div>
    </div></>
  );

  return (
    <><style>{SUITE_STYLES}</style>
    <div className="q-wrap" ref={topRef}>
      <div style={{ background: "#fff", borderBottom: "1px solid #E8EAED", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🃏</span>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#B8860B", letterSpacing: 2 }}>CDAT</span>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>· {candName}</span>
        </div>
        <Timer seconds={420} onExpire={handleExpire} />
      </div>
      <div className="q-progress"><div className="q-progress-fill" style={{ width: `${progress}%` }} /></div>
      <div className="q-center">
        <div className="q-card">
          <div className="q-num">
            {TRAITS[q.trait]} · Question {current + 1} of {QUESTIONS.length}
          </div>
          <div className="q-text">{q.text}</div>
          <div className="q-options">
            {LABELS.map((label, i) => {
              const val = i + 1;
              const selected = answers[q.id] === val;
              return (
                <button key={i} className={`q-option${selected ? " selected" : ""}`} onClick={() => selectAnswer(val)}>
                  <div className="q-option-dot">{selected && <div className="q-option-dot-inner" />}</div>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </div></>
  );
}

// ── CDAT REPORT ───────────────────────────────────────────────────────────────
function CDATReport({ answers, property, onBack, onNewCandidate }) {
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const scores = scoreAnswers(answers);
  const overall = Math.round(scores.reduce((a, s) => a + s.pct, 0) / scores.length);
  const tier = getTier(overall);
  const flags = getRedFlags(scores, answers);
  const interviewQs = getInterviewQs(scores);

  function tryPin() {
    if (pinInput === property?.hrPin) { setUnlocked(true); setPinError(""); }
    else setPinError("Incorrect PIN. Contact CasinoPro Solutions if you need assistance.");
  }

  const traitColor = (p) => p >= 70 ? "#2E7D32" : p >= 50 ? "#E65100" : "#C62828";
  const traitBg = (p) => p >= 70 ? "#ECFDF5" : p >= 50 ? "#FFF7ED" : "#FEF2F2";

  return (
    <><style>{SUITE_STYLES}</style>
    <style>{`
      .rpt-wrap{min-height:100vh;background:#F7F8FA;font-family:'Source Sans 3',sans-serif}
      .rpt-hdr{background:#1B2A4A;padding:0}
      .rpt-hdr-top{padding:20px 36px;display:flex;align-items:center;justify-content:space-between}
      .rpt-hdr-gold{height:3px;background:linear-gradient(to right,#C9A84C,#E8C96A)}
      .rpt-body{max-width:800px;margin:0 auto;padding:36px 24px 80px}
      .rpt-section{background:#fff;border:1px solid #E0DBD0;border-radius:8px;margin-bottom:20px;overflow:hidden}
      .rpt-section-hdr{background:#1B2A4A;padding:12px 20px}
      .rpt-section-lbl{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:700}
      .rpt-score-big{font-family:'Playfair Display',serif;font-size:64px;font-weight:700;line-height:1}
      .rpt-trait-row{display:flex;align-items:center;padding:12px 20px;border-bottom:1px solid #F5F0E8}
      .rpt-trait-row:last-child{border-bottom:none}
      .rpt-bar-track{flex:1;height:8px;background:#EAE6DC;border-radius:4px;margin:0 16px}
      .rpt-bar-fill{height:8px;border-radius:4px;transition:width .8s}
      .rpt-flag{display:flex;gap:10px;padding:10px 16px;border-left:3px solid #DC2626;margin-bottom:8px;background:#FEF2F2;border-radius:0 4px 4px 0;font-size:13px;color:#DC2626;line-height:1.5}
      .rpt-pin-box{background:#fff;border:1px solid #E0DBD0;border-radius:8px;padding:32px;text-align:center;max-width:380px;margin:0 auto 24px}
      .rpt-pin-input{width:100%;border:2px solid #D4CFC4;border-radius:6px;padding:12px;font-size:24px;letter-spacing:8px;text-align:center;font-family:'Playfair Display',serif;color:#1B2A4A;outline:none;margin:12px 0;transition:border-color .2s}
      .rpt-pin-input:focus{border-color:#C9A84C}
    `}</style>
    <div className="rpt-wrap">
      {/* Header */}
      <div className="rpt-hdr">
        <div className="rpt-hdr-top">
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#C9A84C", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>CasinoPro Solutions</div>
            <div style={{ fontFamily: "'Playfair Display',serif", color: "#fff", fontSize: 22, fontWeight: 700 }}>CDAT Report</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>Casino Dealer Aptitude Assessment · Confidential</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ background: "#C9A84C", color: "#1B2A4A", padding: "5px 14px", fontSize: 11, fontWeight: 700, letterSpacing: 1, borderRadius: 2 }}>{property?.propertyName}</div>
            <button onClick={onNewCandidate} style={{ background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)", color: "#C9A84C", padding: "6px 14px", cursor: "pointer", fontSize: 12, borderRadius: 4, fontFamily: "inherit" }}>New Candidate</button>
            <button onClick={onBack} style={{ background: "transparent", border: "1px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.7)", padding: "6px 14px", cursor: "pointer", fontSize: 12, borderRadius: 4, fontFamily: "inherit" }}>← Dashboard</button>
          </div>
        </div>
        <div className="rpt-hdr-gold" />
      </div>

      <div className="rpt-body">
        {/* Score + Traits */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Overall Score */}
          <div className="rpt-section">
            <div className="rpt-section-hdr"><div className="rpt-section-lbl">Overall Composite Score</div></div>
            <div style={{ padding: 28, textAlign: "center" }}>
              <div className="rpt-score-big" style={{ color: tier.color }}>{overall}<span style={{ fontSize: 28 }}>%</span></div>
              <div style={{ marginTop: 12, display: "inline-block", padding: "6px 20px", borderRadius: 99, background: tier.bg, color: tier.color, fontWeight: 700, fontSize: 12, letterSpacing: 1, border: `1px solid ${tier.color}40` }}>{tier.label}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 10, lineHeight: 1.5 }}>{tier.desc}</div>
            </div>
          </div>
          {/* Trait Breakdown */}
          <div className="rpt-section">
            <div className="rpt-section-hdr"><div className="rpt-section-lbl">Trait Breakdown</div></div>
            <div style={{ padding: "8px 0" }}>
              {scores.map(s => (
                <div className="rpt-trait-row" key={s.trait}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1B2A4A", minWidth: 160 }}>{s.trait}</div>
                  <div className="rpt-bar-track">
                    <div className="rpt-bar-fill" style={{ width: `${s.pct}%`, background: traitColor(s.pct) }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: traitColor(s.pct), minWidth: 40, textAlign: "right" }}>{s.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PIN gate */}
        {!unlocked ? (
          <div className="rpt-pin-box">
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#C9A84C", fontWeight: 700, marginBottom: 8 }}>🔐 HR Access Required</div>
            <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 4, lineHeight: 1.6 }}>Enter your HR PIN to unlock the full report.</div>
            <input className="rpt-pin-input" type="password" maxLength={4} placeholder="••••" value={pinInput}
              onChange={e => { setPinInput(e.target.value); setPinError(""); }}
              onKeyDown={e => e.key === "Enter" && tryPin()} />
            {pinError && <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 10 }}>{pinError}</div>}
            <button onClick={tryPin} style={{ width: "100%", background: "#C9A84C", color: "#1B2A4A", border: "none", borderRadius: 6, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Unlock Full Report →</button>
          </div>
        ) : (
          <>
            {/* Red Flags */}
            <div className="rpt-section" style={{ marginBottom: 20 }}>
              <div className="rpt-section-hdr" style={{ background: flags.length > 0 ? "#DC2626" : "#2E7D32" }}>
                <div className="rpt-section-lbl" style={{ color: "#fff" }}>{flags.length > 0 ? `⚠ Red Flags Detected (${flags.length})` : "✓ No Red Flags Detected"}</div>
              </div>
              <div style={{ padding: flags.length > 0 ? 16 : 20 }}>
                {flags.length > 0
                  ? flags.map((f, i) => <div key={i} className="rpt-flag">⚠ {f}</div>)
                  : <div style={{ fontSize: 14, color: "#2E7D32", fontWeight: 600 }}>Responses appear consistent and genuine across all traits.</div>
                }
              </div>
            </div>

            {/* HR Analysis */}
            <div className="rpt-section" style={{ marginBottom: 20 }}>
              <div className="rpt-section-hdr"><div className="rpt-section-lbl">HR Analysis</div></div>
              <div style={{ padding: 20, fontSize: 14, color: "#374151", lineHeight: 1.8 }}>
                {overall >= 85 && "This candidate demonstrates an exceptional behavioral profile across all five dealer traits. Their responses reflect a natural aptitude for guest interaction, composure under pressure, and professional dependability. Strongly recommended for advancement in the hiring process."}
                {overall >= 70 && overall < 85 && "This candidate shows a strong overall profile with above-average scores in most trait areas. Minor gaps noted but are consistent with trainable behaviors. Recommended for interview with focused questions on lower-scoring areas."}
                {overall >= 55 && overall < 70 && "This candidate presents a mixed profile. Strengths exist but are offset by meaningful gaps in key dealer traits. Proceed with caution and use the suggested interview questions to explore potential concerns."}
                {overall < 55 && "This candidate's behavioral profile raises significant concerns for a dealer role. Low scores across multiple trait areas suggest potential fit challenges. Not recommended without further structured evaluation."}
              </div>
            </div>

            {/* Interview Questions */}
            {interviewQs.length > 0 && (
              <div className="rpt-section" style={{ marginBottom: 20 }}>
                <div className="rpt-section-hdr"><div className="rpt-section-lbl">Suggested Interview Questions</div></div>
                <div style={{ padding: 20 }}>
                  {interviewQs.map((q, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, padding: "10px 14px", background: "#F5F0E8", borderRadius: 6, border: "1px solid #E0DBD0" }}>
                      <span style={{ fontWeight: 700, color: "#C9A84C", flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => window.print()} style={{ background: "#C9A84C", color: "#1B2A4A", border: "none", borderRadius: 6, padding: "11px 26px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>⬇ Print Report</button>
              <button onClick={onNewCandidate} style={{ background: "#1B2A4A", color: "#C9A84C", border: "none", borderRadius: 6, padding: "11px 26px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>New Candidate →</button>
              <button onClick={onBack} style={{ background: "transparent", color: "#6B7280", border: "1px solid #E0DBD0", borderRadius: 6, padding: "11px 26px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Dashboard</button>
            </div>
          </>
        )}
      </div>
    </div></>
  );
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
function AdminDashboard({ onClose }) {
  const [codes, setCodes] = useState({});
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPlan, setNewPlan] = useState("trial");
  const [msg, setMsg] = useState("");

  async function refresh() {
    setLoading(true);
    const data = await getAllCodes();
    setCodes(data);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function addCode() {
    if (!newCode.trim() || !newName.trim()) { setMsg("Code and property name are required."); return; }
    const key = newCode.trim().toUpperCase();
    if (codes[key]) { setMsg(`Code ${key} already exists.`); return; }
    const pin = genPin();
    try {
      await createCode({
        code: key, propertyName: newName.trim(),
        contactName: newContact.trim(), email: newEmail.trim(),
        plan: newPlan, hrPin: pin, freeLimit: FREE_LIMIT,
      });
      setMsg(`✓ Code ${key} created. HR PIN: ${pin}`);
      setNewCode(""); setNewName(""); setNewContact(""); setNewEmail(""); setNewPlan("trial");
      refresh();
    } catch(e) { setMsg("Error creating code. Please try again."); }
  }

  async function deleteCode(key) {
    if (!window.confirm(`Delete code ${key}?`)) return;
    await deleteCodeFromDB(key);
    refresh();
  }

  async function resetUsage(key) {
    await resetUsageInDB(key);
    refresh();
  }

  async function upgradeCode(key) {
    await upgradeCodeInDB(key);
    refresh();
  }

  const entries = Object.values(codes);
  const totalUsed = entries.reduce((a, r) => a + (r.used || 0), 0);
  const activeProps = entries.filter(r => (r.used || 0) > 0).length;
  const trialExpired = entries.filter(r => r.plan === "trial" && (r.used || 0) >= (r.freeLimit || FREE_LIMIT)).length;

  if (loading && entries.length === 0) return (
    <><style>{SUITE_STYLES}</style>
    <div style={{ minHeight: "100vh", background: "#0e1a2b", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#c9a84c", fontFamily: "'Cinzel',serif", fontSize: ".72rem", letterSpacing: ".3em" }}>LOADING...</div>
    </div></>
  );

  return (
    <><style>{SUITE_STYLES}</style>
    <div className="admin-wrap">
      <div className="hdr">
        <div><div className="hdr-eyebrow">CasinoPro Solutions</div><div className="hdr-title">Admin Dashboard</div></div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="hdr-badge">{entries.length} Properties</div>
          <button onClick={onClose} className="btn btn-ghost" style={{ fontSize: ".6rem" }}>← Back to Suite</button>
        </div>
      </div>
      <div className="content">
        <div className="stat-grid">
          {[[entries.length, "Total Properties"],[activeProps, "Active Properties"],[totalUsed, "Total Assessments Run"],[trialExpired, "Trials Expired"]].map(([n, l]) => (
            <div className="stat-card" key={l}><span className="stat-num">{n}</span><span className="stat-lbl">{l}</span></div>
          ))}
        </div>
        <div style={{ background: "#152338", border: "1px solid rgba(201,168,76,.2)", padding: 24, marginBottom: 32 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: ".62rem", letterSpacing: ".3em", color: "#c9a84c", textTransform: "uppercase", marginBottom: 16 }}>Add New Property</div>
          <div className="form-grid" style={{ marginBottom: 12 }}>
            {[["Property Code", newCode, setNewCode, "e.g. ARIA2025"], ["Property Name", newName, setNewName, "e.g. Aria Resort"], ["Contact Name", newContact, setNewContact, "HR Director"], ["Contact Email", newEmail, setNewEmail, "hr@casino.com"]].map(([l, v, set, ph]) => (
              <div className="field" key={l}>
                <label>{l}</label>
                <input value={v} onChange={e => set(e.target.value)} onInput={l === "Property Code" ? e => e.target.value = e.target.value.toUpperCase() : undefined} placeholder={ph} />
              </div>
            ))}
          </div>
          <div className="field" style={{ maxWidth: 240, marginBottom: 16 }}>
            <label>Plan</label>
            <select value={newPlan} onChange={e => setNewPlan(e.target.value)}>
              <option value="trial">Free Trial ({FREE_LIMIT} assessments)</option>
              <option value="paid">Paid — Per Assessment</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </div>
          {msg && <div style={{ color: "#c9a84c", fontSize: ".82rem", marginBottom: 12, fontFamily: "'Cinzel',serif", letterSpacing: ".05em" }}>{msg}</div>}
          <button onClick={addCode} className="btn btn-gold" style={{ fontSize: ".62rem" }}>Add Property Code ◆</button>
        </div>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: ".62rem", letterSpacing: ".3em", color: "#c9a84c", textTransform: "uppercase", marginBottom: 16 }}>Active Properties ({entries.length})</div>
        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#8a9db5", fontSize: ".88rem" }}>No property codes yet. Add your first one above.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr><th>Code</th><th>Property</th><th>HR PIN</th><th>Plan</th><th>Used</th><th>Remaining</th><th>Last Used</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {entries.map(rec => {
                  const limit = rec.plan === "unlimited" ? Infinity : (rec.freeLimit || FREE_LIMIT);
                  const remaining = rec.plan === "unlimited" ? "∞" : Math.max(0, limit - (rec.used || 0));
                  const pct = rec.plan === "unlimited" ? 0 : Math.min(100, ((rec.used || 0) / limit) * 100);
                  const expired = rec.plan === "trial" && remaining === 0;
                  const remainColor = remaining === "∞" ? "#c9a84c" : remaining <= 2 ? "#C62828" : remaining <= WARN_AT ? "#E65100" : "#2E7D32";
                  return (
                    <tr key={rec.code}>
                      <td><strong style={{ color: "#c9a84c", fontFamily: "'Cinzel',serif", letterSpacing: ".1em" }}>{rec.code}</strong></td>
                      <td>
                        <div style={{ color: "#f7f2e8", fontWeight: 600 }}>{rec.propertyName}</div>
                        {rec.contactName && <div style={{ fontSize: ".78rem", color: "#8a9db5" }}>{rec.contactName}</div>}
                        {rec.email && <div style={{ fontSize: ".72rem", color: "#8a9db5" }}>{rec.email}</div>}
                      </td>
                      <td><strong style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: "#c9a84c" }}>{rec.hrPin}</strong></td>
                      <td><span style={{ fontSize: ".72rem", fontFamily: "'Cinzel',serif", letterSpacing: ".1em", textTransform: "uppercase", color: expired ? "#C62828" : rec.plan === "unlimited" ? "#c9a84c" : "#d4c9b0" }}>{expired ? "EXPIRED" : rec.plan}</span></td>
                      <td>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#f7f2e8" }}>{rec.used || 0}</div>
                        {rec.plan !== "unlimited" && <div style={{ marginTop: 4, height: 3, background: "rgba(201,168,76,.1)", width: 60 }}><div style={{ height: 3, background: expired ? "#C62828" : "#c9a84c", width: `${pct}%` }} /></div>}
                      </td>
                      <td><span style={{ color: remainColor, fontWeight: 700, fontSize: 15 }}>{remaining}</span></td>
                      <td style={{ fontSize: ".72rem", color: "#8a9db5" }}>{rec.lastUsed ? new Date(rec.lastUsed).toLocaleDateString() : "Never"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button onClick={() => resetUsage(rec.code)} className="btn" style={{ background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)", color: "#c9a84c", padding: "4px 10px", fontSize: ".62rem", fontFamily: "'Cinzel',serif", letterSpacing: ".08em" }}>Reset</button>
                          {rec.plan === "trial" && <button onClick={() => upgradeCode(rec.code)} className="btn" style={{ background: "rgba(46,125,50,.1)", border: "1px solid rgba(46,125,50,.3)", color: "#4caf50", padding: "4px 10px", fontSize: ".62rem", fontFamily: "'Cinzel',serif", letterSpacing: ".08em" }}>Upgrade</button>}
                          <button onClick={() => deleteCode(rec.code)} className="btn btn-danger" style={{ padding: "4px 10px", fontSize: ".62rem", fontFamily: "'Cinzel',serif", letterSpacing: ".08em" }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div></>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState("codegate");
  const [property, setProperty] = useState(null);
  const [propertyCode, setPropertyCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [cdatAnswers, setCdatAnswers] = useState(null);
  const topRef = useRef(null);
  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth" });

  function handleLogoClick() {
    const next = logoClickCount + 1;
    setLogoClickCount(next);
    if (next >= 3) { setLogoClickCount(0); setPhase("admin"); }
  }

  const [codeLoading, setCodeLoading] = useState(false);

  async function handleEnterCode() {
    const code = codeInput.trim().toUpperCase();
    if (!code) { setCodeError("Please enter your property code."); return; }
    if (code === ADMIN_PIN.toUpperCase()) { setPhase("admin"); return; }
    setCodeLoading(true);
    const rec = await getCodeFromDB(code);
    setCodeLoading(false);
    if (!rec) { setCodeError("Code not recognized. Please contact CasinoPro Solutions."); return; }
    const limit = rec.plan === "unlimited" ? Infinity : (rec.freeLimit || FREE_LIMIT);
    if (rec.plan === "trial" && (rec.used || 0) >= limit) {
      setProperty(rec); setPropertyCode(code); setPhase("upgrade"); return;
    }
    setProperty(rec); setPropertyCode(code); setPhase("suite"); scrollTop();
  }

  async function launchCDAT() {
    await incrementUsageInDB(propertyCode);
    const updated = await getCodeFromDB(propertyCode);
    setProperty(updated);
    setCdatAnswers(null);
    setPhase("cdat");
    scrollTop();
  }

  function handleCDATComplete(answers) {
    setCdatAnswers(answers);
    setPhase("cdat-report");
    scrollTop();
  }

  function handleNewCandidate() {
    setCdatAnswers(null);
    setPhase("suite");
    scrollTop();
  }

  if (phase === "admin") return <AdminDashboard onClose={() => setPhase("codegate")} />;

  if (phase === "cdat") return (
    <CDATAssessment
      onComplete={handleCDATComplete}
      onBack={() => setPhase("suite")}
    />
  );

  if (phase === "cdat-report") return (
    <CDATReport
      answers={cdatAnswers}
      property={property}
      onBack={() => setPhase("suite")}
      onNewCandidate={handleNewCandidate}
    />
  );

  if (phase === "upgrade") return (
    <><style>{SUITE_STYLES}</style>
    <div className="upgrade-wrap">
      <div className="hdr"><div><div className="hdr-eyebrow">CasinoPro Solutions</div><div className="hdr-title">Assessment Suite</div></div><div className="hdr-badge">Trial Complete</div></div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", flexDirection: "column", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎰</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: "#f7f2e8", marginBottom: 10 }}>Free Trial Complete</div>
        <div style={{ fontSize: ".95rem", color: "#8a9db5", marginBottom: 28, lineHeight: 1.7, maxWidth: 460 }}>
          <strong style={{ color: "#f7f2e8" }}>{property?.propertyName}</strong> has used all {FREE_LIMIT} free assessments.<br />Contact CasinoPro Solutions to continue.
        </div>
        <a href="mailto:rocky@casinoprosolutions.com?subject=Assessment Suite Upgrade" style={{ background: "#c9a84c", color: "#0e1a2b", padding: "13px 32px", fontSize: ".72rem", fontFamily: "'Cinzel',serif", letterSpacing: ".15em", textDecoration: "none", fontWeight: 700, textTransform: "uppercase" }}>Contact Rocky to Upgrade ◆</a>
      </div>
    </div></>
  );

  if (phase === "codegate") return (
    <><style>{SUITE_STYLES}</style>
    <div className="gate-wrap" ref={topRef}>
      <div className="hdr">
        <div onClick={handleLogoClick} style={{ cursor: "pointer" }}>
          <div className="hdr-eyebrow">CasinoPro Solutions</div>
          <div className="hdr-title">Assessment Suite</div>
        </div>
        <div className="hdr-badge">Property Access</div>
      </div>
      <div className="gate-center">
        <div style={{ width: "100%", maxWidth: 460 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 60, height: 60, background: "#152338", border: "1px solid rgba(201,168,76,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>🏢</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: "#f7f2e8", marginBottom: 8 }}>Property Access</div>
            <div style={{ fontSize: ".88rem", color: "#8a9db5" }}>Enter your casino's property code to begin.</div>
          </div>
          <div className="gate-card">
            <div className="gate-card-hdr">
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: ".58rem", letterSpacing: ".3em", color: "#c9a84c", textTransform: "uppercase", marginBottom: 6 }}>CasinoPro Solutions Suite</div>
              <div style={{ fontSize: ".82rem", color: "rgba(255,255,255,.6)" }}>CDAT · DPAT — Dealer Assessment Tools</div>
            </div>
            <div className="gate-card-body">
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: ".55rem", letterSpacing: ".2em", color: "#8a9db5", textTransform: "uppercase", marginBottom: 8 }}>Property Code</div>
              <input className="gate-input" type="text" placeholder="e.g. ARIA2025" value={codeInput} maxLength={12}
                onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(""); }}
                onKeyDown={e => e.key === "Enter" && handleEnterCode()} autoFocus />
              {codeError && <div className="gate-error">⚠ {codeError}</div>}
              <button className="btn btn-gold" style={{ width: "100%", marginTop: 16, padding: "13px", fontSize: ".72rem" }} onClick={handleEnterCode} disabled={codeLoading}>{codeLoading ? "Checking..." : "Enter →"}</button>
              <div style={{ fontSize: ".75rem", color: "#8a9db5", textAlign: "center", marginTop: 12 }}>
                Don't have a code? Contact <strong style={{ color: "#c9a84c" }}>CasinoPro Solutions</strong> to get started.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div></>
  );

  if (phase === "suite") {
    const limit = property?.plan === "unlimited" ? Infinity : (property?.freeLimit || FREE_LIMIT);
    const used = property?.used || 0;
    const remaining = property?.plan === "unlimited" ? null : Math.max(0, limit - used);
    const usagePct = property?.plan === "unlimited" ? 0 : Math.min(100, (used / limit) * 100);
    const remainColor = remaining === null ? "#c9a84c" : remaining <= 2 ? "#C62828" : remaining <= WARN_AT ? "#E65100" : "#2E7D32";

    return (
      <><style>{SUITE_STYLES}</style>
      <div ref={topRef}>
        <div className="hdr">
          <div onClick={handleLogoClick} style={{ cursor: "pointer" }}>
            <div className="hdr-eyebrow">CasinoPro Solutions</div>
            <div className="hdr-title">Assessment Suite</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {property?.plan && <div className="hdr-badge">{property.plan === "unlimited" ? "Unlimited" : property.plan.charAt(0).toUpperCase() + property.plan.slice(1)}</div>}
            <button onClick={() => { setPhase("codegate"); setCodeInput(""); }} className="btn btn-ghost" style={{ fontSize: ".58rem", letterSpacing: ".15em" }}>Sign Out</button>
          </div>
        </div>
        <div className="content">
          <div className="suite-welcome">
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: ".62rem", letterSpacing: ".4em", color: "#c9a84c", textTransform: "uppercase", marginBottom: 12 }}>Welcome</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "2rem", fontWeight: 700, color: "#f7f2e8", marginBottom: 8 }}>{property?.propertyName || "Your Property"}</div>
            <div style={{ fontSize: ".88rem", color: "#8a9db5" }}>Select an assessment to begin.</div>
          </div>

          {remaining !== null && (
            <div className="usage-bar-wrap">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: ".58rem", letterSpacing: ".2em", color: "#8a9db5", textTransform: "uppercase" }}>Assessment Usage</div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: ".62rem", letterSpacing: ".1em", color: remainColor }}>{remaining} remaining of {limit}</div>
              </div>
              <div className="usage-bar"><div className="usage-bar-fill" style={{ width: `${usagePct}%`, background: remainColor }} /></div>
              {remaining <= WARN_AT && remaining > 0 && <div style={{ fontSize: ".78rem", color: "#E65100", marginTop: 8, fontStyle: "italic" }}>⚠ Running low — contact CasinoPro Solutions to upgrade.</div>}
              {remaining === 0 && <div style={{ fontSize: ".78rem", color: "#C62828", marginTop: 8, fontStyle: "italic" }}>✕ No assessments remaining. Contact Rocky to continue.</div>}
            </div>
          )}

          <div className="suite-grid">
            <div className="suite-card featured" onClick={() => remaining !== 0 && launchCDAT()} style={{ opacity: remaining === 0 ? .5 : 1, cursor: remaining === 0 ? "not-allowed" : "pointer" }}>
              <div className="suite-card-badge">◆ Available Now</div>
              <div className="suite-card-name">CDAT</div>
              <div className="suite-card-sub">Casino Dealer Aptitude Assessment Tool</div>
              <p className="suite-card-desc">A 40-question behavioral assessment evaluating five traits proven to predict dealer success. Completed in 7 minutes.</p>
              <ul className="suite-card-features">
                <li>5 behavioral traits with reverse scoring</li>
                <li>Instant PIN-gated HR report</li>
                <li>Red flag detection & consistency analysis</li>
                <li>Suggested interview questions</li>
              </ul>
              <button className="btn btn-gold" style={{ fontSize: ".62rem" }} disabled={remaining === 0}>Launch CDAT →</button>
            </div>

            <div className="suite-card" onClick={() => remaining !== 0 && window.open("https://dpat-assessment.vercel.app", "_blank")} style={{ opacity: remaining === 0 ? .5 : 1, cursor: remaining === 0 ? "not-allowed" : "pointer" }}>
              <div className="suite-card-badge">◆ Available Now</div>
              <div className="suite-card-name">DPAT</div>
              <div className="suite-card-sub">Dealer Performance Aptitude Tool</div>
              <p className="suite-card-desc">A structured written assessment for experienced dealer candidates. Takes 20 minutes.</p>
              <ul className="suite-card-features">
                <li>10 behavioral trait questions</li>
                <li>18 situational judgment scenarios</li>
                <li>Eagle Dealer™ tier classification</li>
                <li>Auto-generated PDF report</li>
              </ul>
              <button className="btn btn-navy" style={{ fontSize: ".62rem" }} disabled={remaining === 0}>Launch DPAT →</button>
            </div>
          </div>

          <div style={{ textAlign: "center", fontSize: ".75rem", color: "#8a9db5", borderTop: "1px solid rgba(201,168,76,.1)", paddingTop: 24 }}>
            Both assessments share your property code and HR PIN.<br />
            Questions? Contact <strong style={{ color: "#c9a84c" }}>rocky@casinoprosolutions.com</strong>
          </div>
        </div>
      </div></>
    );
  }

  return null;
}
