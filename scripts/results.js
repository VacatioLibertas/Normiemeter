// Read results payload from localStorage and render the results page
(function() {
  function $id(id) { return document.getElementById(id); }

  // Color helpers for throbber (interpolate between negative/neutral/positive)
  function hexToRgb(hex) {
    hex = (hex || '').replace('#','');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16) || 0;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToHex(r,g,b) { return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join(''); }
  function lerp(a,b,t){ return Math.round(a + (b - a) * t); }

  const COLOR_POS = hexToRgb('#57bb8a'); // +1
  const COLOR_NEU = hexToRgb('#625a58'); // 0
  const COLOR_NEG = hexToRgb('#e67c73'); // -1

  function colorForOAI(oai) {
    if (!isFinite(oai)) return rgbToHex(COLOR_NEU.r, COLOR_NEU.g, COLOR_NEU.b);
    oai = Math.max(-1, Math.min(1, oai));
    if (oai >= 0) {
      const t = oai;
      return rgbToHex(
        lerp(COLOR_NEU.r, COLOR_POS.r, t),
        lerp(COLOR_NEU.g, COLOR_POS.g, t),
        lerp(COLOR_NEU.b, COLOR_POS.b, t)
      );
    } else {
      const t = -oai;
      return rgbToHex(
        lerp(COLOR_NEU.r, COLOR_NEG.r, t),
        lerp(COLOR_NEU.g, COLOR_NEG.g, t),
        lerp(COLOR_NEU.b, COLOR_NEG.b, t)
      );
    }
  }

  // Create or return the throbber element inside the given container (preferably the right column)
  function insertThrobber(container) {
    if (!container) return null;
    // if container already contains spinner, return it
    let spinner = container.querySelector('.results-throbber');
    if (!spinner) {
      spinner = document.createElement('div');
      spinner.className = 'results-throbber';
      spinner.setAttribute('role','img');
      spinner.setAttribute('aria-label','Alignment throbber');
      // create 12 small rectangles positioned around the circle
      for (let i = 0; i < 12; i++) {
        const rect = document.createElement('div');
        rect.className = 'rect';
        // position by rotating each rect around center and translating outward
        const angle = i * 30; // degrees (360/12)
        // distance outward in px - for 200px spinner use larger offset
        const dist = 70; // px
        rect.style.transform = `rotate(${angle}deg) translateY(-${dist}px)`;
        spinner.appendChild(rect);
      }
      container.appendChild(spinner);
    }
    return spinner;
  }

  function updateThrobber(container, oai) {
    const spinner = insertThrobber(container);
    if (!spinner) return;
    const color = colorForOAI(oai);
    spinner.style.setProperty('--throbber-color', color);
    const pct = (isFinite(oai) ? Math.round(oai * 100) : 0);
    spinner.setAttribute('aria-label', `Overall alignment ${pct} percent`);
    if (!isFinite(oai)) spinner.classList.add('paused'); else spinner.classList.remove('paused');
  }

  function render() {
    const container = $id('resultsContainer');
    container.innerHTML = '';
    const raw = localStorage.getItem('normiemeter_results');
    if (!raw) {
      const p = document.createElement('p');
      p.textContent = 'No results found. Please take the quiz first.';
      container.appendChild(p);
      return;
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      const p = document.createElement('p');
      p.textContent = 'Failed to parse saved results.';
      container.appendChild(p);
      console.error(e);
      return;
    }

  // build a header row: left column for title + score + OAI, right column for the throbber
  const headerRow = document.createElement('div');
  headerRow.className = 'results-row';
  const leftCol = document.createElement('div');
  leftCol.className = 'results-left';
  const rightCol = document.createElement('div');
  rightCol.className = 'results-right';
  headerRow.appendChild(leftCol);
  headerRow.appendChild(rightCol);
  container.appendChild(headerRow);

  const title = document.createElement('h1');
  title.textContent = 'Results';
  leftCol.appendChild(title);

  const scoreP = document.createElement('p');
  scoreP.textContent = `Raw score: ${Number(payload.totalScore || 0).toFixed(3)}`;
  leftCol.appendChild(scoreP);

    // compute OAI same as in quiz.js
    let totalMax = 0;
    for (const a of (payload.answers || [])) {
      if (!a || a.answer === 'skip') continue;
      const q = payload.questions[a.index];
      const netSupport = Number(q['Net Support']) || 0;
      const salience = Number(q['Salience']) || 0;
      totalMax += salience * Math.abs(netSupport);
    }
    let oai = null;
    if (totalMax > 0) {
      // make it from 0 - 100
      oai = ((payload.totalScore / totalMax)+1)/2;
      const pct = (oai * 100).toFixed(1);
  const p = document.createElement('p');
  p.textContent = `Overall Alignment Index (OAI): ${pct}%`;
  leftCol.appendChild(p);

      const interpret = document.createElement('p');
      if (oai >= 0.9) interpret.textContent = 'Very high alignment with the public consensus.';
      else if (oai >= 0.75) interpret.textContent = 'High alignment with the public consensus.';
      else if (oai >= 0.5) interpret.textContent = 'Moderate alignment with the public consensus.';
      else if (oai >= 0.25) interpret.textContent = 'Low alignment with the public consensus.';
      else if (oai = 0.0) interpret.textContent = 'Strongly opposed to the public consensus.';
  leftCol.appendChild(interpret);
    } else {
      const p = document.createElement('p');
      p.textContent = 'Overall Alignment Index (OAI): — (no answered questions)';
      leftCol.appendChild(p);
    }

    // insert/update throbber into the right column to reflect OAI (oai may be null)
    updateThrobber(rightCol, oai);

    // answered count
    const nonSkipped = (payload.answers || []).filter(a => a && a.answer !== 'skip').length || 0;
    const answeredP = document.createElement('p');
    answeredP.textContent = `Answered questions: ${nonSkipped} / ${payload.questions.length}`;
    container.appendChild(answeredP);

    // show how many times the user agreed or disagreed
    let agreeCount = 0;
    let disagreeCount = 0;
    for (const a of (payload.answers || [])) {
      if (!a) continue;
      if (a.answer === 'agree') agreeCount++;
      if (a.answer === 'disagree') disagreeCount++;
    }
    const countsP = document.createElement('p');
    countsP.textContent = `Agreed: ${agreeCount} — Disagreed: ${disagreeCount}`;
    container.appendChild(countsP);

    // breakdown list
    const divider = document.createElement('hr');
    container.appendChild(divider);

    const ul = document.createElement('ul');
    ul.style.textAlign = 'left';
    ul.style.maxHeight = '60vh';
    ul.style.overflow = 'auto';
    for (let i = 0; i < payload.questions.length; i++) {
      const q = payload.questions[i];
      const ans = (payload.answers || []).find(a => a.index === i);
      const li = document.createElement('li');
      const title = q['Policy'] || q['Policy Text'] || `Question ${i+1}`;
      const answerText = ans ? ans.answer : 'unseen';
      const contribText = ans ? (Number(ans.contrib) || 0).toFixed(3) : '0.000';
      li.textContent = `${title} — ${answerText} (contrib: ${contribText})`;
      ul.appendChild(li);
    }
    container.appendChild(ul);

    // wire restart button — redirect back to short quiz if payload.source === 'short'
    const restart = $id('restartBtn');
    restart.style.fontFamily = 'Inconsolata';
    if (restart) {
      restart.addEventListener('click', () => {
        localStorage.removeItem('normiemeter_results');
        if (payload && payload.source === 'short') {
          window.location.href = './shortquiz.html';
        } else {
          window.location.href = './quiz.html';
        }
      });
    }

    // ensure both buttons have the same fixed width
    if (restart) restart.style.width = '135px';

    // add a "Return to home" button next to the restart button
    const homeBtn = document.createElement('button');
  homeBtn.id = 'homeBtn';
  homeBtn.textContent = 'RETURN HOME';
  homeBtn.style.fontFamily = 'Inconsolata';
  // give it the same class as the restart button so it matches visually
  if (restart && restart.className) homeBtn.className = restart.className;
  // small visual spacing if inserted next to restart
  homeBtn.style.marginLeft = '8px';
  // set same width as restart
  homeBtn.style.width = '135px';
    // Insert the button immediately after the restart button when possible
    if (restart && restart.parentNode) {
      restart.parentNode.insertBefore(homeBtn, restart.nextSibling);
    } else {
      // fallback: append to container
      container.appendChild(homeBtn);
    }
    homeBtn.addEventListener('click', () => {
      // navigate to the site index (do not remove saved results by default)
      window.location.href = './index.html';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();

})();
