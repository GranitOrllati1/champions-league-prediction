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
    const newResults = { ...results, [matchId]: team };

    // Clear downstream if changed
    const clearDownstream = (id) => {
      QF_SEEDS.forEach((pair, i) => {
        if (pair.includes(id)) {
          const qfId = 'qf_' + (i + 1);
          if (newResults[qfId]) { delete newResults[qfId]; clearDownstream(qfId); }
        }
      });
      SF_SEEDS.forEach((pair, i) => {
        if (pair.includes(id)) {
          const sfId = 'sf_' + (i + 1);
          if (newResults[sfId]) { delete newResults[sfId]; clearDownstream(sfId); }
        }
      });
      if (FINAL_SEEDS.includes(id) && newResults['final']) {
        delete newResults['final'];
      }
    };
    clearDownstream(matchId);
    setResults(newResults);
  }

  function getTeam(id) { return results[id] || null; }

  async function saveResults() {
    setSaving(true);
    setMessage('');
    const res = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, results }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setMessage('Results saved! Leaderboard updated.');
    } else {
      setMessage('Error: ' + (data.error || 'Something went wrong'));
    }
  }

  function ResultCard({ matchId, teamA, teamB, round }) {
    const lockedA = !teamA;
    const lockedB = !teamB;
    return (
      <div className="result-card">
        <div className="result-round">{round}</div>
        <div className="result-buttons">
          <button
            className={`result-btn ${results[matchId] === teamA ? 'selected' : ''} ${lockedA ? 'locked' : ''}`}
            onClick={() => !lockedA && pickResult(matchId, teamA)}
            disabled={lockedA}
          >{teamA || 'TBD'}</button>
          <span className="result-vs">vs</span>
          <button
            className={`result-btn ${results[matchId] === teamB ? 'selected' : ''} ${lockedB ? 'locked' : ''}`}
            onClick={() => !lockedB && pickResult(matchId, teamB)}
            disabled={lockedB}
          >{teamB || 'TBD'}</button>
        </div>
        {results[matchId] && (
          <div className="result-winner">Advanced: <strong>{results[matchId]}</strong></div>
        )}
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <>
        <div className="admin-login">
          <div className="login-card">
            <h1>Admin Panel</h1>
            <p>Enter the admin password to manage results</p>
            <input
              type="password"
              placeholder="Password..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setLoggedIn(true)}
            />
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
          <h1>Admin Panel &mdash; Enter Real Results</h1>
          <p>Select the team that actually advanced in each match</p>
        </header>

        <div className="admin-container">
          <div className="round-section">
            <h2>Round of 16</h2>
            <div className="results-grid">
              {R16.map(m => <ResultCard key={m.id} matchId={m.id} teamA={m.home} teamB={m.away} round="R16" />)}
            </div>
          </div>

          <div className="round-section">
            <h2>Quarter-Finals</h2>
            <div className="results-grid">
              {QF_SEEDS.map((pair, i) => (
                <ResultCard key={i} matchId={'qf_' + (i+1)} teamA={getTeam(pair[0])} teamB={getTeam(pair[1])} round="QF" />
              ))}
            </div>
          </div>

          <div className="round-section">
            <h2>Semi-Finals</h2>
            <div className="results-grid">
              {SF_SEEDS.map((pair, i) => (
                <ResultCard key={i} matchId={'sf_' + (i+1)} teamA={getTeam(pair[0])} teamB={getTeam(pair[1])} round="SF" />
              ))}
            </div>
          </div>

          <div className="round-section">
            <h2>Final</h2>
            <div className="results-grid">
              <ResultCard matchId="final" teamA={getTeam(FINAL_SEEDS[0])} teamB={getTeam(FINAL_SEEDS[1])} round="FINAL" />
            </div>
          </div>

          <button className="save-btn" onClick={saveResults} disabled={saving}>
            {saving ? 'Saving...' : 'Save Results & Update Leaderboard'}
          </button>
          {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}
        </div>
      </div>
      <style jsx global>{`${adminStyles}`}</style>
    </>
  );
}

const adminStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0e1a; color: #fff; min-height: 100vh; }

  .admin-login {
    display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px;
  }
  .login-card {
    background: rgba(255,255,255,0.05); border-radius: 16px; padding: 40px;
    border: 1px solid rgba(255,255,255,0.1); text-align: center; max-width: 400px; width: 100%;
  }
  .login-card h1 { font-size: 1.8rem; color: #e94560; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
  .login-card p { color: #8892b0; margin-bottom: 25px; }
  .login-card input {
    width: 100%; padding: 14px 18px; border-radius: 8px;
    border: 2px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06);
    color: #fff; font-size: 1rem; outline: none; margin-bottom: 15px;
  }
  .login-card input:focus { border-color: #e94560; }
  .login-card button {
    width: 100%; padding: 14px; background: linear-gradient(135deg, #e94560, #c23152);
    color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 700;
    cursor: pointer; text-transform: uppercase; letter-spacing: 2px;
  }
  .login-card button:hover { opacity: 0.9; }

  .admin-header {
    background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
    padding: 30px 20px; text-align: center; border-bottom: 3px solid #e94560;
  }
  .admin-header h1 { font-size: 1.6rem; text-transform: uppercase; letter-spacing: 2px; }
  .admin-header p { color: #8892b0; margin-top: 8px; }

  .admin-container { max-width: 900px; margin: 0 auto; padding: 30px 20px; }

  .round-section { margin-bottom: 35px; }
  .round-section h2 {
    font-size: 1.1rem; color: #e94560; text-transform: uppercase;
    letter-spacing: 2px; margin-bottom: 15px; padding-bottom: 8px;
    border-bottom: 1px solid rgba(233,69,96,0.3);
  }

  .results-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 12px;
  }

  .result-card {
    background: rgba(255,255,255,0.04); border-radius: 10px;
    padding: 16px; border: 1px solid rgba(255,255,255,0.08);
  }
  .result-round {
    font-size: 0.65rem; color: #8892b0; text-transform: uppercase;
    letter-spacing: 2px; margin-bottom: 10px;
  }
  .result-buttons { display: flex; gap: 8px; align-items: center; }
  .result-vs { color: #555; font-size: 0.8rem; font-weight: 700; }
  .result-btn {
    flex: 1; padding: 12px 8px; border-radius: 8px;
    border: 2px solid rgba(255,255,255,0.12); background: transparent;
    color: #8892b0; font-size: 0.9rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s; text-align: center;
  }
  .result-btn:hover { border-color: #e94560; color: #fff; }
  .result-btn.selected { background: rgba(233,69,96,0.2); border-color: #e94560; color: #e94560; font-weight: 700; }
  .result-btn.locked { opacity: 0.3; pointer-events: none; }
  .result-winner { margin-top: 8px; font-size: 0.8rem; color: #4ecca3; text-align: center; }
  .result-winner strong { color: #4ecca3; }

  .save-btn {
    display: block; width: 100%; padding: 16px; margin-top: 10px;
    background: linear-gradient(135deg, #e94560, #c23152);
    color: #fff; border: none; border-radius: 10px;
    font-size: 1.1rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 2px; cursor: pointer; transition: transform 0.2s;
  }
  .save-btn:hover { transform: translateY(-2px); }
  .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .message {
    text-align: center; padding: 12px; border-radius: 8px; margin-top: 15px; font-weight: 600;
  }
  .message.success { background: rgba(78,204,163,0.15); color: #4ecca3; }
  .message.error { background: rgba(233,69,96,0.15); color: #e94560; }
`;
