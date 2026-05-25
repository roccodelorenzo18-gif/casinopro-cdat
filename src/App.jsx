import { useState, useEffect, useRef, useCallback } from "react";

// ── PDF GENERATION ────────────────────────────────────────────────────────────
async function loadJsPDF() {
  if (window.jspdf) return window.jspdf.jsPDF;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => resolve(window.jspdf.jsPDF);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function generateHRPdf(applicant, results) {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const pw = 210, lm = 18, rm = 18, cw = pw - lm - rm;
  let y = 0;

  const gold  = [184,134,11];  const dark  = [17,24,39];
  const mid   = [55,65,81];    const muted = [107,114,128];
  const green = [5,150,105];   const amber = [217,119,6];
  const red   = [220,38,38];   const white = [255,255,255];
  const bg    = [247,248,250]; const border= [232,234,237];

  const { traitResults, overall, recommendation, totalRedFlags, inconsistencies, interviewQs } = results;
  const mins = Math.floor(results.timeTaken / 60), secs = results.timeTaken % 60;

  function recCol() {
    return recommendation === "RECOMMEND TO HIRE" ? green
         : recommendation === "PROCEED WITH CAUTION" ? amber : red;
  }
  function traitCol(p) { return p >= 75 ? green : p >= 55 ? amber : red; }

  // HEADER BAND
  doc.setFillColor(...[17,24,39]); doc.rect(0,0,pw,28,"F");
  doc.setFillColor(...gold);       doc.rect(0,26,pw,2,"F");
  doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.setTextColor(...white);
  doc.text("CDAT", lm, 13);
  doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(180,180,180);
  doc.text("Casino Dealer Aptitude Assessment  |  CONFIDENTIAL HR REPORT", lm+22, 13);
  doc.setTextColor(...gold); doc.setFontSize(8);
  doc.text("FOR AUTHORIZED PERSONNEL ONLY", pw-rm, 20, { align:"right" });
  y = 36;

  // CANDIDATE STRIP
  doc.setFillColor(...bg); doc.setDrawColor(...border); doc.setLineWidth(0.3);
  doc.roundedRect(lm, y, cw, 22, 3, 3, "FD");
  doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(...dark);
  doc.text(applicant.name, lm+6, y+8);
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(...muted);
  doc.text(applicant.position, lm+6, y+14);
  [["Date",applicant.date],["Time Taken",`${mins}m ${secs}s`]].forEach(([label,val],i)=>{
    const x = lm + (cw/2)*i + cw/4 + 40;
    doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(...muted);
    doc.text(label.toUpperCase(), x, y+8, {align:"center"});
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...dark);
    doc.text(val, x, y+15, {align:"center"});
  });
  y += 30;

  // SCORE BOX + TRAIT BARS
  const scoreBoxW = 58, radarBoxW = cw - scoreBoxW - 6;
  doc.setFillColor(...white); doc.setDrawColor(...recCol()); doc.setLineWidth(0.5);
  doc.roundedRect(lm, y, scoreBoxW, 38, 3, 3, "FD");
  doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(...muted);
  doc.text("OVERALL COMPOSITE SCORE", lm+scoreBoxW/2, y+6, {align:"center"});
  doc.setFont("helvetica","bold"); doc.setFontSize(34); doc.setTextColor(...recCol());
  doc.text(`${overall}%`, lm+scoreBoxW/2, y+22, {align:"center"});
  const pillY = y+27;
  doc.setFillColor(...recCol()); doc.roundedRect(lm+6, pillY, scoreBoxW-12, 7, 2, 2, "F");
  doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(...white);
  doc.text(recommendation, lm+scoreBoxW/2, pillY+5, {align:"center"});
  if (totalRedFlags>0) {
    doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(...red);
    doc.text(`${totalRedFlags} red flag${totalRedFlags>1?"s":""}`, lm+scoreBoxW/2, y+37, {align:"center"});
  }

  const bx = lm+scoreBoxW+6;
  doc.setFillColor(...white); doc.setDrawColor(...border); doc.setLineWidth(0.3);
  doc.roundedRect(bx, y, radarBoxW, 38, 3, 3, "FD");
  doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(...gold);
  doc.text("TRAIT BREAKDOWN", bx+6, y+6);
  traitResults.forEach((r,i) => {
    const by = y+11+i*5.6, barX = bx+52, barW = radarBoxW-58, barH = 3;
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...mid);
    doc.text(r.trait.name.length>22?r.trait.name.slice(0,22)+"…":r.trait.name, bx+6, by+2.5);
    doc.setFillColor(...border); doc.roundedRect(barX, by, barW, barH, 1,1,"F");
    doc.setFillColor(...traitCol(r.pct)); doc.roundedRect(barX, by, barW*r.pct/100, barH, 1,1,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(...traitCol(r.pct));
    doc.text(`${r.pct}%`, bx+radarBoxW-5, by+2.5, {align:"right"});
  });
  y += 44;

  // RED FLAGS
  const flags = traitResults.filter(r=>r.redFlags.length>0);
  if (flags.length>0) {
    doc.setFillColor(254,242,242); doc.setDrawColor(254,202,202); doc.setLineWidth(0.3);
    doc.roundedRect(lm,y,cw,8,2,2,"FD");
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(...red);
    doc.text(`RED FLAGS DETECTED (${totalRedFlags})`, lm+5, y+5.5);
    y += 12;
    flags.forEach(r => {
      doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(...red);
      doc.text(r.trait.name, lm+4, y+4); y += 7;
      r.redFlags.forEach(f => {
        doc.setFillColor(254,242,242); doc.roundedRect(lm+2,y,cw-4,8,1,1,"F");
        doc.setDrawColor(...red); doc.setLineWidth(0.5); doc.line(lm+2,y,lm+2,y+8);
        doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(...red);
        const lines = doc.splitTextToSize(`"${f}"`, cw-12);
        doc.text(lines, lm+6, y+4.5); y += lines.length*4+6;
      });
    });
    y += 4;
  }

  // CONSISTENCY
  if (inconsistencies.length>0) {
    doc.setFillColor(255,251,235); doc.setDrawColor(253,230,138); doc.setLineWidth(0.3);
    doc.roundedRect(lm,y,cw,8,2,2,"FD");
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(...amber);
    doc.text(`CONSISTENCY ISSUES (${inconsistencies.length} pair${inconsistencies.length>1?"s":""})`, lm+5, y+5.5);
    y += 12;
    inconsistencies.forEach((inc,i) => {
      doc.setFillColor(255,251,235); doc.setDrawColor(...amber); doc.setLineWidth(0.3);
      const l1 = doc.splitTextToSize(`"${inc.q1}"`, cw-10);
      const l2 = doc.splitTextToSize(`"${inc.q2}"`, cw-10);
      const boxH = l1.length*4 + l2.length*4 + 16;
      doc.roundedRect(lm,y,cw,boxH,2,2,"FD");
      doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(...amber);
      doc.text(`${inc.trait}  ·  Pair ${i+1}`, lm+5, y+5);
      doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(...mid);
      doc.text(l1, lm+5, y+10);
      doc.setTextColor(...muted); doc.text("contradicts ↕", lm+cw/2, y+10+l1.length*4, {align:"center"});
      doc.setTextColor(...mid); doc.text(l2, lm+5, y+14+l1.length*4);
      y += boxH+4;
    });
    y += 4;
  }

  // INTERVIEW PAGE
  if (interviewQs.length>0) {
    doc.addPage(); y = 18;
    doc.setFillColor(...[17,24,39]); doc.rect(0,0,pw,14,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...white);
    doc.text("CDAT  |  SUGGESTED INTERVIEW QUESTIONS", lm, 9);
    doc.setTextColor(...gold); doc.setFontSize(8);
    doc.text(applicant.name+"  ·  "+applicant.position, pw-rm, 9, {align:"right"});
    y = 24;
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...muted);
    doc.text("Generated for traits scoring below 70% or triggering red flags.", lm, y);
    y += 8;
    interviewQs.forEach(group => {
      doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(...gold);
      doc.text(group.traitName, lm, y);
      doc.setDrawColor(232,213,163); doc.setLineWidth(0.3); doc.line(lm,y+1.5,lm+cw,y+1.5);
      y += 6;
      group.questions.forEach((q,qi) => {
        const lines = doc.splitTextToSize(q, cw-16);
        const boxH = lines.length*4.5+6;
        doc.setFillColor(...bg); doc.setDrawColor(...border); doc.setLineWidth(0.2);
        doc.roundedRect(lm,y,cw,boxH,2,2,"FD");
        doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(...gold);
        doc.text(`${qi+1}.`, lm+4, y+5);
        doc.setFont("helvetica","normal"); doc.setTextColor(...mid);
        doc.text(lines, lm+10, y+5); y += boxH+3;
      });
      y += 4;
    });
    doc.setFillColor(253,248,236); doc.setDrawColor(232,213,163);
    doc.roundedRect(lm,y,cw,12,2,2,"FD");
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(...gold);
    doc.text("Interviewer Tip:", lm+5, y+5);
    doc.setFont("helvetica","normal"); doc.setTextColor(...mid);
    const tip = doc.splitTextToSize("Listen for specific past examples (S-T-A-R format), emotional regulation under pressure, and alignment with casino floor expectations.", cw-40);
    doc.text(tip, lm+30, y+5);
  }

  // FOOTER
  const pageCount = doc.internal.getNumberOfPages();
  for (let p=1; p<=pageCount; p++) {
    doc.setPage(p); doc.setFillColor(...[17,24,39]); doc.rect(0,290,pw,8,"F");
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(140,140,140);
    doc.text(`CDAT © ${new Date().getFullYear()}  ·  Confidential  ·  For Authorized Personnel Only`, lm, 295);
    doc.text(`Page ${p} of ${pageCount}`, pw-rm, 295, {align:"right"});
  }

  const filename = `CDAT_${applicant.name.replace(/\s+/g,"_")}_${applicant.date.replace(/,?\s+/g,"_")}.pdf`;
  doc.save(filename);
  return filename;
}

// ── SHAREABLE HR LINK ─────────────────────────────────────────────────────────
function buildHRLink(applicant, results) {
  const payload = {
    a: applicant,
    r: {
      overall: results.overall,
      recommendation: results.recommendation,
      timeTaken: results.timeTaken,
      totalRedFlags: results.totalRedFlags,
      traitResults: results.traitResults.map(t => ({ id: t.trait.id, name: t.trait.name, abbr: t.trait.abbr, pct: t.pct, redFlags: t.redFlags })),
      inconsistencies: results.inconsistencies,
      interviewQs: results.interviewQs,
    }
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const base = window.location.href.split("?")[0].split("#")[0];
  return `${base}?hr=${encoded}`;
}

function parseHRLink() {
  const params = new URLSearchParams(window.location.search);
  const hr = params.get("hr");
  if (!hr) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(hr))));
  } catch { return null; }
}

// ── DATA ──────────────────────────────────────────────────────────────────────

const TRAITS = [
  {
    id:"interaction", name:"Interaction & Friendliness", abbr:"I&F",
    questions:[
      {id:"i1",text:"I enjoy talking and interacting with people from different backgrounds.",reversed:false,redFlag:false},
      {id:"i2",text:"I greet people with a genuine smile, even when I am physically tired.",reversed:false,redFlag:false},
      {id:"i3",text:"I understand that part of my job is to make others feel comfortable, even when I'm having a bad day.",reversed:false,redFlag:false},
      {id:"i4",text:"When someone is being rude or difficult, I can keep the interaction positive without losing my composure.",reversed:false,redFlag:true},
      {id:"i5",text:"I make a conscious effort to remain warm and welcoming toward people.",reversed:false,redFlag:false},
      {id:"i6",text:"I find it difficult to remain friendly when someone is visibly rude to me.",reversed:true,redFlag:true},
      {id:"i7",text:"I tend to keep to myself when I feel stressed or overwhelmed.",reversed:true,redFlag:true},
      {id:"i8",text:"I struggle to hide my true feelings when I am annoyed.",reversed:true,redFlag:true},
    ],
  },
  {
    id:"patience", name:"Patience & Emotional Control", abbr:"P&E",
    questions:[
      {id:"p1",text:"I follow established procedures exactly, even when I know a faster way.",reversed:false,redFlag:false},
      {id:"p2",text:"I can perform the same task with the same level of care and attention.",reversed:false,redFlag:false},
      {id:"p3",text:"I can separate my personal feelings about a situation in the moment.",reversed:false,redFlag:false},
      {id:"p4",text:"I stay calm and professional, even when someone is rude or confrontational.",reversed:false,redFlag:true},
      {id:"p5",text:"I can remain patient when the same question or problem comes up repeatedly.",reversed:false,redFlag:false},
      {id:"p6",text:"I tend to lose patience when I must deal with the same issue repeatedly.",reversed:true,redFlag:true},
      {id:"p7",text:"I tend to let my emotions get the best of me.",reversed:true,redFlag:true},
      {id:"p8",text:"I find it difficult to stay calm when I feel overwhelmed.",reversed:true,redFlag:true},
    ],
  },
  {
    id:"communication", name:"Communication & Listening", abbr:"C&L",
    questions:[
      {id:"c1",text:"I make sure I understand instructions before acting.",reversed:false,redFlag:false},
      {id:"c2",text:"I stay focused on what someone is saying, even with distractions.",reversed:false,redFlag:false},
      {id:"c3",text:"I listen carefully to instructions and follow them accordingly.",reversed:false,redFlag:false},
      {id:"c4",text:"I ask questions when I am unsure of something.",reversed:false,redFlag:false},
      {id:"c5",text:"I can explain things clearly to others.",reversed:false,redFlag:false},
      {id:"c6",text:"I tend to talk more than I listen in a conversation.",reversed:true,redFlag:true},
      {id:"c7",text:"I sometimes miss important details when listening to instructions.",reversed:true,redFlag:true},
      {id:"c8",text:"I find it difficult to stay patient when I must explain the same thing repeatedly.",reversed:true,redFlag:false},
    ],
  },
  {
    id:"attention", name:"Attention to Detail & Focus", abbr:"A&F",
    questions:[
      {id:"a1",text:"When I'm under pressure, I still prioritize accuracy over speed.",reversed:false,redFlag:false},
      {id:"a2",text:"I perform basic mental math (addition/multiplication) quickly and accurately.",reversed:false,redFlag:false},
      {id:"a3",text:"I tend to catch errors before they become bigger problems.",reversed:false,redFlag:false},
      {id:"a4",text:"I remain consistent and precise, even during long or repetitive tasks.",reversed:false,redFlag:false},
      {id:"a5",text:"I double-check my work instinctively, even when I am in a hurry.",reversed:false,redFlag:false},
      {id:"a6",text:"I find it difficult to keep track of multiple things happening at once.",reversed:true,redFlag:true},
      {id:"a7",text:"I find my concentration slipping after 30 minutes of a detailed task.",reversed:true,redFlag:true},
      {id:"a8",text:"I overlook small but important details when I am trying to work quickly.",reversed:true,redFlag:true},
    ],
  },
  {
    id:"teamwork", name:"Teamwork & Dependability", abbr:"T&D",
    questions:[
      {id:"t1",text:"When I commit to something, I follow through on it.",reversed:false,redFlag:false},
      {id:"t2",text:"I admit mistakes immediately rather than trying to fix them quietly.",reversed:false,redFlag:true},
      {id:"t3",text:"Others can rely on me to follow through on my responsibilities.",reversed:false,redFlag:false},
      {id:"t4",text:"I support my team, even when it requires extra effort on my part.",reversed:false,redFlag:false},
      {id:"t5",text:"I adapt quickly to changes in schedules, procedures, or expectations.",reversed:false,redFlag:false},
      {id:"t6",text:"I hesitate to take initiative or accept new responsibilities.",reversed:true,redFlag:true},
      {id:"t7",text:"I prefer to focus only on my own responsibilities rather than helping others.",reversed:true,redFlag:true},
      {id:"t8",text:"I feel frustrated when asked to perform a task outside of my usual routine.",reversed:true,redFlag:true},
    ],
  },
];

const LIKERT = [
  {label:"Never",       value:1},
  {label:"Rarely",      value:2},
  {label:"Sometimes",   value:3},
  {label:"Often",       value:4},
  {label:"Always",      value:5},
];

const TIMER_SECONDS = 7 * 60;

const CONSISTENCY_PAIRS = [
  ["i4","i6"],["i5","i8"],["i3","i7"],
  ["p4","p7"],["p5","p6"],["p3","p8"],
  ["c2","c7"],["c3","c6"],
  ["a1","a8"],["a4","a7"],["a5","a6"],
  ["t1","t6"],["t4","t7"],["t5","t8"],
];

const INTERVIEW_QUESTIONS = {
  interaction:[
    "Tell me about a time you had to stay warm and friendly with a guest who was being difficult. What did you do?",
    "How do you reset emotionally between guest interactions when you're having a tough day?",
    "Describe a situation where you had to mask your frustration. How did you handle it?",
  ],
  patience:[
    "Walk me through how you stay calm when a guest is repeatedly confrontational.",
    "How do you maintain the same level of attention during a long, repetitive shift?",
    "Tell me about a time your emotions almost got the better of you at work. What happened?",
  ],
  communication:[
    "Describe a time you had to explain a complex rule or process to someone unfamiliar with it.",
    "How do you ensure you've fully understood instructions before acting on them?",
    "Tell me about a time you missed an important detail. What was the outcome?",
  ],
  attention:[
    "How do you maintain accuracy when you're working quickly under pressure?",
    "Tell me about a time you caught an error before it became a bigger problem.",
    "How do you handle tracking multiple things happening simultaneously at the table?",
  ],
  teamwork:[
    "Describe a time you had to admit a mistake immediately. How did your team respond?",
    "Tell me about a time you went beyond your usual role to help a colleague.",
    "How do you adapt when procedures or schedules change unexpectedly?",
  ],
};

const POSITIONS = [
  "Casino Dealer – Table Games",
  "Casino Dealer – Blackjack",
  "Casino Dealer – Poker",
  "Casino Dealer – Roulette",
  "Casino Dealer – Baccarat",
  "Casino Dealer – Craps",
  "Dual-Rate Dealer",
  "Other / Not Listed",
];

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C = {
  white:      "#FFFFFF",
  bg:         "#F7F8FA",
  border:     "#E8EAED",
  gold:       "#B8860B",
  goldBg:     "#FDF8EC",
  goldBorder: "#E8D5A3",
  text:       "#111827",
  textMid:    "#374151",
  textMuted:  "#6B7280",
  textFaint:  "#9CA3AF",
  green:      "#059669",
  greenBg:    "#ECFDF5",
  greenBorder:"#A7F3D0",
  amber:      "#D97706",
  amberBg:    "#FFFBEB",
  amberBorder:"#FDE68A",
  red:        "#DC2626",
  redBg:      "#FEF2F2",
  redBorder:  "#FECACA",
  shadow:     "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd:   "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)",
  shadowLg:   "0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)",
};

// ── UTILS ─────────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scoreQ(q, raw) { return q.reversed ? 6 - raw : raw; }

function calcResults(answers) {
  const allQMap = {};
  TRAITS.forEach(t => t.questions.forEach(q => allQMap[q.id] = q));

  const traitResults = TRAITS.map(trait => {
    let total = 0, redFlags = [];
    trait.questions.forEach(q => {
      const raw = answers[q.id]; if (!raw) return;
      const scored = scoreQ(q, raw); total += scored;
      if (q.redFlag && scored <= 2) redFlags.push(q.text);
    });
    const pct = Math.round((total / (trait.questions.length * 5)) * 100);
    return { trait, total, pct, redFlags };
  });

  const inconsistencies = [];
  CONSISTENCY_PAIRS.forEach(([fwdId, revId]) => {
    const fwdQ = allQMap[fwdId], revQ = allQMap[revId];
    if (!fwdQ || !revQ) return;
    const fwdRaw = answers[fwdId], revRaw = answers[revId];
    if (!fwdRaw || !revRaw) return;
    const fwdScored = scoreQ(fwdQ, fwdRaw), revScored = scoreQ(revQ, revRaw);
    if (Math.abs(fwdScored - revScored) >= 3)
      inconsistencies.push({ q1: fwdQ.text, q2: revQ.text, trait: TRAITS.find(t => t.questions.find(q => q.id === fwdId))?.name });
  });

  const overall = Math.round(traitResults.reduce((s, r) => s + r.pct, 0) / traitResults.length);
  const totalRedFlags = traitResults.reduce((s, r) => s + r.redFlags.length, 0);

  const interviewQs = [];
  traitResults.forEach(r => {
    if (r.pct < 70 || r.redFlags.length > 0)
      interviewQs.push({ traitName: r.trait.name, questions: INTERVIEW_QUESTIONS[r.trait.id] });
  });

  let recommendation, recColor, recBg, recBorder;
  if (overall >= 75 && totalRedFlags === 0 && inconsistencies.length === 0) {
    recommendation = "RECOMMEND TO HIRE"; recColor = C.green; recBg = C.greenBg; recBorder = C.greenBorder;
  } else if (overall >= 60 && totalRedFlags <= 2 && inconsistencies.length <= 2) {
    recommendation = "PROCEED WITH CAUTION"; recColor = C.amber; recBg = C.amberBg; recBorder = C.amberBorder;
  } else {
    recommendation = "DO NOT RECOMMEND"; recColor = C.red; recBg = C.redBg; recBorder = C.redBorder;
  }

  return { traitResults, overall, recommendation, recColor, recBg, recBorder, totalRedFlags, inconsistencies, interviewQs };
}

function traitColor(p) { return p >= 75 ? C.green : p >= 55 ? C.amber : C.red; }
function traitLabel(p) { return p >= 75 ? "Strong" : p >= 55 ? "Moderate" : "Needs Improvement"; }
function traitBg(p)    { return p >= 75 ? C.greenBg : p >= 55 ? C.amberBg : C.redBg; }
function traitBorder(p){ return p >= 75 ? C.greenBorder : p >= 55 ? C.amberBorder : C.redBorder; }

// ── TOP BAR ───────────────────────────────────────────────────────────────────
function TopBar({ right }) {
  return (
    <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 50, boxShadow: C.shadow }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>🃏</span>
        <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 17, fontWeight: 700, color: C.gold, letterSpacing: 2 }}>CDAT</span>
        <span style={{ fontSize: 12, color: C.textFaint, marginLeft: 4 }}>Casino Dealer Aptitude Assessment</span>
      </div>
      {right}
    </div>
  );
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
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: urgent ? C.redBg : C.goldBg, border: `1px solid ${urgent ? C.redBorder : C.goldBorder}`, borderRadius: 8, padding: "6px 12px" }}>
      <svg viewBox="0 0 32 32" style={{ width: 26, height: 26, transform: "rotate(-90deg)", flexShrink: 0 }}>
        <circle cx="16" cy="16" r="12" fill="none" stroke={urgent ? "#FECACA" : "#E8D5A3"} strokeWidth="2.5" />
        <circle cx="16" cy="16" r="12" fill="none" stroke={urgent ? C.red : C.gold} strokeWidth="2.5"
          strokeDasharray={`${2 * Math.PI * 12}`}
          strokeDashoffset={`${2 * Math.PI * 12 * (1 - pct / 100)}`}
          style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <span style={{ fontFamily: "'Courier New',monospace", fontSize: 17, fontWeight: 700, color: urgent ? C.red : C.gold, letterSpacing: 2, animation: urgent ? "timerPulse 0.8s infinite" : "none" }}>
        {m}:{s}
      </span>
    </div>
  );
}

// ── WELCOME PAGE ──────────────────────────────────────────────────────────────
function Welcome({ onContinue, onLogoClick }) {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const [form, setForm] = useState({ name: "", position: "", date: today });
  const [errors, setErrors] = useState({});

  function handleSubmit() {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your full name.";
    if (!form.position) e.position = "Please select a position.";
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onContinue(form);
  }

  const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 };
  const inputStyle = (err) => ({ width: "100%", background: C.white, border: `1.5px solid ${err ? C.red : C.border}`, borderRadius: 8, padding: "11px 14px", fontSize: 14, color: C.text, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s" });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <TopBar right={<span onClick={onLogoClick} style={{cursor:"default",userSelect:"none",fontSize:11,color:C.textFaint}}>v9</span>}/>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: C.goldBg, border: `1.5px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 16px" }}>🃏</div>
            <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Welcome</h1>
            <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>Please complete the fields below to begin your assessment.</p>
          </div>

          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: C.shadowLg, padding: "32px 36px" }}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Full Name</label>
              <input type="text" placeholder="e.g. Jordan M. Rivers" value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: "" })); }}
                style={inputStyle(errors.name)}
                onFocus={e => { e.target.style.borderColor = C.gold; e.target.style.boxShadow = `0 0 0 3px ${C.goldBg}`; }}
                onBlur={e => { e.target.style.borderColor = errors.name ? C.red : C.border; e.target.style.boxShadow = "none"; }} />
              {errors.name && <p style={{ fontSize: 12, color: C.red, marginTop: 5 }}>⚠ {errors.name}</p>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Position Applied For</label>
              <div style={{ position: "relative" }}>
                <select value={form.position}
                  onChange={e => { setForm(f => ({ ...f, position: e.target.value })); setErrors(er => ({ ...er, position: "" })); }}
                  style={{ ...inputStyle(errors.position), appearance: "none", cursor: "pointer", paddingRight: 36 }}
                  onFocus={e => { e.target.style.borderColor = C.gold; e.target.style.boxShadow = `0 0 0 3px ${C.goldBg}`; }}
                  onBlur={e => { e.target.style.borderColor = errors.position ? C.red : C.border; e.target.style.boxShadow = "none"; }}>
                  <option value="">Select a position…</option>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="12" height="8" viewBox="0 0 12 8">
                  <path d="M1 1l5 5 5-5" stroke={C.textFaint} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              {errors.position && <p style={{ fontSize: 12, color: C.red, marginTop: 5 }}>⚠ {errors.position}</p>}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Date</label>
              <input type="text" value={form.date} readOnly style={{ ...inputStyle(false), color: C.textMuted, cursor: "default", background: C.bg }} />
            </div>

            <div style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 10, padding: "14px 16px", marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.gold, margin: "0 0 8px" }}>Before You Begin</p>
              {[
                "40 questions — answered one at a time",
                "Once you move to the next question, you cannot go back",
                "7 minutes to complete the full assessment",
                "Frequency scale: Never · Rarely · Sometimes · Often · Always",
                "Answer each question honestly and independently",
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "flex-start" }}>
                  <span style={{ color: C.gold, fontSize: 10, marginTop: 2, flexShrink: 0 }}>✦</span>
                  <span style={{ fontSize: 12, color: C.textMid }}>{t}</span>
                </div>
              ))}
            </div>

            <button onClick={handleSubmit} style={{ width: "100%", background: C.gold, color: C.white, border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 1, fontFamily: "'Playfair Display',Georgia,serif", boxShadow: `0 4px 14px rgba(184,134,11,0.3)` }}>
              Continue →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── INTRO ─────────────────────────────────────────────────────────────────────
function Intro({ applicant, onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <TopBar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: 540 }}>
          <div style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 10, padding: "12px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: C.white, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontWeight: 700, color: C.gold, fontSize: 16 }}>
              {applicant.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{applicant.name}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{applicant.position}</div>
            </div>
          </div>

          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: C.shadowLg, padding: "36px" }}>
            <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>Assessment Instructions</h1>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 28px" }}>Please read carefully before beginning.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {[
                ["⏱", "7-minute timed assessment", "The countdown begins the moment you click Begin."],
                ["➡️", "One question at a time — forward only", "Each question appears on its own screen. Once you select an answer and advance, you cannot return to a previous question. Choose carefully."],
                ["📊", "Frequency scale", "Rate each statement: Never · Rarely · Sometimes · Often · Always"],
                ["🔒", "Answer independently", "Treat each question on its own merit. Do not try to align answers — respond honestly to each one."],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ display: "flex", gap: 14, padding: "14px 16px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{title}</div>
                    <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Forward-only notice */}
            <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <span style={{ fontSize: 13, color: C.amber, fontWeight: 500, lineHeight: 1.5 }}>
                <strong>No back button.</strong> Once you move to the next question, your answer is final. Read each statement carefully before selecting.
              </span>
            </div>

            <button onClick={onStart} style={{ width: "100%", background: C.gold, color: C.white, border: "none", borderRadius: 10, padding: "15px", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 1, fontFamily: "'Playfair Display',serif", boxShadow: `0 4px 14px rgba(184,134,11,0.3)` }}>
              Begin Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ONE-QUESTION-PER-PAGE ASSESSMENT ─────────────────────────────────────────
function Assessment({ questions, onComplete, onExpire, applicant }) {
  const total = questions.length;
  const [current, setCurrent] = useState(0);           // index of visible question
  const [answers, setAnswers] = useState({});           // locked answers
  const [selected, setSelected] = useState(null);       // staged answer for current Q
  const [animDir, setAnimDir] = useState("in");         // "in" | "out" for slide animation
  const [shake, setShake] = useState(false);            // shake if Next tapped with no answer

  const q = questions[current];
  const pct = Math.round((current / total) * 100);
  const isLast = current === total - 1;

  function handleNext() {
    if (selected === null) {
      // shake the button and options to prompt selection
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    // Lock answer
    const newAnswers = { ...answers, [q.id]: selected };
    setAnswers(newAnswers);

    if (isLast) {
      onComplete(newAnswers);
      return;
    }

    // Animate out then advance
    setAnimDir("out");
    setTimeout(() => {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnimDir("in");
    }, 220);
  }

  // Keyboard support: 1-5 to select, Enter to advance
  useEffect(() => {
    function handleKey(e) {
      if (e.key >= "1" && e.key <= "5") setSelected(parseInt(e.key));
      if (e.key === "Enter") handleNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected, current, answers]);

  const slideStyle = {
    opacity: animDir === "in" ? 1 : 0,
    transform: animDir === "in" ? "translateX(0)" : "translateX(40px)",
    transition: "opacity 0.22s ease, transform 0.22s ease",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Sticky header */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50, boxShadow: C.shadow }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 17 }}>🃏</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: C.gold, letterSpacing: 2 }}>CDAT</span>
            <span style={{ fontSize: 12, color: C.textFaint }}>· {applicant.name}</span>
          </div>
          <Timer seconds={TIMER_SECONDS} onExpire={() => onComplete(answers)} />
        </div>
        {/* Progress bar */}
        <div style={{ background: C.bg, height: 4 }}>
          <div style={{ background: C.gold, width: `${pct}%`, height: "100%", transition: "width 0.35s ease" }} />
        </div>
      </div>

      {/* Centred question area */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: 600 }}>

          {/* Question counter */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: C.textFaint, letterSpacing: 1 }}>
              Question <strong style={{ color: C.textMid }}>{current + 1}</strong> of <strong style={{ color: C.textMid }}>{total}</strong>
            </div>
            {/* Dot-row progress — shows last 10 questions as dots */}
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: Math.min(total, 20) }).map((_, i) => {
                const qIdx = total <= 20 ? i : Math.round(i * (total - 1) / 19);
                const done = qIdx < current;
                const active = qIdx === current;
                return (
                  <div key={i} style={{
                    width: active ? 20 : 8, height: 8, borderRadius: 99,
                    background: done ? C.gold : active ? C.gold : C.border,
                    opacity: done ? 0.5 : 1,
                    transition: "all 0.3s",
                  }} />
                );
              })}
            </div>
          </div>

          {/* Question card — slides on transition */}
          <div style={slideStyle}>
            <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: C.shadowLg, padding: "36px 40px", marginBottom: 20 }}>
              {/* Question text */}
              <p style={{ fontSize: 18, fontWeight: 500, color: C.text, lineHeight: 1.65, margin: "0 0 36px", letterSpacing: "-0.01em" }}>
                {q.text}
              </p>

              {/* Likert options — large tappable cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: shake ? "shakeAnim 0.45s ease" : "none" }}>
                {LIKERT.map((opt, idx) => {
                  const chosen = selected === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelected(opt.value)}
                      style={{
                        display: "flex", alignItems: "center", gap: 16,
                        padding: "14px 20px", borderRadius: 10, cursor: "pointer",
                        border: `1.5px solid ${chosen ? C.gold : C.border}`,
                        background: chosen ? C.goldBg : C.white,
                        textAlign: "left", outline: "none",
                        boxShadow: chosen ? `0 0 0 3px ${C.goldBg}` : "none",
                        transition: "all 0.12s",
                      }}>
                      {/* Radio circle */}
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${chosen ? C.gold : C.borderMid || "#D1D5DB"}`,
                        background: chosen ? C.gold : C.white,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.12s",
                      }}>
                        {chosen && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.white }} />}
                      </div>
                      {/* Frequency number + label */}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flex: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: chosen ? C.gold : C.textFaint, minWidth: 14 }}>{idx + 1}</span>
                        <span style={{ fontSize: 15, fontWeight: chosen ? 700 : 400, color: chosen ? C.gold : C.textMid }}>{opt.label}</span>
                      </div>
                      {chosen && <span style={{ fontSize: 14, color: C.gold }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next / Submit button */}
            <button
              onClick={handleNext}
              style={{
                width: "100%", padding: "15px",
                background: selected !== null ? C.gold : C.border,
                color: selected !== null ? C.white : C.textFaint,
                border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: selected !== null ? "pointer" : "not-allowed",
                letterSpacing: 1, fontFamily: "'Playfair Display',serif",
                boxShadow: selected !== null ? `0 4px 14px rgba(184,134,11,0.3)` : "none",
                transition: "all 0.15s",
                animation: shake ? "shakeAnim 0.45s ease" : "none",
              }}>
              {isLast ? "Submit Assessment" : `Next Question →`}
            </button>

            {/* Keyboard hint */}
            <p style={{ textAlign: "center", fontSize: 11, color: C.textFaint, marginTop: 12 }}>
              Tip: Press <kbd style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: "1px 5px", fontSize: 10, color: C.textMuted }}>1</kbd>–<kbd style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: "1px 5px", fontSize: 10, color: C.textMuted }}>5</kbd> to select · <kbd style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: "1px 5px", fontSize: 10, color: C.textMuted }}>Enter</kbd> to advance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── RADAR CHART ───────────────────────────────────────────────────────────────
function RadarChart({ traitResults }) {
  const cx = 150, cy = 150, r = 108;
  const angles = traitResults.map((_, i) => (Math.PI * 2 * i / 5) - Math.PI / 2);
  const gridPts = f => angles.map(a => [cx + r * f * Math.cos(a), cy + r * f * Math.sin(a)]);
  const scorePts = traitResults.map((res, i) => [cx + r * (res.pct / 100) * Math.cos(angles[i]), cy + r * (res.pct / 100) * Math.sin(angles[i])]);
  const toPath = pts => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + "Z";
  return (
    <svg viewBox="0 0 300 300" style={{ width: "100%", maxWidth: 260, display: "block", margin: "0 auto" }}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={gridPts(f).map(p => p.join(",")).join(" ")} fill="none" stroke={C.border} strokeWidth="1" />
      ))}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke={C.border} strokeWidth="1" />
      ))}
      <path d={toPath(scorePts)} fill={C.goldBg} stroke={C.gold} strokeWidth="2" />
      {scorePts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="5" fill={traitColor(traitResults[i].pct)} stroke={C.white} strokeWidth="1.5" />
      ))}
      {traitResults.map((res, i) => {
        const lx = cx + (r + 22) * Math.cos(angles[i]), ly = cy + (r + 22) * Math.sin(angles[i]);
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" fill={traitColor(res.pct)} fontFamily="'Courier New',monospace">{res.trait.abbr}</text>;
      })}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={C.gold} fontFamily="'Playfair Display',serif">CDAT</text>
    </svg>
  );
}

// ── SCORE BAR ─────────────────────────────────────────────────────────────────
function ScoreBar({ pct }) {
  return (
    <div style={{ background: C.bg, borderRadius: 99, height: 8, overflow: "hidden", marginTop: 8 }}>
      <div style={{ background: traitColor(pct), width: `${pct}%`, height: "100%", borderRadius: 99, transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)" }} />
    </div>
  );
}

// ── THANK YOU (candidate-facing — NO scores) ──────────────────────────────────
function ThankYou({ applicant, results, hrLink, onViewReport }) {
  const [pdfStatus, setPdfStatus] = useState("generating"); // generating | done | error
  const [filename, setFilename] = useState("");

  useEffect(() => {
    generateHRPdf(applicant, results)
      .then(name => { setFilename(name); setPdfStatus("done"); })
      .catch(() => setPdfStatus("error"));
  }, []);

  const [copied, setCopied] = useState(false);
  function copyLink() {
    navigator.clipboard.writeText(hrLink).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <TopBar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: 520, textAlign: "center" }}>

          {/* Success icon */}
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.greenBg, border: `2px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 24px", boxShadow: `0 0 0 8px ${C.greenBg}` }}>✓</div>

          <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 30, fontWeight: 700, color: C.text, margin: "0 0 12px" }}>
            Assessment Complete
          </h1>
          <p style={{ fontSize: 16, color: C.textMid, margin: "0 0 32px", lineHeight: 1.7 }}>
            Thank you, <strong>{applicant.name}</strong>.<br/>
            Your responses have been submitted successfully.
          </p>

          {/* What happens next */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 32px", boxShadow: C.shadowMd, textAlign: "left", marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 16 }}>What Happens Next</div>
            {[
              ["📋", "Your assessment has been received", "Your responses are being reviewed by the hiring team as part of the evaluation process."],
              ["🔒", "Results are confidential", "Assessment scores are reviewed only by the HR team and are not shared with applicants."],
              ["📞", "You will be contacted", "The hiring team will be in touch regarding next steps in your application."],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* PDF status */}
          <div style={{ background: pdfStatus === "done" ? C.greenBg : pdfStatus === "error" ? C.amberBg : C.goldBg, border: `1px solid ${pdfStatus === "done" ? C.greenBorder : pdfStatus === "error" ? C.amberBorder : C.goldBorder}`, borderRadius: 10, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>{pdfStatus === "done" ? "✅" : pdfStatus === "error" ? "⚠️" : "⏳"}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: pdfStatus === "done" ? C.green : pdfStatus === "error" ? C.amber : C.gold }}>
                {pdfStatus === "done" ? `HR report downloaded: ${filename}` : pdfStatus === "error" ? "PDF download unavailable — use the HR link below" : "Generating HR report PDF…"}
              </div>
              {pdfStatus === "done" && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Check your Downloads folder.</div>}
            </div>
          </div>

          {/* Submission confirmation strip */}
          <div style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 10, padding: "12px 18px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {[["Candidate", applicant.name], ["Position", applicant.position], ["Date", applicant.date]].map(([l, v]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>{l}</div>
                <div style={{ fontSize: 12, color: C.textMid, fontWeight: 500, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: C.textFaint, marginTop: 4 }}>You may now close this window.</p>

          {/* HR access section */}
          <div style={{ marginTop: 32, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.textFaint, fontWeight: 700, marginBottom: 12 }}>HR / Assessor Access</div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", boxShadow: C.shadow, textAlign: "left" }}>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
                Share this link with the hiring manager to access the full scored report on any device:
              </div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontFamily: "'Courier New',monospace", fontSize: 11, color: C.textMuted, wordBreak: "break-all", lineHeight: 1.5 }}>
                {hrLink.length > 80 ? hrLink.slice(0, 80) + "…" : hrLink}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={copyLink} style={{ flex: 1, background: copied ? C.greenBg : C.goldBg, border: `1px solid ${copied ? C.greenBorder : C.goldBorder}`, borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, color: copied ? C.green : C.gold, cursor: "pointer", transition: "all 0.15s" }}>
                  {copied ? "✓ Copied!" : "Copy HR Link"}
                </button>
                <button onClick={onViewReport} style={{ flex: 1, background: C.gold, border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, color: C.white, cursor: "pointer" }}>
                  Open HR Report →
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── HR REPORT (HR-only view — full scores, behind PIN) ────────────────────────
function HRReport({ results, timeTaken, applicant }) {
  const { traitResults, overall, recommendation, recColor, recBg, recBorder, totalRedFlags, inconsistencies, interviewQs } = results;
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [tab, setTab] = useState("overview");
  const mins = Math.floor(timeTaken / 60), secs = timeTaken % 60;

  // HR PIN — in production this would be set per property; here it's a fixed demo
  const HR_PIN = "1234";

  function handleUnlock() {
    if (pin === HR_PIN) { setUnlocked(true); setPinError(""); }
    else { setPinError("Incorrect PIN. Please try again."); setPin(""); }
  }

  const tabs = ["overview", "traits", "consistency", "interview"];
  const tabLabels = { overview: "Overview", traits: "Trait Detail", consistency: "Consistency", interview: "Interview Qs" };
  const tabIcons  = { overview: "📊", traits: "📋", consistency: "🔍", interview: "💬" };

  // ── PIN GATE ──
  if (!unlocked) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
        <TopBar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
          <div style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: C.goldBg, border: `1.5px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 16px" }}>🔐</div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>HR Access Only</h1>
              <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>Enter your assessor PIN to view the full candidate report.</p>
            </div>
            <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: C.shadowLg, padding: "32px 36px" }}>
              {/* Candidate summary (non-sensitive) */}
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.gold, fontSize: 16, fontFamily: "'Playfair Display',serif", flexShrink: 0 }}>
                  {applicant.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{applicant.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{applicant.position} · {applicant.date}</div>
                </div>
              </div>

              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Assessor PIN</label>
              <input
                type="password" placeholder="Enter PIN" value={pin} maxLength={8}
                onChange={e => { setPin(e.target.value); setPinError(""); }}
                onKeyDown={e => e.key === "Enter" && handleUnlock()}
                style={{ width: "100%", background: C.white, border: `1.5px solid ${pinError ? C.red : C.border}`, borderRadius: 8, padding: "12px 14px", fontSize: 18, color: C.text, fontFamily: "'Courier New',monospace", letterSpacing: 6, outline: "none", marginBottom: 8, textAlign: "center" }}
              />
              {pinError && <p style={{ fontSize: 12, color: C.red, marginBottom: 12 }}>⚠ {pinError}</p>}
              <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 16 }}>Demo PIN: <strong style={{ color: C.textMid, letterSpacing: 2 }}>1234</strong> — change this to your property code before deploying.</p>
              <button onClick={handleUnlock} style={{ width: "100%", background: C.gold, color: C.white, border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 1, fontFamily: "'Playfair Display',serif", boxShadow: `0 4px 14px rgba(184,134,11,0.3)` }}>
                View Report →
              </button>
            </div>
            <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "12px 16px", marginTop: 16, display: "flex", gap: 10 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
              <span style={{ fontSize: 12, color: C.amber, lineHeight: 1.5 }}>This report is confidential. Do not share with the applicant or unauthorized personnel.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FULL REPORT (unlocked) ──
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <TopBar right={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: 1 }}>🔐 HR VIEW</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>{applicant.date}</div>
        </div>
      } />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 16px 64px", width: "100%" }}>

        {/* Confidential banner */}
        <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "10px 18px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <span style={{ fontSize: 12, color: C.amber, fontWeight: 600 }}>Confidential — For Hiring Manager & HR Use Only. Do not share with the applicant.</span>
        </div>

        {/* Candidate strip */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 24px", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", boxShadow: C.shadow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 200 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.goldBg, border: `1.5px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontWeight: 700, color: C.gold, fontSize: 18, flexShrink: 0 }}>
              {applicant.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{applicant.name}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>{applicant.position}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
            {[["Date", applicant.date], ["Time Taken", `${mins}m ${secs}s`]].map(([l, v]) => (
              <div key={l} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: C.textFaint, fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: 13, color: C.textMid, fontWeight: 500, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 20, display: "flex", overflow: "hidden", boxShadow: C.shadow }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "13px 8px", background: tab === t ? C.goldBg : C.white, color: tab === t ? C.gold : C.textMuted, border: "none", borderBottom: tab === t ? `2px solid ${C.gold}` : "2px solid transparent", cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 700 : 400, transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span>{tabIcons[t]}</span><span style={{ whiteSpace: "nowrap" }}>{tabLabels[t]}</span>
            </button>
          ))}
        </div>

        {/* REPORT TABS — identical content to old Report component below */}

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div style={{ background: C.white, border: `1.5px solid ${recBorder}`, borderRadius: 14, padding: "28px 24px", textAlign: "center", boxShadow: C.shadowMd }}>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.textFaint, fontWeight: 600, marginBottom: 12 }}>Overall Composite Score</div>
                <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 64, fontWeight: 700, color: recColor, lineHeight: 1 }}>{overall}<span style={{ fontSize: 26 }}>%</span></div>
                <div style={{ margin: "16px auto 0", padding: "9px 20px", borderRadius: 99, background: recBg, color: recColor, fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", display: "inline-block", border: `1px solid ${recBorder}` }}>
                  {recommendation}
                </div>
                {totalRedFlags > 0 && <div style={{ marginTop: 10, fontSize: 12, color: C.red, fontWeight: 600 }}>⚠ {totalRedFlags} red flag{totalRedFlags > 1 ? "s" : ""}</div>}
                {inconsistencies.length > 0 && <div style={{ marginTop: 4, fontSize: 12, color: C.amber, fontWeight: 600 }}>🔄 {inconsistencies.length} inconsistenc{inconsistencies.length > 1 ? "ies" : "y"}</div>}
              </div>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", boxShadow: C.shadow, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RadarChart traitResults={traitResults} />
              </div>
            </div>

            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px", marginBottom: 16, boxShadow: C.shadow }}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 18 }}>Trait Summary</div>
              {[...traitResults].sort((a, b) => b.pct - a.pct).map(r => (
                <div key={r.trait.id} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                  <div style={{ minWidth: 190, fontSize: 13, color: C.textMid, fontWeight: 500 }}>{r.trait.name}</div>
                  <div style={{ flex: 1 }}><ScoreBar pct={r.pct} /></div>
                  <div style={{ minWidth: 42, textAlign: "right", fontWeight: 700, fontSize: 15, color: traitColor(r.pct) }}>{r.pct}%</div>
                  <div style={{ minWidth: 90, padding: "3px 10px", borderRadius: 99, background: traitBg(r.pct), color: traitColor(r.pct), border: `1px solid ${traitBorder(r.pct)}`, fontSize: 11, fontWeight: 600, textAlign: "center" }}>{traitLabel(r.pct)}</div>
                </div>
              ))}
            </div>

            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px", boxShadow: C.shadow }}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.textFaint, fontWeight: 700, marginBottom: 14 }}>Score Interpretation Guide</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
                {[
                  [C.green, C.greenBg, C.greenBorder, "75–100%", "Strong", "Consistent with the dealer role."],
                  [C.amber, C.amberBg, C.amberBorder, "55–74%", "Moderate", "May need coaching in this area."],
                  [C.red, C.redBg, C.redBorder, "0–54%", "Needs Improvement", "Concerns raised; further review advised."],
                  [C.red, C.redBg, C.redBorder, "Red Flag", "Critical", "Potentially disqualifying responses."],
                ].map(([col, bg, brd, range, label, desc]) => (
                  <div key={range} style={{ background: bg, border: `1px solid ${brd}`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: col, marginBottom: 4 }}>{range}</div>
                    <div style={{ fontWeight: 600, fontSize: 12, color: col, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TRAITS */}
        {tab === "traits" && (
          <div>
            {traitResults.map(r => (
              <div key={r.trait.id} style={{ background: C.white, border: `1px solid ${r.redFlags.length > 0 ? C.redBorder : C.border}`, borderRadius: 14, padding: "22px 26px", marginBottom: 14, boxShadow: C.shadow }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: "'Playfair Display',serif" }}>{r.trait.name}</div>
                    <div style={{ marginTop: 6, display: "inline-block", padding: "3px 10px", borderRadius: 99, background: traitBg(r.pct), color: traitColor(r.pct), border: `1px solid ${traitBorder(r.pct)}`, fontSize: 11, fontWeight: 600 }}>{traitLabel(r.pct)}</div>
                  </div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, color: traitColor(r.pct) }}>{r.pct}%</div>
                </div>
                <ScoreBar pct={r.pct} />
                {r.redFlags.length > 0 && (
                  <div style={{ marginTop: 16, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ color: C.red, fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>🚩 Red Flag{r.redFlags.length > 1 ? "s" : ""} Detected</div>
                    {r.redFlags.map((f, i) => (
                      <div key={i} style={{ color: C.red, fontSize: 13, marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${C.red}`, lineHeight: 1.5 }}>"{f}"</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CONSISTENCY */}
        {tab === "consistency" && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px", boxShadow: C.shadow }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Consistency Analysis</h3>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 24px", lineHeight: 1.6 }}>Paired questions measure the same trait from opposite directions. Large discrepancies may indicate inconsistent self-reporting.</p>
            {inconsistencies.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.greenBg, border: `1.5px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: C.green, marginBottom: 6 }}>No Inconsistencies Detected</div>
                <div style={{ fontSize: 13, color: C.textMuted }}>{applicant.name}'s responses appear internally consistent.</div>
              </div>
            ) : (
              <div>
                <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: C.amber, fontWeight: 600 }}>
                  ⚠ {inconsistencies.length} inconsistent pair{inconsistencies.length > 1 ? "s" : ""} detected. Recommend addressing in the interview.
                </div>
                {inconsistencies.map((inc, i) => (
                  <div key={i} style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "16px 18px", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: C.amber, fontWeight: 700, marginBottom: 10 }}>{inc.trait} · Pair {i + 1}</div>
                    <div style={{ fontSize: 13, color: C.textMid, paddingLeft: 12, borderLeft: `2px solid ${C.amber}`, marginBottom: 6, lineHeight: 1.5 }}>"{inc.q1}"</div>
                    <div style={{ fontSize: 11, color: C.textFaint, textAlign: "center", margin: "6px 0" }}>contradicts ↕</div>
                    <div style={{ fontSize: 13, color: C.textMid, paddingLeft: 12, borderLeft: `2px solid ${C.amber}`, lineHeight: 1.5 }}>"{inc.q2}"</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INTERVIEW */}
        {tab === "interview" && (
          <div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px", marginBottom: 16, boxShadow: C.shadow }}>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Suggested Interview Questions</h3>
              <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 24px", lineHeight: 1.6 }}>Generated based on traits where {applicant.name} scored below 70% or triggered red flags.</p>
              {interviewQs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.greenBg, border: `1.5px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>🎯</div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: C.green, marginBottom: 6 }}>No Focus Areas Flagged</div>
                  <div style={{ fontSize: 13, color: C.textMuted }}>Candidate scored well across all traits.</div>
                </div>
              ) : (
                interviewQs.map((group, i) => (
                  <div key={i} style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, fontFamily: "'Playfair Display',serif", paddingBottom: 8, borderBottom: `1px solid ${C.goldBorder}`, marginBottom: 12 }}>{group.traitName}</div>
                    {group.questions.map((q, j) => (
                      <div key={j} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start", padding: "10px 14px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                        <span style={{ fontWeight: 700, color: C.gold, fontSize: 13, flexShrink: 0, minWidth: 18 }}>{j + 1}.</span>
                        <span style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{q}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
            <div style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 12, padding: "16px 20px" }}>
              <p style={{ fontSize: 12, color: C.textMid, margin: 0, lineHeight: 1.7 }}>
                <strong style={{ color: C.gold }}>Interviewer Tip:</strong> Listen for specific past examples (S-T-A-R format), emotional regulation under pressure, and alignment with casino floor expectations.
              </p>
            </div>
          </div>
        )}

        <p style={{ fontSize: 11, color: C.textFaint, textAlign: "center", marginTop: 36 }}>
          CDAT © {new Date().getFullYear()} · Confidential · For authorized personnel only
        </p>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
// ── PROPERTY CODE SYSTEM ──────────────────────────────────────────────────────
// All codes stored in localStorage — no backend needed.
// You create codes manually via the Admin Dashboard.
// Each code tracks: propertyName, used count, plan type, created date.

const CODES_KEY      = "cdat_property_codes";
const FREE_LIMIT     = 20;
const WARN_THRESHOLD = 5;
const GUMROAD_URL    = "https://roccodelorenzo.gumroad.com/l/cdat-casino-dealer-assessment";
const ADMIN_PIN      = "CDAT2025"; // change this to your private admin PIN

function getCodes() {
  try { return JSON.parse(localStorage.getItem(CODES_KEY) || "{}"); }
  catch { return {}; }
}
function saveCode(code, record) {
  const codes = getCodes();
  codes[code.toUpperCase()] = record;
  localStorage.setItem(CODES_KEY, JSON.stringify(codes));
}
function getCode(code) {
  return getCodes()[code.toUpperCase()] || null;
}
function incrementUsage(code) {
  const codes = getCodes();
  const rec   = codes[code.toUpperCase()];
  if (!rec) return;
  rec.used += 1;
  rec.lastUsed = new Date().toISOString();
  localStorage.setItem(CODES_KEY, JSON.stringify(codes));
}

// ── PROPERTY CODE GATE ────────────────────────────────────────────────────────
function CodeGate({ onVerified }) {
  const [code, setCode]   = useState("");
  const [error, setError] = useState("");

  function handleEnter() {
    if (!code.trim()) { setError("Please enter your property code."); return; }
    const rec = getCode(code.trim());
    if (!rec) { setError("Code not recognized. Please contact CasinoPro Solutions."); return; }
    if (rec.plan === "paid" || rec.plan === "purchased") { onVerified(rec, code.trim().toUpperCase()); return; }
    if (rec.used >= FREE_LIMIT) { onVerified(rec, code.trim().toUpperCase()); return; } // show upgrade screen
    onVerified(rec, code.trim().toUpperCase());
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <TopBar/>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 16px" }}>
        <div style={{ width:"100%", maxWidth:440 }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:C.goldBg, border:`1.5px solid ${C.goldBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, margin:"0 auto 16px" }}>🏢</div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:C.text, margin:"0 0 8px" }}>Property Access</h1>
            <p style={{ fontSize:14, color:C.textMuted }}>Enter your casino's property code to begin.</p>
          </div>
          <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, boxShadow:C.shadowLg, padding:"32px 36px" }}>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:C.textMuted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Property Code</label>
            <input type="text" placeholder="e.g. ARIA2025" value={code} maxLength={12}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleEnter()}
              style={{ width:"100%", background:C.white, border:`1.5px solid ${error?C.red:C.border}`, borderRadius:8, padding:"12px 14px", fontSize:20, color:C.text, fontFamily:"'Courier New',monospace", letterSpacing:4, textAlign:"center", outline:"none", marginBottom:8 }}/>
            {error && <p style={{ fontSize:12, color:C.red, marginBottom:10 }}>⚠ {error}</p>}
            <button onClick={handleEnter} style={{ width:"100%", background:C.gold, color:C.white, border:"none", borderRadius:10, padding:"13px", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"'Playfair Display',serif", letterSpacing:1, boxShadow:`0 4px 14px rgba(184,134,11,0.3)`, marginTop:4 }}>
              Enter →
            </button>
            <p style={{ fontSize:11, color:C.textFaint, textAlign:"center", marginTop:12 }}>Don't have a code? Contact <strong style={{color:C.gold}}>CasinoPro Solutions</strong> to get started.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── UPGRADE SCREEN ────────────────────────────────────────────────────────────
function UpgradeScreen({ propertyName }) {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <TopBar/>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 16px" }}>
        <div style={{ width:"100%", maxWidth:560, textAlign:"center" }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:C.goldBg, border:`2px solid ${C.goldBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 20px" }}>🎰</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:C.text, margin:"0 0 10px" }}>Your Free Trial Is Complete</h1>
          <p style={{ fontSize:15, color:C.textMuted, margin:"0 0 36px", lineHeight:1.7 }}>
            <strong>{propertyName}</strong> has used all 20 free assessments. Choose how you'd like to continue using CDAT.
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:28 }}>
            {/* Pay per use */}
            <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:16, padding:"28px 24px", boxShadow:C.shadowMd }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:700, color:C.gold, lineHeight:1 }}>$15</div>
              <div style={{ fontSize:12, color:C.textMuted, margin:"4px 0 16px" }}>per assessment</div>
              <div style={{ fontSize:13, color:C.textMid, lineHeight:1.7, marginBottom:20 }}>
                Pay as you go. No monthly fee. Each completed assessment billed at $15.
              </div>
              <div style={{ fontSize:12, color:C.textMuted, background:C.bg, borderRadius:8, padding:"10px 12px", marginBottom:16, lineHeight:1.6 }}>
                Contact CasinoPro Solutions to activate pay-per-use billing for your property code.
              </div>
              <a href="mailto:info@casinoprosolutions.com?subject=CDAT Pay-Per-Use Activation&body=Property: " style={{ display:"block", background:C.gold, color:C.white, border:"none", borderRadius:8, padding:"11px", fontSize:13, fontWeight:700, cursor:"pointer", textDecoration:"none", letterSpacing:0.5 }}>
                Contact Us to Activate
              </a>
            </div>

            {/* Purchase outright */}
            <div style={{ background:C.white, border:`2px solid ${C.gold}`, borderRadius:16, padding:"28px 24px", boxShadow:`0 0 24px rgba(184,134,11,0.15)`, position:"relative" }}>
              <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:C.gold, color:C.white, padding:"3px 16px", borderRadius:99, fontSize:10, fontWeight:700, letterSpacing:1, whiteSpace:"nowrap" }}>BEST VALUE</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:38, fontWeight:700, color:C.gold, lineHeight:1 }}>$297</div>
              <div style={{ fontSize:12, color:C.textMuted, margin:"4px 0 16px" }}>one-time purchase</div>
              <div style={{ fontSize:13, color:C.textMid, lineHeight:1.7, marginBottom:20 }}>
                Unlimited assessments forever. No per-use charges. Full system ownership.
              </div>
              <div style={{ fontSize:12, color:C.textMuted, background:C.goldBg, border:`1px solid ${C.goldBorder}`, borderRadius:8, padding:"10px 12px", marginBottom:16, lineHeight:1.6 }}>
                Includes all files, User Manual, Scoring Guide, and Deployment Guide.
              </div>
              <a href={GUMROAD_URL} target="_blank" rel="noreferrer" style={{ display:"block", background:C.gold, color:C.white, borderRadius:8, padding:"11px", fontSize:13, fontWeight:700, cursor:"pointer", textDecoration:"none", letterSpacing:0.5, textAlign:"center" }}>
                Purchase on Gumroad →
              </a>
            </div>
          </div>

          <p style={{ fontSize:12, color:C.textFaint }}>
            Questions? Contact <strong style={{color:C.gold}}>CasinoPro Solutions</strong> · info@casinoprosolutions.com
          </p>
        </div>
      </div>
    </div>
  );
}

// ── WARNING BANNER (5 remaining) ──────────────────────────────────────────────
function WarningBanner({ remaining }) {
  return (
    <div style={{ background:C.amberBg, border:`1px solid ${C.amberBorder}`, borderRadius:10, padding:"12px 18px", marginBottom:20, display:"flex", gap:12, alignItems:"center" }}>
      <span style={{ fontSize:20, flexShrink:0 }}>⚠️</span>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:C.amber }}>
          {remaining} Free Assessment{remaining !== 1 ? "s" : ""} Remaining
        </div>
        <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>
          After your free trial ends, assessments are $15 each or $297 for unlimited access. Contact CasinoPro Solutions to continue.
        </div>
      </div>
    </div>
  );
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
function AdminDashboard({ onExit }) {
  const [pin, setPin]         = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState("");
  const [codes, setCodes]     = useState({});
  const [newCode, setNewCode] = useState({ code:"", propertyName:"", contactName:"", email:"", plan:"trial" });
  const [saved, setSaved]     = useState("");

  function handleUnlock() {
    if (pin === ADMIN_PIN) { setUnlocked(true); setCodes(getCodes()); }
    else { setPinError("Incorrect PIN."); setPin(""); }
  }

  function handleCreateCode() {
    if (!newCode.code.trim() || !newCode.propertyName.trim()) { setSaved("⚠ Code and property name are required."); return; }
    const record = {
      code:         newCode.code.toUpperCase(),
      propertyName: newCode.propertyName,
      contactName:  newCode.contactName,
      email:        newCode.email,
      plan:         newCode.plan,
      used:         0,
      freeLimit:    FREE_LIMIT,
      createdAt:    new Date().toISOString(),
      lastUsed:     null,
    };
    saveCode(newCode.code, record);
    setCodes(getCodes());
    setNewCode({ code:"", propertyName:"", contactName:"", email:"", plan:"trial" });
    setSaved(`✅ Code ${record.code} created for ${record.propertyName}`);
    setTimeout(() => setSaved(""), 3000);
  }

  function handleUpgrade(code) {
    const codes = getCodes();
    codes[code].plan = "paid";
    localStorage.setItem(CODES_KEY, JSON.stringify(codes));
    setCodes(getCodes());
  }

  const inputSt = { width:"100%", background:C.white, border:`1px solid ${C.border}`, borderRadius:7, padding:"8px 12px", fontSize:13, color:C.text, fontFamily:"inherit", outline:"none" };

  if (!unlocked) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, boxShadow:C.shadowLg, padding:"36px", maxWidth:380, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:16 }}>🔐</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.text, marginBottom:8 }}>Admin Access</h2>
        <p style={{ fontSize:13, color:C.textMuted, marginBottom:20 }}>Enter your admin PIN to manage property codes.</p>
        <input type="password" placeholder="Admin PIN" value={pin} onChange={e=>{setPin(e.target.value);setPinError("");}} onKeyDown={e=>e.key==="Enter"&&handleUnlock()}
          style={{...inputSt, fontSize:20, letterSpacing:4, textAlign:"center", marginBottom:8}}/>
        {pinError && <p style={{ fontSize:12, color:C.red, marginBottom:10 }}>{pinError}</p>}
        <button onClick={handleUnlock} style={{ width:"100%", background:C.gold, color:C.white, border:"none", borderRadius:8, padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:10 }}>Unlock →</button>
        <button onClick={onExit} style={{ background:"none", border:"none", color:C.textFaint, fontSize:12, cursor:"pointer" }}>← Back to Assessment</button>
      </div>
    </div>
  );

  const codeList = Object.values(codes).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50, boxShadow:C.shadow }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:C.gold, letterSpacing:2 }}>CDAT</span>
          <span style={{ fontSize:11, background:C.amberBg, color:C.amber, border:`1px solid ${C.amberBorder}`, borderRadius:99, padding:"2px 10px", fontWeight:700, letterSpacing:1 }}>ADMIN</span>
        </div>
        <button onClick={onExit} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 14px", fontSize:12, color:C.textMuted, cursor:"pointer" }}>← Exit Admin</button>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"32px 16px 64px" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:14, marginBottom:28 }}>
          {[
            ["Total Properties", codeList.length, C.gold],
            ["Active Trials", codeList.filter(c=>c.plan==="trial"&&c.used<FREE_LIMIT).length, C.green],
            ["Trial Expired", codeList.filter(c=>c.plan==="trial"&&c.used>=FREE_LIMIT).length, C.red],
            ["Paying / Purchased", codeList.filter(c=>c.plan==="paid"||c.plan==="purchased").length, C.amber],
            ["Total Assessments", codeList.reduce((s,c)=>s+c.used,0), C.gold],
          ].map(([label,val,color])=>(
            <div key={label} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 18px", boxShadow:C.shadow }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:700, color, lineHeight:1 }}>{val}</div>
              <div style={{ fontSize:10, color:C.textFaint, letterSpacing:1.5, textTransform:"uppercase", marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Create new code */}
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:14, padding:"24px", marginBottom:24, boxShadow:C.shadow }}>
          <div style={{ fontSize:11, letterSpacing:2, color:C.gold, fontWeight:700, textTransform:"uppercase", marginBottom:16 }}>Create New Property Code</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:4 }}>Property Code</label>
              <input placeholder="e.g. ARIA2025" value={newCode.code} onChange={e=>setNewCode(n=>({...n,code:e.target.value.toUpperCase()}))} style={{...inputSt, fontFamily:"'Courier New',monospace", letterSpacing:2}}/>
            </div>
            <div>
              <label style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:4 }}>Casino / Property Name</label>
              <input placeholder="e.g. Aria Resort & Casino" value={newCode.propertyName} onChange={e=>setNewCode(n=>({...n,propertyName:e.target.value}))} style={inputSt}/>
            </div>
            <div>
              <label style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:4 }}>Contact Name</label>
              <input placeholder="HR Director name" value={newCode.contactName} onChange={e=>setNewCode(n=>({...n,contactName:e.target.value}))} style={inputSt}/>
            </div>
            <div>
              <label style={{ fontSize:11, color:C.textMuted, fontWeight:600, letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:4 }}>Contact Email</label>
              <input placeholder="hr@casino.com" value={newCode.email} onChange={e=>setNewCode(n=>({...n,email:e.target.value}))} style={inputSt}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <select value={newCode.plan} onChange={e=>setNewCode(n=>({...n,plan:e.target.value}))} style={{...inputSt, width:"auto", cursor:"pointer"}}>
              <option value="trial">Trial (20 free assessments)</option>
              <option value="paid">Paid ($15/assessment)</option>
              <option value="purchased">Purchased ($297 unlimited)</option>
            </select>
            <button onClick={handleCreateCode} style={{ background:C.gold, color:C.white, border:"none", borderRadius:8, padding:"9px 24px", fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
              Create Code
            </button>
          </div>
          {saved && <p style={{ fontSize:13, color:saved.startsWith("⚠")?C.red:C.green, marginTop:10, fontWeight:600 }}>{saved}</p>}
        </div>

        {/* Code list */}
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", boxShadow:C.shadow }}>
          <div style={{ padding:"16px 22px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:11, letterSpacing:2, color:C.gold, fontWeight:700, textTransform:"uppercase" }}>All Property Codes</div>
            <div style={{ fontSize:12, color:C.textFaint }}>{codeList.length} properties</div>
          </div>
          {codeList.length === 0 && <div style={{ padding:"40px", textAlign:"center", color:C.textFaint, fontSize:14 }}>No codes created yet. Create your first code above.</div>}
          {codeList.map((rec, i) => {
            const remaining = Math.max(0, FREE_LIMIT - rec.used);
            const pct = Math.min(100, (rec.used / FREE_LIMIT) * 100);
            const isExpired = rec.plan === "trial" && rec.used >= FREE_LIMIT;
            const isPaid    = rec.plan === "paid" || rec.plan === "purchased";
            const statusColor = isPaid ? C.green : isExpired ? C.red : remaining <= WARN_THRESHOLD ? C.amber : C.green;
            const statusLabel = isPaid ? (rec.plan === "purchased" ? "Purchased" : "Paying") : isExpired ? "Trial Expired" : remaining <= WARN_THRESHOLD ? `${remaining} left` : "Trial Active";
            return (
              <div key={rec.code} style={{ padding:"16px 22px", borderBottom:`1px solid ${C.border}`, background:i%2===0?C.white:"rgba(0,0,0,0.01)" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
                  <div style={{ minWidth:100 }}>
                    <div style={{ fontFamily:"'Courier New',monospace", fontSize:15, fontWeight:700, color:C.gold, letterSpacing:2 }}>{rec.code}</div>
                    <div style={{ fontSize:10, color:C.textFaint, marginTop:2 }}>{new Date(rec.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{rec.propertyName}</div>
                    <div style={{ fontSize:12, color:C.textMuted }}>{rec.contactName} {rec.email ? `· ${rec.email}` : ""}</div>
                  </div>
                  <div style={{ minWidth:120 }}>
                    {!isPaid && (
                      <>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.textMuted, marginBottom:3 }}>
                          <span>Usage</span><span style={{ fontWeight:700, color:statusColor }}>{rec.used}/{FREE_LIMIT}</span>
                        </div>
                        <div style={{ background:C.bg, borderRadius:99, height:5, overflow:"hidden" }}>
                          <div style={{ background:statusColor, width:`${pct}%`, height:"100%", borderRadius:99 }}/>
                        </div>
                      </>
                    )}
                    {isPaid && <div style={{ fontSize:12, color:C.green, fontWeight:600 }}>{rec.used} assessments run</div>}
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                    <span style={{ padding:"3px 10px", borderRadius:99, fontSize:10, fontWeight:700, background:statusColor+"18", color:statusColor, border:`1px solid ${statusColor}44` }}>{statusLabel}</span>
                    {rec.plan === "trial" && rec.used >= FREE_LIMIT && (
                      <button onClick={() => handleUpgrade(rec.code)} style={{ background:C.gold, color:C.white, border:"none", borderRadius:6, padding:"4px 12px", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const startRef = useRef(null);

  // Check if this is an HR report link on load
  const hrPayload = parseHRLink();
  const [phase,      setPhase]      = useState(hrPayload ? "hrreport" : "codegate");
  const [applicant,  setApplicant]  = useState(hrPayload ? hrPayload.a : null);
  const [shuffledQs, setShuffledQs] = useState([]);
  const [results,    setResults]    = useState(hrPayload ? hrPayload.r : null);
  const [hrLink,     setHrLink]     = useState("");
  const [property,   setProperty]   = useState(null); // { code, propertyName, used, plan, ... }
  const [showAdmin,  setShowAdmin]  = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);  // secret tap counter

  // Secret admin access — click CDAT logo 5 times
  function handleLogoClick() {
    const next = adminClicks + 1;
    setAdminClicks(next);
    if (next >= 5) { setShowAdmin(true); setAdminClicks(0); }
  }

  function handleCodeVerified(rec, code) {
    // Reload record in case usage was just updated
    const fresh = getCode(code) || rec;
    setProperty(fresh);
    if (fresh.plan === "trial" && fresh.used >= FREE_LIMIT) {
      setPhase("upgrade");
    } else {
      setPhase("welcome");
    }
  }

  function handleWelcomeContinue(formData) { setApplicant(formData); setPhase("intro"); }

  function handleStart() {
    setShuffledQs(shuffle(TRAITS.flatMap(t => t.questions)));
    startRef.current = Date.now();
    setPhase("assessment");
  }

  function handleComplete(answers) {
    const elapsed = Math.round((Date.now() - startRef.current) / 1000);
    const r = { ...calcResults(answers), timeTaken: elapsed };
    setResults(r);
    // Increment usage counter for this property
    if (property) incrementUsage(property.code);
    const link = buildHRLink(applicant, r);
    setHrLink(link);
    setPhase("thankyou");
  }

  if (showAdmin) return <AdminDashboard onExit={() => setShowAdmin(false)} />;

  const remaining = property ? Math.max(0, FREE_LIMIT - (property.used || 0)) : FREE_LIMIT;
  const showWarning = property && property.plan === "trial" && remaining <= WARN_THRESHOLD && remaining > 0;

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F7F8FA; }
        button:hover:not(:disabled) { filter: brightness(0.96); }
        input::placeholder { color: #9CA3AF; }
        input:focus, select:focus { outline: none; }
        @keyframes timerPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes shakeAnim {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Warning banner shown on Welcome and Intro screens */}
      {showWarning && (phase === "welcome" || phase === "intro") && (
        <div style={{ position:"fixed", top:56, left:0, right:0, zIndex:40, padding:"0 16px" }}>
          <div style={{ maxWidth:600, margin:"8px auto 0" }}>
            <WarningBanner remaining={remaining}/>
          </div>
        </div>
      )}

      {phase === "codegate"  && <CodeGate onVerified={handleCodeVerified}/>}
      {phase === "upgrade"   && <UpgradeScreen propertyName={property?.propertyName || "Your Property"}/>}
      {phase === "welcome"   && <Welcome onContinue={handleWelcomeContinue} onLogoClick={handleLogoClick}/>}
      {phase === "intro"     && <Intro applicant={applicant} onStart={handleStart}/>}
      {phase === "assessment"&& <Assessment questions={shuffledQs} onComplete={handleComplete} onExpire={() => handleComplete({})} applicant={applicant}/>}
      {phase === "thankyou"  && <ThankYou applicant={applicant} results={results} hrLink={hrLink} onViewReport={() => setPhase("hrreport")}/>}
      {phase === "hrreport"  && results && <HRReport results={results} timeTaken={results.timeTaken} applicant={applicant}/>}
    </div>
  );
}
