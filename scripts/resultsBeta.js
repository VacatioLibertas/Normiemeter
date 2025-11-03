// Read results payload from localStorage and render the results page
(function() {
  function $id(id) { return document.getElementById(id); }

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
