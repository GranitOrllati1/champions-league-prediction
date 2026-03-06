'use client';

import { useState, useEffect, useRef } from 'react';

const R16 = [
  { id: 'r16_1', home: 'PSG', away: 'Chelsea' },
  { id: 'r16_2', home: 'Galatasaray', away: 'Liverpool' },
  { id: 'r16_3', home: 'Real Madrid', away: 'Man City' },
  { id: 'r16_4', home: 'Atalanta', away: 'Bayern' },
  { id: 'r16_5', home: 'Newcastle', away: 'Barcelona' },
  { id: 'r16_6', home: 'Atletico', away: 'Tottenham' },
  { id: 'r16_7', home: 'Bodo/Glimt', away: 'Sporting CP' },
  { id: 'r16_8', home: 'Leverkusen', away: 'Arsenal' },
];

const QF_SEEDS = [['r16_1','r16_2'],['r16_3','r16_4'],['r16_5','r16_6'],['r16_7','r16_8']];
const SF_SEEDS = [['qf_1','qf_2'],['qf_3','qf_4']];
const FINAL_SEEDS = ['sf_1','sf_2'];

const R16_IDS = R16.map(m => m.id);
const QF_IDS = QF_SEEDS.map((_, i) => 'qf_' + (i + 1));
const SF_IDS = SF_SEEDS.map((_, i) => 'sf_' + (i + 1));

// Team data with colors and crest IDs from football-data.org
const TEAM_META = {
  'PSG':         { abbr: 'PSG', color1: '#004170', color2: '#DA291C', crest: 524 },
  'Chelsea':     { abbr: 'CHE', color1: '#034694', color2: '#DBA111', crest: 61 },
  'Galatasaray': { abbr: 'GAL', color1: '#A50044', color2: '#FDB813', crest: 257 },
  'Liverpool':   { abbr: 'LIV', color1: '#C8102E', color2: '#00B2A9', crest: 64 },
  'Real Madrid': { abbr: 'RMA', color1: '#FEBE10', color2: '#00529F', crest: 86 },
  'Man City':    { abbr: 'MCI', color1: '#6CABDD', color2: '#1C2C5B', crest: 65 },
  'Atalanta':    { abbr: 'ATA', color1: '#1E71B8', color2: '#000000', crest: 102 },
  'Bayern':      { abbr: 'BAY', color1: '#DC052D', color2: '#0066B2', crest: 5 },
  'Newcastle':   { abbr: 'NEW', color1: '#241F20', color2: '#FFFFFF', crest: 67 },
  'Barcelona':   { abbr: 'BAR', color1: '#A50044', color2: '#004D98', crest: 81 },
  'Atletico':    { abbr: 'ATM', color1: '#CB3524', color2: '#272E61', crest: 78 },
  'Tottenham':   { abbr: 'TOT', color1: '#132257', color2: '#FFFFFF', crest: 73 },
  'Bodo/Glimt':  { abbr: 'BOD', color1: '#FFD700', color2: '#000000', crest: 1139 },
  'Sporting CP': { abbr: 'SCP', color1: '#009A44', color2: '#FFFFFF', crest: 498 },
  'Leverkusen':  { abbr: 'LEV', color1: '#E32221', color2: '#000000', crest: 3 },
  'Arsenal':     { abbr: 'ARS', color1: '#EF0107', color2: '#023474', crest: 57 },
};

function TeamBadge({ team, size = 28 }) {
  const meta = TEAM_META[team];
  if (!meta) return <span className="team-tbd">TBD</span>;
  const crestUrl = `https://crests.football-data.org/${meta.crest}.png`;
  return (
    <span className="team-badge" style={{ '--tc1': meta.color1, '--tc2': meta.color2 }}>
      <img
        src={crestUrl}
        alt={team}
        width={size}
        height={size}
        className="team-crest"
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
      />
      <span className="team-crest-fallback" style={{ width: size, height: size, display: 'none' }}>
        {meta.abbr.substring(0, 2)}
      </span>
    </span>
  );
}

function StarballSVG({ size = 40, className = '' }) {
  return (
    <svg className={`starball ${className}`} width={size} height={size} viewBox="0 0 100 100" fill="none">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <polygon
          key={i}
          points="50,10 54,40 50,50 46,40"
          fill="url(#starGrad)"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="12" fill="url(#starGrad)" />
      <circle cx="50" cy="50" r="8" fill="#0a0e1a" />
      <defs>
        <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#F4D03F" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Confetti({ active }) {
  if (!active) return null;
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 2,
    color: ['#D4AF37', '#F4D03F', '#0057d9', '#fff', '#00349A'][Math.floor(Math.random() * 5)],
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
  }));
  return (
    <div className="confetti-container">
      {particles.map(p => (
        <div key={p.id} className="confetti-particle" style={{
          left: `${p.left}%`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          backgroundColor: p.color,
          width: `${p.size}px`,
          height: `${p.size * 1.5}px`,
          transform: `rotate(${p.rotation}deg)`,
        }} />
      ))}
    </div>
  );
}

function calcScores(picks, results) {
  let r16 = 0, qf = 0, sf = 0, final_pts = 0;
  R16_IDS.forEach(id => { if (results[id] && picks[id] === results[id]) r16++; });
  QF_IDS.forEach(id => { if (results[id] && picks[id] === results[id]) qf++; });
  SF_IDS.forEach(id => { if (results[id] && picks[id] === results[id]) sf++; });
  if (results['sf_1'] && results['sf_2']) {
    const realFinalists = [results['sf_1'], results['sf_2']];
    [picks['sf_1'], picks['sf_2']].forEach(pf => {
      if (pf && realFinalists.includes(pf)) final_pts += 2;
    });
  }
  if (results['final'] && picks['final'] === results['final']) final_pts += 3;
  return { r16, qf, sf, final: final_pts, total: r16 + qf + sf + final_pts };
}

export default function Home() {
  const [picks, setPicks] = useState({});
  const [name, setName] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [results, setResults] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => { fetchPredictions(); fetchResults(); }, []);

  async function fetchPredictions() {
    const res = await fetch('/api/predictions');
    setPredictions(await res.json());
    setLoading(false);
  }
  async function fetchResults() {
    const res = await fetch('/api/results');
    setResults((await res.json()) || {});
  }

  function pick(matchId, team) {
    const np = { ...picks, [matchId]: team };
    const clear = (id) => {
      QF_SEEDS.forEach((p, i) => { if (p.includes(id)) { const q = 'qf_'+(i+1); if (np[q]) { delete np[q]; clear(q); } } });
      SF_SEEDS.forEach((p, i) => { if (p.includes(id)) { const s = 'sf_'+(i+1); if (np[s]) { delete np[s]; clear(s); } } });
      if (FINAL_SEEDS.includes(id) && np['final']) delete np['final'];
    };
    clear(matchId);
    setPicks(np);
  }

  function getTeam(id) { return picks[id] || null; }

  async function submitPrediction() {
    if (!name.trim()) { alert('Please enter your name!'); return; }
    const allIds = [...R16_IDS, ...QF_IDS, ...SF_IDS, 'final'];
    if (allIds.some(id => !picks[id])) { alert('Please make all your picks before submitting!'); return; }
    const existing = predictions.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
    if (existing && !confirm(`"${name.trim()}" already submitted. Overwrite?`)) return;
    await fetch('/api/predictions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), picks }) });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    setPicks({}); setName(''); fetchPredictions();
  }

  const hasResults = Object.keys(results).length > 0;
  const leaderboard = predictions.map(p => {
    const s = hasResults ? calcScores(p.picks, results) : { r16: 0, qf: 0, sf: 0, final: 0, total: 0 };
    return { name: p.name, ...s };
  }).sort((a, b) => b.total - a.total);

  function PickCard({ matchId, teamA, teamB }) {
    return (
      <div className="match-pick-card">
        <div className="pick-buttons">
          <button className={`pick-btn ${picks[matchId] === teamA ? 'selected' : ''} ${!teamA ? 'locked' : ''}`}
            onClick={() => teamA && pick(matchId, teamA)} disabled={!teamA}>
            {teamA && <TeamBadge team={teamA} size={24} />}
            <span>{teamA || 'TBD'}</span>
          </button>
          <div className="pick-vs">
            <StarballSVG size={20} />
          </div>
          <button className={`pick-btn ${picks[matchId] === teamB ? 'selected' : ''} ${!teamB ? 'locked' : ''}`}
            onClick={() => teamB && pick(matchId, teamB)} disabled={!teamB}>
            {teamB && <TeamBadge team={teamB} size={24} />}
            <span>{teamB || 'TBD'}</span>
          </button>
        </div>
      </div>
    );
  }

  function BracketMatch({ teamA, teamB, winner, resultWinner }) {
    return (
      <div className="bracket-match">
        <div className={`bracket-team ${winner === teamA ? 'winner' : winner ? 'loser' : ''}`}>
          {teamA && <TeamBadge team={teamA} size={20} />}
          <span className="bracket-team-name">{teamA || 'TBD'}</span>
          {resultWinner && winner === teamA && resultWinner === teamA && <span className="check">&#10003;</span>}
          {resultWinner && winner === teamA && resultWinner !== teamA && <span className="cross">&#10007;</span>}
        </div>
        <div className={`bracket-team ${winner === teamB ? 'winner' : winner ? 'loser' : ''}`}>
          {teamB && <TeamBadge team={teamB} size={20} />}
          <span className="bracket-team-name">{teamB || 'TBD'}</span>
          {resultWinner && winner === teamB && resultWinner === teamB && <span className="check">&#10003;</span>}
          {resultWinner && winner === teamB && resultWinner !== teamB && <span className="cross">&#10007;</span>}
        </div>
      </div>
    );
  }

  function PlayerBracket({ prediction }) {
    const pk = prediction.picks;
    const r16L = R16.slice(0, 4), r16R = R16.slice(4);
    const qfData = QF_SEEDS.map((pair, i) => ({ teamA: pk[pair[0]], teamB: pk[pair[1]], winner: pk['qf_'+(i+1)] }));
    const sfData = SF_SEEDS.map((pair, i) => ({ teamA: pk[pair[0]], teamB: pk[pair[1]], winner: pk['sf_'+(i+1)] }));

    return (
      <div className="bracket-wrap">
        <div className="bracket">
          <div className="round">
            <div className="round-header">Round of 16</div>
            {r16L.map(m => <BracketMatch key={m.id} teamA={m.home} teamB={m.away} winner={pk[m.id]} resultWinner={results[m.id]} />)}
          </div>
          <div className="connector-line"><div className="line-v" /></div>
          <div className="round">
            <div className="round-header">Quarter-Finals</div>
            <div className="qf-col">
              {qfData.slice(0,2).map((q,i) => <BracketMatch key={i} teamA={q.teamA} teamB={q.teamB} winner={q.winner} resultWinner={results['qf_'+(i+1)]} />)}
            </div>
          </div>
          <div className="connector-line"><div className="line-v" /></div>
          <div className="round">
            <div className="round-header">Semi-Finals</div>
            <div className="sf-col">
              <BracketMatch teamA={sfData[0].teamA} teamB={sfData[0].teamB} winner={sfData[0].winner} resultWinner={results['sf_1']} />
            </div>
          </div>
          <div className="connector-line"><div className="line-v" /></div>
          <div className="trophy-col">
            <div className="trophy-ring" />
            <div className="trophy-glow" />
            <div className="trophy">
              <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
                <path d="M30 25h40v5c0 15-8 28-20 33-12-5-20-18-20-33v-5z" fill="url(#trophyGold)" />
                <path d="M25 25c-8 0-15 8-12 18 2 7 8 12 17 12v-5c-6 0-10-3-12-8-2-6 1-12 7-12v-5z" fill="url(#trophyGold)" />
                <path d="M75 25c8 0 15 8 12 18-2 7-8 12-17 12v-5c6 0 10-3 12-8 2-6-1-12-7-12v-5z" fill="url(#trophyGold)" />
                <rect x="42" y="63" width="16" height="8" rx="2" fill="url(#trophyGold)" />
                <rect x="35" y="71" width="30" height="6" rx="3" fill="url(#trophyGold)" />
                <path d="M35 20h30v5H35z" rx="2" fill="url(#trophyGold)" opacity="0.8" />
                <defs>
                  <linearGradient id="trophyGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F4D03F" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#B8962E" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="champion-name">{pk['final'] || 'TBD'}</div>
            {results['final'] && pk['final'] === results['final'] && <div className="champ-correct">&#10003; Correct!</div>}
            {results['final'] && pk['final'] !== results['final'] && <div className="champ-wrong">&#10007; Wrong</div>}
            <div className="venue">30 May 2026<br/>Puskas Arena<br/>Budapest</div>
          </div>
          <div className="connector-line"><div className="line-v" /></div>
          <div className="round">
            <div className="round-header">Semi-Finals</div>
            <div className="sf-col">
              <BracketMatch teamA={sfData[1].teamA} teamB={sfData[1].teamB} winner={sfData[1].winner} resultWinner={results['sf_2']} />
            </div>
          </div>
          <div className="connector-line"><div className="line-v" /></div>
          <div className="round">
            <div className="round-header">Quarter-Finals</div>
            <div className="qf-col">
              {qfData.slice(2,4).map((q,i) => <BracketMatch key={i} teamA={q.teamA} teamB={q.teamB} winner={q.winner} resultWinner={results['qf_'+(i+3)]} />)}
            </div>
          </div>
          <div className="connector-line"><div className="line-v" /></div>
          <div className="round">
            <div className="round-header">Round of 16</div>
            {r16R.map(m => <BracketMatch key={m.id} teamA={m.home} teamB={m.away} winner={pk[m.id]} resultWinner={results[m.id]} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Confetti active={showConfetti} />

      <header>
        <div className="header-bg" />
        <div className="header-pattern" />
        <div className="header-content">
          <div className="header-starball">
            <StarballSVG size={50} />
          </div>
          <div className="header-title-row">
            <div className="ucl-line" />
            <h1>UEFA Champions League</h1>
            <div className="ucl-line" />
          </div>
          <h2>Prediction Tournament</h2>
          <p className="header-subtitle">2025/26 Season &mdash; Final: Puskas Arena, Budapest</p>
          <div className="header-stars-row">
            {[...Array(5)].map((_, i) => <StarballSVG key={i} size={12} className="header-mini-star" />)}
          </div>
        </div>
      </header>

      <div className="container">
        {/* Prediction Form */}
        <section className="fade-in">
          <h2 className="section-title">
            <StarballSVG size={22} />
            <span>Submit Your Predictions</span>
          </h2>
          <div className="form-card">
            <div className="name-input-row">
              <label htmlFor="player-name">Your Name</label>
              <input type="text" id="player-name" placeholder="Enter your name..." maxLength={30} value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="round-label">
              <span className="round-dot" />
              <span>Round of 16</span>
              <span className="round-line" />
            </div>
            <div className="matches-form">
              {R16.map(m => <PickCard key={m.id} matchId={m.id} teamA={m.home} teamB={m.away} />)}
            </div>

            <div className="round-label">
              <span className="round-dot" />
              <span>Quarter-Finals</span>
              <span className="round-line" />
            </div>
            <div className="matches-form">
              {QF_SEEDS.map((pair, i) => <PickCard key={i} matchId={'qf_'+(i+1)} teamA={getTeam(pair[0])} teamB={getTeam(pair[1])} />)}
            </div>

            <div className="round-label">
              <span className="round-dot" />
              <span>Semi-Finals</span>
              <span className="round-line" />
            </div>
            <div className="matches-form">
              {SF_SEEDS.map((pair, i) => <PickCard key={i} matchId={'sf_'+(i+1)} teamA={getTeam(pair[0])} teamB={getTeam(pair[1])} />)}
            </div>

            <div className="round-label">
              <span className="round-dot" />
              <span>Final</span>
              <span className="round-line" />
            </div>
            <div className="matches-form">
              <PickCard matchId="final" teamA={getTeam(FINAL_SEEDS[0])} teamB={getTeam(FINAL_SEEDS[1])} />
            </div>

            <button className="submit-btn" onClick={submitPrediction}>
              <StarballSVG size={18} />
              <span>Submit Predictions</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </section>

        {/* Leaderboard */}
        <section className="leaderboard fade-in">
          <h2 className="section-title">
            <StarballSVG size={22} />
            <span>Leaderboard</span>
          </h2>
          <div className="leaderboard-card">
            <table className="leaderboard-table">
              <thead>
                <tr><th style={{width:'60px'}}>#</th><th>Player</th><th>R16</th><th>QF</th><th>SF</th><th>Final</th><th>Total</th></tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr><td colSpan={7} className="no-data">{loading ? 'Loading...' : 'No predictions yet. Be the first!'}</td></tr>
                ) : leaderboard.map((p, i) => (
                  <tr key={p.name} className={i === 0 && hasResults && p.total > 0 ? 'leader-row' : ''}>
                    <td><span className={`rank-badge ${i<3 ? 'rank-'+(i+1) : ''}`}>{i+1}</span></td>
                    <td className="player-name-cell">{p.name}</td>
                    <td>{hasResults ? p.r16 : '-'}</td>
                    <td>{hasResults ? p.qf : '-'}</td>
                    <td>{hasResults ? p.sf : '-'}</td>
                    <td>{hasResults ? p.final : '-'}</td>
                    <td className="total-cell">{hasResults ? p.total : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Brackets */}
        <section className="fade-in">
          <h2 className="section-title">
            <StarballSVG size={22} />
            <span>Prediction Brackets</span>
          </h2>
          {predictions.length === 0 ? (
            <p className="no-data-text">Submit predictions to see brackets here.</p>
          ) : (
            <>
              <div className="players-tabs">
                {predictions.map((p, i) => (
                  <button key={p.name} className={`player-tab ${i === activeTab ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
                    {p.name}
                  </button>
                ))}
              </div>
              {predictions[activeTab] && <PlayerBracket prediction={predictions[activeTab]} />}
            </>
          )}
        </section>
      </div>

      {/* How to Play */}
      <button className="how-to-play-btn" onClick={() => setShowModal(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span className="how-btn-text">How to Play</span>
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            <div className="modal-starball">
              <StarballSVG size={36} />
            </div>
            <h2>How to Play</h2>
            <div className="modal-step"><div className="step-num">1</div><div><h3>Enter Your Name</h3><p>Type your name and submit your picks. One submission per person.</p></div></div>
            <div className="modal-step"><div className="step-num">2</div><div><h3>Pick Who Advances</h3><p>For every match from R16 to the Final, pick which team goes through. Your picks cascade automatically.</p></div></div>
            <div className="modal-step"><div className="step-num">3</div><div><h3>Earn Points</h3>
              <div className="scoring-grid">
                <div className="score-item"><span className="score-pts pts-bronze">1</span><span className="score-label">Correct R16 / QF / SF pick</span></div>
                <div className="score-item"><span className="score-pts pts-silver">2</span><span className="score-label">Correct Finalist</span></div>
                <div className="score-item"><span className="score-pts pts-gold">3</span><span className="score-label">Correct Champion</span></div>
              </div>
            </div></div>
            <div className="modal-step"><div className="step-num">4</div><div><h3>Win!</h3><p>Most points at the end takes the crown. Good luck!</p></div></div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* ===== HEADER ===== */
        header {
          position: relative;
          overflow: hidden;
          border-bottom: 2px solid rgba(212,175,55,0.3);
        }
        .header-bg {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, #060911 0%, #0a1628 25%, #0d1f42 50%, #0a1628 75%, #060911 100%);
        }
        .header-bg::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(ellipse at 50% 130%, rgba(212,175,55,0.12) 0%, transparent 55%);
        }
        .header-pattern {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          opacity: 0.03;
          background-image:
            repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(212,175,55,0.5) 40px, rgba(212,175,55,0.5) 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(212,175,55,0.5) 40px, rgba(212,175,55,0.5) 41px);
        }
        .header-content {
          position: relative; z-index: 1;
          padding: 50px 20px 45px; text-align: center;
        }
        .header-starball {
          margin-bottom: 18px;
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .header-title-row {
          display: flex; align-items: center; justify-content: center; gap: 20px;
          margin-bottom: 6px;
        }
        .ucl-line {
          width: 60px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent);
        }
        header h1 {
          font-family: 'Oswald', sans-serif;
          font-size: 3rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 8px; line-height: 1.1;
          background: linear-gradient(180deg, #F4D03F 0%, #D4AF37 40%, #B8962E 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: none;
        }
        header h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 1.2rem; font-weight: 500; text-transform: uppercase;
          letter-spacing: 10px; color: rgba(255,255,255,0.7); margin-top: 4px;
        }
        .header-subtitle {
          margin-top: 16px; color: var(--ucl-text-dim); font-size: 0.8rem;
          letter-spacing: 3px; text-transform: uppercase;
        }
        .header-stars-row {
          display: flex; justify-content: center; gap: 12px; margin-top: 18px;
          opacity: 0.4;
        }

        /* ===== CONTAINER ===== */
        .container {
          max-width: 1400px; margin: 0 auto; padding: 40px 20px;
          position: relative; z-index: 1;
        }

        /* ===== SECTION TITLES ===== */
        .section-title {
          font-family: 'Oswald', sans-serif;
          font-size: 1.3rem; font-weight: 600; margin-bottom: 24px;
          text-transform: uppercase; letter-spacing: 4px;
          display: flex; align-items: center; gap: 12px;
          color: #fff;
        }

        /* ===== ANIMATION ===== */
        .fade-in { animation: fadeUp 0.6s ease-out; margin-bottom: 50px; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ===== TEAM BADGES ===== */
        .team-badge {
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .team-crest {
          border-radius: 2px;
          object-fit: contain;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        }
        .team-crest-fallback {
          align-items: center; justify-content: center;
          border-radius: 6px;
          background: linear-gradient(135deg, var(--tc1), var(--tc2));
          color: #fff; font-size: 0.6rem; font-weight: 800;
          letter-spacing: 0.5px;
        }
        .team-tbd {
          font-size: 0.75rem; color: var(--ucl-text-dim); font-style: italic;
        }

        /* ===== FORM ===== */
        .form-card {
          background: linear-gradient(145deg, rgba(13,26,58,0.85), rgba(6,9,17,0.95));
          border-radius: 20px; padding: 32px;
          border: 1px solid rgba(212,175,55,0.12);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .name-input-row {
          display: flex; flex-direction: column; gap: 8px; margin-bottom: 30px;
        }
        .name-input-row label {
          font-family: 'Oswald', sans-serif;
          font-weight: 500; font-size: 0.85rem; text-transform: uppercase;
          letter-spacing: 3px; color: var(--ucl-gold);
        }
        .name-input-row input {
          padding: 14px 18px; border-radius: 12px;
          border: 2px solid rgba(212,175,55,0.15); background: rgba(255,255,255,0.03);
          color: #fff; font-size: 1rem; font-weight: 500; outline: none;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
        }
        .name-input-row input:focus {
          border-color: var(--ucl-gold);
          box-shadow: 0 0 25px rgba(212,175,55,0.1);
        }
        .name-input-row input::placeholder { color: var(--ucl-text-dim); }

        /* ===== ROUND LABELS ===== */
        .round-label {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Oswald', sans-serif;
          color: #fff; font-size: 0.85rem; font-weight: 500;
          text-transform: uppercase; letter-spacing: 4px;
          margin: 30px 0 16px;
        }
        .round-dot {
          width: 8px; height: 8px;
          background: linear-gradient(135deg, var(--ucl-gold), var(--ucl-gold-light));
          border-radius: 50%; display: inline-block;
          box-shadow: 0 0 8px rgba(212,175,55,0.4);
        }
        .round-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, rgba(212,175,55,0.2), transparent);
        }

        /* ===== MATCH PICK CARDS ===== */
        .matches-form {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 12px; margin-bottom: 8px;
        }
        .match-pick-card {
          background: rgba(255,255,255,0.02); border-radius: 14px;
          padding: 4px; border: 1px solid rgba(255,255,255,0.04);
          transition: all 0.3s ease;
        }
        .match-pick-card:hover {
          border-color: rgba(212,175,55,0.2);
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .pick-buttons { display: flex; align-items: center; gap: 0; }
        .pick-vs {
          padding: 0 6px; flex-shrink: 0;
          opacity: 0.3;
        }
        .pick-btn {
          flex: 1; padding: 12px 10px; border-radius: 12px;
          border: 2px solid transparent; background: rgba(255,255,255,0.02);
          color: var(--ucl-text); font-size: 0.85rem; font-weight: 600;
          cursor: pointer; transition: all 0.25s ease; text-align: center;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .pick-btn:hover:not(.locked) {
          background: rgba(212,175,55,0.06); color: var(--ucl-gold-light);
          border-color: rgba(212,175,55,0.2);
        }
        .pick-btn.selected {
          background: linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.05));
          border-color: var(--ucl-gold); color: #fff; font-weight: 700;
          box-shadow: 0 0 20px rgba(212,175,55,0.1);
        }
        .pick-btn.locked { opacity: 0.2; cursor: not-allowed; }

        /* ===== SUBMIT BUTTON ===== */
        .submit-btn {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          width: 100%; padding: 18px; margin-top: 28px;
          background: linear-gradient(135deg, #D4AF37, #B8962E, #D4AF37);
          background-size: 200% 100%;
          color: #0a0e1a; border: none; border-radius: 14px;
          font-family: 'Oswald', sans-serif;
          font-size: 1.1rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 4px; cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 25px rgba(212,175,55,0.3);
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 35px rgba(212,175,55,0.4);
        }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn .starball { filter: brightness(0); }

        /* ===== LEADERBOARD ===== */
        .leaderboard { margin-bottom: 50px; }
        .leaderboard-card {
          background: linear-gradient(145deg, rgba(13,26,58,0.85), rgba(6,9,17,0.95));
          border-radius: 20px; overflow: hidden;
          border: 1px solid rgba(212,175,55,0.12);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .leaderboard-table { width: 100%; border-collapse: collapse; }
        .leaderboard-table thead {
          background: linear-gradient(90deg, #1a1a3e, #0d1f42, #1a1a3e);
        }
        .leaderboard-table th {
          padding: 16px 18px; text-align: left;
          font-family: 'Oswald', sans-serif;
          font-weight: 500; text-transform: uppercase; font-size: 0.75rem;
          letter-spacing: 2px; color: var(--ucl-gold);
        }
        .leaderboard-table td {
          padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.03);
          font-size: 0.9rem; color: var(--ucl-text);
        }
        .leaderboard-table tbody tr {
          transition: all 0.2s ease;
        }
        .leaderboard-table tbody tr:hover { background: rgba(212,175,55,0.04); }
        .leader-row {
          background: linear-gradient(90deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03)) !important;
          border-left: 3px solid var(--ucl-gold);
        }
        .leader-row td { color: #fff; }

        .rank-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 8px;
          font-weight: 800; font-size: 0.8rem;
          background: rgba(255,255,255,0.05); color: var(--ucl-text);
        }
        .rank-1 { background: linear-gradient(135deg, #F4D03F, #D4AF37); color: #0a0e1a; box-shadow: 0 2px 10px rgba(212,175,55,0.3); }
        .rank-2 { background: linear-gradient(135deg, #C0C0C0, #a8a8a8); color: #0a0e1a; }
        .rank-3 { background: linear-gradient(135deg, #cd7f32, #a66528); color: #0a0e1a; }

        .player-name-cell { font-weight: 700; color: #fff !important; }
        .total-cell { font-weight: 800; color: var(--ucl-gold) !important; font-size: 1.05rem !important; }

        .no-data { text-align: center; color: var(--ucl-text-dim); padding: 40px; font-size: 0.9rem; }
        .no-data-text { color: var(--ucl-text-dim); font-size: 0.9rem; }

        /* ===== PLAYER TABS ===== */
        .players-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .player-tab {
          padding: 10px 20px; border-radius: 10px;
          border: 2px solid rgba(212,175,55,0.12);
          background: transparent; color: var(--ucl-text);
          font-family: 'Oswald', sans-serif;
          font-size: 0.85rem; font-weight: 500;
          cursor: pointer; transition: all 0.25s ease;
          text-transform: uppercase; letter-spacing: 2px;
        }
        .player-tab:hover { border-color: var(--ucl-gold); color: #fff; }
        .player-tab.active {
          background: linear-gradient(135deg, var(--ucl-gold), #B8962E);
          color: #0a0e1a; border-color: var(--ucl-gold);
          box-shadow: 0 4px 15px rgba(212,175,55,0.3);
          font-weight: 600;
        }

        /* ===== BRACKET ===== */
        .bracket-wrap {
          overflow-x: auto; padding: 10px 0;
          background: linear-gradient(145deg, rgba(13,26,58,0.5), rgba(6,9,17,0.6));
          border-radius: 20px; border: 1px solid rgba(212,175,55,0.08);
          padding: 25px 15px;
        }
        .bracket {
          display: flex; align-items: center; min-width: 1100px;
          padding: 10px 0; justify-content: center;
        }
        .round { display: flex; flex-direction: column; justify-content: space-around; min-width: 160px; }
        .round-header {
          text-align: center;
          font-family: 'Oswald', sans-serif;
          font-size: 0.65rem; color: var(--ucl-gold);
          text-transform: uppercase; letter-spacing: 3px; font-weight: 500; margin-bottom: 14px;
        }
        .bracket-match {
          background: rgba(255,255,255,0.02); border-radius: 10px;
          overflow: hidden; border: 1px solid rgba(255,255,255,0.05); margin: 5px 0;
          transition: all 0.3s ease;
        }
        .bracket-match:hover { border-color: rgba(212,175,55,0.25); }
        .bracket-team {
          padding: 8px 10px; font-size: 0.78rem; font-weight: 500;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          display: flex; align-items: center; gap: 6px;
          color: var(--ucl-text); transition: all 0.2s ease;
        }
        .bracket-team-name { flex: 1; }
        .bracket-team:last-child { border-bottom: none; }
        .bracket-team.winner {
          background: linear-gradient(90deg, rgba(212,175,55,0.1), transparent);
          color: #fff; font-weight: 700;
        }
        .bracket-team.loser { color: var(--ucl-text-dim); }
        .bracket-team .check { color: var(--ucl-green); font-weight: 800; font-size: 0.9rem; margin-left: auto; }
        .bracket-team .cross { color: var(--ucl-red); font-weight: 800; font-size: 0.9rem; margin-left: auto; }

        .connector-line {
          width: 24px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .line-v {
          width: 1px; height: 60px;
          background: linear-gradient(180deg, transparent, rgba(212,175,55,0.2), transparent);
        }

        .qf-col { display: flex; flex-direction: column; justify-content: space-around; height: 100%; gap: 50px; }
        .sf-col { display: flex; flex-direction: column; justify-content: center; height: 100%; }

        .trophy-col {
          text-align: center; min-width: 130px; padding: 0 15px; position: relative;
        }
        .trophy-ring {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -65%);
          width: 90px; height: 90px; border-radius: 50%;
          border: 1px solid rgba(212,175,55,0.15);
          animation: ringPulse 4s ease-in-out infinite;
        }
        @keyframes ringPulse {
          0%, 100% { transform: translate(-50%, -65%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -65%) scale(1.3); opacity: 0.6; }
        }
        .trophy-glow {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -65%);
          width: 80px; height: 80px; border-radius: 50%;
          background: radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%);
          animation: trophyPulse 3s ease-in-out infinite;
        }
        @keyframes trophyPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -65%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -65%) scale(1.15); }
        }
        .trophy-col .trophy {
          position: relative; z-index: 1;
          filter: drop-shadow(0 4px 15px rgba(212,175,55,0.3));
        }
        .trophy-col .champion-name {
          font-family: 'Oswald', sans-serif;
          font-size: 1.15rem; font-weight: 600; margin-top: 8px;
          letter-spacing: 2px; text-transform: uppercase;
          position: relative; z-index: 1;
          background: linear-gradient(180deg, #F4D03F, #D4AF37);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .trophy-col .venue {
          font-size: 0.6rem; color: var(--ucl-text-dim); margin-top: 10px;
          line-height: 1.7; position: relative; z-index: 1;
          letter-spacing: 1.5px; text-transform: uppercase;
        }
        .champ-correct { color: var(--ucl-green); font-size: 0.75rem; font-weight: 700; margin-top: 4px; position: relative; z-index: 1; }
        .champ-wrong { color: var(--ucl-red); font-size: 0.75rem; font-weight: 700; margin-top: 4px; position: relative; z-index: 1; }

        /* ===== HOW TO PLAY BUTTON ===== */
        .how-to-play-btn {
          position: fixed; bottom: 25px; right: 25px;
          background: linear-gradient(135deg, var(--ucl-gold), #B8962E);
          color: #0a0e1a; border: none; padding: 14px 22px; border-radius: 50px;
          font-family: 'Oswald', sans-serif;
          font-size: 0.85rem; font-weight: 600; cursor: pointer; z-index: 100;
          box-shadow: 0 4px 20px rgba(212,175,55,0.3);
          transition: all 0.3s ease;
          display: flex; align-items: center; gap: 8px;
          text-transform: uppercase; letter-spacing: 2px;
        }
        .how-to-play-btn svg { stroke: #0a0e1a; }
        .how-to-play-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(212,175,55,0.5);
        }

        /* ===== MODAL ===== */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.88); z-index: 200;
          display: flex; justify-content: center; align-items: center; padding: 20px;
          backdrop-filter: blur(8px);
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal {
          background: linear-gradient(145deg, #0d1a3a, #060911);
          border-radius: 24px; padding: 40px; max-width: 520px; width: 100%;
          border: 1px solid rgba(212,175,55,0.15); position: relative;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.05);
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-close {
          position: absolute; top: 18px; right: 22px; background: none;
          border: none; color: var(--ucl-text-dim); font-size: 1.8rem; cursor: pointer;
          transition: color 0.2s;
        }
        .modal-close:hover { color: var(--ucl-gold); }

        .modal-starball {
          text-align: center; margin-bottom: 16px;
        }
        .modal h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 1.4rem; text-align: center; color: #fff;
          text-transform: uppercase; letter-spacing: 5px; margin-bottom: 28px;
        }
        .modal-step {
          display: flex; gap: 16px; margin-bottom: 22px; align-items: flex-start;
        }
        .step-num {
          min-width: 38px; height: 38px; border-radius: 10px;
          background: linear-gradient(135deg, var(--ucl-gold), #B8962E);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.85rem; flex-shrink: 0;
          color: #0a0e1a;
          font-family: 'Oswald', sans-serif;
        }
        .modal h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 1rem; color: #fff; margin-bottom: 6px;
          font-weight: 500; letter-spacing: 1px;
        }
        .modal p { color: var(--ucl-text); line-height: 1.6; font-size: 0.88rem; }

        .scoring-grid { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
        .score-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
        }
        .score-pts {
          min-width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.9rem;
          font-family: 'Oswald', sans-serif;
        }
        .pts-gold { background: linear-gradient(135deg, #F4D03F, #D4AF37); color: #0a0e1a; }
        .pts-silver { background: linear-gradient(135deg, #00349A, #0057d9); color: #fff; }
        .pts-bronze { background: linear-gradient(135deg, #cd7f32, #a66528); color: #fff; }
        .score-label { color: var(--ucl-text); font-size: 0.85rem; font-weight: 500; }

        /* ===== CONFETTI ===== */
        .confetti-container {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none; z-index: 300; overflow: hidden;
        }
        .confetti-particle {
          position: absolute; top: -10px;
          border-radius: 2px;
          animation: confettiFall linear forwards;
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        /* ===== STARBALL SVG ===== */
        .starball {
          display: inline-block;
          vertical-align: middle;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          header h1 { font-size: 1.6rem; letter-spacing: 4px; }
          header h2 { font-size: 0.85rem; letter-spacing: 5px; }
          .ucl-line { width: 30px; }
          .matches-form { grid-template-columns: 1fr; }
          .form-card { padding: 20px 16px; }
          .modal { padding: 28px 20px; }
          .how-btn-text { display: none; }
          .how-to-play-btn { padding: 14px; border-radius: 50%; }
          .header-content { padding: 35px 16px 30px; }
          .section-title { font-size: 1.1rem; letter-spacing: 3px; }
        }

        @media (max-width: 480px) {
          header h1 { font-size: 1.3rem; letter-spacing: 3px; }
          header h2 { font-size: 0.75rem; letter-spacing: 3px; }
          .header-starball svg { width: 36px; height: 36px; }
        }
      `}</style>
    </>
  );
}
