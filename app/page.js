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

const R16_IDS = R16.map(m => m.id);
const QF_IDS = QF_SEEDS.map((_, i) => 'qf_' + (i + 1));
const SF_IDS = SF_SEEDS.map((_, i) => 'sf_' + (i + 1));

function calcScores(picks, results) {
  let r16 = 0, qf = 0, sf = 0, final = 0;

  // R16: 1pt each correct
  R16_IDS.forEach(id => {
    if (results[id] && picks[id] === results[id]) r16++;
  });

  // QF: 1pt each correct
  QF_IDS.forEach(id => {
    if (results[id] && picks[id] === results[id]) qf++;
  });

  // SF: 1pt each correct
  SF_IDS.forEach(id => {
    if (results[id] && picks[id] === results[id]) sf++;
  });

  // Finalist bonus: 2pts for each correct finalist
  if (results['sf_1'] && results['sf_2']) {
    const realFinalists = [results['sf_1'], results['sf_2']];
    const pickFinalists = [picks['sf_1'], picks['sf_2']];
    pickFinalists.forEach(pf => {
      if (pf && realFinalists.includes(pf)) final += 2;
    });
  }

  // Champion: 3pts
  if (results['final'] && picks['final'] === results['final']) {
    final += 3;
  }

  return { r16, qf, sf, final, total: r16 + qf + sf + final };
}

export default function Home() {
  const [picks, setPicks] = useState({});
  const [name, setName] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [results, setResults] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
    fetchResults();
  }, []);

  async function fetchPredictions() {
    const res = await fetch('/api/predictions');
    const data = await res.json();
    setPredictions(data);
    setLoading(false);
  }

  async function fetchResults() {
    const res = await fetch('/api/results');
    const data = await res.json();
    setResults(data || {});
  }

  function pick(matchId, team) {
    const newPicks = { ...picks, [matchId]: team };
    const clearDownstream = (id) => {
      QF_SEEDS.forEach((pair, i) => {
        if (pair.includes(id)) {
          const qfId = 'qf_' + (i + 1);
          if (newPicks[qfId]) { delete newPicks[qfId]; clearDownstream(qfId); }
        }
      });
      SF_SEEDS.forEach((pair, i) => {
        if (pair.includes(id)) {
          const sfId = 'sf_' + (i + 1);
          if (newPicks[sfId]) { delete newPicks[sfId]; clearDownstream(sfId); }
        }
      });
      if (FINAL_SEEDS.includes(id) && newPicks['final']) {
        delete newPicks['final'];
      }
    };
    clearDownstream(matchId);
    setPicks(newPicks);
  }

  function getTeam(id) { return picks[id] || null; }

  async function submitPrediction() {
    if (!name.trim()) { alert('Please enter your name!'); return; }
    const allIds = [...R16_IDS, ...QF_IDS, ...SF_IDS, 'final'];
    if (allIds.some(id => !picks[id])) {
      alert('Please make all your picks before submitting!');
      return;
    }
    const existing = predictions.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
    if (existing && !confirm(`"${name.trim()}" already submitted. Overwrite?`)) return;

    await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), picks }),
    });
    setPicks({});
    setName('');
    fetchPredictions();
    alert(`${name.trim()}'s predictions saved!`);
  }

  // Build leaderboard with scores
  const hasResults = Object.keys(results).length > 0;
  const leaderboard = predictions.map(p => {
    const scores = hasResults ? calcScores(p.picks, results) : { r16: 0, qf: 0, sf: 0, final: 0, total: 0 };
    return { name: p.name, ...scores };
  }).sort((a, b) => b.total - a.total);

  function PickCard({ matchId, teamA, teamB }) {
    const lockedA = !teamA;
    const lockedB = !teamB;
    return (
      <div className="match-pick-card">
        <div className="pick-buttons">
          <button
            className={`pick-btn ${picks[matchId] === teamA ? 'selected' : ''} ${lockedA ? 'locked' : ''}`}
            onClick={() => !lockedA && pick(matchId, teamA)}
            disabled={lockedA}
          >{teamA || 'TBD'}</button>
          <button
            className={`pick-btn ${picks[matchId] === teamB ? 'selected' : ''} ${lockedB ? 'locked' : ''}`}
            onClick={() => !lockedB && pick(matchId, teamB)}
            disabled={lockedB}
          >{teamB || 'TBD'}</button>
        </div>
      </div>
    );
  }

  function BracketMatch({ teamA, teamB, winner, resultWinner }) {
    return (
      <div className="bracket-match">
        <div className={`bracket-team ${winner === teamA ? 'winner' : winner ? 'loser' : ''} ${resultWinner && resultWinner === teamA && winner !== teamA ? 'wrong-pick' : ''}`}>
          {teamA || 'TBD'}
          {resultWinner && winner === teamA && resultWinner === teamA && <span className="check"> ✓</span>}
          {resultWinner && winner === teamA && resultWinner !== teamA && <span className="cross"> ✗</span>}
        </div>
        <div className={`bracket-team ${winner === teamB ? 'winner' : winner ? 'loser' : ''} ${resultWinner && resultWinner === teamB && winner !== teamB ? 'wrong-pick' : ''}`}>
          {teamB || 'TBD'}
          {resultWinner && winner === teamB && resultWinner === teamB && <span className="check"> ✓</span>}
          {resultWinner && winner === teamB && resultWinner !== teamB && <span className="cross"> ✗</span>}
        </div>
      </div>
    );
  }

  function PlayerBracket({ prediction }) {
    const pk = prediction.picks;
    const r16L = R16.slice(0, 4);
    const r16R = R16.slice(4);

    const qfData = QF_SEEDS.map((pair, i) => ({
      teamA: pk[pair[0]], teamB: pk[pair[1]], winner: pk['qf_' + (i + 1)]
    }));
    const sfData = SF_SEEDS.map((pair, i) => ({
      teamA: pk[pair[0]], teamB: pk[pair[1]], winner: pk['sf_' + (i + 1)]
    }));

    return (
      <div className="bracket-wrap">
        <div className="bracket">
          <div className="round">
            <div className="round-header">Round of 16</div>
            {r16L.map(m => <BracketMatch key={m.id} teamA={m.home} teamB={m.away} winner={pk[m.id]} resultWinner={results[m.id]} />)}
          </div>
          <div className="connector" />
          <div className="round">
            <div className="round-header">Quarter-Finals</div>
            <div className="qf-col">
              {qfData.slice(0, 2).map((q, i) => <BracketMatch key={i} teamA={q.teamA} teamB={q.teamB} winner={q.winner} resultWinner={results['qf_' + (i + 1)]} />)}
            </div>
          </div>
          <div className="connector" />
          <div className="round">
            <div className="round-header">Semi-Finals</div>
            <div className="sf-col">
              <BracketMatch teamA={sfData[0].teamA} teamB={sfData[0].teamB} winner={sfData[0].winner} resultWinner={results['sf_1']} />
            </div>
          </div>
          <div className="connector" />
          <div className="trophy-col">
            <div className="trophy">&#127942;</div>
            <div className="champion-name">{pk['final'] || 'TBD'}</div>
            {results['final'] && pk['final'] === results['final'] && <div className="champ-correct">✓ Correct!</div>}
            {results['final'] && pk['final'] !== results['final'] && <div className="champ-wrong">✗ Wrong</div>}
            <div className="venue">30 May 2026<br />Puskas Arena<br />Budapest</div>
          </div>
          <div className="connector" />
          <div className="round">
            <div className="round-header">Semi-Finals</div>
            <div className="sf-col">
              <BracketMatch teamA={sfData[1].teamA} teamB={sfData[1].teamB} winner={sfData[1].winner} resultWinner={results['sf_2']} />
            </div>
          </div>
          <div className="connector" />
          <div className="round">
            <div className="round-header">Quarter-Finals</div>
            <div className="qf-col">
              {qfData.slice(2, 4).map((q, i) => <BracketMatch key={i} teamA={q.teamA} teamB={q.teamB} winner={q.winner} resultWinner={results['qf_' + (i + 3)]} />)}
            </div>
          </div>
          <div className="connector" />
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
      <header>
        <h1>Champions League <span>Predictions</span></h1>
        <p>2025/26 Season &mdash; Puskas Arena, Budapest</p>
      </header>

      <div className="container">
        {/* Prediction Form */}
        <section>
          <h2 className="section-title">Submit Your Predictions</h2>
          <div className="form-card">
            <div className="name-input-row">
              <label htmlFor="player-name">Your Name:</label>
              <input
                type="text" id="player-name" placeholder="Enter your name..."
                maxLength={30} value={name} onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="round-label">Round of 16 &mdash; Who advances?</div>
            <div className="matches-form">
              {R16.map(m => <PickCard key={m.id} matchId={m.id} teamA={m.home} teamB={m.away} />)}
            </div>

            <div className="round-label">Quarter-Finals</div>
            <div className="matches-form">
              {QF_SEEDS.map((pair, i) => (
                <PickCard key={i} matchId={'qf_' + (i+1)} teamA={getTeam(pair[0])} teamB={getTeam(pair[1])} />
              ))}
            </div>

            <div className="round-label">Semi-Finals</div>
            <div className="matches-form">
              {SF_SEEDS.map((pair, i) => (
                <PickCard key={i} matchId={'sf_' + (i+1)} teamA={getTeam(pair[0])} teamB={getTeam(pair[1])} />
              ))}
            </div>

            <div className="round-label">Final &mdash; Who wins it all?</div>
            <div className="matches-form">
              <PickCard matchId="final" teamA={getTeam(FINAL_SEEDS[0])} teamB={getTeam(FINAL_SEEDS[1])} />
            </div>

            <button className="submit-btn" onClick={submitPrediction}>Submit Predictions</button>
          </div>
        </section>

        {/* Leaderboard */}
        <section className="leaderboard">
          <h2 className="section-title">Leaderboard</h2>
          <table className="leaderboard-table">
            <thead>
              <tr><th>Rank</th><th>Player</th><th>R16</th><th>QF</th><th>SF</th><th>Final</th><th>Total</th></tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr><td colSpan={7} className="no-data">{loading ? 'Loading...' : 'No predictions yet. Be the first!'}</td></tr>
              ) : leaderboard.map((p, i) => (
                <tr key={p.name}>
                  <td className={i < 3 ? `rank-${i+1}` : ''}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{hasResults ? p.r16 : '-'}</td>
                  <td>{hasResults ? p.qf : '-'}</td>
                  <td>{hasResults ? p.sf : '-'}</td>
                  <td>{hasResults ? p.final : '-'}</td>
                  <td style={{ color: '#d4af37', fontWeight: 700, fontSize: '1.1rem' }}>{hasResults ? p.total : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Brackets */}
        <section>
          <h2 className="section-title">Prediction Brackets</h2>
          {predictions.length === 0 ? (
            <p className="no-data">Submit predictions to see brackets here.</p>
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
      <button className="how-to-play-btn" onClick={() => setShowModal(true)}>? How to Play</button>

      {showModal && (
        <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            <h2>How to Play</h2>
            <h3>1. Enter Your Name</h3>
            <p>Type your name and submit your picks. One submission per person.</p>
            <h3>2. Pick Who Advances</h3>
            <p>For every match from the Round of 16 to the Final, pick which team goes through. Your picks cascade automatically to the next round.</p>
            <h3>3. Scoring</h3>
            <ul>
              <li className="pts-3"><span className="badge badge-gold">3 PTS</span> <strong>Correct Champion</strong> &mdash; Pick the team that wins the Final</li>
              <li className="pts-1"><span className="badge badge-green">2 PTS</span> <strong>Correct Finalist</strong> &mdash; Pick a team that reaches the Final</li>
              <li className="pts-1"><span className="badge badge-green">1 PT</span> <strong>Correct advancement</strong> &mdash; Each correct pick in R16, QF, or SF</li>
              <li className="pts-0"><span className="badge badge-red">0 PTS</span> <strong>Wrong pick</strong> &mdash; Team gets eliminated</li>
            </ul>
            <h3>4. Win!</h3>
            <p>Most points at the end takes the crown. Good luck!</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          padding: 35px 20px; text-align: center; border-bottom: 3px solid #d4af37;
        }
        header h1 { font-size: 2.4rem; text-transform: uppercase; letter-spacing: 4px; }
        header h1 span { color: #d4af37; }
        header p { margin-top: 8px; color: #8892b0; font-size: 1rem; }

        .container { max-width: 1400px; margin: 0 auto; padding: 30px 20px; }

        .section-title {
          font-size: 1.4rem; margin-bottom: 20px; padding-bottom: 10px;
          border-bottom: 2px solid #d4af37; display: inline-block;
          text-transform: uppercase; letter-spacing: 2px;
        }

        .form-card {
          background: rgba(255,255,255,0.04); border-radius: 14px;
          padding: 25px 30px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 40px;
        }

        .name-input-row { display: flex; gap: 15px; align-items: center; margin-bottom: 25px; flex-wrap: wrap; }
        .name-input-row label { font-weight: 600; font-size: 1rem; white-space: nowrap; }
        .name-input-row input {
          flex: 1; min-width: 200px; padding: 12px 16px; border-radius: 8px;
          border: 2px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06);
          color: #fff; font-size: 1rem; outline: none; transition: border-color 0.2s;
        }
        .name-input-row input:focus { border-color: #d4af37; }

        .round-label {
          color: #d4af37; font-size: 0.85rem; text-transform: uppercase;
          letter-spacing: 2px; font-weight: 600; margin: 20px 0 15px;
        }

        .matches-form {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px; margin-bottom: 10px;
        }

        .match-pick-card {
          background: rgba(255,255,255,0.04); border-radius: 10px;
          padding: 14px 16px; border: 1px solid rgba(255,255,255,0.08);
        }

        .pick-buttons { display: flex; gap: 8px; }

        .pick-btn {
          flex: 1; padding: 12px 8px; border-radius: 8px;
          border: 2px solid rgba(255,255,255,0.12); background: transparent;
          color: #8892b0; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s; text-align: center;
        }
        .pick-btn:hover { border-color: #d4af37; color: #fff; }
        .pick-btn.selected { background: rgba(212,175,55,0.2); border-color: #d4af37; color: #d4af37; font-weight: 700; }
        .pick-btn.locked { opacity: 0.3; pointer-events: none; }

        .submit-btn {
          display: block; width: 100%; padding: 16px;
          background: linear-gradient(135deg, #d4af37, #b8962e);
          color: #0a0e1a; border: none; border-radius: 10px;
          font-size: 1.1rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 2px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 20px;
        }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 25px rgba(212,175,55,0.4); }

        .leaderboard { margin-bottom: 40px; }
        .leaderboard-table {
          width: 100%; border-collapse: collapse;
          background: rgba(255,255,255,0.04); border-radius: 12px; overflow: hidden;
        }
        .leaderboard-table thead { background: linear-gradient(90deg, #d4af37, #b8962e); color: #0a0e1a; }
        .leaderboard-table th {
          padding: 14px 18px; text-align: left; font-weight: 700;
          text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px;
        }
        .leaderboard-table td { padding: 13px 18px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .leaderboard-table tbody tr:hover { background: rgba(212,175,55,0.08); }
        .rank-1 { color: #d4af37; font-weight: 700; }
        .rank-2 { color: #c0c0c0; font-weight: 700; }
        .rank-3 { color: #cd7f32; font-weight: 700; }
        .no-data { text-align: center; color: #555; padding: 40px; font-size: 0.95rem; }

        .players-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .player-tab {
          padding: 8px 18px; border-radius: 20px; border: 2px solid rgba(255,255,255,0.15);
          background: transparent; color: #8892b0; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .player-tab:hover { border-color: #d4af37; color: #fff; }
        .player-tab.active { background: #d4af37; color: #0a0e1a; border-color: #d4af37; }

        .bracket-wrap { overflow-x: auto; padding-bottom: 10px; }
        .bracket {
          display: flex; align-items: center; min-width: 1100px;
          padding: 20px 0; justify-content: center;
        }
        .round { display: flex; flex-direction: column; justify-content: space-around; min-width: 160px; }
        .round-header {
          text-align: center; font-size: 0.7rem; color: #d4af37;
          text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin-bottom: 12px;
        }
        .bracket-match {
          background: rgba(255,255,255,0.05); border-radius: 6px;
          overflow: hidden; border: 1px solid rgba(255,255,255,0.1); margin: 6px 0;
        }
        .bracket-team {
          padding: 9px 12px; font-size: 0.82rem; font-weight: 500;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .bracket-team:last-child { border-bottom: none; }
        .bracket-team.winner { background: rgba(212,175,55,0.15); color: #d4af37; font-weight: 700; }
        .bracket-team.loser { color: #555; }
        .bracket-team .check { color: #4ecca3; font-weight: 700; }
        .bracket-team .cross { color: #e94560; font-weight: 700; }
        .connector { width: 25px; flex-shrink: 0; }
        .qf-col { display: flex; flex-direction: column; justify-content: space-around; height: 100%; gap: 50px; }
        .sf-col { display: flex; flex-direction: column; justify-content: center; height: 100%; }
        .trophy-col { text-align: center; min-width: 110px; padding: 0 10px; }
        .trophy-col .trophy { font-size: 2.8rem; }
        .trophy-col .champion-name { font-size: 1.2rem; font-weight: 700; color: #d4af37; margin-top: 8px; }
        .trophy-col .venue { font-size: 0.7rem; color: #8892b0; margin-top: 8px; line-height: 1.5; }
        .champ-correct { color: #4ecca3; font-size: 0.8rem; font-weight: 700; margin-top: 4px; }
        .champ-wrong { color: #e94560; font-size: 0.8rem; font-weight: 700; margin-top: 4px; }

        .how-to-play-btn {
          position: fixed; bottom: 25px; right: 25px;
          background: linear-gradient(135deg, #d4af37, #b8962e);
          color: #0a0e1a; border: none; padding: 15px 25px; border-radius: 50px;
          font-size: 1rem; font-weight: 700; cursor: pointer; z-index: 100;
          box-shadow: 0 4px 20px rgba(212,175,55,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
          text-transform: uppercase; letter-spacing: 1px;
        }
        .how-to-play-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 25px rgba(212,175,55,0.6); }

        .modal-overlay {
          display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8); z-index: 200;
          justify-content: center; align-items: center; padding: 20px;
        }
        .modal-overlay.active { display: flex; }
        .modal {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border-radius: 16px; padding: 35px; max-width: 550px; width: 100%;
          border: 2px solid #d4af37; position: relative; max-height: 90vh; overflow-y: auto;
        }
        .modal-close {
          position: absolute; top: 15px; right: 20px; background: none;
          border: none; color: #8892b0; font-size: 1.8rem; cursor: pointer;
        }
        .modal-close:hover { color: #fff; }
        .modal h2 { font-size: 1.5rem; margin-bottom: 20px; color: #d4af37; text-transform: uppercase; letter-spacing: 2px; }
        .modal h3 { font-size: 1.05rem; margin: 18px 0 8px; color: #fff; }
        .modal p, .modal li { color: #8892b0; line-height: 1.7; font-size: 0.95rem; }
        .modal ul { list-style: none; padding: 0; }
        .modal li { padding: 8px 0 8px 22px; position: relative; }
        .modal li::before {
          content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 10px; height: 10px; border-radius: 50%;
        }
        .modal li.pts-3::before { background: #d4af37; }
        .modal li.pts-1::before { background: #4ecca3; }
        .modal li.pts-0::before { background: #e94560; }
        .badge {
          display: inline-block; padding: 2px 10px; border-radius: 12px;
          font-weight: 700; font-size: 0.85rem; margin-right: 6px;
        }
        .badge-gold { background: #d4af37; color: #0a0e1a; }
        .badge-green { background: #4ecca3; color: #0a0e1a; }
        .badge-red { background: #e94560; color: #fff; }
        .modal strong { color: #fff; }

        @media (max-width: 768px) {
          header h1 { font-size: 1.4rem; letter-spacing: 2px; }
          .matches-form { grid-template-columns: 1fr; }
          .modal { padding: 25px; }
        }
      `}</style>
    </>
  );
}
