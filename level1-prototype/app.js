const Mode = {
  INTRO: 'INTRO',
  LEARN_YES: 'LEARN_YES',
  LEARN_NO: 'LEARN_NO',
  QUIZ: 'QUIZ'
};

const Sign = {
  YES: 'YES',
  NO: 'NO'
};

const state = {
  mode: Mode.INTRO,
  targetSign: null,
  captionsEnabled: true,
  quizIndex: 0,
  quiz: [
    { text: 'Is the sun brighter than the moon?', answer: Sign.YES },
    { text: 'Do rabbits have wings?', answer: Sign.NO },
    { text: 'Is water wet?', answer: Sign.YES },
    { text: 'Do fish live on trees?', answer: Sign.NO }
  ],
  score: {
    streak: 0,
    correct: 0,
    wrong: 0
  },
  matchHoldMs: 0,
  lastFrameTs: null,
  lastWrist: null
};

const els = {
  video: document.getElementById('video'),
  overlay: document.getElementById('overlay'),
  modeTitle: document.getElementById('modeTitle'),
  modeHint: document.getElementById('modeHint'),
  questionText: document.getElementById('questionText'),
  statusText: document.getElementById('statusText'),
  captionsToggle: document.getElementById('captionsToggle'),
  startBtn: document.getElementById('startBtn'),
  resetBtn: document.getElementById('resetBtn'),
  cameraNote: document.getElementById('cameraNote'),
  streak: document.getElementById('streak'),
  correct: document.getElementById('correct'),
  wrong: document.getElementById('wrong'),
  barHandshape: document.getElementById('barHandshape'),
  barLocation: document.getElementById('barLocation'),
  barOrientation: document.getElementById('barOrientation'),
  barMovement: document.getElementById('barMovement'),
  badgeHandshape: document.getElementById('badgeHandshape'),
  badgeLocation: document.getElementById('badgeLocation'),
  badgeOrientation: document.getElementById('badgeOrientation'),
  badgeMovement: document.getElementById('badgeMovement')
};

function setMode(mode) {
  state.mode = mode;
  state.matchHoldMs = 0;
  state.lastFrameTs = null;

  if (mode === Mode.INTRO) {
    state.targetSign = null;
    els.modeTitle.textContent = 'Ready';
    els.modeHint.textContent = 'Press Start to enable the camera and begin learning YES/NO.';
    els.questionText.textContent = els.captionsToggle.checked ? 'Camera requires HTTPS (or localhost).' : '';
    els.statusText.textContent = '';
    els.startBtn.disabled = false;
    return;
  }

  if (mode === Mode.LEARN_YES) {
    state.targetSign = Sign.YES;
    els.modeTitle.textContent = 'Learn: YES';
    els.modeHint.textContent = 'Make a YES (thumbs-up fist) in the center of the frame and hold it steady.';
    els.statusText.textContent = '';
    els.questionText.textContent = els.captionsToggle.checked ? 'Try signing: YES' : '';
    return;
  }

  if (mode === Mode.LEARN_NO) {
    state.targetSign = Sign.NO;
    els.modeTitle.textContent = 'Learn: NO';
    els.modeHint.textContent = 'Make a NO handshape (index + middle up) in the center of the frame and hold it steady.';
    els.statusText.textContent = '';
    els.questionText.textContent = els.captionsToggle.checked ? 'Try signing: NO' : '';
    return;
  }

  if (mode === Mode.QUIZ) {
    state.targetSign = null;
    state.quizIndex = 0;
    els.modeTitle.textContent = 'Quiz Show';
    els.modeHint.textContent = 'Answer each question by signing YES or NO. Hold your answer steady to lock it in.';
    els.statusText.textContent = '';
    renderQuizQuestion();
  }
}

function renderQuizQuestion() {
  const q = state.quiz[state.quizIndex];
  if (!q) {
    els.questionText.textContent = els.captionsToggle.checked ? 'Calibration complete. Reset to try again.' : '';
    els.statusText.textContent = 'Done.';
    return;
  }
  els.questionText.textContent = els.captionsToggle.checked ? q.text : '';
  els.statusText.textContent = 'Sign YES or NO.';
}

function updateScoreUI() {
  els.streak.textContent = String(state.score.streak);
  els.correct.textContent = String(state.score.correct);
  els.wrong.textContent = String(state.score.wrong);
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function scoreToBadge(score) {
  if (score >= 0.8) return { text: 'Green', cls: 'good' };
  if (score >= 0.55) return { text: 'Yellow', cls: 'warn' };
  return { text: 'Red', cls: 'bad' };
}

function applyMeter(elBar, elBadge, score) {
  const pct = Math.round(score * 100);
  elBar.style.width = pct + '%';
  const b = scoreToBadge(score);
  elBadge.textContent = `${b.text} ${pct}%`;
  elBadge.style.color = b.cls === 'good' ? 'var(--good)' : b.cls === 'warn' ? 'var(--warn)' : 'var(--bad)';
  elBar.style.background = b.cls === 'good' ? 'var(--good)' : b.cls === 'warn' ? 'var(--warn)' : 'var(--bad)';
}

function distance2(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
}

function normalize(v) {
  const m = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
  return { x: v.x / m, y: v.y / m, z: v.z / m };
}

function fingerExtended(landmarks, tipIdx, pipIdx, mcpIdx) {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];
  if (!tip || !pip || !mcp) return false;
  return tip.y < pip.y;
}

function thumbExtended(landmarks) {
  const tip = landmarks[4];
  const ip = landmarks[3];
  const mcp = landmarks[2];
  if (!tip || !ip || !mcp) return false;
  return distance2(tip, mcp) > distance2(ip, mcp);
}

function getFeatures(landmarks) {
  const fingers = {
    thumb: thumbExtended(landmarks),
    index: fingerExtended(landmarks, 8, 6, 5),
    middle: fingerExtended(landmarks, 12, 10, 9),
    ring: fingerExtended(landmarks, 16, 14, 13),
    pinky: fingerExtended(landmarks, 20, 18, 17)
  };

  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];

  let orientationScore = 0.5;
  if (wrist && indexMcp && middleMcp) {
    const v1 = sub(indexMcp, wrist);
    const v2 = sub(middleMcp, wrist);
    const n = normalize(cross(v1, v2));
    orientationScore = clamp01((-n.z + 0.2) / 0.7);
  }

  const center = { x: 0.5, y: 0.55 };
  let locationScore = 0;
  if (wrist) {
    const d = distance2(wrist, center);
    locationScore = clamp01(1 - d / 0.35);
  }

  let movementScore = 0;
  if (wrist && state.lastWrist) {
    const d = distance2(wrist, state.lastWrist);
    movementScore = clamp01(1 - d / 0.03);
  } else {
    movementScore = 0.5;
  }

  return { fingers, orientationScore, locationScore, movementScore, wrist };
}

function handshapeScoreFor(sign, fingers) {
  if (sign === Sign.YES) {
    const desired = {
      thumb: true,
      index: false,
      middle: false,
      ring: false,
      pinky: false
    };
    const keys = Object.keys(desired);
    const score = keys.reduce((acc, k) => acc + (fingers[k] === desired[k] ? 1 : 0), 0) / keys.length;
    return score;
  }

  if (sign === Sign.NO) {
    const desired = {
      index: true,
      middle: true,
      ring: false,
      pinky: false
    };
    const keys = Object.keys(desired);
    const score = keys.reduce((acc, k) => acc + (fingers[k] === desired[k] ? 1 : 0), 0) / keys.length;
    return score;
  }

  return 0;
}

function classifyYesNo(features) {
  const yesHand = handshapeScoreFor(Sign.YES, features.fingers);
  const noHand = handshapeScoreFor(Sign.NO, features.fingers);

  const common = (features.locationScore + features.orientationScore + features.movementScore) / 3;

  const yesScore = (yesHand * 0.55) + (common * 0.45);
  const noScore = (noHand * 0.55) + (common * 0.45);

  if (yesScore >= 0.75 && yesScore > noScore + 0.08) return { sign: Sign.YES, confidence: yesScore };
  if (noScore >= 0.75 && noScore > yesScore + 0.08) return { sign: Sign.NO, confidence: noScore };
  return { sign: null, confidence: Math.max(yesScore, noScore) };
}

function isTargetSatisfied(targetSign, detectedSign) {
  if (!targetSign) return false;
  return detectedSign === targetSign;
}

function onRecognizedCorrect() {
  if (state.mode === Mode.LEARN_YES) {
    els.statusText.textContent = 'Nice. YES recognized.';
    setTimeout(() => setMode(Mode.LEARN_NO), 600);
    return;
  }

  if (state.mode === Mode.LEARN_NO) {
    els.statusText.textContent = 'Nice. NO recognized.';
    setTimeout(() => setMode(Mode.QUIZ), 600);
    return;
  }
}

function onQuizAnswer(answerSign) {
  const q = state.quiz[state.quizIndex];
  if (!q) return;

  if (answerSign === q.answer) {
    state.score.correct += 1;
    state.score.streak += 1;
    els.statusText.textContent = 'Correct.';
  } else {
    state.score.wrong += 1;
    state.score.streak = 0;
    els.statusText.textContent = 'Wrong.';
  }
  updateScoreUI();

  state.quizIndex += 1;
  state.matchHoldMs = 0;
  setTimeout(() => renderQuizQuestion(), 600);
}

function updateHoldTimer(isHolding, dt) {
  if (!isHolding) {
    state.matchHoldMs = 0;
    return;
  }
  state.matchHoldMs += dt;
}

function renderOverlay(results) {
  const canvas = els.overlay;
  const video = els.video;

  canvas.width = video.videoWidth || canvas.clientWidth;
  canvas.height = video.videoHeight || canvas.clientHeight;

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#60a5fa', lineWidth: 2 });
      drawLandmarks(ctx, landmarks, { color: '#22c55e', lineWidth: 1, radius: 2 });
    }
  }

  ctx.restore();
}

function setCameraNote(msg) {
  els.cameraNote.textContent = msg;
}

async function start() {
  els.startBtn.disabled = true;
  setCameraNote('Starting camera…');

  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
  });

  hands.onResults((results) => {
    renderOverlay(results);

    const now = performance.now();
    const dt = state.lastFrameTs == null ? 0 : now - state.lastFrameTs;
    state.lastFrameTs = now;

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      applyMeter(els.barHandshape, els.badgeHandshape, 0);
      applyMeter(els.barLocation, els.badgeLocation, 0);
      applyMeter(els.barOrientation, els.badgeOrientation, 0);
      applyMeter(els.barMovement, els.badgeMovement, 0);
      state.lastWrist = null;
      state.matchHoldMs = 0;
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    const features = getFeatures(landmarks);

    const detected = classifyYesNo(features);

    const handshapeScore = state.mode === Mode.LEARN_YES
      ? handshapeScoreFor(Sign.YES, features.fingers)
      : state.mode === Mode.LEARN_NO
        ? handshapeScoreFor(Sign.NO, features.fingers)
        : Math.max(handshapeScoreFor(Sign.YES, features.fingers), handshapeScoreFor(Sign.NO, features.fingers));

    const orientationScore = features.orientationScore;
    const locationScore = features.locationScore;

    const holdOk = features.movementScore >= 0.7;
    const movementScore = features.movementScore;

    applyMeter(els.barHandshape, els.badgeHandshape, handshapeScore);
    applyMeter(els.barLocation, els.badgeLocation, locationScore);
    applyMeter(els.barOrientation, els.badgeOrientation, orientationScore);
    applyMeter(els.barMovement, els.badgeMovement, movementScore);

    state.lastWrist = features.wrist;

    if (state.mode === Mode.LEARN_YES || state.mode === Mode.LEARN_NO) {
      const isTarget = isTargetSatisfied(state.targetSign, detected.sign);
      const isHolding = isTarget && holdOk;
      updateHoldTimer(isHolding, dt);
      if (isHolding) {
        els.statusText.textContent = `Hold… ${Math.min(100, Math.round((state.matchHoldMs / 600) * 100))}%`;
      }
      if (state.matchHoldMs >= 600) {
        state.matchHoldMs = 0;
        onRecognizedCorrect();
      }
      return;
    }

    if (state.mode === Mode.QUIZ) {
      const answerSign = detected.sign;
      const isAnswer = answerSign === Sign.YES || answerSign === Sign.NO;
      const isHolding = isAnswer && holdOk;
      updateHoldTimer(isHolding, dt);
      if (isHolding) {
        els.statusText.textContent = `Locking in ${answerSign}… ${Math.min(100, Math.round((state.matchHoldMs / 600) * 100))}%`;
      }
      if (state.matchHoldMs >= 600) {
        state.matchHoldMs = 0;
        onQuizAnswer(answerSign);
      }
    }
  });

  const camera = new Camera(els.video, {
    onFrame: async () => {
      await hands.send({ image: els.video });
    },
    width: 640,
    height: 480
  });

  try {
    await camera.start();
    setCameraNote('Camera running.');
    setMode(Mode.LEARN_YES);
  } catch (err) {
    setCameraNote('Failed to start camera. Ensure you are using HTTPS (or localhost) and grant camera permissions.');
    els.statusText.textContent = String(err);
    els.startBtn.disabled = false;
  }
}

els.captionsToggle.addEventListener('change', () => {
  state.captionsEnabled = els.captionsToggle.checked;
  if (state.mode === Mode.QUIZ) renderQuizQuestion();
  if (state.mode === Mode.LEARN_YES) els.questionText.textContent = state.captionsEnabled ? 'Try signing: YES' : '';
  if (state.mode === Mode.LEARN_NO) els.questionText.textContent = state.captionsEnabled ? 'Try signing: NO' : '';
  if (state.mode === Mode.INTRO) els.questionText.textContent = state.captionsEnabled ? 'Camera requires HTTPS (or localhost).' : '';
});

els.startBtn.addEventListener('click', () => {
  start();
});

els.resetBtn.addEventListener('click', () => {
  state.score.streak = 0;
  state.score.correct = 0;
  state.score.wrong = 0;
  updateScoreUI();
  setMode(Mode.INTRO);
});

updateScoreUI();
setMode(Mode.INTRO);
setCameraNote('Serve this folder over HTTPS (or localhost) for camera access.');
