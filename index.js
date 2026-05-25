import { useState, useRef, useEffect } from "react";

const CODES_KEY = "cdat_property_codes";
const FREE_LIMIT = 10;
const ADMIN_PIN = "CDAT2025";
const WARN_AT = 5;

function getCodes() { try { return JSON.parse(localStorage.getItem(CODES_KEY) || "{}"); } catch { return {}; } }
function getCode(c) { if (!c) return null; return getCodes()[c.toUpperCase()] || null; }
function incrementUsage(code) {
  const codes = getCodes(); const rec = codes[code.toUpperCase()];
  if (!rec) return; rec.used = (rec.used || 0) + 1; rec.lastUsed = new Date().toISOString();
  localStorage.setItem(CODES_KEY, JSON.stringify(codes));
}
function saveCodes(c) { localStorage.setItem(CODES_KEY, JSON.stringify(c)); }
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
`;

// ── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({ onClose }) {
  const [codes, setCodes] = useState(getCodes());
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPlan, setNewPlan] = useState("trial");
  const [msg, setMsg] = useState("");

  function refresh() { setCodes(getCodes()); }

  function addCode() {
    if (!newCode.trim() || !newName.trim()) { setMsg("Code and property name are required."); return; }
    const existing = getCodes();
    const key = newCode.trim().toUpperCase();
    if (existing[key]) { setMsg(`Code ${key} already exists.`); return; }
    existing[key] = {
      code: key, propertyName: newName.trim(),
      contactName: newContact.trim(), email: newEmail.trim(),
      plan: newPlan, hrPin: genPin(),
      used: 0, freeLimit: FREE_LIMIT,
      createdAt: new Date().toISOString(), lastUsed: null
    };
    saveCodes(existing);
    setMsg(`✓ Code ${key} created. HR PIN: ${existing[key].hrPin}`);
    setNewCode(""); setNewName(""); setNewContact(""); setNewEmail(""); setNewPlan("trial");
    refresh();
  }

  function deleteCode(key) {
    if (!window.confirm(`Delete code ${key}?`)) return;
    const c = getCodes(); delete c[key]; saveCodes(c); refresh();
  }

  function resetUsage(key) {
    const c = getCodes(); if (c[key]) { c[key].used = 0; saveCodes(c); refresh(); }
  }

  function upgradeCode(key) {
    const c = getCodes();
    if (c[key]) { c[key].plan = "unlimited"; c[key].freeLimit = 9999; saveCodes(c); refresh(); }
  }

  const entries = Object.values(codes);
  const totalUsed = entries.reduce((a, r) => a + (r.used || 0), 0);
  const activeProps = entries.filter(r => (r.used || 0) > 0).length;
  const trialExpired = entries.filter(r => r.plan === "trial" && (r.used || 0) >= (r.freeLimit || FREE_LIMIT)).length;

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

        {/* Stats */}
        <div className="stat-grid">
          {[
            [entries.length, "Total Properties"],
            [activeProps, "Active Properties"],
            [totalUsed, "Total Assessments Run"],
            [trialExpired, "Trials Expired"],
          ].map(([n, l]) => (
            <div className="stat-card" key={l}>
              <span className="stat-num">{n}</span>
              <span className="stat-lbl">{l}</span>
            </div>
          ))}
        </div>

        {/* Add new code */}
        <div style={{ background: "#152338", border: "1px solid rgba(201,168,76,.2)", padding: 24, marginBottom: 32 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: ".62rem", letterSpacing: ".3em", color: "#c9a84c", textTransform: "uppercase", marginBottom: 16 }}>Add New Property</div>
          <div className="form-grid" style={{ marginBottom: 12 }}>
            {[["Property Code", newCode, setNewCode, "e.g. ARIA2025"], ["Property Name", newName, setNewName, "e.g. Aria Resort"], ["Contact Name", newContact, setNewContact, "HR Director"], ["Contact Email", newEmail, setNewEmail, "hr@casino.com"]].map(([l, v, set, ph]) => (
              <div className="field" key={l}>
                <label>{l}</label>
                <input value={v} onChange={e => set(l === "Property Code" || l === "Contact Email" ? e.target.value : e.target.value)} onInput={l === "Property Code" ? e => e.target.value = e.target.value.toUpperCase() : undefined} placeholder={ph} />
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

        {/* Property list */}
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
                      <td>
                        <span style={{ fontSize: ".72rem", fontFamily: "'Cinzel',serif", letterSpacing: ".1em", textTransform: "uppercase", color: expired ? "#C62828" : rec.plan === "unlimited" ? "#c9a84c" : "#d4c9b0" }}>
                          {expired ? "EXPIRED" : rec.plan}
                        </span>
                      </td>
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
  const topRef = useRef(null);
  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth" });

  function handleLogoClick() {
    const next = logoClickCount + 1;
    setLogoClickCount(next);
    if (next >= 3) { setLogoClickCount(0); setPhase("admin"); }
  }

  function handleEnterCode() {
    const code = codeInput.trim().toUpperCase();
    if (!code) { setCodeError("Please enter your property code."); return; }
    if (code === ADMIN_PIN.toUpperCase()) { setPhase("admin"); return; }
    const rec = getCode(code);
    if (!rec) { setCodeError("Code not recognized. Please contact CasinoPro Solutions."); return; }
    const limit = rec.plan === "unlimited" ? Infinity : (rec.freeLimit || FREE_LIMIT);
    if (rec.plan === "trial" && (rec.used || 0) >= limit) {
      setProperty(rec); setPropertyCode(code); setPhase("upgrade"); return;
    }
    setProperty(rec); setPropertyCode(code); setPhase("suite"); scrollTop();
  }

  // Admin
  if (phase === "admin") return <AdminDashboard onClose={() => setPhase("codegate")} />;

  // Upgrade screen
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

  // Code gate
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
              <button className="btn btn-gold" style={{ width: "100%", marginTop: 16, padding: "13px", fontSize: ".72rem" }} onClick={handleEnterCode}>Enter →</button>
              <div style={{ fontSize: ".75rem", color: "#8a9db5", textAlign: "center", marginTop: 12 }}>
                Don't have a code? Contact <strong style={{ color: "#c9a84c" }}>CasinoPro Solutions</strong> to get started.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div></>
  );

  // Suite dashboard
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
            <div className="suite-card featured" onClick={() => { if (remaining === 0) return; incrementUsage(propertyCode); window.open("https://casinoprosolutions.com/cdat/", "_blank"); }} style={{ opacity: remaining === 0 ? .5 : 1, cursor: remaining === 0 ? "not-allowed" : "pointer" }}>
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

            <div className="suite-card" onClick={() => { if (remaining === 0) return; incrementUsage(propertyCode); window.open("https://casinoprosolutions.com/dpat-assessment/", "_blank"); }} style={{ opacity: remaining === 0 ? .5 : 1, cursor: remaining === 0 ? "not-allowed" : "pointer" }}>
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
