
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Playfair+Display:ital,wght@0,700;1,400&family=Source+Sans+3:wght@300;400;500&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --navy:#0e1a2b;--navy-mid:#152338;--navy-lt:#1e3050;
  --gold:#c9a84c;--gold-lt:#e3c478;
  --cream:#f7f2e8;--muted:#8a9db5;--text:#d4c9b0;
}
body{font-family:'Source Sans 3',sans-serif;background:var(--navy);color:var(--cream)}

.page-hero{background:var(--navy-mid);padding:70px 60px;border-bottom:1px solid rgba(201,168,76,.2);text-align:center;}
.eyebrow{font-family:'Cinzel',serif;font-size:.65rem;letter-spacing:.4em;color:var(--gold);text-transform:uppercase;margin-bottom:16px;display:block;}
.hero-title{font-family:'Playfair Display',serif;font-size:3rem;font-weight:700;color:var(--cream);line-height:1.1;margin-bottom:16px;}
.hero-title em{font-style:italic;color:var(--gold)}
.hero-sub{font-size:1rem;color:var(--text);max-width:580px;margin:0 auto;line-height:1.8;font-weight:300;}
.ornament{display:flex;align-items:center;gap:12px;justify-content:center;margin:28px auto;}
.ornament::before,.ornament::after{content:'';flex:1;max-width:80px;height:1px;background:linear-gradient(to right,transparent,var(--gold));}
.ornament::after{background:linear-gradient(to left,transparent,var(--gold))}
.ornament-diamond{width:7px;height:7px;background:var(--gold);transform:rotate(45deg)}

.section{padding:80px 60px;}
.section-tag{font-family:'Cinzel',serif;font-size:.62rem;letter-spacing:.4em;color:var(--gold);text-transform:uppercase;margin-bottom:12px;display:block;}
.section-title{font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:700;color:var(--cream);line-height:1.2;margin-bottom:12px;}
.section-title em{font-style:italic;color:var(--gold)}
.section-lead{font-size:.95rem;color:var(--text);line-height:1.8;font-weight:300;max-width:680px;margin-bottom:48px;}

.assessment-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
.assessment-card{background:var(--navy-mid);border:2px solid #c9a84c;padding:40px;position:relative;transition:border-color .25s,transform .2s;}
.assessment-card:hover{border-color:rgba(201,168,76,.8);transform:translateY(-3px)}
.card-title{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;color:var(--cream);margin-bottom:6px;}
.card-subtitle{font-family:'Cinzel',serif;font-size:.62rem;letter-spacing:.15em;color:var(--gold);text-transform:uppercase;margin-bottom:20px;}
.card-desc{font-size:.9rem;color:var(--text);line-height:1.8;font-weight:300;margin-bottom:24px;}
.card-features{list-style:none;margin-bottom:0;}
.card-features li{font-size:.85rem;color:var(--text);padding:8px 0;border-bottom:1px solid rgba(201,168,76,.08);display:flex;gap:10px;align-items:flex-start;line-height:1.5;}
.card-features li::before{content:'◆';color:var(--gold);font-size:.45rem;flex-shrink:0;margin-top:5px;}
.btn-gold{display:inline-block;background:var(--gold);color:var(--navy);font-family:'Cinzel',serif;font-size:.65rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;padding:12px 28px;text-decoration:none;transition:background .25s;}
.btn-gold:hover{background:var(--gold-lt);}
.btn-ghost{display:inline-block;border:1px solid rgba(201,168,76,.3);color:var(--muted);font-family:'Cinzel',serif;font-size:.65rem;letter-spacing:.18em;text-transform:uppercase;padding:12px 28px;text-decoration:none;}

.section-divider{height:1px;background:linear-gradient(to right,transparent,rgba(201,168,76,.2),transparent);margin:0 60px;}

.gate-wrap{padding:48px 60px;background:var(--navy-mid);border-top:1px solid rgba(201,168,76,.15);}
.gate-eyebrow{font-family:'Cinzel',serif;font-size:.58rem;letter-spacing:.35em;color:var(--gold);text-transform:uppercase;margin-bottom:8px;display:block;}
.gate-heading{font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:700;color:var(--cream);margin-bottom:6px;}
.gate-sub{font-size:.88rem;color:var(--muted);margin-bottom:28px;line-height:1.6;}
.gate-box{background:rgba(14,26,43,.6);border:1px solid rgba(201,168,76,.25);padding:32px;max-width:700px;margin:0 auto;}
.gate-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:20px;}
.gate-status-locked{display:inline-flex;align-items:center;gap:6px;font-family:'Cinzel',serif;font-size:.58rem;letter-spacing:.15em;color:var(--muted);background:rgba(138,157,181,.1);border:1px solid rgba(138,157,181,.2);padding:5px 14px;white-space:nowrap;}
.gate-status-unlocked{display:inline-flex;align-items:center;gap:6px;font-family:'Cinzel',serif;font-size:.58rem;letter-spacing:.15em;color:#5dcaa5;background:rgba(93,202,165,.1);border:1px solid rgba(93,202,165,.25);padding:5px 14px;white-space:nowrap;}
.gate-label{font-family:'Cinzel',serif;font-size:.58rem;letter-spacing:.2em;color:var(--gold);text-transform:uppercase;margin-bottom:4px;}
.gate-title{font-size:1rem;font-weight:500;color:var(--cream);margin-bottom:3px;}
.gate-hint{font-size:.82rem;color:var(--muted);}
.gate-input-row{display:flex;gap:10px;}
.gate-input{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(201,168,76,.3);padding:12px 16px;font-size:.95rem;color:var(--cream);font-family:'Courier New',monospace;letter-spacing:.06em;outline:none;min-width:0;}
.gate-input::placeholder{color:#2a3a4e;}
.gate-input:focus{border-color:rgba(201,168,76,.7);}
.gate-enter{background:var(--gold);color:var(--navy);border:none;font-family:'Cinzel',serif;font-size:.62rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;padding:12px 24px;cursor:pointer;white-space:nowrap;transition:background .2s;}
.gate-enter:hover{background:var(--gold-lt);}
.gate-error{margin-top:8px;font-size:.82rem;color:#e07070;display:none;}
.gate-error a{color:#e07070;}
.gate-nocode{margin-top:10px;font-size:.8rem;color:var(--muted);}
.gate-nocode a{color:var(--gold);text-decoration:none;}
.gate-nocode a:hover{text-decoration:underline;}
.gate-session-info{font-size:.85rem;color:var(--muted);margin-bottom:16px;}
.gate-session-info .s-code{color:var(--cream);font-family:'Courier New',monospace;letter-spacing:.04em;}
.gate-btns{display:flex;gap:12px;flex-wrap:wrap;}
.gate-signout{margin-top:12px;font-size:.78rem;color:var(--muted);cursor:pointer;background:none;border:none;padding:0;text-decoration:underline;font-family:'Source Sans 3',sans-serif;}
.gate-signout:hover{color:var(--gold);}

.training-section{background:var(--navy-mid);}
.program-hero{background:linear-gradient(135deg,var(--navy-lt) 0%,var(--navy-mid) 100%);border:1px solid rgba(201,168,76,.2);padding:48px;margin-bottom:40px;position:relative;overflow:hidden;}
.program-hero::before{content:'WIN³';position:absolute;right:-20px;top:-10px;font-family:'Playfair Display',serif;font-size:8rem;font-weight:900;color:rgba(201,168,76,.04);pointer-events:none;line-height:1;}
.program-badge{display:inline-flex;align-items:center;gap:8px;background:var(--gold);color:var(--navy);font-family:'Cinzel',serif;font-size:.6rem;font-weight:700;letter-spacing:.2em;padding:5px 14px;margin-bottom:20px;}
.program-title{font-family:'Playfair Display',serif;font-size:2rem;font-weight:700;color:var(--cream);margin-bottom:8px;line-height:1.2;}
.program-subtitle{font-family:'Cinzel',serif;font-size:.65rem;letter-spacing:.2em;color:var(--gold);text-transform:uppercase;margin-bottom:20px;}
.program-desc{font-size:.95rem;color:var(--text);line-height:1.8;font-weight:300;max-width:680px;margin-bottom:24px;}

.win-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:40px;}
.win-card{background:rgba(14,26,43,.6);border:1px solid rgba(201,168,76,.15);padding:28px 24px;text-align:center;}
.win-num{font-family:'Playfair Display',serif;font-size:2.5rem;font-weight:700;color:var(--gold);display:block;margin-bottom:4px;}
.win-label{font-family:'Cinzel',serif;font-size:.7rem;letter-spacing:.2em;color:var(--cream);text-transform:uppercase;margin-bottom:8px;display:block;}
.win-desc{font-size:.82rem;color:var(--muted);line-height:1.6;}

.modules-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.module-card{background:rgba(14,26,43,.5);border:1px solid rgba(201,168,76,.12);padding:20px 24px;display:flex;gap:16px;align-items:flex-start;transition:border-color .25s;}
.module-card:hover{border-color:rgba(201,168,76,.35)}
.module-num{font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:.2em;color:var(--gold);flex-shrink:0;margin-top:2px;}
.module-title{font-family:'Cinzel',serif;font-size:.7rem;letter-spacing:.1em;color:var(--cream);text-transform:uppercase;margin-bottom:4px;}
.module-desc{font-size:.8rem;color:var(--muted);line-height:1.6;}

.outcomes-section{background:var(--navy);padding:80px 60px;}
.outcomes-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:40px;}
.outcome-card{background:var(--navy-mid);border:1px solid rgba(201,168,76,.15);padding:28px 20px;text-align:center;}
.outcome-icon{font-size:1.5rem;margin-bottom:12px;display:block;}
.outcome-title{font-family:'Cinzel',serif;font-size:.65rem;letter-spacing:.15em;color:var(--gold);text-transform:uppercase;margin-bottom:8px;}
.outcome-desc{font-size:.8rem;color:var(--muted);line-height:1.6;}

.cta-section{background:var(--navy-mid);padding:60px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;border-top:1px solid rgba(201,168,76,.15);text-align:center;}
.cta-text h3{font-family:'Playfair Display',serif;font-size:1.6rem;color:var(--cream);margin-bottom:6px;}
.cta-text p{font-size:.9rem;color:var(--muted);}
.cta-buttons{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;}

@media(max-width:900px){
  .assessment-grid,.win-grid,.modules-grid,.outcomes-grid{grid-template-columns:1fr;}
  .section,.training-section,.outcomes-section,.cta-section{padding:48px 24px;}
  .page-hero{padding:48px 24px;}
  .section-divider{margin:0 24px;}
  .gate-wrap{padding:40px 24px;}
  .gate-input-row{flex-direction:column;}
}
</style>
</head>
<body>

<div class="page-hero">
  <span class="eyebrow">CasinoPro Solutions</span>
  <h1 class="hero-title">Assessments <em>&</em> Training</h1>
  <div class="ornament"><div class="ornament-diamond"></div></div>
  <p class="hero-sub">Most casinos measure dealer performance by what they can see. CasinoPro Solutions measures what actually matters — the behavioral traits that determine whether a guest stays at your table, comes back to your property, and brings people with them.</p>
</div>

<div class="section">
  <span class="section-tag">Our Assessments</span>
  <h2 class="section-title">Know Who You're Hiring <em>Before</em> They Step Behind the Table</h2>
  <p class="section-lead">A guest who feels unwelcome at your table doesn't complain — they leave, they tell people, and they find another casino. CasinoPro Solutions assessment tools are built to identify the behavioral traits that predict genuine guest engagement before a single shift begins.</p>

  <div class="assessment-grid">

    <div class="assessment-card">
      <div class="card-title">CDAT</div>
      <div class="card-subtitle">Casino Dealer Aptitude Assessment Tool</div>
      <p class="card-desc">A 40-question behavioral assessment that evaluates five traits proven to predict dealer success. Designed for casino HR departments to screen new applicants before they step behind the table.</p>
      <ul class="card-features">
        <li>5 behavioral traits — from Emotional Control to Professional Composure</li>
        <li>40 validated questions with reverse scoring to ensure accuracy</li>
        <li>PIN-gated HR report with scored trait breakdown and hire guidance</li>
        <li>Property code access — embed on your career site or HR portal</li>
        <li>7-minute timed assessment — candidate-friendly and efficient</li>
      </ul>
    </div>

    <div class="assessment-card">
      <div class="card-title">DPAT</div>
      <div class="card-subtitle">Dealer Performance Aptitude Tool</div>
      <p class="card-desc">A structured written assessment for experienced dealer candidates — measuring how they think, decide, and respond under real floor pressure before they step behind a table.</p>
      <ul class="card-features">
        <li>Candidate-completed format on HR's computer — no evaluator bias in the response</li>
        <li>10 behavioral trait questions across guest interaction, composure, integrity, accountability, and professionalism</li>
        <li>18 situational judgment scenarios across game protection, table control, and ethical decision-making</li>
        <li>Silent background timer with HR-visible completion flag</li>
        <li>PIN-gated HR review panel with ideal answer markers and per-scenario scoring</li>
        <li>Auto-generated PDF report with Eagle Dealer™ tier classification — downloaded in one click</li>
      </ul>
    </div>

  </div>
</div>

<div style="text-align:center;padding:48px 60px;background:#152338;border-top:1px solid rgba(201,168,76,.15);">
  <p style="font-family:'Cinzel',serif;font-size:.62rem;letter-spacing:.4em;color:#c9a84c;text-transform:uppercase;margin-bottom:12px;">Client Access Portal</p>
  <p style="font-size:.95rem;color:#8a9db5;margin-bottom:28px;line-height:1.7;max-width:520px;margin-left:auto;margin-right:auto;">Licensed casino properties — enter your property code to access both the CDAT and DPAT assessment tools.</p>
  <a href="https://casinoprosolutions.com/dealer-assessments" style="display:inline-block;background:#c9a84c;color:#0e1a2b;font-family:'Cinzel',serif;font-size:.65rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;padding:14px 32px;text-decoration:none;">Access Your Assessment Suite ◆</a>
</div>
<div class="section training-section">
  <span class="section-tag">Dealer Training</span>
  <h2 class="section-title">The Dealer Is Already Hired. <em>Now What?</em></h2>
  <p class="section-lead">The CDAT identifies the right dealers before they're hired. But what about the dealers already on your floor? The Win-Win-Win program is the answer — an in-person training experience that transforms how dealers think about their role, their guests, and the revenue they directly influence every shift.</p>

  <div class="program-hero">
    <div class="program-badge">◆ In-Person Dealer Training</div>
    <div class="program-title">Win-Win-Win</div>
    <div class="program-subtitle">Guest Interaction & Dealer Excellence Training</div>
    <p class="program-desc">Most dealers understand the technical side of their job. What they rarely understand is the business impact of how they treat guests. A guest who feels unwelcome at your table doesn't complain — they leave, they tell people, and they find another casino. The Win-Win-Win program changes that by showing dealers exactly what their behavior costs the property — and what it earns them personally.</p>

    <div style="background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.2);padding:24px 28px;margin-bottom:28px;">
      <div style="font-family:'Cinzel',serif;font-size:.62rem;letter-spacing:.3em;color:var(--gold);text-transform:uppercase;margin-bottom:14px;">The Problem This Program Solves</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div>
          <div style="font-family:'Cinzel',serif;font-size:.65rem;letter-spacing:.15em;color:#dc2626;text-transform:uppercase;margin-bottom:8px;">Without Training</div>
          <div style="font-size:.88rem;color:var(--text);line-height:1.8;">Guests who have a bad dealer experience rarely say a word. They finish their drink, cash out, and go home. Then they tell their friends — and choose a different casino next time. The dealer stays. The revenue bleeds. The casino never knows.</div>
        </div>
        <div>
          <div style="font-family:'Cinzel',serif;font-size:.65rem;letter-spacing:.15em;color:var(--gold);text-transform:uppercase;margin-bottom:8px;">With Win-Win-Win</div>
          <div style="font-size:.88rem;color:var(--text);line-height:1.8;">Dealers understand exactly how their behavior affects guest decisions, table revenue, and their own toke income. The floor culture shifts. Guests stay longer, come back more often, and bring people — because the experience at your table is one worth talking about.</div>
        </div>
      </div>
    </div>

    <a href="/contact" class="btn-gold">Bring This Program to Your Property ◆</a>
  </div>

  <div class="win-grid">
 <div class="win-card"><span class="win-num">Win¹</span><span class="win-label">The Guests Win</span><div class="win-desc">Guests who feel welcomed, entertained, and respected stay longer and come back. A great dealer interaction is the single most powerful driver of guest loyalty.</div></div>
   
 <div class="win-card"><span class="win-num">Win²</span><span class="win-label">The Dealers Win</span><div class="win-desc">Dealers who genuinely engage guests earn more in tokes, receive stronger evaluations, and build a reputation on the floor that advances their career.</div></div>
  
    <div class="win-card"><span class="win-num">Win³</span><span class="win-label">The Casino Wins</span><div class="win-desc">Properties with engaged, guest-focused dealers see longer playing sessions, higher return visit rates, and stronger word-of-mouth.</div></div>
  </div>

  <h3 style="font-family:'Playfair Display',serif;font-size:1.4rem;color:var(--cream);margin-bottom:8px;">What the Program Covers</h3>
  <p style="font-size:.88rem;color:var(--muted);margin-bottom:24px;">Delivered in person at your property — a structured, interactive training experience built around real casino floor situations your dealers face every shift.</p>

  <div class="modules-grid">
    <div class="module-card"><div class="module-num">01</div><div><div class="module-title">Perception & Mindset</div><div class="module-desc">Shifting how dealers view their role — from card pusher to entertainer, salesperson, and the single biggest influence on whether a guest comes back.</div></div></div>
    <div class="module-card"><div class="module-num">02</div><div><div class="module-title">Dealer Categories & The Eagle Standard</div><div class="module-desc">Understanding the five dealer types and what it takes to operate at the Eagle Dealer™ level — the standard that keeps guests at the table.</div></div></div>
    <div class="module-card"><div class="module-num">03</div><div><div class="module-title">The True Cost of a Bad Experience</div><div class="module-desc">Teaching dealers to understand what happens when a guest leaves unhappy — where they go, who they tell, and what it costs the property they'll never return to.</div></div></div>
    <div class="module-card"><div class="module-num">04</div><div><div class="module-title">Guest Interaction Skills</div><div class="module-desc">Practical tools for greeting, engaging, and building rapport — including arrival and departure statements that make guests feel like they matter.</div></div></div>
    <div class="module-card"><div class="module-num">05</div><div><div class="module-title">Dealing with Difficult Guests</div><div class="module-desc">Strategies for staying professional and positive when guests are difficult — turning a tense moment into a reason to come back instead of a reason to leave.</div></div></div>
    <div class="module-card"><div class="module-num">06</div><div><div class="module-title">Body Language & Nonverbal Communication</div><div class="module-desc">What dealers communicate without saying a word — and how posture, eye contact, and energy affect whether a guest feels welcome or invisible.</div></div></div>
    <div class="module-card"><div class="module-num">07</div><div><div class="module-title">Passing the Baton</div><div class="module-desc">How dealers handle table transitions professionally — keeping guests engaged and informed so the momentum of a great experience never breaks.</div></div></div>
    <div class="module-card"><div class="module-num">08</div><div><div class="module-title">The 21-Day Challenge</div><div class="module-desc">A commitment-based accountability system that turns training into lasting behavioral change — so the shift in culture sticks long after Rocky leaves the property.</div></div></div>
  </div>
</div>

<div class="outcomes-section">
  <span class="section-tag">Program Outcomes</span>
  <h2 class="section-title">What Changes on Your <em>Floor</em></h2>
  <p style="font-size:.95rem;color:var(--text);line-height:1.8;font-weight:300;max-width:680px;margin:0 auto 40px;text-align:center;">The guests you were losing silently start staying longer, coming back more often, and bringing people with them.</p>
  <div class="outcomes-grid">
    <div class="outcome-card"><span class="outcome-icon">◆</span><div class="outcome-title">Guests Stay Longer</div><div class="outcome-desc">Dealers who genuinely engage guests extend playing sessions — not through pressure, but through an experience worth staying for.</div></div>
    <div class="outcome-card"><span class="outcome-icon">◇</span><div class="outcome-title">Guests Come Back</div><div class="outcome-desc">A great dealer experience is the most powerful driver of return visits. Win-Win-Win trains dealers to be the reason guests choose your property again.</div></div>
    <div class="outcome-card"><span class="outcome-icon">▣</span><div class="outcome-title">Guests Bring People</div><div class="outcome-desc">Word of mouth works both ways. Dealers trained in the Win-Win-Win standard become stories worth telling — the kind that fill tables on a Friday night.</div></div>
    <div class="outcome-card"><span class="outcome-icon">◈</span><div class="outcome-title">Dealers Earn More</div><div class="outcome-desc">Toke income rises when guests feel engaged and entertained. Dealers who understand this connection show up differently — every single shift.</div></div>
  </div>
</div>

<div class="cta-section">
  <div class="cta-text">
    <h3>Ready to Stop the Silent Revenue Bleed?</h3>
    <p>Contact Rocky to discuss CDAT assessment licensing or to bring the Win-Win-Win training program to your property.</p>
  </div>
  <div class="cta-buttons">
    <a href="/contact" class="btn-gold">Contact Rocky ◆</a>
    <a href="/contact" class="btn-ghost">Get Your Property Code</a>
  </div>
</div>


</body>
</html>
