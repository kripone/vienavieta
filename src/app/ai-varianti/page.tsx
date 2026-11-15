// AI pogas animāciju variantu demo-lapa (tikai lokālai apskatei — netiek linkota no lapas).
// Atver /ai-varianti un paskaties, kurš patīk; izvēlēto pārnesīsim uz īsto pogu.
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI pogas varianti" };

const SPARKLE = `<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><circle class="eye" cx="9.2" cy="11.5" r="2.7" fill="#fff"/><circle class="eye" cx="14.8" cy="11.5" r="2.7" fill="#fff"/></svg>`;

const VARIANTS: { id: string; name: string; desc: string; cls: string; inner: string }[] = [
  { id: "A", name: "Pašreizējā", desc: "Rotējošs gradients + viļņotā mala — tas, kas tagad lapā", cls: "av-a", inner: "✨" },
  { id: "B", name: "Siri viļņi", desc: "3 ļoti maigi viļņi lēni izplešas un izgaist — vistuvāk Siri", cls: "av-b", inner: `<i class="w"></i><i class="w"></i><i class="w"></i><em>✨</em>` },
  { id: "C", name: "Elpojošs orbs", desc: "Bez viļņiem — tikai maigs mirdzums un elpošana", cls: "av-c", inner: "✨" },
  { id: "D", name: "Gradienta burbulis", desc: "Izplūdis krāsu mākonis lēni rotē aiz pogas", cls: "av-d", inner: "✨" },
  { id: "E", name: "Balss stabiņi", desc: "Mazi skaņas stabiņi pogas iekšpusē — it kā palīgs klausās", cls: "av-e", inner: "<i></i><i></i><i></i><i></i><i></i>" },
  { id: "F", name: "Orbitālie punkti", desc: "3 mirdzoši punktiņi lēni riņķo ap pogu", cls: "av-f", inner: "<i></i><i></i><i></i>✨" },
  { id: "G", name: "Aurora hālo", desc: "Plats, maigs daudzkrāsu mirdzums pulsē ap malu", cls: "av-g", inner: "✨" },
  { id: "H", name: "Minimālais", desc: "Gandrīz nekā — tikai ļoti vājš viļnītis reizi 4 sekundēs", cls: "av-h", inner: "✨" },
  { id: "I", name: "Dūmiņš", desc: "4 maigi dūmu pūpli lēni paceļas un izgaist — kā tvaiks", cls: "av-i", inner: `<i class="s"></i><i class="s"></i><i class="s"></i><i class="s"></i><em>✨</em>` },
  { id: "J", name: "Biezs dūmiņš", desc: "Lielāki, lēnāki pūpli ar vairāk izplūduma — nosvaidītāks", cls: "av-j", inner: `<i class="s"></i><i class="s"></i><i class="s"></i><i class="s"></i><i class="s"></i><em>✨</em>` },
  { id: "K", name: "Dūmiņš + vilnis", desc: "Dūmu pūpli + rets maigs viļņa gredzens pa virsu", cls: "av-k", inner: `<i class="s"></i><i class="s"></i><i class="s"></i><em>✨</em>` },
  { id: "L", name: "Siri orbs", desc: "Tumša stiklotā sfēra ar maigu gaismas vilni iekšā — kā Siri ikona", cls: "av-l", inner: `<i class="w1"></i><i class="w2"></i><i class="w3"></i>` },
  { id: "M", name: "Siri orbs krāsains", desc: "Tas pats orbs, bet vilnis ar violetu-zilu-rozā mirdzumu", cls: "av-m", inner: `<i class="w1"></i><i class="w2"></i><i class="w3"></i>` },
  { id: "N", name: "Kūpošs orbs", desc: "Tumšā sfērā lēni kūpo dūmu slāņi, kontūra maigi elpo", cls: "av-n", inner: `<i class="w1"></i><i class="w2"></i><i class="w3"></i><i class="w4"></i>` },
  { id: "O", name: "Burbulis + actiņas", desc: "D burbulis + ✨ ar maziņām actiņām; ik pa 5 s maigs uzmanības mirdzums", cls: "av-o", inner: SPARKLE },
];

export default function AiVarianti() {
  return (
    <main className="av-page">
      <style>{CSS}</style>
      <h1>AI pogas varianti</h1>
      <p className="av-sub">Kurš patīk visvairāk? Pasaki burtu (piem., „B“) — pārnesīšu uz īsto pogu.</p>
      <div className="av-grid">
        {VARIANTS.map((v) => (
          <section key={v.id} className="av-card">
            <h2><b>{v.id}</b> — {v.name}</h2>
            <p>{v.desc}</p>
            <div className="av-row">
              <div className="av-tile dark">
                <span className="av-tag">tumšs fons</span>
                <button className={`av-fab ${v.cls}`} aria-label={v.name} dangerouslySetInnerHTML={{ __html: v.inner }} />
              </div>
              <div className="av-tile light">
                <span className="av-tag">gaišs fons</span>
                <button className={`av-fab ${v.cls}`} aria-label={v.name} dangerouslySetInnerHTML={{ __html: v.inner }} />
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

const CSS = `
@property --av-rot { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
.av-page { max-width: 900px; margin: 0 auto; padding: 32px 16px 64px; font-family: inherit; }
.av-page h1 { font-size: 24px; margin: 0 0 6px; }
.av-sub { color: #888; margin: 0 0 24px; }
.av-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
.av-card { border: 1px solid rgba(128,128,128,.25); border-radius: 14px; padding: 14px 16px 18px; background: rgba(128,128,128,.06); }
.av-card h2 { font-size: 16px; margin: 0 0 4px; }
.av-card p { font-size: 13px; color: #888; margin: 0 0 12px; }
.av-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.av-tile { position: relative; height: 150px; border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.av-tile.dark { background: #0f1115; }
.av-tile.light { background: #f2f3f5; }
.av-tag { position: absolute; top: 6px; left: 8px; font-size: 10px; letter-spacing: .04em; text-transform: uppercase; color: #999; }

/* kopējā bāze — tā pati forma kas īstajai lapas pogai */
.av-fab { position: relative; width: 54px; height: 54px; border-radius: 50%; border: 0; cursor: pointer; font-size: 22px; color: #fff;
  display: flex; align-items: center; justify-content: center;
  background: conic-gradient(from var(--av-rot), #7c3aed, #06b6d4, #22d3ee, #a855f7, #ec4899, #7c3aed);
  transition: transform .15s; }
.av-fab:hover { transform: scale(1.08); }
.av-fab::before { content: ""; position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle at 32% 30%, rgba(255,255,255,.38), rgba(255,255,255,0) 45%); }
.av-fab::after { content: ""; position: absolute; inset: 0; border-radius: 50%; pointer-events: none; z-index: -1; }

/* A — pašreizējā */
.av-a { box-shadow: 0 4px 18px rgba(124,58,237,.45), 0 0 24px rgba(6,182,212,.25); animation: av-rot 6s linear infinite, av-breathe 3.2s ease-in-out infinite; }
.av-a::after { border: 2px solid rgba(124,58,237,.55); animation: av-ripple 2.4s ease-out infinite; }

/* B — Siri viļņi: 3 maigi viļņi ar nobīdēm */
.av-b { animation: av-rot 9s linear infinite; box-shadow: 0 4px 16px rgba(124,58,237,.35); }
.av-b em { font-style: normal; position: relative; z-index: 1; }
.av-b .w { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(139,92,246,.55); animation: av-siri 3.6s cubic-bezier(.2,.6,.35,1) infinite; }
.av-b .w:nth-child(2) { border-color: rgba(34,211,238,.45); animation-delay: 1.2s; }
.av-b .w:nth-child(3) { border-color: rgba(236,72,153,.4); animation-delay: 2.4s; }
.av-b::after { content: none; }

/* C — elpojošs orbs: bez viļņiem */
.av-c { animation: av-rot 10s linear infinite, av-c-breathe 4s ease-in-out infinite; }
.av-c::after { animation: av-c-glow 4s ease-in-out infinite; }

/* D — gradienta burbulis aiz pogas */
.av-d { animation: none; box-shadow: 0 4px 14px rgba(0,0,0,.25); }
.av-d::after { inset: -14px; filter: blur(10px); opacity: .8;
  background: conic-gradient(from var(--av-rot), #7c3aed, #06b6d4, #ec4899, #7c3aed);
  animation: av-rot 7s linear infinite, av-d-pulse 3.5s ease-in-out infinite; }

/* E — balss stabiņi */
.av-e { gap: 3px; animation: av-rot 8s linear infinite; box-shadow: 0 4px 16px rgba(124,58,237,.4); }
.av-e i { width: 3px; border-radius: 2px; background: #fff; height: 7px; animation: av-eq 1.1s ease-in-out infinite; }
.av-e i:nth-child(2) { animation-delay: .15s; } .av-e i:nth-child(3) { animation-delay: .3s; }
.av-e i:nth-child(4) { animation-delay: .45s; } .av-e i:nth-child(5) { animation-delay: .6s; }
.av-e::after { border: 2px solid rgba(34,211,238,.35); animation: av-ripple 3s ease-out infinite; }

/* F — orbitālie punkti */
.av-f { animation: av-rot 8s linear infinite; box-shadow: 0 4px 16px rgba(124,58,237,.4); }
.av-f i { position: absolute; inset: -7px; border-radius: 50%; animation: av-rot 5s linear infinite; pointer-events: none; }
.av-f i::after { content: ""; position: absolute; top: 0; left: 50%; width: 5px; height: 5px; margin-left: -2.5px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 6px #22d3ee; }
.av-f i:nth-child(2) { animation-duration: 7s; animation-direction: reverse; }
.av-f i:nth-child(2)::after { background: #ec4899; box-shadow: 0 0 6px #ec4899; }
.av-f i:nth-child(3) { animation-duration: 9.5s; }
.av-f i:nth-child(3)::after { background: #a855f7; box-shadow: 0 0 6px #a855f7; }

/* G — aurora hālo */
.av-g { animation: av-rot 8s linear infinite; }
.av-g::after { inset: -8px; filter: blur(8px); opacity: .65;
  background: conic-gradient(from var(--av-rot), rgba(124,58,237,.9), rgba(6,182,212,.9), rgba(236,72,153,.9), rgba(124,58,237,.9));
  animation: av-rot 5s linear infinite reverse, av-g-pulse 2.8s ease-in-out infinite; }

/* H — minimālais */
.av-h { animation: none; box-shadow: 0 4px 14px rgba(124,58,237,.3); }
.av-h::after { border: 1.5px solid rgba(139,92,246,.35); animation: av-ripple 4s ease-out infinite; }

/* I — dūmiņš: 4 maigi pūpli */
.av-i { animation: av-rot 10s linear infinite; box-shadow: 0 4px 16px rgba(124,58,237,.35); }
.av-i em, .av-j em, .av-k em { font-style: normal; position: relative; z-index: 1; }
.av-i .s, .av-j .s, .av-k .s { position: absolute; inset: -4px; border-radius: 50%; pointer-events: none; z-index: -1;
  background: radial-gradient(circle, rgba(196,181,253,.55) 0%, rgba(139,92,246,.25) 45%, transparent 70%);
  filter: blur(6px); opacity: 0; animation: av-smoke 4.8s ease-out infinite; }
.av-i .s:nth-child(2) { animation-delay: 1.2s; --dx: 10px; --dy: -14px;
  background: radial-gradient(circle, rgba(165,243,252,.5) 0%, rgba(34,211,238,.22) 45%, transparent 70%); }
.av-i .s:nth-child(3) { animation-delay: 2.4s; --dx: -12px; --dy: -10px;
  background: radial-gradient(circle, rgba(249,168,212,.5) 0%, rgba(236,72,153,.2) 45%, transparent 70%); }
.av-i .s:nth-child(4) { animation-delay: 3.6s; --dx: 4px; --dy: -18px; }

/* J — biezs dūmiņš: lielāki, lēnāki pūpli */
.av-j { animation: av-rot 12s linear infinite; box-shadow: 0 4px 16px rgba(124,58,237,.3); }
.av-j .s { inset: -8px; filter: blur(11px); animation-duration: 6.5s;
  background: radial-gradient(circle, rgba(221,214,254,.65) 0%, rgba(139,92,246,.3) 50%, transparent 75%); }
.av-j .s:nth-child(2) { animation-delay: 1.3s; --dx: 14px; --dy: -16px;
  background: radial-gradient(circle, rgba(207,250,254,.6) 0%, rgba(34,211,238,.28) 50%, transparent 75%); }
.av-j .s:nth-child(3) { animation-delay: 2.6s; --dx: -16px; --dy: -12px;
  background: radial-gradient(circle, rgba(251,207,232,.6) 0%, rgba(236,72,153,.25) 50%, transparent 75%); }
.av-j .s:nth-child(4) { animation-delay: 3.9s; --dx: 6px; --dy: -22px; }
.av-j .s:nth-child(5) { animation-delay: 5.2s; --dx: -6px; --dy: -20px; }

/* K — dūmiņš + vilnis */
.av-k { animation: av-rot 10s linear infinite; box-shadow: 0 4px 16px rgba(124,58,237,.35); }
.av-k .s { animation-duration: 4.2s; }
.av-k .s:nth-child(2) { animation-delay: 1.4s; --dx: 8px; --dy: -14px;
  background: radial-gradient(circle, rgba(165,243,252,.5) 0%, rgba(34,211,238,.22) 45%, transparent 70%); }
.av-k .s:nth-child(3) { animation-delay: 2.8s; --dx: -10px; --dy: -12px; }
.av-k::after { border: 2px solid rgba(139,92,246,.4); animation: av-siri 4.2s cubic-bezier(.2,.6,.35,1) infinite; }

/* L — Siri orbs: tumša stiklotā sfēra ar ūdens vilni */
.av-l, .av-m, .av-n { overflow: hidden; animation: av-blob 7s ease-in-out infinite;
  background: radial-gradient(circle at 32% 26%, #454c5c 0%, #23262e 45%, #0e1013 100%);
  box-shadow: inset 0 1px 2px rgba(255,255,255,.35), inset 0 -6px 12px rgba(0,0,0,.5), 0 4px 14px rgba(0,0,0,.4); }
.av-l::before, .av-m::before, .av-n::before { background: radial-gradient(circle at 34% 24%, rgba(255,255,255,.5), rgba(255,255,255,0) 42%); z-index: 2; }
.av-l i, .av-m i, .av-n i { position: absolute; border-radius: 50%; filter: blur(7px); pointer-events: none; }
.av-l .w1 { left: -30%; top: 40%; width: 160%; height: 26%;
  background: radial-gradient(ellipse, rgba(255,255,255,.8), rgba(186,230,253,.4) 55%, transparent 75%);
  animation: av-wave1 5.5s ease-in-out infinite; }
.av-l .w2 { left: -20%; top: 58%; width: 130%; height: 30%;
  background: radial-gradient(ellipse, rgba(226,232,240,.45), transparent 70%);
  animation: av-wave2 7s ease-in-out infinite; }
.av-l .w3 { left: -10%; top: 18%; width: 90%; height: 32%;
  background: radial-gradient(ellipse, rgba(255,255,255,.25), transparent 70%);
  animation: av-wave2 8.5s ease-in-out reverse infinite; }

/* M — Siri orbs krāsains */
.av-m .w1 { left: -30%; top: 40%; width: 160%; height: 26%;
  background: radial-gradient(ellipse, rgba(255,255,255,.85), rgba(103,232,249,.5) 45%, transparent 75%);
  animation: av-wave1 5.5s ease-in-out infinite; }
.av-m .w2 { left: -25%; top: 55%; width: 140%; height: 32%;
  background: radial-gradient(ellipse, rgba(216,180,254,.55), rgba(168,85,247,.25) 55%, transparent 75%);
  animation: av-wave2 7s ease-in-out infinite; }
.av-m .w3 { left: -15%; top: 25%; width: 110%; height: 30%;
  background: radial-gradient(ellipse, rgba(249,168,212,.4), transparent 70%);
  animation: av-wave2 8.5s ease-in-out reverse infinite; }

/* N — kūpošs orbs: dūmu slāņi sfērā */
.av-n .w1 { left: -25%; top: 30%; width: 120%; height: 45%;
  background: radial-gradient(ellipse, rgba(203,213,225,.4), transparent 70%);
  animation: av-swirl 9s ease-in-out infinite; }
.av-n .w2 { left: -10%; top: 45%; width: 110%; height: 40%;
  background: radial-gradient(ellipse, rgba(148,163,184,.35), transparent 70%);
  animation: av-swirl 12s ease-in-out reverse infinite; }
.av-n .w3 { left: -35%; top: 20%; width: 140%; height: 38%;
  background: radial-gradient(ellipse, rgba(226,232,240,.3), transparent 70%);
  animation: av-swirl 10.5s ease-in-out 2s infinite; }
.av-n .w4 { left: -5%; top: 55%; width: 90%; height: 35%;
  background: radial-gradient(ellipse, rgba(241,245,249,.3), transparent 70%);
  animation: av-swirl 13s ease-in-out 4s reverse infinite; }
.av-n::after { inset: -3px; filter: blur(6px); opacity: .35;
  background: radial-gradient(circle, rgba(148,163,184,.5), transparent 70%);
  animation: av-d-pulse 5s ease-in-out infinite; }

/* O — D burbulis + zvaigznīte ar actiņām, kas mirgo */
.av-o { animation: none; box-shadow: 0 4px 14px rgba(0,0,0,.25); }
.av-o::after { inset: -14px; filter: blur(10px); opacity: .8;
  background: conic-gradient(from var(--av-rot), #7c3aed, #06b6d4, #ec4899, #7c3aed);
  animation: av-rot 7s linear infinite, av-d-pulse 3.5s ease-in-out infinite; }
.av-o .eye { transform-box: fill-box; transform-origin: center; animation: av-blink 5s ease-in-out infinite; }
@keyframes av-blink { 0%, 91%, 100% { transform: scaleY(1); } 94% { transform: scaleY(.12); } 97% { transform: scaleY(1); } }

@keyframes av-blob {
  0%,100% { border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%; }
  25% { border-radius: 47% 53% 51% 49% / 52% 48% 52% 48%; }
  50% { border-radius: 52% 48% 49% 51% / 48% 52% 47% 53%; }
  75% { border-radius: 49% 51% 53% 47% / 51% 49% 52% 48%; }
}
@keyframes av-wave1 { 0%,100% { transform: translate(0,0) scaleY(1); } 33% { transform: translate(6%,-16%) scaleY(.8); } 66% { transform: translate(-5%,10%) scaleY(1.15); } }
@keyframes av-wave2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-8%,-14%) scale(1.08); } }
@keyframes av-swirl { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(9%,-10%) scale(1.12); } 66% { transform: translate(-7%,8%) scale(.94); } }

@keyframes av-rot { to { --av-rot: 360deg; } }
@keyframes av-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes av-ripple { 0% { transform: scale(1); opacity: .8; } 100% { transform: scale(1.65); opacity: 0; } }
@keyframes av-siri { 0% { transform: scale(1); opacity: .55; } 70% { opacity: .18; } 100% { transform: scale(2.1); opacity: 0; } }
@keyframes av-c-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
@keyframes av-c-glow { 0%,100% { box-shadow: 0 0 10px 2px rgba(124,58,237,.35); } 50% { box-shadow: 0 0 26px 8px rgba(6,182,212,.45); } }
@keyframes av-d-pulse { 0%,100% { opacity: .55; transform: scale(.95); } 50% { opacity: .85; transform: scale(1.05); } }
@keyframes av-eq { 0%,100% { height: 7px; } 50% { height: 20px; } }
@keyframes av-g-pulse { 0%,100% { opacity: .45; } 50% { opacity: .8; } }
@keyframes av-smoke {
  0% { transform: scale(.65) translate(0, 4px); opacity: 0; }
  20% { opacity: .55; }
  100% { transform: scale(1.7) translate(var(--dx, 8px), var(--dy, -12px)); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) { .av-fab, .av-fab::after, .av-fab::before, .av-fab i, .av-fab .w { animation: none !important; } }
`;
