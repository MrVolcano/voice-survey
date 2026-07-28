// Shared voice-survey engine. Each survey page sets window.SURVEY_QUESTIONS,
// window.SURVEY_ROUTE_ID and window.SURVEY_ROUTE_LABEL (see questions-*.js)
// before loading this file.
(function () {
  // Paste a Power Automate "When an HTTP request is received" trigger URL
  // here to also send each response into an Excel table on OneDrive/
  // SharePoint. Left blank, the webhook step is skipped entirely and only
  // local storage + manual download are used. See README for setup steps.
  const POWER_AUTOMATE_URL = '';

  const LOCAL_STORAGE_KEY = 'voiceSurveyResponses';
  const MAX_STORED_RESPONSES = 100;
  const PREFERRED_VOICE_KEY = 'voiceSurveyPreferredVoice';

  const questions = window.SURVEY_QUESTIONS || [];
  const routeId = window.SURVEY_ROUTE_ID || 'unknown';
  const routeLabel = window.SURVEY_ROUTE_LABEL || '';

  const card = document.getElementById('card');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const liveRegion = document.getElementById('liveRegion');
  const compatNote = document.getElementById('compatNote');
  const listVoicesBtn = document.getElementById('listVoicesBtn');
  const voiceListEl = document.getElementById('voiceList');

  listVoicesBtn.addEventListener('click', () => {
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    if (!voices.length) {
      voiceListEl.innerHTML = 'No voices reported yet - try again in a second, or check the browser has permission/internet access.';
    } else {
      voiceListEl.innerHTML = voices.map(v =>
        `${v.name} (${v.lang})${/natural|online|enhanced|premium/i.test(v.name) ? ' - looks natural' : ''}`
      ).join('<br>');
    }
    voiceListEl.style.display = voiceListEl.style.display === 'none' ? 'block' : 'none';
  });

  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSupported = !!SpeechRecognitionAPI && !!window.speechSynthesis;
  const ttsSupported = !!window.speechSynthesis;

  // iOS only grants microphone-based speech recognition to Safari itself -
  // Chrome, Edge and every other iPhone/iPad browser use the same rendering
  // engine but don't get this feature, so voice input silently fails there.
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isIOSSafari = isIOS && /Safari/.test(ua) && !/CriOS|EdgiOS|FxiOS|OPiOS/.test(ua);
  const isIOSOtherBrowser = isIOS && !isIOSSafari;

  let recognizer = null;
  if (SpeechRecognitionAPI) {
    recognizer = new SpeechRecognitionAPI();
    recognizer.continuous = false;
    recognizer.interimResults = false;
    recognizer.lang = 'en-GB';
  }

  let current = 0;
  const answers = [];

  // Natural voices (Edge's "Online (Natural)" set, and equivalents on other
  // browsers) sound far less robotic than the default local voice. They load
  // asynchronously and often aren't ready on the very first check, so we
  // retry a few times rather than relying on a single event that not every
  // browser fires reliably.
  let naturalVoice = null;
  let selectedVoice = null;
  let voiceLabel = 'standard';
  let voiceAttempts = 0;

  function voiceKey(v) { return v.name + '|' + v.lang; }

  function getVoicePool() {
    if (!window.speechSynthesis) return [];
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
    return englishVoices.length ? englishVoices : voices;
  }

  function pickBestVoice() {
    if (!window.speechSynthesis) { updateCompatNote(); return; }
    const voices = window.speechSynthesis.getVoices();

    if (!voices.length) {
      voiceAttempts++;
      if (voiceAttempts <= 10) {
        setTimeout(pickBestVoice, 300);
      } else {
        voiceLabel = 'none-found';
        updateCompatNote();
      }
      return;
    }

    const pool = getVoicePool();

    // Prefer anything explicitly flagged "Natural" (Edge), then fall back to
    // other known cloud/enhanced voice naming patterns other browsers use.
    const natural = pool.find(v => /natural/i.test(v.name))
      || pool.find(v => /online|enhanced|premium/i.test(v.name))
      || null;

    // Prefer British English where available, since that best matches the
    // rest of the interface, then just take the first sensible option.
    const gbFirst = pool.find(v => v.lang.toLowerCase() === 'en-gb') || pool[0];

    naturalVoice = natural || gbFirst || null;
    voiceLabel = natural ? 'natural' : 'standard';

    // A voice picked by hand (this session or a previous visit, via the
    // dropdown on the start screen) wins over the auto-pick above, as long
    // as it's actually present in this browser's voice list.
    let preferred = null;
    try {
      const savedKey = localStorage.getItem(PREFERRED_VOICE_KEY);
      if (savedKey) preferred = pool.find(v => voiceKey(v) === savedKey) || null;
    } catch (e) { /* localStorage unavailable - just use the auto-pick */ }
    selectedVoice = preferred || naturalVoice;

    updateCompatNote();
    populateVoiceSelect();
  }

  function updateCompatNote() {
    if (!compatNote) return;
    if (!speechSupported) {
      compatNote.textContent = 'This browser does not support voice input, so manual buttons are used instead.';
      return;
    }
    if (voiceLabel === 'natural') {
      compatNote.textContent = `Voice works in this browser, using a natural voice (${naturalVoice.name}). Manual buttons are always available too.`;
    } else if (voiceLabel === 'none-found') {
      compatNote.textContent = 'Voice output is not returning any voices in this browser - manual buttons will still work.';
    } else if (naturalVoice) {
      compatNote.textContent = `Voice works in this browser, using the standard voice (${naturalVoice.name}). Manual buttons are always available too.`;
    } else {
      compatNote.textContent = 'Checking available voices...';
    }
  }

  updateCompatNote();
  if (window.speechSynthesis) {
    pickBestVoice();
    // Chrome/Edge load the voice list asynchronously - this event fires once
    // it's actually ready, on browsers that support it.
    window.speechSynthesis.onvoiceschanged = pickBestVoice;
  }

  function announce(msg) {
    liveRegion.textContent = '';
    setTimeout(() => { liveRegion.textContent = msg; }, 50);
  }

  function speak(text, onEnd) {
    if (!window.speechSynthesis) { if (onEnd) onEnd(); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-GB';
    utter.rate = 0.98;
    if (selectedVoice) {
      utter.voice = selectedVoice;
      utter.lang = selectedVoice.lang;
    }
    utter.onend = () => { if (onEnd) onEnd(); };
    utter.onerror = () => { if (onEnd) onEnd(); };
    window.speechSynthesis.speak(utter);
  }

  function setOrb(state) {
    // state: 'idle' | 'speaking' | 'listening'
    return `<div class="orb-wrap"><div class="orb ${state === 'idle' ? '' : state}" aria-hidden="true">
      <span class="icon">${state === 'listening' ? '\u{1F3A4}' : state === 'speaking' ? '\u{1F50A}' : '\u{2728}'}</span>
    </div></div>
    <div class="state-label" id="stateLabel">${state === 'listening' ? 'Listening...' : state === 'speaking' ? 'Speaking...' : 'Ready'}</div>`;
  }

  function updateProgress() {
    progressWrap.style.display = 'block';
    const pct = Math.round((current / questions.length) * 100);
    progressFill.style.width = pct + '%';
    progressLabel.textContent = `Question ${Math.min(current + 1, questions.length)} of ${questions.length}`;
  }

  function fuzzyMatchOption(transcript, options) {
    const t = transcript.toLowerCase();
    let best = null;
    let bestScore = 0;
    options.forEach((opt) => {
      const words = opt.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      let score = 0;
      words.forEach(w => { if (t.includes(w)) score++; });
      if (t.includes(opt.toLowerCase())) score += 5;
      if (score > bestScore) { bestScore = score; best = opt; }
    });
    return bestScore > 0 ? best : null;
  }

  let handsFree = !isIOSSafari;

  // Rebuilds the start-screen voice dropdown in place from whatever voices
  // are currently available, without touching the rest of the intro screen.
  // Safe to call even when that dropdown isn't on screen right now.
  function populateVoiceSelect() {
    const select = document.getElementById('voiceSelect');
    if (!select) return;
    const pool = getVoicePool();
    if (!pool.length) {
      select.innerHTML = '<option value="">Loading voices...</option>';
      select.disabled = true;
      return;
    }
    select.disabled = false;
    select.innerHTML = pool.map((v, i) => {
      const label = `${v.name} (${v.lang})${/natural|online|enhanced|premium/i.test(v.name) ? ' - natural' : ''}`;
      return `<option value="${i}">${label}</option>`;
    }).join('');
    let currentIndex = selectedVoice ? pool.findIndex(v => voiceKey(v) === voiceKey(selectedVoice)) : -1;
    if (currentIndex < 0) {
      currentIndex = 0;
      selectedVoice = pool[0];
    }
    select.value = String(currentIndex);
  }

  function renderIntro() {
    const inFrame = window.top !== window.self;
    const frameWarning = (speechSupported && inFrame)
      ? `<div class="support-note">This page seems to be running inside an embedded preview, which often blocks microphone access even when you allow it. If the microphone button doesn't work, try opening the downloaded file directly in its own browser tab.</div>`
      : '';
    const iosWarning = isIOSOtherBrowser
      ? `<div class="support-note">On iPhone and iPad, voice answers only work in Safari. This looks like a different browser, so questions will still be read aloud but spoken answers won't be picked up - please open this page in Safari, or use the on-screen options instead.</div>`
      : '';
    card.innerHTML = `
      ${setOrb('idle')}
      <p style="font-size:1.05rem; line-height:1.6; margin-bottom:24px;">
        There are ${questions.length} short questions. For each one I will read it aloud,
        then listen for your answer. You can also just tap the options on screen at any time -
        voice is optional, never required.
      </p>
      ${speechSupported ? `
      <label style="display:flex; align-items:center; gap:10px; justify-content:center; margin-bottom:24px; font-size:1rem; color:var(--text-dim); cursor:pointer;">
        <input type="checkbox" id="handsFreeToggle" ${handsFree ? 'checked' : ''} style="width:22px; height:22px;">
        Start listening automatically after each question
      </label>` : ''}
      ${ttsSupported ? `
      <label style="display:block; margin-bottom:24px; font-size:1rem; color:var(--text-dim); text-align:left;">
        Voice used to read questions aloud
        <select id="voiceSelect" style="display:block; width:100%; margin-top:8px; background:var(--surface-raised); color:var(--text); border:2px solid transparent; border-radius:12px; padding:12px; font-family:inherit; font-size:1.05rem;">
          <option value="">Loading voices...</option>
        </select>
      </label>` : ''}
      <div class="btn-row">
        <button class="btn btn-primary" id="startBtn">Start survey</button>
      </div>
      ${frameWarning}
      ${iosWarning}
    `;
    if (speechSupported) {
      document.getElementById('handsFreeToggle').addEventListener('change', (e) => {
        handsFree = e.target.checked;
      });
    }
    if (ttsSupported) {
      populateVoiceSelect();
      document.getElementById('voiceSelect').addEventListener('change', (e) => {
        const pool = getVoicePool();
        const chosen = pool[+e.target.value];
        if (!chosen) return;
        selectedVoice = chosen;
        try { localStorage.setItem(PREFERRED_VOICE_KEY, voiceKey(chosen)); } catch (err) { /* ignore */ }
      });
    }
    document.getElementById('startBtn').addEventListener('click', () => {
      current = 0;
      answers.length = 0;
      askQuestion();
    });
  }

  function askQuestion() {
    if (current >= questions.length) { renderSummary(); return; }
    updateProgress();
    const q = questions[current];

    let body = `${setOrb('idle')}<p class="question-text">${q.text}</p>`;

    if (q.type === 'choice') {
      body += `<div class="options" role="group" aria-label="Answer options">`;
      q.options.forEach((opt, i) => {
        body += `<button class="option-btn" data-opt="${i}">${opt}</button>`;
      });
      body += `</div>`;
    } else {
      body += `<textarea class="free-text" id="freeText" aria-label="Your answer" placeholder="Type your answer here, or use the microphone"></textarea>`;
    }

    body += `<div class="btn-row" style="margin-top:8px;">`;
    if (speechSupported) {
      body += `<button class="btn btn-primary" id="micBtn">${handsFree ? 'Listen again' : 'Use microphone'}</button>`;
    }
    body += `<button class="btn btn-secondary" id="repeatBtn">Repeat question</button>`;
    body += `</div>`;

    if (q.type === 'text') {
      body += `<div class="btn-row" style="margin-top:14px;"><button class="btn btn-secondary" id="submitTextBtn">Next</button></div>`;
    }

    card.innerHTML = body;

    if (q.type === 'choice') {
      card.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => selectAnswer(q.options[+btn.dataset.opt]));
      });
    } else {
      document.getElementById('submitTextBtn').addEventListener('click', () => {
        const val = document.getElementById('freeText').value.trim();
        selectAnswer(val.length ? val : '(no answer given)');
      });
    }

    document.getElementById('repeatBtn').addEventListener('click', () => readQuestionAloud(q));

    if (speechSupported) {
      document.getElementById('micBtn').addEventListener('click', () => startListening(q));
    }

    readQuestionAloud(q);
  }

  function readQuestionAloud(q) {
    setOrbState('speaking');
    let toSay = q.text;
    if (q.type === 'choice') {
      toSay += ' Your options are: ' + q.options.join(', ') + '.';
    }
    speak(toSay, () => {
      setOrbState('idle');
      if (handsFree && speechSupported) {
        // Small pause so it doesn't feel like it's cutting the person off
        // mid-breath the instant the question finishes.
        setTimeout(() => startListening(q), 500);
      }
    });
  }

  function setOrbState(state) {
    const wrap = card.querySelector('.orb-wrap');
    const label = document.getElementById('stateLabel');
    if (!wrap || !label) return;
    const orb = wrap.querySelector('.orb');
    orb.className = 'orb' + (state === 'idle' ? '' : ' ' + state);
    orb.querySelector('.icon').textContent = state === 'listening' ? '\u{1F3A4}' : state === 'speaking' ? '\u{1F50A}' : '\u{2728}';
    label.textContent = state === 'listening' ? 'Listening...' : state === 'speaking' ? 'Speaking...' : 'Ready';
  }

  const ERROR_MESSAGES = {
    'not-allowed': 'Microphone access was blocked. Check the site permission for the microphone (often a padlock or camera icon in the address bar) and allow it, then try again.',
    'service-not-allowed': 'The browser blocked microphone access for this page - this often happens inside an embedded preview. Try opening the downloaded file directly in its own browser tab.',
    'no-speech': 'No speech was picked up that time. Try again and speak shortly after the beep.',
    'audio-capture': 'No microphone could be found. Check one is connected and not in use by another app.',
    'network': 'A network error stopped voice recognition - this needs an internet connection to work.',
    'aborted': 'Listening was stopped before an answer came through.'
  };

  // Errors where simply trying again is likely to work (nothing was heard),
  // as opposed to ones that need the person to fix something first (blocked
  // microphone permission, no microphone, no network).
  const RETRYABLE_ERRORS = new Set(['no-speech']);

  function startListening(q, opts) {
    if (!recognizer) return;
    opts = opts || {};

    const inFrame = window.top !== window.self;

    setOrbState('listening');
    announce('Listening for your answer');
    clearMicError();

    try {
      recognizer.start();
    } catch (e) {
      setOrbState('idle');
      showMicError('Could not start listening: ' + e.message);
      return;
    }

    recognizer.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setOrbState('idle');
      clearMicError();
      if (opts.confirmText) {
        handleTextConfirmResult(q, transcript);
      } else {
        handleVoiceResult(q, transcript);
      }
    };
    recognizer.onerror = (event) => {
      setOrbState('idle');
      let msg = ERROR_MESSAGES[event.error] || ('Voice recognition error: ' + event.error);
      if (event.error === 'not-allowed' && inFrame) {
        msg = ERROR_MESSAGES['service-not-allowed'];
      }
      showMicError(msg);
      announce(msg);
      if (RETRYABLE_ERRORS.has(event.error)) {
        // Speaking the message first guarantees the previous recognition
        // session has fully ended before we start a new one.
        speak(msg, () => startListening(q, opts));
      }
    };
    recognizer.onend = () => {
      if (card.querySelector('.orb.listening')) setOrbState('idle');
    };
  }

  function showMicError(msg) {
    let box = document.getElementById('micErrorBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'micErrorBox';
      box.className = 'support-note';
      const btnRow = card.querySelector('.btn-row');
      card.insertBefore(box, btnRow);
    }
    box.textContent = msg;
  }

  function clearMicError() {
    const box = document.getElementById('micErrorBox');
    if (box) box.remove();
  }

  function isNextCommand(transcript) {
    return /\bnext\b/i.test(transcript.trim());
  }

  function handleVoiceResult(q, transcript) {
    if (q.type === 'text') {
      const field = document.getElementById('freeText');
      if (field) field.value = transcript;
      speak('I heard: ' + transcript + '. Re-speak your response if incorrect, or say next to continue.', () => {
        startListening(q, { confirmText: true });
      });
      return;
    }
    const match = fuzzyMatchOption(transcript, q.options);
    if (match) {
      const box = document.createElement('div');
      box.className = 'transcript-box';
      box.innerHTML = `Heard: <strong>${transcript}</strong> - matched to <strong>${match}</strong>`;
      card.insertBefore(box, card.querySelector('.btn-row'));
      speak('I heard ' + match + '. Confirming that answer.', () => selectAnswer(match));
    } else {
      speak('Sorry, I did not catch a clear answer. Let\'s try again.', () => startListening(q));
    }
  }

  // Follow-up listen after a free-text answer: "next" submits it, anything
  // else is treated as a re-spoken replacement and prompted again.
  function handleTextConfirmResult(q, transcript) {
    if (isNextCommand(transcript)) {
      const field = document.getElementById('freeText');
      const val = field ? field.value.trim() : '';
      selectAnswer(val.length ? val : '(no answer given)');
      return;
    }
    const field = document.getElementById('freeText');
    if (field) field.value = transcript;
    speak('I heard: ' + transcript + '. Re-speak your response if incorrect, or say next to continue.', () => {
      startListening(q, { confirmText: true });
    });
  }

  function selectAnswer(answerText) {
    answers.push({ question: questions[current].text, answer: answerText });
    current++;
    askQuestion();
  }

  // ---- Storage: local device only by default, plus a best-effort webhook ----

  function buildRecord() {
    return {
      timestamp: new Date().toISOString(),
      route: routeId,
      answers: answers.slice()
    };
  }

  function saveResponseLocally(record) {
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    } catch (e) {
      stored = [];
    }
    stored.push(record);
    if (stored.length > MAX_STORED_RESPONSES) {
      stored = stored.slice(stored.length - MAX_STORED_RESPONSES);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stored));
  }

  // Best-effort only: sent as text/plain (not application/json) so the
  // cross-origin POST counts as a CORS "simple request" and skips the
  // preflight OPTIONS call that a Power Automate HTTP trigger doesn't answer
  // by default. Power Automate still parses the body as JSON on its side.
  // Reading the response cross-origin may fail without CORS headers on the
  // flow's reply even though the row was written successfully - that's
  // expected here, not a bug, so failures are swallowed silently.
  function sendToExcelWebhook(record) {
    if (!POWER_AUTOMATE_URL) return;
    fetch(POWER_AUTOMATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(record)
    }).catch(() => { /* best-effort; local storage already has the data */ });
  }

  function escapeCsvCell(value) {
    const str = String(value == null ? '' : value);
    return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
  }

  function recordsToCsv(records) {
    const rows = [['Timestamp', 'Route', 'Question', 'Answer']];
    records.forEach(r => {
      r.answers.forEach(a => {
        rows.push([r.timestamp, r.route, a.question, a.answer]);
      });
    });
    return rows.map(row => row.map(escapeCsvCell).join(',')).join('\r\n');
  }

  function downloadCsv(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function renderSummary() {
    progressWrap.style.display = 'none';
    const record = buildRecord();
    saveResponseLocally(record);
    sendToExcelWebhook(record);

    let body = `${setOrb('idle')}<p class="question-text">All done - thank you</p>`;
    body += `<div class="summary-list">`;
    answers.forEach(a => {
      body += `<div class="summary-item"><div class="q">${a.question}</div><div class="a">${a.answer}</div></div>`;
    });
    body += `</div>`;
    body += `<div class="btn-row">
      <button class="btn btn-primary" id="downloadBtn">Download my answers</button>
      <button class="btn btn-secondary" id="restartBtn">Start again</button>
    </div>
    <div class="support-note">
      Prototype note: your answers are saved on this device (browser local storage) and, if a
      storage webhook has been configured, sent to an Excel table on the organisation's
      Microsoft 365 tenant. Nothing is sent anywhere else.
    </div>`;
    card.innerHTML = body;
    speak('That is everything. Here is a summary of your answers. Your answers have been saved.');
    document.getElementById('downloadBtn').addEventListener('click', () => {
      downloadCsv(recordsToCsv([record]), `voice-survey-${routeId}-${record.timestamp.replace(/[:.]/g, '-')}.csv`);
    });
    document.getElementById('restartBtn').addEventListener('click', renderIntro);
  }

  // Exposed so index.html's "export everything saved on this device" link
  // can reuse the same CSV logic without duplicating it.
  window.voiceSurveyStorage = {
    exportAllLocalResponses() {
      let stored = [];
      try {
        stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      } catch (e) {
        stored = [];
      }
      if (!stored.length) {
        window.alert('No responses are saved on this device yet.');
        return;
      }
      downloadCsv(recordsToCsv(stored), `voice-survey-all-responses-${Date.now()}.csv`);
    }
  };

  if (card) {
    renderIntro();
    if (progressLabel) {
      progressLabel.setAttribute('data-route', routeLabel);
    }
  }
})();
