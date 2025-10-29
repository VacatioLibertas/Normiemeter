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
    container.appendChild(title);

    const scoreP = document.createElement('p');
    scoreP.textContent = `Raw score: ${Number(payload.totalScore || 0).toFixed(3)}`;
    container.appendChild(scoreP);

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
      oai = payload.totalScore / totalMax;
      const pct = (oai * 100).toFixed(1);
      const p = document.createElement('p');
      p.textContent = `Overall Alignment Index (OAI): ${pct}%`;
      container.appendChild(p);

      const interpret = document.createElement('p');
      if (oai >= 0.9) interpret.textContent = 'Very high alignment with the public consensus.';
      else if (oai >= 0.6) interpret.textContent = 'High alignment with the public consensus.';
      else if (oai >= 0.2) interpret.textContent = 'Moderate alignment with the public consensus.';
      else if (oai > -0.2) interpret.textContent = 'Mixed or near-neutral alignment.';
      else if (oai > -0.6) interpret.textContent = 'Low alignment with the public consensus.';
      else interpret.textContent = 'Strongly opposed to the public consensus.';
      container.appendChild(interpret);
    } else {
      const p = document.createElement('p');
      p.textContent = 'Overall Alignment Index (OAI): — (no answered questions)';
      container.appendChild(p);
    }

    // answered count
    const nonSkipped = (payload.answers || []).filter(a => a && a.answer !== 'skip').length || 0;
    const answeredP = document.createElement('p');
    answeredP.textContent = `Answered questions: ${nonSkipped} / ${payload.questions.length}`;
    container.appendChild(answeredP);

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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();

})();
