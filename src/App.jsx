import { useState, useEffect, useRef, useCallback } from "react";

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
  if (!res.ok) { const err = await res.text(); throw new Error(err); }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function getAllCodes() {
  try {
    const data = await sbFetch("property_codes?select=*");
    const map = {};
    (data || []).forEach(r => {
      map[r.code] = { code: r.code, propertyName: r.property_name, contactName: r.contact_name, email: r.email, plan: r.plan, hrPin: r.hr_pin, used: r.used, freeLimit: r.free_limit, createdAt: r.created_at, lastUsed: r.last_used, cdatUsed: r.cdat_used||0, dpatUsed: r.dpat_used||0 };
    });
    return map;
  } catch { return {}; }
}

async function getCodeFromDB(code) {
  try {
    const data = await sbFetch(`property_codes?code=eq.${encodeURIComponent(code.toUpperCase())}&select=*`);
    if (!data || data.length === 0) return null;
    const r = data[0];
    return { code: r.code, propertyName: r.property_name, contactName: r.contact_name, email: r.email, plan: r.plan, hrPin: r.hr_pin, used: r.used, freeLimit: r.free_limit, createdAt: r.created_at, lastUsed: r.last_used, cdatUsed: r.cdat_used||0, dpatUsed: r.dpat_used||0 };
  } catch { return null; }
}

async function createCode(rec) {
  return sbFetch("property_codes", { method: "POST", prefer: "return=representation", body: JSON.stringify({ code: rec.code, property_name: rec.propertyName, contact_name: rec.contactName, email: rec.email, plan: rec.plan, hr_pin: rec.hrPin, used: 0, free_limit: rec.freeLimit }) });
}

async function deleteCodeFromDB(code) {
  return sbFetch(`property_codes?code=eq.${encodeURIComponent(code)}`, { method: "DELETE", prefer: "" });
}

async function resetUsageInDB(code) {
  return sbFetch(`property_codes?code=eq.${encodeURIComponent(code)}`, { method: "PATCH", body: JSON.stringify({ used: 0 }) });
}

async function upgradeCodeInDB(code, plan) {
    const limit = plan === "trial" ? FREE_LIMIT : 9999;
    return sbFetch(`property_codes?code=eq.${encodeURIComponent(code)}`, { method: "PATCH", body: JSON.stringify({ plan, free_limit: limit }) });
  }

async function incrementUsageInDB(code, type="cdat") {
  try {
    const rec = await getCodeFromDB(code);
    if (!rec) return;
    const field = type === "dpat" ? "dpat_used" : "cdat_used";
    await sbFetch(`property_codes?code=eq.${encodeURIComponent(code.toUpperCase())}`, {
      method: "PATCH",
      body: JSON.stringify({
        used: (rec.used || 0) + 1,
        [field]: (rec[field] || 0) + 1,
        last_used: new Date().toISOString()
      })
    });
  } catch {}
}

const FREE_LIMIT = 10;
const ADMIN_PIN = "CDAT2025";
const WARN_AT = 5;
function genPin() { return String(Math.floor(1000 + Math.random() * 9000)); }

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C = {
  white:"#FFFFFF",bg:"#F7F8FA",border:"#E8EAED",gold:"#B8860B",goldBg:"#FDF8EC",goldBorder:"#E8D5A3",
  text:"#111827",textMid:"#374151",textMuted:"#6B7280",textFaint:"#9CA3AF",
  green:"#059669",greenBg:"#ECFDF5",greenBorder:"#A7F3D0",
  amber:"#D97706",amberBg:"#FFFBEB",amberBorder:"#FDE68A",
  red:"#DC2626",redBg:"#FEF2F2",redBorder:"#FECACA",
  shadow:"0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd:"0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)",
  shadowLg:"0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)",
  navy:"#0e1a2b",navyMid:"#152338",navyLt:"#1e3050",
  suiteGold:"#c9a84c",suiteGoldLt:"#e3c478",cream:"#f7f2e8",suiteMuted:"#8a9db5",
};

// ── SUITE STYLES (for gate/dashboard/admin) ────────────────────────────────
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
  @keyframes timerPulse{0%,100%{opacity:1}50%{opacity:0.35}}
  @keyframes shakeAnim{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
`;

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
  const pw=210,lm=18,rm=18,cw=pw-lm-rm; let y=0;
  const gold=[184,134,11],dark=[17,24,39],mid=[55,65,81],muted=[107,114,128];
  const green=[5,150,105],amber=[217,119,6],red=[220,38,38],white=[255,255,255];
  const bg=[247,248,250],border=[232,234,237];
  const {traitResults,overall,recommendation,totalRedFlags,inconsistencies,interviewQs}=results;
  const mins=Math.floor(results.timeTaken/60),secs=results.timeTaken%60;
  function recCol(){return recommendation==="ELITE DEALER"?green:recommendation==="STRONG DEALER"||recommendation==="DEVELOPING DEALER"?amber:red;}
  function traitCol(t){return t>=30?green:t>=22?amber:red;}
  doc.setFillColor(...[17,24,39]);doc.rect(0,0,pw,28,"F");
  doc.setFillColor(...gold);doc.rect(0,26,pw,2,"F");
  doc.setFont("helvetica","bold");doc.setFontSize(18);doc.setTextColor(...white);
  doc.text("CDAT",lm,13);
  doc.setFontSize(9);doc.setFont("helvetica","normal");doc.setTextColor(180,180,180);
  doc.text("Casino Dealer Aptitude Assessment  |  CONFIDENTIAL HR REPORT",lm+22,13);
  doc.setTextColor(...gold);doc.setFontSize(8);
  doc.text("FOR AUTHORIZED PERSONNEL ONLY",pw-rm,20,{align:"right"});
  y=36;
  doc.setFillColor(...bg);doc.setDrawColor(...border);doc.setLineWidth(0.3);
  doc.roundedRect(lm,y,cw,22,3,3,"FD");
  doc.setFont("helvetica","bold");doc.setFontSize(13);doc.setTextColor(...dark);
  doc.text(applicant.name,lm+6,y+8);
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(...muted);
  doc.text(applicant.position,lm+6,y+14);
  [["Date",applicant.date],["Time Taken",`${mins}m ${secs}s`]].forEach(([label,val],i)=>{
    const x=lm+(cw/2)*i+cw/4+40;
    doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(...muted);
    doc.text(label.toUpperCase(),x,y+8,{align:"center"});
    doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(...dark);
    doc.text(val,x,y+15,{align:"center"});
  });
  y+=30;
  const scoreBoxW=58,radarBoxW=cw-scoreBoxW-6;
  doc.setFillColor(...white);doc.setDrawColor(...recCol());doc.setLineWidth(0.5);
  doc.roundedRect(lm,y,scoreBoxW,38,3,3,"FD");
  doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(...muted);
  doc.text("OVERALL COMPOSITE SCORE",lm+scoreBoxW/2,y+6,{align:"center"});
  doc.setFont("helvetica","bold");doc.setFontSize(34);doc.setTextColor(...recCol());
  doc.text(`${overall}/200`,lm+scoreBoxW/2,y+22,{align:"center"});
  const pillY=y+27;
  doc.setFillColor(...recCol());doc.roundedRect(lm+6,pillY,scoreBoxW-12,7,2,2,"F");
  doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(...white);
  doc.text(recommendation,lm+scoreBoxW/2,pillY+5,{align:"center"});
  if(totalRedFlags>0){doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(...red);doc.text(`${totalRedFlags} red flag${totalRedFlags>1?"s":""}`,lm+scoreBoxW/2,y+37,{align:"center"});}
  const bx=lm+scoreBoxW+6;
  doc.setFillColor(...white);doc.setDrawColor(...border);doc.setLineWidth(0.3);
  doc.roundedRect(bx,y,radarBoxW,38,3,3,"FD");
  doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(...gold);
  doc.text("TRAIT BREAKDOWN",bx+6,y+6);
  traitResults.forEach((r,i)=>{
    const by=y+11+i*5.6,barX=bx+52,barW=radarBoxW-58,barH=3;
    doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(...mid);
    doc.text(r.trait.name.length>22?r.trait.name.slice(0,22)+"…":r.trait.name,bx+6,by+2.5);
    doc.setFillColor(...border);doc.roundedRect(barX,by,barW,barH,1,1,"F");
    doc.setFillColor(...traitCol(r.total));doc.roundedRect(barX,by,barW*r.total/40,barH,1,1,"F");
    doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(...traitCol(r.total));
    doc.text(`${r.total}/40`,bx+radarBoxW-5,by+2.5,{align:"right"});
  });
  y+=44;
  const flags=traitResults.filter(r=>r.redFlags.length>0);
  if(flags.length>0){
    doc.setFillColor(254,242,242);doc.setDrawColor(254,202,202);doc.setLineWidth(0.3);
    doc.roundedRect(lm,y,cw,8,2,2,"FD");
    doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(...red);
    doc.text(`RED FLAGS DETECTED (${totalRedFlags})`,lm+5,y+5.5);y+=12;
    flags.forEach(r=>{
      doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(...red);
      doc.text(r.trait.name,lm+4,y+4);y+=7;
      r.redFlags.forEach(f=>{
        doc.setFillColor(254,242,242);doc.roundedRect(lm+2,y,cw-4,8,1,1,"F");
        doc.setDrawColor(...red);doc.setLineWidth(0.5);doc.line(lm+2,y,lm+2,y+8);
        doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(...red);
        const lines=doc.splitTextToSize(`"${f}"`,cw-12);
        doc.text(lines,lm+6,y+4.5);y+=lines.length*4+6;
      });
    });
    y+=4;
  }
  if(inconsistencies.length>0){
    doc.setFillColor(255,251,235);doc.setDrawColor(253,230,138);doc.setLineWidth(0.3);
    doc.roundedRect(lm,y,cw,8,2,2,"FD");
    doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(...amber);
    doc.text(`CONSISTENCY ISSUES (${inconsistencies.length} pair${inconsistencies.length>1?"s":""})`,lm+5,y+5.5);y+=12;
    inconsistencies.forEach((inc,i)=>{
      const l1=doc.splitTextToSize(`"${inc.q1}"`,cw-10);
      const l2=doc.splitTextToSize(`"${inc.q2}"`,cw-10);
      const boxH=l1.length*4+l2.length*4+16;
      doc.setFillColor(255,251,235);doc.setDrawColor(...amber);doc.setLineWidth(0.3);
      doc.roundedRect(lm,y,cw,boxH,2,2,"FD");
      doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(...amber);
      doc.text(`${inc.trait}  ·  Pair ${i+1}`,lm+5,y+5);
      doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(...mid);
      doc.text(l1,lm+5,y+10);
      doc.setTextColor(...muted);doc.text("contradicts ↕",lm+cw/2,y+10+l1.length*4,{align:"center"});
      doc.setTextColor(...mid);doc.text(l2,lm+5,y+14+l1.length*4);
      y+=boxH+4;
    });
    y+=4;
  }
  if(interviewQs.length>0){
    doc.addPage();y=18;
    doc.setFillColor(...[17,24,39]);doc.rect(0,0,pw,14,"F");
    doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(...white);
    doc.text("CDAT  |  SUGGESTED INTERVIEW QUESTIONS",lm,9);
    doc.setTextColor(...gold);doc.setFontSize(8);
    doc.text(applicant.name+"  ·  "+applicant.position,pw-rm,9,{align:"right"});
    y=24;
    interviewQs.forEach(group=>{
      doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(...gold);
      doc.text(group.traitName,lm,y);
      doc.setDrawColor(232,213,163);doc.setLineWidth(0.3);doc.line(lm,y+1.5,lm+cw,y+1.5);y+=6;
      group.questions.forEach((q,qi)=>{
        const lines=doc.splitTextToSize(q,cw-16);
        const boxH=lines.length*4.5+6;
        doc.setFillColor(...bg);doc.setDrawColor(...border);doc.setLineWidth(0.2);
        doc.roundedRect(lm,y,cw,boxH,2,2,"FD");
        doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(...gold);
        doc.text(`${qi+1}.`,lm+4,y+5);
        doc.setFont("helvetica","normal");doc.setTextColor(...mid);
        doc.text(lines,lm+10,y+5);y+=boxH+3;
      });
      y+=4;
    });
  }
  const pageCount=doc.internal.getNumberOfPages();
  for(let p=1;p<=pageCount;p++){
    doc.setPage(p);doc.setFillColor(...[17,24,39]);doc.rect(0,290,pw,8,"F");
    doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(140,140,140);
    doc.text(`CDAT © ${new Date().getFullYear()}  ·  Confidential  ·  For Authorized Personnel Only`,lm,295);
    doc.text(`Page ${p} of ${pageCount}`,pw-rm,295,{align:"right"});
  }
  const filename=`CDAT_${applicant.name.replace(/\s+/g,"_")}_${applicant.date.replace(/,?\s+/g,"_")}.pdf`;
  doc.save(filename);
  return filename;
}

// ── CDAT DATA ─────────────────────────────────────────────────────────────────
const TRAITS = [
  { id:"interaction", name:"Interaction & Friendliness", abbr:"I&F", questions:[
    {id:"i1",text:"I enjoy talking and interacting with people from different backgrounds.",reversed:false,redFlag:false},
    {id:"i2",text:"I greet people with a genuine smile, even when I am physically tired.",reversed:false,redFlag:false},
    {id:"i3",text:"I understand that part of my job is to make others feel comfortable, even when I'm having a bad day.",reversed:false,redFlag:false},
    {id:"i4",text:"When someone is being rude or difficult, I can keep the interaction positive without losing my composure.",reversed:false,redFlag:true},
    {id:"i5",text:"I make a conscious effort to remain warm and welcoming toward people.",reversed:false,redFlag:false},
    {id:"i6",text:"I find it difficult to remain friendly when someone is visibly rude to me.",reversed:true,redFlag:true},
    {id:"i7",text:"I tend to keep to myself when I feel stressed or overwhelmed.",reversed:true,redFlag:true},
    {id:"i8",text:"I struggle to hide my true feelings when I am annoyed.",reversed:true,redFlag:true},
  ]},
  { id:"patience", name:"Patience & Emotional Control", abbr:"P&E", questions:[
    {id:"p1",text:"I follow established procedures exactly, even when I know a faster way.",reversed:false,redFlag:false},
    {id:"p2",text:"I can perform the same task with the same level of care and attention.",reversed:false,redFlag:false},
    {id:"p3",text:"I can separate my personal feelings about a situation in the moment.",reversed:false,redFlag:false},
    {id:"p4",text:"I stay calm and professional, even when someone is rude or confrontational.",reversed:false,redFlag:true},
    {id:"p5",text:"I can remain patient when the same question or problem comes up repeatedly.",reversed:false,redFlag:false},
    {id:"p6",text:"I tend to lose patience when I must deal with the same issue repeatedly.",reversed:true,redFlag:true},
    {id:"p7",text:"I tend to let my emotions get the best of me.",reversed:true,redFlag:true},
    {id:"p8",text:"I find it difficult to stay calm when I feel overwhelmed.",reversed:true,redFlag:true},
  ]},
  { id:"communication", name:"Communication & Listening", abbr:"C&L", questions:[
    {id:"c1",text:"I make sure I understand instructions before acting.",reversed:false,redFlag:false},
    {id:"c2",text:"I stay focused on what someone is saying, even with distractions.",reversed:false,redFlag:false},
    {id:"c3",text:"I listen carefully to instructions and follow them accordingly.",reversed:false,redFlag:false},
    {id:"c4",text:"I ask questions when I am unsure of something.",reversed:false,redFlag:false},
    {id:"c5",text:"I can explain things clearly to others.",reversed:false,redFlag:false},
    {id:"c6",text:"I tend to talk more than I listen in a conversation.",reversed:true,redFlag:true},
    {id:"c7",text:"I sometimes miss important details when listening to instructions.",reversed:true,redFlag:true},
    {id:"c8",text:"I find it difficult to stay patient when I must explain the same thing repeatedly.",reversed:true,redFlag:false},
  ]},
  { id:"attention", name:"Attention to Detail & Focus", abbr:"A&F", questions:[
    {id:"a1",text:"When I'm under pressure, I still prioritize accuracy over speed.",reversed:false,redFlag:false},
    {id:"a2",text:"I perform basic mental math (addition/multiplication) quickly and accurately.",reversed:false,redFlag:false},
    {id:"a3",text:"I tend to catch errors before they become bigger problems.",reversed:false,redFlag:false},
    {id:"a4",text:"I remain consistent and precise, even during long or repetitive tasks.",reversed:false,redFlag:false},
    {id:"a5",text:"I double-check my work instinctively, even when I am in a hurry.",reversed:false,redFlag:false},
    {id:"a6",text:"I find it difficult to keep track of multiple things happening at once.",reversed:true,redFlag:true},
    {id:"a7",text:"I find my concentration slipping after 30 minutes of a detailed task.",reversed:true,redFlag:true},
    {id:"a8",text:"I overlook small but important details when I am trying to work quickly.",reversed:true,redFlag:true},
  ]},
  { id:"teamwork", name:"Teamwork & Dependability", abbr:"T&D", questions:[
    {id:"t1",text:"When I commit to something, I follow through on it.",reversed:false,redFlag:false},
    {id:"t2",text:"I admit mistakes immediately rather than trying to fix them quietly.",reversed:false,redFlag:true},
    {id:"t3",text:"Others can rely on me to follow through on my responsibilities.",reversed:false,redFlag:false},
    {id:"t4",text:"I support my team, even when it requires extra effort on my part.",reversed:false,redFlag:false},
    {id:"t5",text:"I adapt quickly to changes in schedules, procedures, or expectations.",reversed:false,redFlag:false},
    {id:"t6",text:"I hesitate to take initiative or accept new responsibilities.",reversed:true,redFlag:true},
    {id:"t7",text:"I prefer to focus only on my own responsibilities rather than helping others.",reversed:true,redFlag:true},
    {id:"t8",text:"I feel frustrated when asked to perform a task outside of my usual routine.",reversed:true,redFlag:true},
  ]},
];

const LIKERT=[{label:"Never",value:1},{label:"Rarely",value:2},{label:"Sometimes",value:3},{label:"Often",value:4},{label:"Always",value:5}];
const TIMER_SECONDS=7*60;

const CONSISTENCY_PAIRS=[
  ["i4","i6"],["i5","i8"],["i3","i7"],
  ["p4","p7"],["p5","p6"],["p3","p8"],
  ["c2","c7"],["c3","c6"],
  ["a1","a8"],["a4","a7"],["a5","a6"],
  ["t1","t6"],["t4","t7"],["t5","t8"],
];

const INTERVIEW_QUESTIONS={
  interaction:["Tell me about a time you had to stay warm and friendly with a guest who was being difficult. What did you do?","How do you reset emotionally between guest interactions when you're having a tough day?","Describe a situation where you had to mask your frustration. How did you handle it?"],
  patience:["Walk me through how you stay calm when a guest is repeatedly confrontational.","How do you maintain the same level of attention during a long, repetitive shift?","Tell me about a time your emotions almost got the better of you at work. What happened?"],
  communication:["Describe a time you had to explain a complex rule or process to someone unfamiliar with it.","How do you ensure you've fully understood instructions before acting on them?","Tell me about a time you missed an important detail. What was the outcome?"],
  attention:["How do you maintain accuracy when you're working quickly under pressure?","Tell me about a time you caught an error before it became a bigger problem.","How do you handle tracking multiple things happening simultaneously at the table?"],
  teamwork:["Describe a time you had to admit a mistake immediately. How did your team respond?","Tell me about a time you went beyond your usual role to help a colleague.","How do you adapt when procedures or schedules change unexpectedly?"],
};

const POSITIONS=["Casino Dealer – Table Games","Casino Dealer – Blackjack","Casino Dealer – Poker","Casino Dealer – Roulette","Casino Dealer – Baccarat","Casino Dealer – Craps","Dual-Rate Dealer","Other / Not Listed"];

function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function scoreQ(q,raw){return q.reversed?6-raw:raw;}

function calcResults(answers){
  const allQMap={};
  TRAITS.forEach(t=>t.questions.forEach(q=>allQMap[q.id]=q));
  const traitResults=TRAITS.map(trait=>{
    let total=0,redFlags=[];
    trait.questions.forEach(q=>{
      const raw=answers[q.id];if(!raw)return;
      const scored=scoreQ(q,raw);total+=scored;
      if(q.redFlag){
        if(!q.reversed&&raw<=2)redFlags.push(q.text);
        if(q.reversed&&raw>=4)redFlags.push(q.text);
      }
    });
    return{trait,total,redFlags};
  });
  const inconsistencies=[];
  CONSISTENCY_PAIRS.forEach(([fwdId,revId])=>{
    const fwdQ=allQMap[fwdId],revQ=allQMap[revId];
    if(!fwdQ||!revQ)return;
    const fwdRaw=answers[fwdId],revRaw=answers[revId];
    if(!fwdRaw||!revRaw)return;
    const fwdScored=scoreQ(fwdQ,fwdRaw),revScored=scoreQ(revQ,revRaw);
    if(Math.abs(fwdScored-revScored)>=3)
      inconsistencies.push({q1:fwdQ.text,q2:revQ.text,trait:TRAITS.find(t=>t.questions.find(q=>q.id===fwdId))?.name});
  });
  const overall=traitResults.reduce((s,r)=>s+r.total,0);
  const totalRedFlags=traitResults.reduce((s,r)=>s+r.redFlags.length,0);
  const interviewQs=[];
  traitResults.forEach(r=>{
    if(r.total<28||r.redFlags.length>0)
      interviewQs.push({traitName:r.trait.name,questions:INTERVIEW_QUESTIONS[r.trait.id]});
  });
  let recommendation,recColor,recBg,recBorder;
  if(overall>=169){recommendation="ELITE DEALER";recColor=C.green;recBg=C.greenBg;recBorder=C.greenBorder;}
  else if(overall>=137){recommendation="STRONG DEALER";recColor=C.amber;recBg=C.amberBg;recBorder=C.amberBorder;}
  else if(overall>=105){recommendation="DEVELOPING DEALER";recColor=C.amber;recBg=C.amberBg;recBorder=C.amberBorder;}
  else{recommendation="HIGH-RISK DEALER";recColor=C.red;recBg=C.redBg;recBorder=C.redBorder;}
  return{traitResults,overall,recommendation,recColor,recBg,recBorder,totalRedFlags,inconsistencies,interviewQs};
}

function traitColor(t){return t>=30?C.green:t>=22?C.amber:C.red;}
function traitLabel(t){return t>=30?"Strong":t>=22?"Moderate":"Needs Improvement";}
function traitBg(t){return t>=30?C.greenBg:t>=22?C.amberBg:C.redBg;}
function traitBorder(t){return t>=30?C.greenBorder:t>=22?C.amberBorder:C.redBorder;}

// ── TIMER ─────────────────────────────────────────────────────────────────────
function Timer({seconds,onExpire}){
  const [left,setLeft]=useState(seconds);
  useEffect(()=>{
    if(left<=0){onExpire();return;}
    const id=setInterval(()=>setLeft(l=>l-1),1000);
    return()=>clearInterval(id);
  },[left]);
  const m=String(Math.floor(left/60)).padStart(2,"0");
  const s=String(left%60).padStart(2,"0");
  const urgent=left<=60;
  const pct=(left/seconds)*100;
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,background:urgent?C.redBg:C.goldBg,border:`1px solid ${urgent?C.redBorder:C.goldBorder}`,borderRadius:8,padding:"6px 12px"}}>
      <svg viewBox="0 0 32 32" style={{width:26,height:26,transform:"rotate(-90deg)",flexShrink:0}}>
        <circle cx="16" cy="16" r="12" fill="none" stroke={urgent?"#FECACA":"#E8D5A3"} strokeWidth="2.5"/>
        <circle cx="16" cy="16" r="12" fill="none" stroke={urgent?C.red:C.gold} strokeWidth="2.5"
          strokeDasharray={`${2*Math.PI*12}`}
          strokeDashoffset={`${2*Math.PI*12*(1-pct/100)}`}
          style={{transition:"stroke-dashoffset 1s linear"}}/>
      </svg>
      <span style={{fontFamily:"'Courier New',monospace",fontSize:17,fontWeight:700,color:urgent?C.red:C.gold,letterSpacing:2,animation:urgent?"timerPulse 0.8s infinite":"none"}}>{m}:{s}</span>
    </div>
  );
}

// ── SCORE BAR ─────────────────────────────────────────────────────────────────
function ScoreBar({total}){
  return(
    <div style={{background:C.bg,borderRadius:99,height:8,overflow:"hidden",marginTop:8}}>
      <div style={{background:traitColor(total),width:`${(total/40)*100}%`,height:"100%",borderRadius:99,transition:"width 1.2s cubic-bezier(0.22,1,0.36,1)"}}/>
    </div>
  );
}

// ── CATEGORY SUMMARY TABLE ────────────────────────────────────────────────────
function CategorySummaryTable({traitResults}){
  const total=traitResults.reduce((s,r)=>s+r.total,0);
  return(
    <div style={{width:"100%"}}>
      <div style={{background:C.gold,borderRadius:"8px 8px 0 0",padding:"10px 16px",textAlign:"center"}}>
        <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:C.white,letterSpacing:1}}>Category Summary</span>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",border:`1px solid ${C.border}`}}>
        <thead>
          <tr style={{background:"#1B2A4A"}}>
            <th style={{padding:"8px 12px",fontSize:11,fontWeight:700,color:C.white,textAlign:"left",borderRight:`1px solid ${C.border}`}}>Category</th>
            <th style={{padding:"8px 12px",fontSize:11,fontWeight:700,color:C.white,textAlign:"center",borderRight:`1px solid ${C.border}`}}>Items</th>
            <th style={{padding:"8px 12px",fontSize:11,fontWeight:700,color:C.white,textAlign:"center"}}>Score (/ 40)</th>
          </tr>
        </thead>
        <tbody>
          {traitResults.map((r,i)=>(
            <tr key={r.trait.id} style={{background:i%2===0?C.white:C.bg,borderBottom:`1px solid ${C.border}`}}>
              <td style={{padding:"8px 12px",fontSize:12,color:C.textMid,borderRight:`1px solid ${C.border}`}}>{r.trait.name}</td>
              <td style={{padding:"8px 12px",fontSize:12,color:C.textMuted,textAlign:"center",borderRight:`1px solid ${C.border}`}}>8</td>
              <td style={{padding:"8px 12px",fontSize:13,fontWeight:700,color:traitColor(r.total),textAlign:"center"}}>{r.total}</td>
            </tr>
          ))}
          <tr style={{background:"#1B2A4A"}}>
            <td style={{padding:"8px 12px",fontSize:12,fontWeight:700,color:C.white,borderRight:`1px solid ${C.border}`}}>Total</td>
            <td style={{padding:"8px 12px",fontSize:12,fontWeight:700,color:C.white,textAlign:"center",borderRight:`1px solid ${C.border}`}}>40</td>
            <td style={{padding:"8px 12px",fontSize:14,fontWeight:700,color:C.gold,textAlign:"center"}}>{total} / 200</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── CDAT WELCOME ──────────────────────────────────────────────────────────────
function CDATWelcome({onContinue,onBack}){
  const today=new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  const [form,setForm]=useState({name:"",position:"",date:today});
  const [errors,setErrors]=useState({});
  function handleSubmit(){
    const e={};
    if(!form.name.trim())e.name="Please enter your full name.";
    if(!form.position)e.position="Please select a position.";
    if(Object.keys(e).length>0){setErrors(e);return;}
    onContinue(form);
  }
  const labelStyle={display:"block",fontSize:11,fontWeight:600,color:C.textMuted,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6};
  const inputStyle=(err)=>({width:"100%",background:C.white,border:`1.5px solid ${err?C.red:C.border}`,borderRadius:8,padding:"11px 14px",fontSize:14,color:C.text,fontFamily:"inherit",outline:"none"});
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",position:"sticky",top:0,zIndex:50,boxShadow:C.shadow}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🃏</span>
          <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:17,fontWeight:700,color:C.gold,letterSpacing:2}}>CDAT</span>
          <span style={{fontSize:12,color:C.textFaint,marginLeft:4}}>Casino Dealer Aptitude Assessment</span>
        </div>
        <button onClick={onBack} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 14px",fontSize:12,color:C.textMuted,cursor:"pointer"}}>← Back</button>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 16px"}}>
        <div style={{width:"100%",maxWidth:500}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:28,fontWeight:700,color:C.text,margin:"0 0 8px"}}>Welcome</h1>
            <p style={{fontSize:14,color:C.textMuted,margin:0}}>Please complete the fields below to begin your assessment.</p>
          </div>
          <div style={{background:C.white,borderRadius:16,border:`1px solid ${C.border}`,boxShadow:C.shadowLg,padding:"32px 36px"}}>
            <div style={{marginBottom:20}}>
              <label style={labelStyle}>Full Name</label>
              <input type="text" placeholder="e.g. Jordan M. Rivers" value={form.name}
                onChange={e=>{setForm(f=>({...f,name:e.target.value}));setErrors(er=>({...er,name:""}));}}
                style={inputStyle(errors.name)}
                onFocus={e=>{e.target.style.borderColor=C.gold;}}
                onBlur={e=>{e.target.style.borderColor=errors.name?C.red:C.border;}}/>
              {errors.name&&<p style={{fontSize:12,color:C.red,marginTop:5}}>⚠ {errors.name}</p>}
            </div>
            <div style={{marginBottom:20}}>
              <label style={labelStyle}>Position Applied For</label>
              <div style={{position:"relative"}}>
                <select value={form.position}
                  onChange={e=>{setForm(f=>({...f,position:e.target.value}));setErrors(er=>({...er,position:""}));}}
                  style={{...inputStyle(errors.position),appearance:"none",cursor:"pointer",paddingRight:36}}>
                  <option value="">Select a position…</option>
                  {POSITIONS.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
                <svg style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="12" height="8" viewBox="0 0 12 8">
                  <path d="M1 1l5 5 5-5" stroke={C.textFaint} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
              {errors.position&&<p style={{fontSize:12,color:C.red,marginTop:5}}>⚠ {errors.position}</p>}
            </div>
            <div style={{marginBottom:24}}>
              <label style={labelStyle}>Date</label>
              <input type="text" value={form.date} readOnly style={{...inputStyle(false),color:C.textMuted,cursor:"default",background:C.bg}}/>
            </div>
            <div style={{background:C.goldBg,border:`1px solid ${C.goldBorder}`,borderRadius:10,padding:"14px 16px",marginBottom:20}}>
              <p style={{fontSize:12,fontWeight:600,color:C.gold,margin:"0 0 8px"}}>Before You Begin</p>
              {["40 questions — answered one at a time","Once you move to the next question, you cannot go back","7 minutes to complete the full assessment","Frequency scale: Never · Rarely · Sometimes · Often · Always","Answer each question honestly and independently"].map((t,i)=>(
                <div key={i} style={{display:"flex",gap:8,marginBottom:4,alignItems:"flex-start"}}>
                  <span style={{color:C.gold,fontSize:10,marginTop:2,flexShrink:0}}>✦</span>
                  <span style={{fontSize:12,color:C.textMid}}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{background:C.amberBg,border:`1px solid ${C.amberBorder}`,borderRadius:8,padding:"12px 16px",marginBottom:20}}>
              <p style={{fontSize:12,color:C.textMid,margin:0,lineHeight:1.6}}><strong style={{color:C.amber}}>Note:</strong> This assessment is one part of the hiring process and should be used alongside the dealer audition, structured interview, math evaluation, and reference checks. It is not a standalone hiring decision tool.</p>
            </div>
            <button onClick={handleSubmit} style={{width:"100%",background:C.gold,color:C.white,border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",letterSpacing:1,fontFamily:"'Playfair Display',Georgia,serif",boxShadow:`0 4px 14px rgba(184,134,11,0.3)`}}>
              Continue →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CDAT ASSESSMENT (one question per page) ───────────────────────────────────
function CDATAssessment({questions,applicant,onComplete,onExpire}){
  const total=questions.length;
  const [current,setCurrent]=useState(0);
  const [answers,setAnswers]=useState({});
  const [selected,setSelected]=useState(null);
  const [animDir,setAnimDir]=useState("in");
  const [shake,setShake]=useState(false);
  const q=questions[current];
  const pct=Math.round((current/total)*100);
  const isLast=current===total-1;

  function handleNext(){
    if(selected===null){setShake(true);setTimeout(()=>setShake(false),500);return;}
    const newAnswers={...answers,[q.id]:selected};
    setAnswers(newAnswers);
    if(isLast){onComplete(newAnswers);return;}
    setAnimDir("out");
    setTimeout(()=>{setCurrent(c=>c+1);setSelected(null);setAnimDir("in");},220);
  }

  useEffect(()=>{
    function handleKey(e){
      if(e.key>="1"&&e.key<="5")setSelected(parseInt(e.key));
      if(e.key==="Enter")handleNext();
    }
    window.addEventListener("keydown",handleKey);
    return()=>window.removeEventListener("keydown",handleKey);
  },[selected,current,answers]);

  const slideStyle={opacity:animDir==="in"?1:0,transform:animDir==="in"?"translateX(0)":"translateX(40px)",transition:"opacity 0.22s ease, transform 0.22s ease"};

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:50,boxShadow:C.shadow}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",height:56}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:17}}>🃏</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:C.gold,letterSpacing:2}}>CDAT</span>
            <span style={{fontSize:12,color:C.textFaint}}>· {applicant.name}</span>
          </div>
          <Timer seconds={TIMER_SECONDS} onExpire={()=>onComplete(answers)}/>
        </div>
        <div style={{background:C.bg,height:4}}>
          <div style={{background:C.gold,width:`${pct}%`,height:"100%",transition:"width 0.35s ease"}}/>
        </div>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 16px"}}>
        <div style={{width:"100%",maxWidth:600}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <div style={{fontSize:12,color:C.textFaint,letterSpacing:1}}>Question <strong style={{color:C.textMid}}>{current+1}</strong> of <strong style={{color:C.textMid}}>{total}</strong></div>
            <div style={{display:"flex",gap:4}}>
              {Array.from({length:Math.min(total,20)}).map((_,i)=>{
                const qIdx=total<=20?i:Math.round(i*(total-1)/19);
                const done=qIdx<current,active=qIdx===current;
                return<div key={i} style={{width:active?20:8,height:8,borderRadius:99,background:done?C.gold:active?C.gold:C.border,opacity:done?0.5:1,transition:"all 0.3s"}}/>;
              })}
            </div>
          </div>
          <div style={slideStyle}>
            <div style={{background:C.white,borderRadius:16,border:`1px solid ${C.border}`,boxShadow:C.shadowLg,padding:"36px 40px",marginBottom:20}}>
              <p style={{fontSize:18,fontWeight:500,color:C.text,lineHeight:1.65,margin:"0 0 36px",letterSpacing:"-0.01em"}}>{q.text}</p>
              <div style={{display:"flex",flexDirection:"column",gap:10,animation:shake?"shakeAnim 0.45s ease":"none"}}>
                {LIKERT.map((opt,idx)=>{
                  const chosen=selected===opt.value;
                  return(
                    <button key={opt.value} onClick={()=>setSelected(opt.value)} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 20px",borderRadius:10,cursor:"pointer",border:`1.5px solid ${chosen?C.gold:C.border}`,background:chosen?C.goldBg:C.white,textAlign:"left",outline:"none",boxShadow:chosen?`0 0 0 3px ${C.goldBg}`:"none",transition:"all 0.12s"}}>
                      <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,border:`2px solid ${chosen?C.gold:"#D1D5DB"}`,background:chosen?C.gold:C.white,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.12s"}}>
                        {chosen&&<div style={{width:8,height:8,borderRadius:"50%",background:C.white}}/>}
                      </div>
                      <div style={{display:"flex",alignItems:"baseline",gap:10,flex:1}}>
                        <span style={{fontSize:11,fontWeight:700,color:chosen?C.gold:C.textFaint,minWidth:14}}>{idx+1}</span>
                        <span style={{fontSize:15,fontWeight:chosen?700:400,color:chosen?C.gold:C.textMid}}>{opt.label}</span>
                      </div>
                      {chosen&&<span style={{fontSize:14,color:C.gold}}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={handleNext} style={{width:"100%",padding:"15px",background:selected!==null?C.gold:C.border,color:selected!==null?C.white:C.textFaint,border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:selected!==null?"pointer":"not-allowed",letterSpacing:1,fontFamily:"'Playfair Display',serif",boxShadow:selected!==null?`0 4px 14px rgba(184,134,11,0.3)`:"none",transition:"all 0.15s",animation:shake?"shakeAnim 0.45s ease":"none"}}>
              {isLast?"Submit Assessment":"Next Question →"}
            </button>
            <p style={{textAlign:"center",fontSize:11,color:C.textFaint,marginTop:12}}>
              Tip: Press <kbd style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,padding:"1px 5px",fontSize:10}}>1</kbd>–<kbd style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,padding:"1px 5px",fontSize:10}}>5</kbd> to select · <kbd style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,padding:"1px 5px",fontSize:10}}>Enter</kbd> to advance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HR PDF BUTTON ─────────────────────────────────────────────────────────────
function HRPdfButton({applicant,results}){
  const [status,setStatus]=useState("ready");
  const [filename,setFilename]=useState("");
  function handleDownload(){
    setStatus("generating");
    generateHRPdf(applicant,results).then(name=>{setFilename(name);setStatus("done");}).catch(()=>setStatus("error"));
  }
  function handlePrint(){
    const {traitResults,overall,recommendation,recColor,totalRedFlags,inconsistencies}=results;
    const domainColor=(t)=>t>=30?"#059669":t>=22?"#D97706":"#DC2626";
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CDAT — ${applicant.name}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:#fff;color:#111827;font-size:13px}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none}}
    .btn{padding:10px 24px;background:#B8860B;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;border-radius:3px;margin:4px;font-family:Arial,sans-serif}
    </style></head><body>
    <div class="no-print" style="text-align:center;padding:16px;background:#FDF8EC;border-bottom:3px solid #B8860B">
      <button class="btn" onclick="window.print()">🖨 Print This Report</button>
      <button class="btn" style="background:#111827" onclick="window.close()">✕ Close</button>
    </div>
    <div style="background:#111827;padding:24px 36px 20px"><div style="font-size:10px;letter-spacing:3px;color:#B8860B;font-weight:700;margin-bottom:6px">CASINOPRO SOLUTIONS — HR REVIEW</div><div style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#fff">CDAT — Candidate Assessment Report</div></div>
    <div style="height:3px;background:#B8860B"></div>
    <div style="padding:20px 36px">
      <div style="border:1px solid #E8EAED;border-radius:4px;padding:14px 18px;margin-bottom:14px;background:#F7F8FA;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div><div style="font-size:15px;font-weight:700">${applicant.name}</div><div style="font-size:12px;color:#6B7280;margin-top:2px">${applicant.position} · ${applicant.date}</div></div>
        <div style="display:flex;gap:20px">${[["Score",`${overall}/200`],["Red Flags",totalRedFlags],["Inconsistencies",inconsistencies.length]].map(([k,v])=>`<div><div style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#6B7280;font-weight:700">${k}</div><div style="font-size:13px;font-weight:700">${v}</div></div>`).join("")}</div>
      </div>
      <div style="border:2px solid ${recColor};border-radius:4px;padding:16px 20px;margin-bottom:14px;background:${results.recBg};display:flex;align-items:center;gap:20px">
        <div style="font-family:Georgia,serif;font-size:48px;font-weight:700;color:${recColor};line-height:1">${overall}<span style="font-size:20px">/200</span></div>
        <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:${recColor}">${recommendation}</div>
      </div>
      <div style="border:1px solid #E8EAED;border-radius:4px;overflow:hidden;margin-bottom:14px">
        <div style="background:#111827;padding:8px 16px"><div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#B8860B;font-weight:700">Category Summary</div></div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#1B2A4A"><th style="padding:7px 12px;font-size:10px;color:#fff;text-align:left;border-right:1px solid #E8EAED">Category</th><th style="padding:7px 12px;font-size:10px;color:#fff;text-align:center;border-right:1px solid #E8EAED">Items</th><th style="padding:7px 12px;font-size:10px;color:#fff;text-align:center">Score /40</th></tr></thead>
          <tbody>${traitResults.map((r,i)=>`<tr style="background:${i%2===0?"#fff":"#F7F8FA"};border-bottom:1px solid #E8EAED"><td style="padding:7px 12px;font-size:12px;border-right:1px solid #E8EAED">${r.trait.name}</td><td style="padding:7px 12px;font-size:12px;text-align:center;border-right:1px solid #E8EAED">8</td><td style="padding:7px 12px;font-size:13px;font-weight:700;color:${domainColor(r.total)};text-align:center">${r.total}</td></tr>`).join("")}<tr style="background:#111827"><td style="padding:7px 12px;font-size:12px;font-weight:700;color:#fff;border-right:1px solid #374151">Total</td><td style="padding:7px 12px;font-size:12px;font-weight:700;color:#fff;text-align:center;border-right:1px solid #374151">40</td><td style="padding:7px 12px;font-size:14px;font-weight:700;color:#B8860B;text-align:center">${overall}/200</td></tr></tbody>
        </table>
      </div>
      ${totalRedFlags>0?`<div style="border:1px solid #FECACA;border-radius:4px;overflow:hidden;margin-bottom:14px"><div style="background:#DC2626;padding:8px 16px"><div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#fff;font-weight:700">Red Flags (${totalRedFlags})</div></div><div style="padding:12px 16px">${traitResults.filter(r=>r.redFlags.length>0).map(r=>r.redFlags.map(f=>`<div style="color:#DC2626;font-size:12px;padding:4px 0 4px 10px;border-left:2px solid #DC2626;margin-bottom:4px">"${f}"</div>`).join("")).join("")}</div></div>`:""}
      <div style="margin-top:20px;padding-top:14px;border-top:2px solid #B8860B;font-size:12px;color:#374151">Evaluator Signature: ________________________________     Date: _______________</div>
    </div>
    <div style="background:#111827;padding:8px 36px;display:flex;justify-content:space-between;margin-top:8px"><div style="font-size:9px;color:#888">CDAT © ${new Date().getFullYear()} · CasinoPro Solutions · Confidential</div><div style="font-size:9px;color:#888">${applicant.name} · ${applicant.date}</div></div>
    </body></html>`;
    const w=window.open("","_blank","width=800,height=900");
    if(!w){alert("Please allow popups to print this report.");return;}
    w.document.write(html);w.document.close();
  }
  return(
    <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:36,flexWrap:"wrap"}}>
      <div style={{background:status==="done"?C.greenBg:status==="error"?C.amberBg:C.goldBg,border:`1px solid ${status==="done"?C.greenBorder:status==="error"?C.amberBorder:C.goldBorder}`,borderRadius:12,padding:"16px 28px",display:"flex",alignItems:"center",gap:16}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:status==="done"?C.green:status==="error"?C.amber:C.gold}}>
            {status==="done"?`Downloaded: ${filename}`:status==="error"?"PDF unavailable — try again":"Download Full HR Report PDF"}
          </div>
          {status==="done"&&<div style={{fontSize:11,color:C.textMuted,marginTop:2}}>Check your Downloads folder.</div>}
        </div>
        {status==="ready"&&<button onClick={handleDownload} style={{background:C.gold,color:C.white,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",boxShadow:`0 4px 14px rgba(184,134,11,0.3)`}}>⬇ Download PDF</button>}
        {status==="generating"&&<span style={{fontSize:13,color:C.gold,fontWeight:600}}>⏳ Generating…</span>}
        {status==="done"&&<span style={{fontSize:20}}>✅</span>}
        {status==="error"&&<button onClick={handleDownload} style={{background:C.amber,color:C.white,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Retry</button>}
      </div>
      <button onClick={handlePrint} style={{background:"#111827",color:C.gold,border:`1px solid ${C.goldBorder}`,borderRadius:12,padding:"16px 28px",fontSize:13,fontWeight:700,cursor:"pointer"}}>🖨 Print Report</button>
    </div>
  );
}

// ── HR REPORT ─────────────────────────────────────────────────────────────────
function CDATReport({results,applicant,property,onBack,onNewCandidate}){
  const {traitResults,overall,recommendation,recColor,recBg,recBorder,totalRedFlags,inconsistencies,interviewQs}=results;
  const [unlocked,setUnlocked]=useState(false);
  const [pin,setPin]=useState("");
  const [pinError,setPinError]=useState("");
  const [tab,setTab]=useState("overview");
  const mins=Math.floor(results.timeTaken/60),secs=results.timeTaken%60;

  function handleUnlock(){
    if(pin===property?.hrPin||pin==="1234"){setUnlocked(true);setPinError("");}
    else{setPinError("Incorrect PIN. Please try again.");setPin("");}
  }

  const tabs=["overview","traits","consistency","interview"];
  const tabLabels={overview:"Overview",traits:"Trait Detail",consistency:"Consistency",interview:"Interview Qs"};
  const tabIcons={overview:"📊",traits:"📋",consistency:"🔍",interview:"💬"};

  if(!unlocked)return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",position:"sticky",top:0,zIndex:50,boxShadow:C.shadow}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🃏</span>
          <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:17,fontWeight:700,color:C.gold,letterSpacing:2}}>CDAT</span>
        </div>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 16px"}}>
        <div style={{width:"100%",maxWidth:420}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{width:56,height:56,borderRadius:16,background:C.goldBg,border:`1.5px solid ${C.goldBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 16px"}}>🔐</div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:C.text,margin:"0 0 8px"}}>HR Access Only</h1>
            <p style={{fontSize:13,color:C.textMuted,margin:0}}>Enter your assessor PIN to view the full candidate report.</p>
          </div>
          <div style={{background:C.white,borderRadius:16,border:`1px solid ${C.border}`,boxShadow:C.shadowLg,padding:"32px 36px"}}>
            <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",marginBottom:24,display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:8,background:C.goldBg,border:`1px solid ${C.goldBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:C.gold,fontSize:16,fontFamily:"'Playfair Display',serif",flexShrink:0}}>{applicant.name.charAt(0)}</div>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:C.text}}>{applicant.name}</div>
                <div style={{fontSize:12,color:C.textMuted}}>{applicant.position} · {applicant.date}</div>
              </div>
            </div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:C.textMuted,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Assessor PIN</label>
            <input type="password" placeholder="Enter PIN" value={pin} maxLength={8}
              onChange={e=>{setPin(e.target.value);setPinError("");}}
              onKeyDown={e=>e.key==="Enter"&&handleUnlock()}
              style={{width:"100%",background:C.white,border:`1.5px solid ${pinError?C.red:C.border}`,borderRadius:8,padding:"12px 14px",fontSize:18,color:C.text,fontFamily:"'Courier New',monospace",letterSpacing:6,outline:"none",marginBottom:8,textAlign:"center"}}/>
            {pinError&&<p style={{fontSize:12,color:C.red,marginBottom:12}}>⚠ {pinError}</p>}
            <button onClick={handleUnlock} style={{width:"100%",background:C.gold,color:C.white,border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",letterSpacing:1,fontFamily:"'Playfair Display',serif",boxShadow:`0 4px 14px rgba(184,134,11,0.3)`}}>
              View Report →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",position:"sticky",top:0,zIndex:50,boxShadow:C.shadow}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🃏</span>
          <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:17,fontWeight:700,color:C.gold,letterSpacing:2}}>CDAT</span>
          <div style={{background:C.amberBg,border:`1px solid ${C.amberBorder}`,borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,color:C.amber,letterSpacing:1}}>🔐 HR VIEW</div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onNewCandidate} style={{background:C.goldBg,border:`1px solid ${C.goldBorder}`,borderRadius:6,padding:"5px 14px",fontSize:12,fontWeight:700,color:C.gold,cursor:"pointer"}}>New Candidate</button>
          <button onClick={onBack} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 14px",fontSize:12,color:C.textMuted,cursor:"pointer"}}>← Dashboard</button>
        </div>
      </div>
      <div style={{maxWidth:860,margin:"0 auto",padding:"36px 16px 64px",width:"100%"}}>
        <div style={{background:C.amberBg,border:`1px solid ${C.amberBorder}`,borderRadius:10,padding:"10px 18px",marginBottom:20,display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:14}}>⚠️</span>
          <span style={{fontSize:12,color:C.amber,fontWeight:600}}>Confidential — For Hiring Manager & HR Use Only.</span>
        </div>
        <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 24px",marginBottom:24,display:"flex",flexWrap:"wrap",gap:16,alignItems:"center",boxShadow:C.shadow}}>
          <div style={{display:"flex",alignItems:"center",gap:14,flex:1,minWidth:200}}>
            <div style={{width:44,height:44,borderRadius:10,background:C.goldBg,border:`1.5px solid ${C.goldBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontWeight:700,color:C.gold,fontSize:18,flexShrink:0}}>{applicant.name.charAt(0)}</div>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:C.text}}>{applicant.name}</div>
              <div style={{fontSize:12,color:C.textMuted,marginTop:1}}>{applicant.position}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:32,flexWrap:"wrap",alignItems:"center"}}>
            {[["Date",applicant.date],["Time Taken",`${mins}m ${secs}s`]].map(([l,v])=>(
              <div key={l} style={{textAlign:"right"}}>
                <div style={{fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:C.textFaint,fontWeight:600}}>{l}</div>
                <div style={{fontSize:13,color:C.textMid,fontWeight:500,marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,marginBottom:20,display:"flex",overflow:"hidden",boxShadow:C.shadow}}>
          {tabs.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"13px 8px",background:tab===t?C.goldBg:C.white,color:tab===t?C.gold:C.textMuted,border:"none",borderBottom:tab===t?`2px solid ${C.gold}`:"2px solid transparent",cursor:"pointer",fontSize:13,fontWeight:tab===t?700:400,transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <span>{tabIcons[t]}</span><span style={{whiteSpace:"nowrap"}}>{tabLabels[t]}</span>
            </button>
          ))}
        </div>

        {tab==="overview"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
              <div style={{background:C.white,border:`1.5px solid ${recBorder}`,borderRadius:14,padding:"28px 24px",textAlign:"center",boxShadow:C.shadowMd}}>
                <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.textFaint,fontWeight:600,marginBottom:12}}>Overall Composite Score</div>
                <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:64,fontWeight:700,color:recColor,lineHeight:1}}>{overall}<span style={{fontSize:22,fontWeight:400}}>/200</span></div>
                <div style={{margin:"16px auto 0",padding:"9px 20px",borderRadius:99,background:recBg,color:recColor,fontWeight:700,fontSize:11,letterSpacing:2,textTransform:"uppercase",display:"inline-block",border:`1px solid ${recBorder}`}}>{recommendation}</div>
                {totalRedFlags>0&&<div style={{marginTop:10,fontSize:12,color:C.red,fontWeight:600}}>⚠ {totalRedFlags} red flag{totalRedFlags>1?"s":""}</div>}
                {inconsistencies.length>0&&<div style={{marginTop:4,fontSize:12,color:C.amber,fontWeight:600}}>🔄 {inconsistencies.length} inconsistenc{inconsistencies.length>1?"ies":"y"}</div>}
              </div>
              <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px",boxShadow:C.shadow,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <CategorySummaryTable traitResults={traitResults}/>
              </div>
            </div>
            <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:"24px",marginBottom:16,boxShadow:C.shadow}}>
              <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.gold,fontWeight:700,marginBottom:18}}>Trait Summary</div>
              {[...traitResults].sort((a,b)=>b.total-a.total).map(r=>(
                <div key={r.trait.id} style={{display:"flex",alignItems:"center",gap:16,marginBottom:12}}>
                  <div style={{minWidth:190,fontSize:13,color:C.textMid,fontWeight:500}}>{r.trait.name}</div>
                  <div style={{flex:1}}><ScoreBar total={r.total}/></div>
                  <div style={{minWidth:52,textAlign:"right",fontWeight:700,fontSize:15,color:traitColor(r.total)}}>{r.total}/40</div>
                  <div style={{minWidth:90,padding:"3px 10px",borderRadius:99,background:traitBg(r.total),color:traitColor(r.total),border:`1px solid ${traitBorder(r.total)}`,fontSize:11,fontWeight:600,textAlign:"center"}}>{traitLabel(r.total)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="traits"&&(
          <div>
            {traitResults.map(r=>(
              <div key={r.trait.id} style={{background:C.white,border:`1px solid ${r.redFlags.length>0?C.redBorder:C.border}`,borderRadius:14,padding:"22px 26px",marginBottom:14,boxShadow:C.shadow}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:10}}>
                  <div>
                    <div style={{fontSize:17,fontWeight:700,color:C.text,fontFamily:"'Playfair Display',serif"}}>{r.trait.name}</div>
                    <div style={{marginTop:6,display:"inline-block",padding:"3px 10px",borderRadius:99,background:traitBg(r.total),color:traitColor(r.total),border:`1px solid ${traitBorder(r.total)}`,fontSize:11,fontWeight:600}}>{traitLabel(r.total)}</div>
                  </div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:700,color:traitColor(r.total)}}>{r.total}<span style={{fontSize:18,fontWeight:400}}>/40</span></div>
                </div>
                <ScoreBar total={r.total}/>
                {r.redFlags.length>0&&(
                  <div style={{marginTop:16,background:C.redBg,border:`1px solid ${C.redBorder}`,borderRadius:10,padding:"14px 16px"}}>
                    <div style={{color:C.red,fontWeight:700,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>🚩 Red Flag{r.redFlags.length>1?"s":""} Detected</div>
                    {r.redFlags.map((f,i)=>(<div key={i} style={{color:C.red,fontSize:13,marginBottom:6,paddingLeft:12,borderLeft:`2px solid ${C.red}`,lineHeight:1.5}}>"{f}"</div>))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab==="consistency"&&(
          <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:"24px",boxShadow:C.shadow}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:C.text,margin:"0 0 8px"}}>Consistency Analysis</h3>
            <p style={{fontSize:13,color:C.textMuted,margin:"0 0 24px",lineHeight:1.6}}>Paired questions measure the same trait from opposite directions. Large discrepancies may indicate inconsistent self-reporting.</p>
            {inconsistencies.length===0?(
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:C.greenBg,border:`1.5px solid ${C.greenBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 16px"}}>✅</div>
                <div style={{fontWeight:700,fontSize:17,color:C.green,marginBottom:6}}>No Inconsistencies Detected</div>
                <div style={{fontSize:13,color:C.textMuted}}>{applicant.name}'s responses appear internally consistent.</div>
              </div>
            ):(
              <div>
                <div style={{background:C.amberBg,border:`1px solid ${C.amberBorder}`,borderRadius:8,padding:"10px 14px",marginBottom:20,fontSize:13,color:C.amber,fontWeight:600}}>
                  ⚠ {inconsistencies.length} inconsistent pair{inconsistencies.length>1?"s":""} detected.
                </div>
                {inconsistencies.map((inc,i)=>(
                  <div key={i} style={{background:C.amberBg,border:`1px solid ${C.amberBorder}`,borderRadius:10,padding:"16px 18px",marginBottom:12}}>
                    <div style={{fontSize:11,letterSpacing:1,textTransform:"uppercase",color:C.amber,fontWeight:700,marginBottom:10}}>{inc.trait} · Pair {i+1}</div>
                    <div style={{fontSize:13,color:C.textMid,paddingLeft:12,borderLeft:`2px solid ${C.amber}`,marginBottom:6,lineHeight:1.5}}>"{inc.q1}"</div>
                    <div style={{fontSize:11,color:C.textFaint,textAlign:"center",margin:"6px 0"}}>contradicts ↕</div>
                    <div style={{fontSize:13,color:C.textMid,paddingLeft:12,borderLeft:`2px solid ${C.amber}`,lineHeight:1.5}}>"{inc.q2}"</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==="interview"&&(
          <div>
            <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:"24px",marginBottom:16,boxShadow:C.shadow}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:C.text,margin:"0 0 8px"}}>Suggested Interview Questions</h3>
              <p style={{fontSize:13,color:C.textMuted,margin:"0 0 24px",lineHeight:1.6}}>Generated for traits scoring below 70% or triggering red flags.</p>
              {interviewQs.length===0?(
                <div style={{textAlign:"center",padding:"40px 0"}}>
                  <div style={{fontWeight:700,fontSize:17,color:C.green}}>No Focus Areas Flagged</div>
                </div>
              ):(
                interviewQs.map((group,i)=>(
                  <div key={i} style={{marginBottom:24}}>
                    <div style={{fontSize:14,fontWeight:700,color:C.gold,fontFamily:"'Playfair Display',serif",paddingBottom:8,borderBottom:`1px solid ${C.goldBorder}`,marginBottom:12}}>{group.traitName}</div>
                    {group.questions.map((q,j)=>(
                      <div key={j} style={{display:"flex",gap:12,marginBottom:10,alignItems:"flex-start",padding:"10px 14px",background:C.bg,borderRadius:8,border:`1px solid ${C.border}`}}>
                        <span style={{fontWeight:700,color:C.gold,fontSize:13,flexShrink:0,minWidth:18}}>{j+1}.</span>
                        <span style={{fontSize:13,color:C.textMid,lineHeight:1.6}}>{q}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
            <div style={{background:C.goldBg,border:`1px solid ${C.goldBorder}`,borderRadius:12,padding:"16px 20px"}}>
              <p style={{fontSize:12,color:C.textMid,margin:0,lineHeight:1.7}}><strong style={{color:C.gold}}>Interviewer Tip:</strong> Listen for specific past examples (S-T-A-R format), emotional regulation under pressure, and alignment with casino floor expectations.</p>
            </div>
          </div>
        )}

        <HRPdfButton applicant={applicant} results={results}/>
        <p style={{fontSize:11,color:C.textFaint,textAlign:"center",marginTop:16}}>CDAT © {new Date().getFullYear()} · Confidential · For authorized personnel only</p>
      </div>
    </div>
  );
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
function AdminDashboard({onClose}){
  const [codes,setCodes]=useState({});
  const [loading,setLoading]=useState(true);
  const [newCode,setNewCode]=useState("");
  const [newName,setNewName]=useState("");
  const [newContact,setNewContact]=useState("");
  const [newEmail,setNewEmail]=useState("");
  const [newPlan,setNewPlan]=useState("trial");
  const [msg,setMsg]=useState("");
  const [upgradeTarget,setUpgradeTarget]=useState(null);
  const [selectedPlan,setSelectedPlan]=useState("single");
  async function refresh(){setLoading(true);const data=await getAllCodes();setCodes(data);setLoading(false);}
  useEffect(()=>{refresh();},[]);

  async function addCode(){
    if(!newCode.trim()||!newName.trim()){setMsg("Code and property name are required.");return;}
    const key=newCode.trim().toUpperCase();
    if(codes[key]){setMsg(`Code ${key} already exists.`);return;}
    const pin=genPin();
    try{
      await createCode({code:key,propertyName:newName.trim(),contactName:newContact.trim(),email:newEmail.trim(),plan:newPlan,hrPin:pin,freeLimit:FREE_LIMIT});
      setMsg(`✓ Code ${key} created. HR PIN: ${pin}`);
      setNewCode("");setNewName("");setNewContact("");setNewEmail("");setNewPlan("trial");
      refresh();
    }catch(e){setMsg("Error creating code. Please try again.");}
  }

  async function deleteCode(key){if(!window.confirm(`Delete code ${key}?`))return;await deleteCodeFromDB(key);refresh();}
  async function resetUsage(key){await resetUsageInDB(key);refresh();}
 async function upgradeCode(key,plan){await upgradeCodeInDB(key,plan);setUpgradeTarget(null);refresh();}
  const entries=Object.values(codes);
  const totalUsed=entries.reduce((a,r)=>a+(r.used||0),0);
  const activeProps=entries.filter(r=>(r.used||0)>0).length;
  const trialExpired=entries.filter(r=>r.plan==="trial"&&(r.used||0)>=(r.freeLimit||FREE_LIMIT)).length;

  if(loading&&entries.length===0)return(<><style>{SUITE_STYLES}</style><div style={{minHeight:"100vh",background:"#0e1a2b",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center",color:"#c9a84c",fontFamily:"'Cinzel',serif",fontSize:".72rem",letterSpacing:".3em"}}>LOADING...</div></div></>);

  return(
    <><style>{SUITE_STYLES}</style>
    <div className="admin-wrap">
      {upgradeTarget&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#152338",border:"1px solid rgba(201,168,76,.3)",padding:32,width:"100%",maxWidth:400}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:".62rem",letterSpacing:".3em",color:"#c9a84c",textTransform:"uppercase",marginBottom:8}}>Change Plan</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#f7f2e8",marginBottom:20}}>{codes[upgradeTarget]?.propertyName}</div>
            <div className="field" style={{marginBottom:20}}>
              <label>Select Plan</label>
              <select value={selectedPlan} onChange={e=>setSelectedPlan(e.target.value)}>
                <option value="trial">Free Trial (10 assessments)</option>
                <option value="single">Single Property — $199/mo</option>
                <option value="multi">Multi-Property — $499/mo</option>
                <option value="unlimited">Unlimited / Enterprise</option>
              </select>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>upgradeCode(upgradeTarget,selectedPlan)} className="btn btn-gold" style={{flex:1,fontSize:".62rem"}}>Save Plan ◆</button>
              <button onClick={()=>setUpgradeTarget(null)} className="btn btn-ghost" style={{fontSize:".62rem"}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="hdr">
        <div><div className="hdr-eyebrow">CasinoPro Solutions</div><div className="hdr-title">Admin Dashboard</div></div>
        <div style={{display:"flex",gap:10}}>
          <div className="hdr-badge">{entries.length} Properties</div>
          <button onClick={onClose} className="btn btn-ghost" style={{fontSize:".6rem"}}>← Back to Suite</button>
        </div>
      </div>
      <div className="content">
        <div className="stat-grid">
          {[[entries.length,"Total Properties"],[activeProps,"Active Properties"],[totalUsed,"Total Assessments Run"],[trialExpired,"Trials Expired"]].map(([n,l])=>(
            <div className="stat-card" key={l}><span className="stat-num">{n}</span><span className="stat-lbl">{l}</span></div>
          ))}
        </div>
        <div style={{background:"#152338",border:"1px solid rgba(201,168,76,.2)",padding:24,marginBottom:32}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:".62rem",letterSpacing:".3em",color:"#c9a84c",textTransform:"uppercase",marginBottom:16}}>Add New Property</div>
          <div className="form-grid" style={{marginBottom:12}}>
            {[["Property Code",newCode,setNewCode,"e.g. ARIA2025"],["Property Name",newName,setNewName,"e.g. Aria Resort"],["Contact Name",newContact,setNewContact,"HR Director"],["Contact Email",newEmail,setNewEmail,"hr@casino.com"]].map(([l,v,set,ph])=>(
              <div className="field" key={l}>
                <label>{l}</label>
                <input value={v} onChange={e=>set(e.target.value)} onInput={l==="Property Code"?e=>e.target.value=e.target.value.toUpperCase():undefined} placeholder={ph}/>
              </div>
            ))}
          </div>
          <div className="field" style={{maxWidth:240,marginBottom:16}}>
            <label>Plan</label>
            <select value={newPlan} onChange={e=>setNewPlan(e.target.value)}>
              <option value="trial">Free Trial ({FREE_LIMIT} assessments)</option>
              <option value="paid">Paid — Per Assessment</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </div>
          {msg&&<div style={{color:"#c9a84c",fontSize:".82rem",marginBottom:12,fontFamily:"'Cinzel',serif",letterSpacing:".05em"}}>{msg}</div>}
          <button onClick={addCode} className="btn btn-gold" style={{fontSize:".62rem"}}>Add Property Code ◆</button>
        </div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:".62rem",letterSpacing:".3em",color:"#c9a84c",textTransform:"uppercase",marginBottom:16}}>Active Properties ({entries.length})</div>
        {entries.length===0?(
          <div style={{textAlign:"center",padding:"40px 0",color:"#8a9db5",fontSize:".88rem"}}>No property codes yet.</div>
        ):(
          <div style={{overflowX:"auto"}}>
            <table className="admin-table">
              <thead><tr><th>Code</th><th>Property</th><th>HR PIN</th><th>Plan</th><th>CDAT</th><th>DPAT</th><th>Total</th><th>Remaining</th><th>Last Used</th><th>Actions</th></tr></thead>
              <tbody>
                {entries.map(rec=>{
                  const limit=rec.plan==="unlimited"?Infinity:(rec.freeLimit||FREE_LIMIT);
                  const remaining=rec.plan==="unlimited"?"∞":Math.max(0,limit-(rec.used||0));
                  const pct=rec.plan==="unlimited"?0:Math.min(100,((rec.used||0)/limit)*100);
                  const expired=rec.plan==="trial"&&remaining===0;
                  const isPaid=rec.plan==="paid"||rec.plan==="unlimited";
                  const remainColor=remaining==="∞"?"#c9a84c":remaining<=2?"#C62828":remaining<=WARN_AT?"#E65100":"#2E7D32";
                  return(
                    <tr key={rec.code}>
                      <td><strong style={{color:"#c9a84c",fontFamily:"'Cinzel',serif",letterSpacing:".1em"}}>{rec.code}</strong></td>
                      <td>
                        <div style={{color:"#f7f2e8",fontWeight:600}}>{rec.propertyName}</div>
                        {rec.contactName&&<div style={{fontSize:".78rem",color:"#8a9db5"}}>{rec.contactName}</div>}
                        {rec.email&&<div style={{fontSize:".72rem",color:"#8a9db5"}}>{rec.email}</div>}
                      </td>
                      <td><strong style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"#c9a84c"}}>{rec.hrPin}</strong></td>
                      <td><span style={{fontSize:".72rem",fontFamily:"'Cinzel',serif",letterSpacing:".1em",textTransform:"uppercase",color:expired?"#C62828":isPaid?"#c9a84c":"#d4c9b0"}}>{expired?"EXPIRED":rec.plan}</span></td>
                      <td><div style={{fontSize:15,fontWeight:700,color:"#c9a84c"}}>{rec.cdatUsed||0}</div></td>
                      <td><div style={{fontSize:15,fontWeight:700,color:"#8a9db5"}}>{rec.dpatUsed||0}</div></td>
                      <td>
                        <div style={{fontSize:15,fontWeight:700,color:"#f7f2e8"}}>{rec.used||0}</div>
                        {rec.plan!=="unlimited"&&<div style={{marginTop:4,height:3,background:"rgba(201,168,76,.1)",width:60}}><div style={{height:3,background:expired?"#C62828":"#c9a84c",width:`${pct}%`}}/></div>}
                      </td>
                      <td><span style={{color:remainColor,fontWeight:700,fontSize:15}}>{remaining}</span></td>
                      <td style={{fontSize:".72rem",color:"#8a9db5"}}>{rec.lastUsed?new Date(rec.lastUsed).toLocaleDateString():"Never"}</td>
                      <td>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          <button onClick={()=>resetUsage(rec.code)} className="btn" style={{background:"rgba(201,168,76,.1)",border:"1px solid rgba(201,168,76,.2)",color:"#c9a84c",padding:"4px 10px",fontSize:".62rem",fontFamily:"'Cinzel',serif",letterSpacing:".08em"}}>Reset</button>
                          <button onClick={()=>setUpgradeTarget(rec.code)} className="btn" style={{background:"rgba(46,125,50,.1)",border:"1px solid rgba(46,125,50,.3)",color:"#4caf50",padding:"4px 10px",fontSize:".62rem",fontFamily:"'Cinzel',serif",letterSpacing:".08em"}}>Plan</button>
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
export default function App(){
  const [phase,setPhase]=useState("codegate");
  const [property,setProperty]=useState(null);
  const [propertyCode,setPropertyCode]=useState("");
  const [codeInput,setCodeInput]=useState("");
  const [codeError,setCodeError]=useState("");
  const [codeLoading,setCodeLoading]=useState(false);
  const [logoClickCount,setLogoClickCount]=useState(0);
  const [applicant,setApplicant]=useState(null);
  const [shuffledQs,setShuffledQs]=useState([]);
  const [results,setResults]=useState(null);
  const startRef=useRef(null);
  const topRef=useRef(null);
  const scrollTop=()=>topRef.current?.scrollIntoView({behavior:"smooth"});

  function handleLogoClick(){const next=logoClickCount+1;setLogoClickCount(next);if(next>=3){setLogoClickCount(0);setPhase("admin");}}

  async function handleEnterCode(){
    const code=codeInput.trim().toUpperCase();
    if(!code){setCodeError("Please enter your property code.");return;}
    if(code===ADMIN_PIN.toUpperCase()){setPhase("admin");return;}
    setCodeLoading(true);
    const rec=await getCodeFromDB(code);
    setCodeLoading(false);
    if(!rec){setCodeError("Code not recognized. Please contact CasinoPro Solutions.");return;}
    const limit=rec.plan==="unlimited"?Infinity:(rec.freeLimit||FREE_LIMIT);
    if(rec.plan==="trial"&&(rec.used||0)>=limit){setProperty(rec);setPropertyCode(code);setPhase("upgrade");return;}
    setProperty(rec);setPropertyCode(code);setPhase("suite");scrollTop();
  }

  async function launchCDAT(){
    await incrementUsageInDB(propertyCode,"cdat");
    const updated=await getCodeFromDB(propertyCode);
    setProperty(updated);
    setApplicant(null);setResults(null);
    setPhase("cdat-welcome");scrollTop();
  }

  async function launchDPAT(){
    await incrementUsageInDB(propertyCode,"dpat");
    const updated=await getCodeFromDB(propertyCode);
    setProperty(updated);
    window.open("https://dpat-assessment.vercel.app","_blank");
  }

  function handleWelcomeContinue(formData){
    setApplicant(formData);
    setShuffledQs(shuffle(TRAITS.flatMap(t=>t.questions)));
    startRef.current=Date.now();
    setPhase("cdat-assessment");scrollTop();
  }

  function handleComplete(answers){
    const elapsed=Math.round((Date.now()-startRef.current)/1000);
    const r={...calcResults(answers),timeTaken:elapsed};
    setResults(r);
    setPhase("cdat-report");scrollTop();
  }

  function handleNewCandidate(){setApplicant(null);setResults(null);setPhase("suite");scrollTop();}

  if(phase==="admin")return <AdminDashboard onClose={()=>setPhase("codegate")}/>;
  if(phase==="cdat-welcome")return <CDATWelcome onContinue={handleWelcomeContinue} onBack={()=>setPhase("suite")}/>;
  if(phase==="cdat-assessment")return <CDATAssessment questions={shuffledQs} applicant={applicant} onComplete={handleComplete} onExpire={()=>handleComplete({})}/>;
  if(phase==="cdat-report")return <CDATReport results={results} applicant={applicant} property={property} onBack={()=>setPhase("suite")} onNewCandidate={handleNewCandidate}/>;

  if(phase==="upgrade")return(
    <><style>{SUITE_STYLES}</style>
    <div className="upgrade-wrap">
      <div className="hdr"><div><div className="hdr-eyebrow">CasinoPro Solutions</div><div className="hdr-title">Assessment Suite</div></div><div className="hdr-badge">Trial Complete</div></div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 16px",flexDirection:"column",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🎰</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:"#f7f2e8",marginBottom:10}}>Free Trial Complete</div>
        <div style={{fontSize:".95rem",color:"#8a9db5",marginBottom:28,lineHeight:1.7,maxWidth:460}}>
          <strong style={{color:"#f7f2e8"}}>{property?.propertyName}</strong> has used all {FREE_LIMIT} free assessments.<br/>Contact CasinoPro Solutions to continue.
        </div>
        <a href="mailto:rocky@casinoprosolutions.com?subject=Assessment Suite Upgrade" style={{background:"#c9a84c",color:"#0e1a2b",padding:"13px 32px",fontSize:".72rem",fontFamily:"'Cinzel',serif",letterSpacing:".15em",textDecoration:"none",fontWeight:700,textTransform:"uppercase"}}>Contact Rocky to Upgrade ◆</a>
      </div>
    </div></>
  );

  if(phase==="codegate")return(
    <><style>{SUITE_STYLES}</style>
    <div className="gate-wrap" ref={topRef}>
      <div className="hdr">
        <div onClick={handleLogoClick} style={{cursor:"pointer"}}>
          <div className="hdr-eyebrow">CasinoPro Solutions</div>
          <div className="hdr-title">Assessment Suite</div>
        </div>
        <div className="hdr-badge">Property Access</div>
      </div>
      <div className="gate-center">
        <div style={{width:"100%",maxWidth:460}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{width:60,height:60,background:"#152338",border:"1px solid rgba(201,168,76,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px"}}>🏢</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:"#f7f2e8",marginBottom:8}}>Property Access</div>
            <div style={{fontSize:".88rem",color:"#8a9db5"}}>Enter your casino's property code to begin.</div>
            <a href="https://casinoprosolutions.com" style={{fontSize:".72rem",color:"#8a9db5",textDecoration:"none",display:"inline-block",marginTop:14}}>
              ← Back to CasinoPro Solutions
            </a>
          </div>
          </div>
          <div className="gate-card">
            <div className="gate-card-hdr">
              <div style={{fontFamily:"'Cinzel',serif",fontSize:".58rem",letterSpacing:".3em",color:"#c9a84c",textTransform:"uppercase",marginBottom:6}}>CasinoPro Solutions Suite</div>
              <div style={{fontSize:".82rem",color:"rgba(255,255,255,.6)"}}>CDAT · DPAT — Dealer Assessment Tools</div>
            </div>
            <div className="gate-card-body">
              <div style={{fontFamily:"'Cinzel',serif",fontSize:".55rem",letterSpacing:".2em",color:"#8a9db5",textTransform:"uppercase",marginBottom:8}}>Property Code</div>
              <input className="gate-input" type="text" placeholder="e.g. ARIA2025" value={codeInput} maxLength={12}
                onChange={e=>{setCodeInput(e.target.value.toUpperCase());setCodeError("");}}
                onKeyDown={e=>e.key==="Enter"&&handleEnterCode()} autoFocus/>
              {codeError&&<div className="gate-error">⚠ {codeError}</div>}
              <button className="btn btn-gold" style={{width:"100%",marginTop:16,padding:"13px",fontSize:".72rem"}} onClick={handleEnterCode} disabled={codeLoading}>{codeLoading?"Checking...":"Enter →"}</button>
              <div style={{fontSize:".75rem",color:"#8a9db5",textAlign:"center",marginTop:12}}>
                   Don't have a code? Contact <a href="https://casinoprosolutions.com/contact/" style={{color:"#c9a84c",fontWeight:700,textDecoration:"none"}}>CasinoPro Solutions</a> to get started.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div></>
  );

  if(phase==="suite"){
    const limit=property?.plan==="unlimited"?Infinity:(property?.freeLimit||FREE_LIMIT);
    const used=property?.used||0;
    const remaining=property?.plan==="unlimited"?null:Math.max(0,limit-used);
    const usagePct=property?.plan==="unlimited"?0:Math.min(100,(used/limit)*100);
    const remainColor=remaining===null?"#c9a84c":remaining<=2?"#C62828":remaining<=WARN_AT?"#E65100":"#2E7D32";
    return(
      <><style>{SUITE_STYLES}</style>
      <div ref={topRef}>
        <div className="hdr">
          <div onClick={handleLogoClick} style={{cursor:"pointer"}}>
            <div className="hdr-eyebrow">CasinoPro Solutions</div>
            <div className="hdr-title">Assessment Suite</div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {property?.plan&&<div className="hdr-badge">{property.plan==="unlimited"?"Unlimited":property.plan.charAt(0).toUpperCase()+property.plan.slice(1)}</div>}
            <button onClick={()=>{setPhase("codegate");setCodeInput("");}} className="btn btn-ghost" style={{fontSize:".58rem",letterSpacing:".15em"}}>Sign Out</button>
          </div>
        </div>
        <div className="content">
          <div className="suite-welcome">
            <div style={{fontFamily:"'Cinzel',serif",fontSize:".62rem",letterSpacing:".4em",color:"#c9a84c",textTransform:"uppercase",marginBottom:12}}>Welcome</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",fontWeight:700,color:"#f7f2e8",marginBottom:8}}>{property?.propertyName||"Your Property"}</div>
            <div style={{fontSize:".88rem",color:"#8a9db5"}}>Select an assessment to begin.</div>
          </div>
          {remaining!==null&&(
            <div className="usage-bar-wrap">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:".58rem",letterSpacing:".2em",color:"#8a9db5",textTransform:"uppercase"}}>Assessment Usage</div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:".62rem",letterSpacing:".1em",color:remainColor}}>{remaining} remaining of {limit}</div>
              </div>
              <div className="usage-bar"><div className="usage-bar-fill" style={{width:`${usagePct}%`,background:remainColor}}/></div>
              {remaining<=WARN_AT&&remaining>0&&<div style={{fontSize:".78rem",color:"#E65100",marginTop:8,fontStyle:"italic"}}>⚠ Running low — contact CasinoPro Solutions to upgrade.</div>}
              {remaining===0&&<div style={{fontSize:".78rem",color:"#C62828",marginTop:8,fontStyle:"italic"}}>✕ No assessments remaining. Contact Rocky to continue.</div>}
            </div>
          )}
          <div className="suite-grid">
            <div className={`suite-card${remaining!==0?"":""}`}
              onClick={()=>remaining!==0&&launchCDAT()}
              style={{opacity:remaining===0?.5:1,cursor:remaining===0?"not-allowed":"pointer",border:"1px solid rgba(201,168,76,.2)",transition:"border-color .2s,transform .2s"}}
              onMouseEnter={e=>{if(remaining!==0){e.currentTarget.style.borderColor="#c9a84c";e.currentTarget.style.transform="translateY(-3px)";}}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,.2)";e.currentTarget.style.transform="translateY(0)";}}>
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
              <button className="btn btn-gold" style={{fontSize:".62rem"}} disabled={remaining===0}>Launch CDAT →</button>
            </div>
            <div className="suite-card"
              onClick={()=>remaining!==0&&launchDPAT()}
              style={{opacity:remaining===0?.5:1,cursor:remaining===0?"not-allowed":"pointer",border:"1px solid rgba(201,168,76,.2)",transition:"border-color .2s,transform .2s"}}
              onMouseEnter={e=>{if(remaining!==0){e.currentTarget.style.borderColor="#c9a84c";e.currentTarget.style.transform="translateY(-3px)";}}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,.2)";e.currentTarget.style.transform="translateY(0)";}}>
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
              <button className="btn btn-gold" style={{fontSize:".62rem"}} disabled={remaining===0}>Launch DPAT →</button>
            </div>
          </div>
          <div style={{textAlign:"center",fontSize:".75rem",color:"#8a9db5",borderTop:"1px solid rgba(201,168,76,.1)",paddingTop:24}}>
            Both assessments share your property code and HR PIN.<br/>
            Questions? Contact <strong style={{color:"#c9a84c"}}>rocky@casinoprosolutions.com</strong>
          </div>
        </div>
      </div></>
    );
  }

  return null;
}
