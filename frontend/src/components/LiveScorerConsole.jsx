import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import CricketOverStrip from './CricketOverStrip';

export default function LiveScorerConsole({
  match,
  onClose,
  onMatchUpdated,
  isOrganizer = false,
}) {
  const [currentMatch, setCurrentMatch] = useState(match);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState(match?.winnerId?._id || match?.winnerId || '');

  // Sport category normalized
  const sport = (currentMatch?.sportCategory || 'FOOTBALL').toUpperCase();

  // State for Football
  const [footballPeriod, setFootballPeriod] = useState(currentMatch?.score?.details?.period || '1st Half');
  const [footballScoreA, setFootballScoreA] = useState(Number(currentMatch?.score?.teamAScore) || 0);
  const [footballScoreB, setFootballScoreB] = useState(Number(currentMatch?.score?.teamBScore) || 0);
  const [penaltyA, setPenaltyA] = useState(currentMatch?.score?.details?.penaltyA ?? '');
  const [penaltyB, setPenaltyB] = useState(currentMatch?.score?.details?.penaltyB ?? '');

  // State for Cricket
  const [cricketInnings, setCricketInnings] = useState(Number(currentMatch?.score?.details?.currentInnings) || 1);
  const [cricketMaxOvers, setCricketMaxOvers] = useState(Number(currentMatch?.score?.details?.maxOvers) || 20);
  const [cricketTarget, setCricketTarget] = useState(
    currentMatch?.score?.details?.target !== undefined && currentMatch?.score?.details?.target !== null
      ? Number(currentMatch.score.details.target)
      : (currentMatch?.score?.details?.teamA?.runs ? Number(currentMatch.score.details.teamA.runs) + 1 : null)
  );
  const [cricketA, setCricketA] = useState({
    runs: Number(currentMatch?.score?.details?.teamA?.runs) || 0,
    wickets: Number(currentMatch?.score?.details?.teamA?.wickets) || 0,
    balls: Number(currentMatch?.score?.details?.teamA?.balls) || 0, // total legal balls bowled
  });
  const [cricketB, setCricketB] = useState({
    runs: Number(currentMatch?.score?.details?.teamB?.runs) || 0,
    wickets: Number(currentMatch?.score?.details?.teamB?.wickets) || 0,
    balls: Number(currentMatch?.score?.details?.teamB?.balls) || 0,
  });
  const [currentOverBalls, setCurrentOverBalls] = useState(currentMatch?.score?.details?.currentOverBalls || []);
  const [cricketCorrectionMode, setCricketCorrectionMode] = useState(false);
  const [cricketHistory, setCricketHistory] = useState([]);
  const [showConfirmEndInnings, setShowConfirmEndInnings] = useState(false);

  // State for Basketball
  const [basketballQuarter, setBasketballQuarter] = useState(currentMatch?.score?.details?.quarter || 'Q1');
  const [basketballScoreA, setBasketballScoreA] = useState(Number(currentMatch?.score?.teamAScore) || 0);
  const [basketballScoreB, setBasketballScoreB] = useState(Number(currentMatch?.score?.teamBScore) || 0);

  // State for Sets (Badminton / Volleyball)
  const [setsA, setSetsA] = useState(Number(currentMatch?.score?.details?.setsA) || 0);
  const [setsB, setSetsB] = useState(Number(currentMatch?.score?.details?.setsB) || 0);
  const [currentSetPointsA, setCurrentSetPointsA] = useState(Number(currentMatch?.score?.details?.currentSetPointsA) || 0);
  const [currentSetPointsB, setCurrentSetPointsB] = useState(Number(currentMatch?.score?.details?.currentSetPointsB) || 0);
  const [completedSets, setCompletedSets] = useState(currentMatch?.score?.details?.completedSets || []);

  // State for Kabaddi
  const [kabaddiHalf, setKabaddiHalf] = useState(currentMatch?.score?.details?.period || '1st Half');
  const [kabaddiA, setKabaddiA] = useState({
    raidPoints: Number(currentMatch?.score?.details?.teamA?.raidPoints) || 0,
    tacklePoints: Number(currentMatch?.score?.details?.teamA?.tacklePoints) || 0,
    allOutPoints: Number(currentMatch?.score?.details?.teamA?.allOutPoints) || 0,
    bonusPoints: Number(currentMatch?.score?.details?.teamA?.bonusPoints) || 0,
  });
  const [kabaddiB, setKabaddiB] = useState({
    raidPoints: Number(currentMatch?.score?.details?.teamB?.raidPoints) || 0,
    tacklePoints: Number(currentMatch?.score?.details?.teamB?.tacklePoints) || 0,
    allOutPoints: Number(currentMatch?.score?.details?.teamB?.allOutPoints) || 0,
    bonusPoints: Number(currentMatch?.score?.details?.teamB?.bonusPoints) || 0,
  });

  // State for Generic
  const [genericScoreA, setGenericScoreA] = useState(Number(currentMatch?.score?.teamAScore) || 0);
  const [genericScoreB, setGenericScoreB] = useState(Number(currentMatch?.score?.teamBScore) || 0);

  // Timeline events
  const [timeline, setTimeline] = useState(currentMatch?.score?.timeline || []);

  // Update auto-calculated winner based on active sport
  useEffect(() => {
    let wId = '';
    const teamAId = currentMatch.teamA?._id || currentMatch.teamA;
    const teamBId = currentMatch.teamB?._id || currentMatch.teamB;

    if (sport === 'FOOTBALL') {
      if (footballScoreA > footballScoreB) wId = teamAId;
      else if (footballScoreB > footballScoreA) wId = teamBId;
      else if (penaltyA !== '' && penaltyB !== '') {
        if (Number(penaltyA) > Number(penaltyB)) wId = teamAId;
        else if (Number(penaltyB) > Number(penaltyA)) wId = teamBId;
      }
    } else if (sport === 'CRICKET') {
      const target = cricketTarget || (cricketA.runs + 1);
      if (cricketInnings === 2) {
        if (cricketB.runs >= target) {
          wId = teamBId;
        } else if (cricketB.wickets >= 10 || cricketB.balls >= cricketMaxOvers * 6) {
          if (cricketA.runs > cricketB.runs) wId = teamAId;
          else if (cricketB.runs > cricketA.runs) wId = teamBId;
        }
      }
    } else if (sport === 'BASKETBALL') {
      if (basketballScoreA > basketballScoreB) wId = teamAId;
      else if (basketballScoreB > basketballScoreA) wId = teamBId;
    } else if (sport === 'BADMINTON' || sport === 'VOLLEYBALL') {
      if (setsA > setsB) wId = teamAId;
      else if (setsB > setsA) wId = teamBId;
    } else if (sport === 'KABADDI') {
      const totA = kabaddiA.raidPoints + kabaddiA.tacklePoints + kabaddiA.allOutPoints + kabaddiA.bonusPoints;
      const totB = kabaddiB.raidPoints + kabaddiB.tacklePoints + kabaddiB.allOutPoints + kabaddiB.bonusPoints;
      if (totA > totB) wId = teamAId;
      else if (totB > totA) wId = teamBId;
    } else {
      if (genericScoreA > genericScoreB) wId = teamAId;
      else if (genericScoreB > genericScoreA) wId = teamBId;
    }

    if (wId) {
      setSelectedWinnerId(wId);
    }
  }, [
    sport,
    footballScoreA,
    footballScoreB,
    penaltyA,
    penaltyB,
    cricketA.runs,
    cricketB.runs,
    basketballScoreA,
    basketballScoreB,
    setsA,
    setsB,
    kabaddiA,
    kabaddiB,
    genericScoreA,
    genericScoreB,
    currentMatch.teamA,
    currentMatch.teamB,
  ]);

  // Generate payload for save
  const buildScorePayload = (statusOverride) => {
    let teamAScore = '';
    let teamBScore = '';
    let resultSummary = '';
    let details = {};

    const nameA = currentMatch.teamA?.name || 'Team A';
    const nameB = currentMatch.teamB?.name || 'Team B';

    if (sport === 'FOOTBALL') {
      const pTextA = penaltyA !== '' ? ` (${penaltyA})` : '';
      const pTextB = penaltyB !== '' ? ` (${penaltyB})` : '';
      teamAScore = `${footballScoreA}${pTextA}`;
      teamBScore = `${footballScoreB}${pTextB}`;

      details = {
        period: footballPeriod,
        penaltyA: penaltyA !== '' ? Number(penaltyA) : null,
        penaltyB: penaltyB !== '' ? Number(penaltyB) : null,
      };

      if (statusOverride === 'COMPLETED' || currentMatch.status === 'COMPLETED') {
        if (penaltyA !== '' && penaltyB !== '') {
          resultSummary = `${Number(penaltyA) > Number(penaltyB) ? nameA : nameB} won ${penaltyA}-${penaltyB} on penalties (${footballScoreA}-${footballScoreB} FT)`;
        } else {
          resultSummary = `${footballScoreA > footballScoreB ? nameA : nameB} won ${Math.max(footballScoreA, footballScoreB)}-${Math.min(footballScoreA, footballScoreB)}`;
        }
      } else {
        resultSummary = `${footballPeriod} • ${nameA} ${teamAScore} - ${teamBScore} ${nameB}`;
      }
    } else if (sport === 'CRICKET') {
      const isFirstInn = cricketInnings === 1 && !cricketCorrectionMode;
      const ovA = `${Math.floor(cricketA.balls / 6)}.${cricketA.balls % 6}`;
      const ovB = `${Math.floor(cricketB.balls / 6)}.${cricketB.balls % 6}`;

      teamAScore = `${cricketA.runs}/${cricketA.wickets} (${ovA} ov)`;
      teamBScore = isFirstInn ? 'Yet to Bat' : `${cricketB.runs}/${cricketB.wickets} (${ovB} ov)`;

      const target = cricketTarget || (cricketA.runs + 1);
      const totalLegalBalls = cricketMaxOvers * 6;
      const ballsLeft = Math.max(0, totalLegalBalls - cricketB.balls);
      const runsNeeded = Math.max(0, target - cricketB.runs);

      details = {
        currentInnings: cricketInnings,
        maxOvers: cricketMaxOvers,
        target: target,
        currentOverBalls: currentOverBalls,
        teamA: { ...cricketA, oversFormatted: ovA },
        teamB: { ...cricketB, oversFormatted: ovB },
      };

      if (statusOverride === 'COMPLETED' || currentMatch.status === 'COMPLETED') {
        if (cricketB.runs >= target) {
          resultSummary = `${nameB} won by ${10 - cricketB.wickets} wickets`;
        } else if (cricketA.runs > cricketB.runs) {
          resultSummary = `${nameA} won by ${cricketA.runs - cricketB.runs} runs`;
        } else {
          resultSummary = `Match Tied (${cricketA.runs} runs)`;
        }
      } else {
        if (isFirstInn) {
          resultSummary = `1st Innings • ${nameA} ${cricketA.runs}/${cricketA.wickets} (${ovA}/${cricketMaxOvers} ov)`;
        } else {
          const crr = cricketB.balls > 0 ? ((cricketB.runs / cricketB.balls) * 6).toFixed(1) : '0.0';
          const rrr = ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(1) : '0.0';
          resultSummary = `${nameB} need ${runsNeeded} runs from ${ballsLeft} balls (Target: ${target} • CRR: ${crr} • RRR: ${rrr})`;
        }
      }
    } else if (sport === 'BASKETBALL') {
      teamAScore = String(basketballScoreA);
      teamBScore = String(basketballScoreB);
      details = { quarter: basketballQuarter };

      if (statusOverride === 'COMPLETED' || currentMatch.status === 'COMPLETED') {
        resultSummary = `${basketballScoreA > basketballScoreB ? nameA : nameB} won ${Math.max(basketballScoreA, basketballScoreB)} - ${Math.min(basketballScoreA, basketballScoreB)}`;
      } else {
        resultSummary = `${basketballQuarter} in progress`;
      }
    } else if (sport === 'BADMINTON' || sport === 'VOLLEYBALL') {
      const setListStr = completedSets.length > 0 ? ` [${completedSets.join(', ')}]` : '';
      teamAScore = `${setsA}${setListStr}`;
      teamBScore = `${setsB}`;

      details = {
        setsA,
        setsB,
        currentSetPointsA,
        currentSetPointsB,
        completedSets,
      };

      if (statusOverride === 'COMPLETED' || currentMatch.status === 'COMPLETED') {
        resultSummary = `${setsA > setsB ? nameA : nameB} won ${Math.max(setsA, setsB)} - ${Math.min(setsA, setsB)} sets`;
      } else {
        resultSummary = `Set ${completedSets.length + 1}: ${nameA} ${currentSetPointsA} - ${currentSetPointsB} ${nameB}`;
      }
    } else if (sport === 'KABADDI') {
      const totA = kabaddiA.raidPoints + kabaddiA.tacklePoints + kabaddiA.allOutPoints + kabaddiA.bonusPoints;
      const totB = kabaddiB.raidPoints + kabaddiB.tacklePoints + kabaddiB.allOutPoints + kabaddiB.bonusPoints;
      teamAScore = String(totA);
      teamBScore = String(totB);

      details = {
        period: kabaddiHalf,
        teamA: { ...kabaddiA, total: totA },
        teamB: { ...kabaddiB, total: totB },
      };

      if (statusOverride === 'COMPLETED' || currentMatch.status === 'COMPLETED') {
        resultSummary = `${totA > totB ? nameA : nameB} won ${Math.max(totA, totB)} - ${Math.min(totA, totB)} (Raids: ${kabaddiA.raidPoints} vs ${kabaddiB.raidPoints}, Tackles: ${kabaddiA.tacklePoints} vs ${kabaddiB.tacklePoints})`;
      } else {
        const leadTeam = totA >= totB ? nameA : nameB;
        resultSummary = `${kabaddiHalf} in progress • ${leadTeam} ${totA >= totB ? 'leads' : 'trails'} ${totA} - ${totB}`;
      }
    } else {
      teamAScore = String(genericScoreA);
      teamBScore = String(genericScoreB);
      details = {};

      if (statusOverride === 'COMPLETED' || currentMatch.status === 'COMPLETED') {
        resultSummary = `${genericScoreA > genericScoreB ? nameA : nameB} won ${Math.max(genericScoreA, genericScoreB)} - ${Math.min(genericScoreA, genericScoreB)}`;
      } else {
        resultSummary = `${nameA} ${genericScoreA} - ${genericScoreB} ${nameB}`;
      }
    }

    return {
      status: statusOverride || currentMatch.status,
      score: {
        teamAScore,
        teamBScore,
        resultSummary,
        details,
        timeline,
      },
      winnerId: statusOverride === 'COMPLETED' ? selectedWinnerId : undefined,
    };
  };

  // API Call: Update Score
  const handleSaveScore = async (statusOverride, customWinnerId) => {
    try {
      setSaving(true);
      setErrorMessage('');
      const payload = buildScorePayload(statusOverride);
      if (customWinnerId) {
        payload.winnerId = customWinnerId;
      }

      const res = await API.put(`/matches/${currentMatch._id}/score`, payload);
      setCurrentMatch(res.data.match);
      setSuccessMessage(res.data.message);
      setTimeout(() => setSuccessMessage(''), 3500);

      if (onMatchUpdated) {
        onMatchUpdated(res.data.match);
      }

      if (statusOverride === 'COMPLETED') {
        setShowEndMatchModal(false);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update live match score');
    } finally {
      setSaving(false);
    }
  };

  // Instant Auto-sync when score changes in a LIVE match
  // Pushes score updates to backend so spectators receive immediate real-time push events via SSE
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (currentMatch.status !== 'LIVE') return;

    const timer = setTimeout(async () => {
      try {
        const payload = buildScorePayload();
        const res = await API.put(`/matches/${currentMatch._id}/score`, payload);
        if (onMatchUpdated && res.data?.match) {
          onMatchUpdated(res.data.match);
        }
      } catch (e) {
        // Silent catch for background live auto-sync
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    cricketA,
    cricketB,
    currentOverBalls,
    footballScoreA,
    footballScoreB,
    basketballScoreA,
    basketballScoreB,
    currentSetPointsA,
    currentSetPointsB,
    setsA,
    setsB,
    kabaddiA,
    kabaddiB,
    genericScoreA,
    genericScoreB,
  ]);

  // Add Cricket Ball (Legal ball or Extra)
  const handleCricketBall = (runsToAdd, isExtra = false, isWicket = false, ballTag = '') => {
    const isTeamA = cricketInnings === 1 || cricketCorrectionMode;
    const current = isTeamA ? { ...cricketA } : { ...cricketB };

    // Snapshot history for undo
    setCricketHistory((prev) => [
      {
        innings: cricketInnings,
        cricketA: { ...cricketA },
        cricketB: { ...cricketB },
        currentOverBalls: [...currentOverBalls],
        timeline: [...timeline],
      },
      ...prev.slice(0, 30),
    ]);

    current.runs += runsToAdd;
    let ballLogged = '';

    if (!isExtra) {
      current.balls += 1;
      ballLogged = isWicket ? 'W' : String(runsToAdd);
    } else {
      ballLogged = ballTag || (runsToAdd > 1 ? `${runsToAdd}Wd` : 'Wd');
    }

    if (isWicket) {
      current.wickets = Math.min(10, current.wickets + 1);
    }

    if (isTeamA) {
      setCricketA(current);
    } else {
      setCricketB(current);
    }

    // Update current over balls strip (strictly 6 legal balls per over)
    const isExtraBall = (b) => {
      if (!b) return false;
      const s = String(b).toLowerCase();
      return s.includes('wd') || s.includes('nb');
    };

    const legalCount = currentOverBalls.filter((b) => !isExtraBall(b)).length;

    // If 6 legal balls have already been completed, start the next over fresh!
    if (legalCount >= 6) {
      setCurrentOverBalls([ballLogged]);
    } else {
      // Still in current over: append this delivery
      setCurrentOverBalls((prev) => [...prev, ballLogged]);
    }

    const teamName = isTeamA ? currentMatch.teamA?.name : currentMatch.teamB?.name;
    const eventText = isWicket
      ? `WICKET! (${teamName}) - ${current.runs}/${current.wickets}`
      : runsToAdd === 6
      ? `SIX! by ${teamName}`
      : runsToAdd === 4
      ? `FOUR! by ${teamName}`
      : isExtra
      ? `${ballTag || 'Extra'} (+${runsToAdd})`
      : `${runsToAdd} run(s) (${teamName})`;

    setTimeline((prev) => [
      { event: eventText, team: teamName, time: `${Math.floor(current.balls / 6)}.${current.balls % 6} ov` },
      ...prev.slice(0, 19),
    ]);
  };

  // Undo Last Cricket Ball
  const handleUndoCricketBall = () => {
    if (cricketHistory.length === 0) return;
    const prev = cricketHistory[0];
    setCricketHistory((h) => h.slice(1));
    setCricketA(prev.cricketA);
    setCricketB(prev.cricketB);
    setCurrentOverBalls(prev.currentOverBalls);
    setTimeline(prev.timeline);
  };

  // Complete 1st Innings and set Target
  const handleConfirmEndFirstInnings = () => {
    const target = cricketA.runs + 1;
    setCricketTarget(target);
    setCricketInnings(2);
    setCricketCorrectionMode(false);
    setCurrentOverBalls([]);
    setShowConfirmEndInnings(false);

    setTimeline((prev) => [
      {
        event: `1ST INNINGS CLOSED: ${currentMatch.teamA?.name} ${cricketA.runs}/${cricketA.wickets} in ${Math.floor(cricketA.balls / 6)}.${cricketA.balls % 6} ov. Target: ${target}`,
        team: currentMatch.teamA?.name,
        time: 'Innings Break',
      },
      ...prev,
    ]);
  };

  // End Badminton / Volleyball Set
  const handleEndSet = () => {
    if (currentSetPointsA === 0 && currentSetPointsB === 0) return;
    const setScoreStr = `${currentSetPointsA}-${currentSetPointsB}`;
    setCompletedSets((prev) => [...prev, setScoreStr]);

    if (currentSetPointsA > currentSetPointsB) {
      setSetsA((prev) => prev + 1);
    } else {
      setSetsB((prev) => prev + 1);
    }

    setCurrentSetPointsA(0);
    setCurrentSetPointsB(0);
  };

  const isCompleted = currentMatch.status === 'COMPLETED';
  const isLive = currentMatch.status === 'LIVE';

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 1300,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '840px',
          width: '95vw',
          maxHeight: '94vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: 14,
          padding: '24px 28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: 14, marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '22px' }}>⏱️</span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Live Field Scorer Console
              </h2>
              <span
                style={{
                  background: isLive ? '#fee2e2' : isCompleted ? '#dcfce7' : '#fef3c7',
                  color: isLive ? '#dc2626' : isCompleted ? '#16a34a' : '#d97706',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 12,
                  letterSpacing: '0.4px',
                }}
              >
                {isLive ? '🔴 LIVE IN PROGRESS' : isCompleted ? '✅ MATCH COMPLETED' : '📅 SCHEDULED'}
              </span>
            </div>
            <p style={{ color: '#0284c7', fontSize: '13px', fontWeight: 600, margin: '4px 0 0 0' }}>
              {currentMatch.tournamentId?.title || 'Tournament'} • {currentMatch.round} (Match #{currentMatch.matchNumber}) • 📍 {currentMatch.venue || 'Ground'}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              fontSize: '18px',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: '13px', marginBottom: 16 }}>
            ⚠️ {errorMessage}
          </div>
        )}
        {successMessage && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 14px', borderRadius: 8, fontSize: '13px', marginBottom: 16 }}>
            ✓ {successMessage}
          </div>
        )}

        {/* MAIN SCOREBOARD DISPLAY */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: 12,
            padding: '22px 24px',
            color: '#ffffff',
            marginBottom: 22,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Team A */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                {currentMatch.teamA?.name || 'Team A'}
              </h3>
              {sport === 'CRICKET' ? (
                <div style={{ fontSize: '12px', marginTop: 3 }}>
                  {cricketInnings === 1 && !cricketCorrectionMode ? (
                    <span style={{ color: '#38bdf8', fontWeight: 800, background: 'rgba(56,189,248,0.2)', padding: '2px 8px', borderRadius: 10 }}>
                      🏏 BATTING
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>
                      1st Inn: {cricketA.runs}/{cricketA.wickets} ({Math.floor(cricketA.balls / 6)}.{cricketA.balls % 6} ov)
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                  {currentMatch.teamA?.district || 'Squad'}
                </div>
              )}
            </div>

            {/* Live Score Counter */}
            <div style={{ flex: 1.2, textAlign: 'center', padding: '0 14px' }}>
              <div
                style={{
                  fontSize: sport === 'CRICKET' ? '36px' : '44px',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  color: '#38bdf8',
                  textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                {sport === 'FOOTBALL' && `${footballScoreA} - ${footballScoreB}`}
                {sport === 'CRICKET' && (
                  cricketInnings === 1 && !cricketCorrectionMode ? (
                    <div>
                      <div>{cricketA.runs}/{cricketA.wickets}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#bae6fd', letterSpacing: '0px' }}>
                        Over {Math.floor(cricketA.balls / 6)}.{cricketA.balls % 6} / {cricketMaxOvers} ov
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div>{cricketB.runs}/{cricketB.wickets}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#bae6fd', letterSpacing: '0px' }}>
                        Over {Math.floor(cricketB.balls / 6)}.{cricketB.balls % 6} / {cricketMaxOvers} ov • Target: {cricketTarget || (cricketA.runs + 1)}
                      </div>
                    </div>
                  )
                )}
                {sport === 'BASKETBALL' && `${basketballScoreA} - ${basketballScoreB}`}
                {sport === 'BADMINTON' && `${setsA} - ${setsB}`}
                {sport === 'VOLLEYBALL' && `${setsA} - ${setsB}`}
                {sport === 'KABADDI' && `${kabaddiA.raidPoints + kabaddiA.tacklePoints + kabaddiA.allOutPoints + kabaddiA.bonusPoints} - ${kabaddiB.raidPoints + kabaddiB.tacklePoints + kabaddiB.allOutPoints + kabaddiB.bonusPoints}`}
                {sport !== 'FOOTBALL' && sport !== 'CRICKET' && sport !== 'BASKETBALL' && sport !== 'BADMINTON' && sport !== 'VOLLEYBALL' && sport !== 'KABADDI' && `${genericScoreA} - ${genericScoreB}`}
              </div>

              {/* Status / Period Tag */}
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.15)',
                  padding: '3px 12px',
                  borderRadius: 20,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#e2e8f0',
                  marginTop: 6,
                }}
              >
                {sport === 'FOOTBALL' && `${footballPeriod}`}
                {sport === 'CRICKET' && (
                  cricketInnings === 1 && !cricketCorrectionMode
                    ? `1st Innings in progress • ${currentMatch.teamA?.name} batting`
                    : `2nd Innings Chase • ${currentMatch.teamB?.name} batting`
                )}
                {sport === 'BASKETBALL' && `${basketballQuarter}`}
                {sport === 'BADMINTON' && `Set ${completedSets.length + 1} (${currentSetPointsA} - ${currentSetPointsB})`}
                {sport === 'VOLLEYBALL' && `Set ${completedSets.length + 1} (${currentSetPointsA} - ${currentSetPointsB})`}
                {sport === 'KABADDI' && `${kabaddiHalf} • Raids: ${kabaddiA.raidPoints}-${kabaddiB.raidPoints}`}
                {sport !== 'FOOTBALL' && sport !== 'CRICKET' && sport !== 'BASKETBALL' && sport !== 'BADMINTON' && sport !== 'VOLLEYBALL' && sport !== 'KABADDI' && 'Match in progress'}
              </div>
            </div>

            {/* Team B */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                {currentMatch.teamB?.name || 'Team B'}
              </h3>
              {sport === 'CRICKET' ? (
                <div style={{ fontSize: '12px', marginTop: 3 }}>
                  {cricketInnings === 1 && !cricketCorrectionMode ? (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 600 }}>
                      Yet to Bat (Bowling)
                    </span>
                  ) : (
                    <span style={{ color: '#38bdf8', fontWeight: 800, background: 'rgba(56,189,248,0.2)', padding: '2px 8px', borderRadius: 10 }}>
                      🏏 BATTING (CHASING)
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                  {currentMatch.teamB?.district || 'Squad'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SPORT-SPECIFIC SCORER CONTROLS */}
        {!isCompleted ? (
          <div>
            {/* 1. FOOTBALL CONTROLS */}
            {sport === 'FOOTBALL' && (
              <div>
                {/* Period Switcher */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16 }}>
                  {['1st Half', 'Half Time', '2nd Half', 'Extra Time', 'Penalties'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setFootballPeriod(p)}
                      style={{
                        background: footballPeriod === p ? '#0284c7' : '#f1f5f9',
                        color: footballPeriod === p ? '#ffffff' : '#334155',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Dual Goal Pads */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {/* Team A Goals */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#0f172a' }}>
                      {currentMatch.teamA?.name || 'Team A'}
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                      <button
                        onClick={() => setFootballScoreA((prev) => Math.max(0, prev - 1))}
                        style={{ background: '#e2e8f0', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 800, fontSize: '16px', cursor: 'pointer' }}
                      >
                        -1
                      </button>
                      <button
                        onClick={() => {
                          setFootballScoreA((prev) => prev + 1);
                          setTimeline((prev) => [{ event: `GOAL! ${currentMatch.teamA?.name}`, team: currentMatch.teamA?.name, time: footballPeriod }, ...prev]);
                        }}
                        style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 800, fontSize: '16px', cursor: 'pointer' }}
                      >
                        ⚽ +1 Goal
                      </button>
                    </div>
                  </div>

                  {/* Team B Goals */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#0f172a' }}>
                      {currentMatch.teamB?.name || 'Team B'}
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                      <button
                        onClick={() => setFootballScoreB((prev) => Math.max(0, prev - 1))}
                        style={{ background: '#e2e8f0', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 800, fontSize: '16px', cursor: 'pointer' }}
                      >
                        -1
                      </button>
                      <button
                        onClick={() => {
                          setFootballScoreB((prev) => prev + 1);
                          setTimeline((prev) => [{ event: `GOAL! ${currentMatch.teamB?.name}`, team: currentMatch.teamB?.name, time: footballPeriod }, ...prev]);
                        }}
                        style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 800, fontSize: '16px', cursor: 'pointer' }}
                      >
                        ⚽ +1 Goal
                      </button>
                    </div>
                  </div>
                </div>

                {/* Penalty Shootout section if draw */}
                {(footballPeriod === 'Penalties' || footballScoreA === footballScoreB) && (
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>
                      🥅 Penalty Shootout Decider (If scores tied at Full Time):
                    </div>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{currentMatch.teamA?.name} Penalties:</span>
                        <input
                          type="number"
                          min="0"
                          value={penaltyA}
                          onChange={(e) => setPenaltyA(e.target.value)}
                          style={{ width: '60px', padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{currentMatch.teamB?.name} Penalties:</span>
                        <input
                          type="number"
                          min="0"
                          value={penaltyB}
                          onChange={(e) => setPenaltyB(e.target.value)}
                          style={{ width: '60px', padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. CRICKET CONTROLS */}
            {sport === 'CRICKET' && (
              <div>
                {/* INNINGS HEADER & INFORMATION BANNER */}
                <div
                  style={{
                    background: cricketInnings === 1 && !cricketCorrectionMode ? '#f0f9ff' : '#f5f3ff',
                    border: cricketInnings === 1 && !cricketCorrectionMode ? '1.5px solid #bae6fd' : '1.5px solid #ddd6fe',
                    borderRadius: 10,
                    padding: '14px 18px',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <span
                        style={{
                          background: cricketInnings === 1 && !cricketCorrectionMode ? '#0284c7' : '#7c3aed',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 14,
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {cricketCorrectionMode
                          ? '⚠️ CORRECTION MODE: EDITING 1ST INNINGS'
                          : cricketInnings === 1
                          ? '🏏 1ST INNINGS IN PROGRESS'
                          : '🎯 2ND INNINGS (CHASE)'}
                      </span>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px 0' }}>
                        Batting:{' '}
                        <span style={{ color: '#0284c7' }}>
                          {cricketInnings === 1 || cricketCorrectionMode
                            ? currentMatch.teamA?.name
                            : currentMatch.teamB?.name}
                        </span>
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginLeft: 10 }}>
                          (Bowling:{' '}
                          {cricketInnings === 1 || cricketCorrectionMode
                            ? currentMatch.teamB?.name
                            : currentMatch.teamA?.name}
                          )
                        </span>
                      </h3>
                      <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
                        {cricketInnings === 1 && !cricketCorrectionMode
                          ? `Only ${currentMatch.teamA?.name} can score runs in 1st Innings. ${currentMatch.teamB?.name} is yet to bat.`
                          : `Chasing Target of ${cricketTarget || (cricketA.runs + 1)} runs. 1st Innings: ${currentMatch.teamA?.name} scored ${cricketA.runs}/${cricketA.wickets} (${Math.floor(cricketA.balls / 6)}.${cricketA.balls % 6} ov).`}
                      </p>
                    </div>

                    {/* Controls & Over Modifier Toggle */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {cricketInnings === 2 && (
                        <button
                          onClick={() => setCricketCorrectionMode(!cricketCorrectionMode)}
                          style={{
                            background: cricketCorrectionMode ? '#fee2e2' : '#f1f5f9',
                            color: cricketCorrectionMode ? '#dc2626' : '#475569',
                            border: '1px solid #cbd5e1',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {cricketCorrectionMode ? '✓ Return to 2nd Innings' : '✏️ Correct 1st Innings'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2nd Innings Equation Bar */}
                  {cricketInnings === 2 && !cricketCorrectionMode && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: '1px solid #ddd6fe',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#6d28d9' }}>
                        🎯 Target: {cricketTarget || (cricketA.runs + 1)} runs
                      </div>
                      <div style={{ fontSize: '13px', color: '#475569', fontWeight: 700 }}>
                        {(() => {
                          const target = cricketTarget || (cricketA.runs + 1);
                          const totalLegalBalls = cricketMaxOvers * 6;
                          const ballsLeft = Math.max(0, totalLegalBalls - cricketB.balls);
                          const runsNeeded = Math.max(0, target - cricketB.runs);
                          const crr = cricketB.balls > 0 ? ((cricketB.runs / cricketB.balls) * 6).toFixed(1) : '0.0';
                          const rrr = ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(1) : '0.0';

                          if (cricketB.runs >= target) {
                            return (
                              <span style={{ color: '#16a34a' }}>
                                🎉 Target achieved! {currentMatch.teamB?.name} won by {10 - cricketB.wickets} wickets
                              </span>
                            );
                          }
                          if (cricketB.wickets >= 10 || ballsLeft === 0) {
                            return (
                              <span style={{ color: '#dc2626' }}>
                                Innings finished! {currentMatch.teamA?.name} won by {target - 1 - cricketB.runs} runs
                              </span>
                            );
                          }
                          return (
                            <span>
                              Need <strong style={{ color: '#dc2626' }}>{runsNeeded} runs</strong> in{' '}
                              <strong style={{ color: '#0f172a' }}>{ballsLeft} balls</strong> (CRR: {crr} • RRR: {rrr})
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* BALL-BY-BALL KEYPAD & CURRENT OVER STRIP */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  {/* Current Over Strip & Undo */}
                  {(() => {
                    const isTeamA = cricketInnings === 1 || cricketCorrectionMode;
                    const activeState = isTeamA ? cricketA : cricketB;
                    const completedOvers = Math.floor(activeState.balls / 6);
                    const ballsInOver = activeState.balls % 6;

                    const isExtra = (b) => {
                      if (!b) return false;
                      const s = String(b).toLowerCase();
                      return s.includes('wd') || s.includes('nb');
                    };
                    const legalInStrip = currentOverBalls.filter((b) => !isExtra(b)).length;
                    const isOverCompleted = legalInStrip >= 6;
                    const currentOverNumber = isOverCompleted ? (completedOvers || 1) : completedOvers + 1;

                    return (
                      <div
                        style={{
                          marginBottom: 16,
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          padding: '16px 20px',
                          boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <h4 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                              Over {currentOverNumber}
                            </h4>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: isOverCompleted ? '#16a34a' : '#64748b' }}>
                              {isOverCompleted
                                ? '(Over Completed • 6/6 balls)'
                                : `(${legalInStrip}/6 balls bowled • Max ${cricketMaxOvers} ov)`}
                            </span>
                          </div>

                          <button
                            onClick={handleUndoCricketBall}
                            disabled={cricketHistory.length === 0}
                            style={{
                              background: cricketHistory.length === 0 ? '#f1f5f9' : '#fee2e2',
                              color: cricketHistory.length === 0 ? '#94a3b8' : '#b91c1c',
                              border: '1px solid #fecaca',
                              padding: '5px 12px',
                              borderRadius: 6,
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: cricketHistory.length === 0 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <span>↺</span> Undo Last Ball
                          </button>
                        </div>

                        {/* 6 Individual Ball Boxes in a Single Row */}
                        <CricketOverStrip
                          balls={currentOverBalls}
                          overNumber={currentOverNumber}
                          showTitle={false}
                          isOverCompleted={isOverCompleted}
                        />
                      </div>
                    );
                  })()}

                  {/* Main Runs Keypad */}
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>
                    Record Ball Outcome:
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {[0, 1, 2, 3].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleCricketBall(r, false, false)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          padding: '10px 18px',
                          borderRadius: 8,
                          fontWeight: 800,
                          fontSize: '15px',
                          cursor: 'pointer',
                          minWidth: '54px',
                        }}
                      >
                        {r === 0 ? '• 0' : `+${r}`}
                      </button>
                    ))}
                    <button
                      onClick={() => handleCricketBall(4, false, false)}
                      style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}
                    >
                      🎯 4 (FOUR)
                    </button>
                    <button
                      onClick={() => handleCricketBall(6, false, false)}
                      style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}
                    >
                      🚀 6 (SIX)
                    </button>
                    <button
                      onClick={() => handleCricketBall(0, false, true)}
                      style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}
                    >
                      🔴 WICKET
                    </button>
                  </div>

                  {/* Extras Keypad (Wide, No Ball, Bye, Leg Bye) */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleCricketBall(1, true, false, 'Wd')}
                      style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '7px 14px', borderRadius: 6, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      +1 Wide (Wd)
                    </button>
                    <button
                      onClick={() => handleCricketBall(1, true, false, 'Nb')}
                      style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '7px 14px', borderRadius: 6, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      +1 No Ball (Nb)
                    </button>
                    <button
                      onClick={() => handleCricketBall(1, false, false, 'Lb')}
                      style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: 6, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      +1 Leg Bye (Lb)
                    </button>
                    <button
                      onClick={() => handleCricketBall(1, false, false, 'B')}
                      style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: 6, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      +1 Bye (B)
                    </button>
                  </div>
                </div>

                {/* END 1ST INNINGS BUTTON */}
                {cricketInnings === 1 && !cricketCorrectionMode && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Ready for 2nd Innings?</span>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                        Click when {cricketMaxOvers} overs are completed or all 10 wickets have fallen. Target: <strong>{cricketA.runs + 1} runs</strong>.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowConfirmEndInnings(true)}
                      style={{
                        background: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>🏁</span> End 1st Innings & Set Target
                    </button>
                  </div>
                )}

                {/* MODAL: CONFIRM END OF 1ST INNINGS */}
                {showConfirmEndInnings && (
                  <div className="modal-overlay" style={{ zIndex: 1400 }}>
                    <div className="modal-content" style={{ maxWidth: '480px', padding: 24, textAlign: 'center', background: '#ffffff', borderRadius: 12 }}>
                      <div style={{ fontSize: '36px', marginBottom: 8 }}>🏁</div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
                        Confirm End of 1st Innings
                      </h3>
                      <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                          {currentMatch.teamA?.name}: <span style={{ color: '#0284c7' }}>{cricketA.runs}/{cricketA.wickets}</span> ({Math.floor(cricketA.balls / 6)}.{cricketA.balls % 6} ov)
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#16a34a', marginTop: 8 }}>
                          🎯 Target for {currentMatch.teamB?.name}: {cricketA.runs + 1} runs in {cricketMaxOvers} overs
                        </div>
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: 20 }}>
                        Once confirmed, {currentMatch.teamA?.name}'s 1st innings will be locked, and {currentMatch.teamB?.name} will begin batting in the 2nd Innings chase.
                      </p>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button
                          onClick={() => setShowConfirmEndInnings(false)}
                          style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 18px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmEndFirstInnings}
                          style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
                        >
                          Confirm & Start 2nd Innings →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. BASKETBALL CONTROLS */}
            {sport === 'BASKETBALL' && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {['Q1', 'Q2', 'Q3', 'Q4', 'OT'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setBasketballQuarter(q)}
                      style={{
                        background: basketballQuarter === q ? '#0284c7' : '#f1f5f9',
                        color: basketballQuarter === q ? '#fff' : '#334155',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {/* Team A */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{currentMatch.teamA?.name}</h4>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => setBasketballScoreA((p) => p + 1)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 800 }}>+1 FT</button>
                      <button onClick={() => setBasketballScoreA((p) => p + 2)} style={{ padding: '8px 12px', borderRadius: 6, background: '#0284c7', color: '#fff', border: 'none', fontWeight: 800 }}>+2 FG</button>
                      <button onClick={() => setBasketballScoreA((p) => p + 3)} style={{ padding: '8px 12px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 800 }}>+3 3PT</button>
                      <button onClick={() => setBasketballScoreA((p) => Math.max(0, p - 1))} style={{ padding: '8px 10px', borderRadius: 6, background: '#e2e8f0', border: 'none', fontWeight: 800 }}>-1</button>
                    </div>
                  </div>

                  {/* Team B */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{currentMatch.teamB?.name}</h4>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => setBasketballScoreB((p) => p + 1)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 800 }}>+1 FT</button>
                      <button onClick={() => setBasketballScoreB((p) => p + 2)} style={{ padding: '8px 12px', borderRadius: 6, background: '#0284c7', color: '#fff', border: 'none', fontWeight: 800 }}>+2 FG</button>
                      <button onClick={() => setBasketballScoreB((p) => p + 3)} style={{ padding: '8px 12px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 800 }}>+3 3PT</button>
                      <button onClick={() => setBasketballScoreB((p) => Math.max(0, p - 1))} style={{ padding: '8px 10px', borderRadius: 6, background: '#e2e8f0', border: 'none', fontWeight: 800 }}>-1</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. SETS (BADMINTON / VOLLEYBALL) */}
            {(sport === 'BADMINTON' || sport === 'VOLLEYBALL') && (
              <div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                      Current Set {completedSets.length + 1} Points:
                    </span>
                    <button
                      onClick={handleEndSet}
                      style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      ✓ Complete Set {completedSets.length + 1}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{currentMatch.teamA?.name}</div>
                      <div style={{ fontSize: '28px', fontWeight: 800, margin: '6px 0', color: '#0284c7' }}>{currentSetPointsA}</div>
                      <button onClick={() => setCurrentSetPointsA((p) => p + 1)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, fontWeight: 800 }}>+1 Pt</button>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{currentMatch.teamB?.name}</div>
                      <div style={{ fontSize: '28px', fontWeight: 800, margin: '6px 0', color: '#0284c7' }}>{currentSetPointsB}</div>
                      <button onClick={() => setCurrentSetPointsB((p) => p + 1)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, fontWeight: 800 }}>+1 Pt</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. KABADDI CONTROLS */}
            {sport === 'KABADDI' && (
              <div>
                {/* Half Selector */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {['1st Half (20m)', 'Half Time', '2nd Half (20m)', 'Extra Time'].map((h) => (
                    <button
                      key={h}
                      onClick={() => setKabaddiHalf(h)}
                      style={{
                        background: kabaddiHalf === h ? '#0284c7' : '#f1f5f9',
                        color: kabaddiHalf === h ? '#fff' : '#334155',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {h}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {/* Team A Kabaddi Keypad */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>{currentMatch.teamA?.name}</h4>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7' }}>
                        Total: {kabaddiA.raidPoints + kabaddiA.tacklePoints + kabaddiA.allOutPoints + kabaddiA.bonusPoints} pts
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 8, fontWeight: 600 }}>
                      Raids: {kabaddiA.raidPoints} | Tackles: {kabaddiA.tacklePoints} | All-Outs: {kabaddiA.allOutPoints} | Bonus: {kabaddiA.bonusPoints}
                    </div>

                    {/* Raid Buttons */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 4 }}>RAID POINTS:</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setKabaddiA((p) => ({ ...p, raidPoints: p.raidPoints + 1 }));
                            setTimeline((t) => [{ event: `Touch Point (+1 Raid) - ${currentMatch.teamA?.name}`, team: currentMatch.teamA?.name, time: kabaddiHalf }, ...t]);
                          }}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 6, background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                        >
                          +1 Touch
                        </button>
                        <button
                          onClick={() => {
                            setKabaddiA((p) => ({ ...p, raidPoints: p.raidPoints + 2 }));
                            setTimeline((t) => [{ event: `2-Pt Raid - ${currentMatch.teamA?.name}`, team: currentMatch.teamA?.name, time: kabaddiHalf }, ...t]);
                          }}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 6, background: '#bae6fd', border: 'none', color: '#0369a1', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                        >
                          +2 Raid
                        </button>
                        <button
                          onClick={() => {
                            setKabaddiA((p) => ({ ...p, raidPoints: p.raidPoints + 3 }));
                            setTimeline((t) => [{ event: `SUPER RAID (+3) - ${currentMatch.teamA?.name}`, team: currentMatch.teamA?.name, time: kabaddiHalf }, ...t]);
                          }}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 6, background: '#7c3aed', border: 'none', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                        >
                          ⚡ +3 Super
                        </button>
                      </div>
                    </div>

                    {/* Tackle & All-Out Buttons */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 4 }}>DEFENSE & ALL-OUT:</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setKabaddiA((p) => ({ ...p, tacklePoints: p.tacklePoints + 1 }));
                            setTimeline((t) => [{ event: `Tackle Point (+1) - ${currentMatch.teamA?.name}`, team: currentMatch.teamA?.name, time: kabaddiHalf }, ...t]);
                          }}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 6, background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                        >
                          🛡️ +1 Tackle
                        </button>
                        <button
                          onClick={() => {
                            setKabaddiA((p) => ({ ...p, tacklePoints: p.tacklePoints + 2 }));
                            setTimeline((t) => [{ event: `SUPER TACKLE (+2) - ${currentMatch.teamA?.name}`, team: currentMatch.teamA?.name, time: kabaddiHalf }, ...t]);
                          }}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 6, background: '#16a34a', border: 'none', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                        >
                          🛡️ +2 Super
                        </button>
                        <button
                          onClick={() => {
                            setKabaddiA((p) => ({ ...p, allOutPoints: p.allOutPoints + 2 }));
                            setTimeline((t) => [{ event: `ALL-OUT (+2 bonus) inflicted by ${currentMatch.teamA?.name}`, team: currentMatch.teamA?.name, time: kabaddiHalf }, ...t]);
                          }}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 6, background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                        >
                          💥 +2 All-Out
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Team B Kabaddi Keypad */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>{currentMatch.teamB?.name}</h4>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7' }}>
                        Total: {kabaddiB.raidPoints + kabaddiB.tacklePoints + kabaddiB.allOutPoints + kabaddiB.bonusPoints} pts
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 8, fontWeight: 600 }}>
                      Raids: {kabaddiB.raidPoints} | Tackles: {kabaddiB.tacklePoints} | All-Outs: {kabaddiB.allOutPoints} | Bonus: {kabaddiB.bonusPoints}
                    </div>

                    {/* Raid Buttons */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 4 }}>RAID POINTS:</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setKabaddiB((p) => ({ ...p, raidPoints: p.raidPoints + 1 }));
                            setTimeline((t) => [{ event: `Touch Point (+1 Raid) - ${currentMatch.teamB?.name}`, team: currentMatch.teamB?.name, time: kabaddiHalf }, ...t]);
                          }}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 6, background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                        >
                          +1 Touch
                        </button>
                        <button
                          onClick={() => {
                            setKabaddiB((p) => ({ ...p, raidPoints: p.raidPoints + 2 }));
                            setTimeline((t) => [{ event: `2-Pt Raid - ${currentMatch.teamB?.name}`, team: currentMatch.teamB?.name, time: kabaddiHalf }, ...t]);
                          }}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 6, background: '#bae6fd', border: 'none', color: '#0369a1', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                        >
                          +2 Raid
                        </button>
                        <button
                          onClick={() => {
                            setKabaddiB((p) => ({ ...p, raidPoints: p.raidPoints + 3 }));
                            setTimeline((t) => [{ event: `SUPER RAID (+3) - ${currentMatch.teamB?.name}`, team: currentMatch.teamB?.name, time: kabaddiHalf }, ...t]);
                          }}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 6, background: '#7c3aed', border: 'none', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                        >
                          ⚡ +3 Super
                        </button>
                      </div>
                    </div>

                    {/* Tackle & All-Out Buttons */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 4 }}>DEFENSE & ALL-OUT:</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setKabaddiB((p) => ({ ...p, tacklePoints: p.tacklePoints + 1 }));
                            setTimeline((t) => [{ event: `Tackle Point (+1) - ${currentMatch.teamB?.name}`, team: currentMatch.teamB?.name, time: kabaddiHalf }, ...t]);
                          }}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 6, background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                        >
                          🛡️ +1 Tackle
                        </button>
                        <button
                          onClick={() => {
                            setKabaddiB((p) => ({ ...p, tacklePoints: p.tacklePoints + 2 }));
                            setTimeline((t) => [{ event: `SUPER TACKLE (+2) - ${currentMatch.teamB?.name}`, team: currentMatch.teamB?.name, time: kabaddiHalf }, ...t]);
                          }}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 6, background: '#16a34a', border: 'none', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                        >
                          🛡️ +2 Super
                        </button>
                        <button
                          onClick={() => {
                            setKabaddiB((p) => ({ ...p, allOutPoints: p.allOutPoints + 2 }));
                            setTimeline((t) => [{ event: `ALL-OUT (+2 bonus) inflicted by ${currentMatch.teamB?.name}`, team: currentMatch.teamB?.name, time: kabaddiHalf }, ...t]);
                          }}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 6, background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                        >
                          💥 +2 All-Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. GENERIC / OTHER SPORTS */}
            {sport !== 'FOOTBALL' && sport !== 'CRICKET' && sport !== 'BASKETBALL' && sport !== 'BADMINTON' && sport !== 'VOLLEYBALL' && sport !== 'KABADDI' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>{currentMatch.teamA?.name}</h4>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={() => setGenericScoreA((p) => p + 1)} style={{ background: '#0284c7', color: '#fff', padding: '10px 18px', borderRadius: 6, fontWeight: 800 }}>+1</button>
                    <button onClick={() => setGenericScoreA((p) => p + 2)} style={{ background: '#0284c7', color: '#fff', padding: '10px 18px', borderRadius: 6, fontWeight: 800 }}>+2</button>
                    <button onClick={() => setGenericScoreA((p) => Math.max(0, p - 1))} style={{ background: '#e2e8f0', padding: '10px 14px', borderRadius: 6, fontWeight: 800 }}>-1</button>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>{currentMatch.teamB?.name}</h4>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={() => setGenericScoreB((p) => p + 1)} style={{ background: '#0284c7', color: '#fff', padding: '10px 18px', borderRadius: 6, fontWeight: 800 }}>+1</button>
                    <button onClick={() => setGenericScoreB((p) => p + 2)} style={{ background: '#0284c7', color: '#fff', padding: '10px 18px', borderRadius: 6, fontWeight: 800 }}>+2</button>
                    <button onClick={() => setGenericScoreB((p) => Math.max(0, p - 1))} style={{ background: '#e2e8f0', padding: '10px 14px', borderRadius: 6, fontWeight: 800 }}>-1</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* COMPLETED MATCH SUMMARY */
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '20px', textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: '36px' }}>🏆</span>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#166534', margin: '8px 0 4px 0' }}>
              Official Match Result Finalized
            </h3>
            <p style={{ fontSize: '14px', color: '#15803d', margin: 0 }}>
              {currentMatch.score?.resultSummary || 'Winner decided'}
            </p>
            <div style={{ marginTop: 10, display: 'inline-block', background: '#dcfce7', padding: '4px 14px', borderRadius: 20, fontSize: '12px', fontWeight: 700, color: '#166534' }}>
              ✓ Winner Advanced into Knockout Bracket Tree
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            {!isLive && !isCompleted && (
              <button
                onClick={() => handleSaveScore('LIVE')}
                disabled={saving}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                🔴 Start Match (Go LIVE)
              </button>
            )}

            {isLive && (
              <button
                onClick={() => handleSaveScore('LIVE')}
                disabled={saving}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Syncing...' : '💾 Sync / Save Live Score'}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {!isCompleted && (
              <button
                onClick={() => setShowEndMatchModal(true)}
                disabled={saving}
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 22px',
                  borderRadius: 6,
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                🏆 End Match & Advance Winner
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '9px 18px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* CONFIRM END MATCH & ADVANCE WINNER MODAL */}
        {showEndMatchModal && (
          <div
            className="modal-overlay"
            style={{
              zIndex: 1400,
              backgroundColor: 'rgba(0,0,0,0.6)',
            }}
          >
            <div
              className="modal-content"
              style={{
                maxWidth: '500px',
                background: '#ffffff',
                borderRadius: 12,
                padding: '24px',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
                🏆 Finalize Match & Advance Winner
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                Ending this match will record official scores and <strong>propel the winning squad directly into the next round</strong> of the single-elimination tournament bracket tree.
              </p>

              {/* Winner Selector */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Select Victorious Squad:
                </label>
                <select
                  value={selectedWinnerId}
                  onChange={(e) => setSelectedWinnerId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                >
                  <option value="">-- Choose Winning Squad --</option>
                  {currentMatch.teamA && (
                    <option value={currentMatch.teamA._id || currentMatch.teamA}>
                      {currentMatch.teamA.name || 'Team A'}
                    </option>
                  )}
                  {currentMatch.teamB && (
                    <option value={currentMatch.teamB._id || currentMatch.teamB}>
                      {currentMatch.teamB.name || 'Team B'}
                    </option>
                  )}
                </select>
              </div>

              {/* Bracket destination reminder */}
              {currentMatch.nextMatchId ? (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px 14px', borderRadius: 6, fontSize: '12px', color: '#0369a1', marginBottom: 20 }}>
                  ⚡ The winner will immediately be seeded into the next round match slot in the tournament bracket tree.
                </div>
              ) : (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: 6, fontSize: '12px', color: '#92400e', marginBottom: 20 }}>
                  🥇 This is the Final Championship Match! The selected squad will be crowned Tournament Champion.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEndMatchModal(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedWinnerId || saving}
                  onClick={() => handleSaveScore('COMPLETED', selectedWinnerId)}
                  style={{
                    background: selectedWinnerId ? '#16a34a' : '#cbd5e1',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 22px',
                    borderRadius: 6,
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: selectedWinnerId && !saving ? 'pointer' : 'not-allowed',
                  }}
                >
                  {saving ? 'Finalizing...' : 'Confirm Winner & Advance'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
