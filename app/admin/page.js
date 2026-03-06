'use client';

import { useState, useEffect } from 'react';

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

const TEAM_META = {
  'PSG':         { crest: 524 },
  'Chelsea':     { crest: 61 },
  'Galatasaray': { crest: 257 },
  'Liverpool':   { crest: 64 },
  'Real Madrid': { crest: 86 },
  'Man City':    { crest: 65 },
  'Atalanta':    { crest: 102 },
  'Bayern':      { crest: 5 },
  'Newcastle':   { crest: 67 },
  'Barcelona':   { crest: 81 },
  'Atletico':    { crest: 78 },
  'Tottenham':   { crest: 73 },
  'Bodo/Glimt':  { crest: 1139 },
  'Sporting CP': { crest: 498 },
  'Leverkusen':  { crest: 3 },
  'Arsenal':     { crest: 57 },
};

function TeamCrest({ team, size = 22 }) {
  const meta = TEAM_META[team];
  if (!meta) return null;
  return (
    <img
      src={`https://crests.football-data.org/${meta.crest}.png`}
      alt={team}
      width={size}
      height={size}
      style={{ objectFit: 'contain', borderRadius: 2, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [results, setResults] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/results').then(r => r.json()).then(data => {
      if (data && Object.keys(data).length > 0) setResults(data);
    });
  }, []);

  function pickResult(matchId, team) {
    const nr = { ...results, [matchId]: team };
    const clear = (id) => {
      QF_SEEDS.forEach((p, i) => { if (p.includes(id)) { const q = 'qf_'+(i+1); if (nr[q]) { delete nr[q]; clear(q); } } });
      SF_SEEDS.forEach((p, i) => { if (p.includes(id)) { const s = 'sf_'+(i+1); if (nr[s]) { delete nr[s]; clear(s); } } });
      if (FINAL_SEEDS.includes(id) && nr['final']) delete nr['final'];
    };
    clear(matchId);
    setResults(nr);
  }

  function getTeam(id) { return results[id] || null; }

  async function saveResults() {
    setSaving(true); setMessage('');
    const res = await fetch('/api/results', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, results }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(data.success ? 'Results saved! Leaderboard updated.' : 'Error: ' + (data.error || 'Something went wrong'));
  }

  function ResultCard({ matchId, teamA, teamB }) {
    return (
      <div className="result-card">
        <div className="result-buttons">
          <button className={`result-btn ${results[matchId] === teamA ? 'selected' : ''} ${!teamA ? 'locked' : ''}`}
            onClick={() => teamA && pickResult(matchId, teamA)} disabled={!teamA}>
            {teamA && <TeamCrest team={teamA} />}
            <span>{teamA || 'TBD'}</span>
          </button>
          <div className="result-vs">VS</div>
          <button className={`result-btn ${results[matchId] === teamB ? 'selected' : ''} ${!teamB ? 'locked' : ''}`}
            onClick={() => teamB && pickResult(matchId, teamB)} disabled={!teamB}>
            {teamB && <TeamCrest team={teamB} />}
            <span>{teamB || 'TBD'}</span>
          </button>
        </div>
        {results[matchId] && <div className="result-winner">&#10003; {results[matchId]}</div>}
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <>
        <div className="admin-login">
          <div className="login-card">
            <div className="login-star">
              <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <polygon key={i} points="50,10 54,40 50,50 46,40" fill="url(#ag)" transform={`rotate(${angle} 50 50)`} />
                ))}
                <circle cx="50" cy="50" r="12" fill="url(#ag)" />
                <circle cx="50" cy="50" r="8" fill="#0a0e1a" />
                <defs><linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F4D03F"/><stop offset="100%" stopColor="#D4AF37"/></linearGradient></defs>
              </svg>
            </div>
            <h1>Admin Panel</h1>
            <p>Enter the password to manage results</p>
            <input type="password" placeholder="Password..." value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setLoggedIn(true)} />
            <button onClick={() => setLoggedIn(true)}>Enter</button>
          </div>
        </div>
        <style jsx global>{`${adminStyles}`}</style>
      </>
    );
  }

  return (
    <>
      <div className="admin-page">
        <header className="admin-header">
          <svg width="30" height="30" viewBox="0 0 100 100" fill="none" style={{ marginBottom: 10 }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <polygon key={i} points="50,10 54,40 50,50 46,40" fill="url(#ahg)" transform={`rotate(${angle} 50 50)`} />
            ))}
            <circle cx="50" cy="50" r="12" fill="url(#ahg)" />
            <circle cx="50" cy="50" r="8" fill="#0a1628" />
            <defs><linearGradient id="ahg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F4D03F"/><stop offset="100%" stopColor="#D4AF37"/></linearGradient></defs>
          </svg>
          <h1>Admin Panel</h1>
          <p>Select the team that advanced in each match</p>
        </header>

        <div className="admin-container">
          <div className="round-section">
            <h2><span className="round-dot" /> Round of 16</h2>
            <div className="results-grid">
              {R16.map(m => <ResultCard key={m.id} matchId={m.id} teamA={m.home} teamB={m.away} />)}
            </div>
          </div>

          <div className="round-section">
            <h2><span className="round-dot" /> Quarter-Finals</h2>
            <div className="results-grid">
              {QF_SEEDS.map((pair, i) => <ResultCard key={i} matchId={'qf_'+(i+1)} teamA={getTeam(pair[0])} teamB={getTeam(pair[1])} />)}
            </div>
          </div>

          <div className="round-section">
            <h2><span className="round-dot" /> Semi-Finals</h2>
            <div className="results-grid">
              {SF_SEEDS.map((pair, i) => <ResultCard key={i} matchId={'sf_'+(i+1)} teamA={getTeam(pair[0])} teamB={getTeam(pair[1])} />)}
            </div>
          </div>

          <div className="round-section">
            <h2><span className="round-dot" /> Final</h2>
            <div className="results-grid">
              <ResultCard matchId="final" teamA={getTeam(FINAL_SEEDS[0])} teamB={getTeam(FINAL_SEEDS[1])} />
            </div>
          </div>

          <button className="save-btn" onClick={saveResults} disabled={saving}>
            {saving ? 'Saving...' : 'Save Results & Update Leaderboard'}
          </button>
          {message && <div className={`msg ${message.includes('Error') ? 'msg-error' : 'msg-success'}`}>{message}</div>}
        </div>
      </div>
      <style jsx global>{`${adminStyles}`}</style>
    </>
  );
}

const adminStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Oswald:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', sans-serif; background: #0a0e1a; color: #fff; min-height: 100vh;
  }

  .admin-login {
    display: flex; justify-content: center; align-items: center;
    min-height: 100vh; padding: 20px;
    background: radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.06), transparent 60%);
  }
  .login-card {
    background: linear-gradient(145deg, rgba(13,26,58,0.9), rgba(6,9,17,0.95));
    border-radius: 24px; padding: 48px 40px; text-align: center;
    max-width: 400px; width: 100%;
    border: 1px solid rgba(212,175,55,0.12);
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  }
  .login-star { margin-bottom: 18px; }
  .login-card h1 {
    font-family: 'Oswald', sans-serif;
    font-size: 1.6rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 5px; margin-bottom: 8px;
    background: linear-gradient(180deg, #F4D03F, #D4AF37);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .login-card p { color: #5a6a8a; margin-bottom: 28px; font-size: 0.85rem; }
  .login-card input {
    width: 100%; padding: 14px 18px; border-radius: 12px;
    border: 2px solid rgba(212,175,55,0.15); background: rgba(255,255,255,0.03);
    color: #fff; font-size: 1rem; outline: none; margin-bottom: 14px;
    transition: border-color 0.3s; font-family: 'Inter', sans-serif;
  }
  .login-card input:focus { border-color: #D4AF37; box-shadow: 0 0 25px rgba(212,175,55,0.1); }
  .login-card input::placeholder { color: #2a3a5c; }
  .login-card button {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #D4AF37, #B8962E);
    color: #0a0e1a; border: none; border-radius: 12px;
    font-family: 'Oswald', sans-serif;
    font-size: 0.95rem; font-weight: 600; cursor: pointer;
    text-transform: uppercase; letter-spacing: 4px;
    transition: all 0.3s; box-shadow: 0 4px 15px rgba(212,175,55,0.3);
  }
  .login-card button:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(212,175,55,0.4); }

  .admin-header {
    background: linear-gradient(135deg, #060911, #0a1628, #0d1f42);
    padding: 40px 20px; text-align: center;
    border-bottom: 2px solid rgba(212,175,55,0.2);
  }
  .admin-header h1 {
    font-family: 'Oswald', sans-serif;
    font-size: 1.6rem; font-weight: 600; text-transform: uppercase; letter-spacing: 5px;
    background: linear-gradient(180deg, #F4D03F, #D4AF37);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .admin-header p { color: #5a6a8a; margin-top: 8px; font-size: 0.85rem; }

  .admin-container { max-width: 900px; margin: 0 auto; padding: 35px 20px; }

  .round-section { margin-bottom: 35px; }
  .round-section h2 {
    display: flex; align-items: center; gap: 10px;
    font-family: 'Oswald', sans-serif;
    font-size: 0.9rem; font-weight: 500; color: #fff;
    text-transform: uppercase; letter-spacing: 4px;
    margin-bottom: 16px;
  }
  .round-dot {
    width: 8px; height: 8px;
    background: linear-gradient(135deg, #D4AF37, #F4D03F);
    border-radius: 50%; display: inline-block;
    box-shadow: 0 0 8px rgba(212,175,55,0.3);
  }

  .results-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 12px;
  }

  .result-card {
    background: rgba(255,255,255,0.02); border-radius: 14px;
    padding: 4px; border: 1px solid rgba(255,255,255,0.04);
    transition: all 0.3s;
  }
  .result-card:hover { border-color: rgba(212,175,55,0.2); }

  .result-buttons { display: flex; align-items: center; gap: 0; }
  .result-vs {
    font-family: 'Oswald', sans-serif;
    font-size: 0.7rem; font-weight: 500; color: #2a3a5c; letter-spacing: 2px; padding: 0 4px;
  }
  .result-btn {
    flex: 1; padding: 12px 10px; border-radius: 12px;
    border: 2px solid transparent; background: rgba(255,255,255,0.02);
    color: #5a6a8a; font-size: 0.85rem; font-weight: 600;
    cursor: pointer; transition: all 0.25s; text-align: center;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .result-btn:hover:not(.locked) { background: rgba(78,204,163,0.06); color: #4ecca3; border-color: rgba(78,204,163,0.2); }
  .result-btn.selected {
    background: linear-gradient(135deg, rgba(78,204,163,0.12), rgba(78,204,163,0.04));
    border-color: #4ecca3; color: #4ecca3; font-weight: 700;
  }
  .result-btn.locked { opacity: 0.2; cursor: not-allowed; }
  .result-winner {
    text-align: center; padding: 6px; font-size: 0.75rem;
    color: #4ecca3; font-weight: 700; letter-spacing: 1px;
  }

  .save-btn {
    display: block; width: 100%; padding: 18px; margin-top: 10px;
    background: linear-gradient(135deg, #4ecca3, #38b28a);
    color: #0a0e1a; border: none; border-radius: 14px;
    font-family: 'Oswald', sans-serif;
    font-size: 1rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 4px; cursor: pointer; transition: all 0.3s;
    box-shadow: 0 4px 20px rgba(78,204,163,0.3);
  }
  .save-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(78,204,163,0.4); }
  .save-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .msg {
    text-align: center; padding: 14px; border-radius: 12px; margin-top: 16px;
    font-weight: 700; font-size: 0.85rem; letter-spacing: 1px;
  }
  .msg-success { background: rgba(78,204,163,0.08); color: #4ecca3; border: 1px solid rgba(78,204,163,0.15); }
  .msg-error { background: rgba(233,69,96,0.08); color: #e94560; border: 1px solid rgba(233,69,96,0.15); }
`;
