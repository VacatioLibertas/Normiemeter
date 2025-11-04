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

  // build a header row: left column for title + score + OAI, right column for the throbber


 

  const title = document.createElement('h1');
  title.textContent = 'Results';

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
      // make it from 0 - 100
      oai = ((payload.totalScore / totalMax)+1)/2;
      const pct = (oai * 100).toFixed(1);
      const pctg = document.getElementById('percentage');
      percentage.textContent = `${Math.trunc(pct)}%`;
      const type = document.getElementById('typology');
      const typeDesc = document.getElementById('resultDesc');
      const rects = document.querySelectorAll('.rectangle');
      if (oai >= 0.9) {
        typology.textContent = 'EXTREMELY NORMAL';
        resultDesc.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus id lorem vel dui euismod elementum. Curabitur sed nibh non urna pulvinar interdum. Vestibulum eu purus id ex auctor pulvinar in sed mauris. Morbi auctor viverra sodales. Mauris vitae sapien nec sem convallis porta. Fusce sodales ligula sodales neque vehicula, non dapibus ipsum sodales. Integer luctus lacus non ullamcorper vestibulum.'
      }
      else if (oai >= 0.75) {
        typology.textContent = 'VERY NORMAL';
        resultDesc.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus id lorem vel dui euismod elementum. Curabitur sed nibh non urna pulvinar interdum. Vestibulum eu purus id ex auctor pulvinar in sed mauris. Morbi auctor viverra sodales. Mauris vitae sapien nec sem convallis porta. Fusce sodales ligula sodales neque vehicula, non dapibus ipsum sodales. Integer luctus lacus non ullamcorper vestibulum.'
      }
      else if (oai >= 0.5) {
        typology.textContent = 'MOSTLY NORMAL';
        resultDesc.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus id lorem vel dui euismod elementum. Curabitur sed nibh non urna pulvinar interdum. Vestibulum eu purus id ex auctor pulvinar in sed mauris. Morbi auctor viverra sodales. Mauris vitae sapien nec sem convallis porta. Fusce sodales ligula sodales neque vehicula, non dapibus ipsum sodales. Integer luctus lacus non ullamcorper vestibulum.'
      }
      else if (oai >= 0.25) {
        typology.textContent = 'SOMEWHAT ABNORMAL';
        resultDesc.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus id lorem vel dui euismod elementum. Curabitur sed nibh non urna pulvinar interdum. Vestibulum eu purus id ex auctor pulvinar in sed mauris. Morbi auctor viverra sodales. Mauris vitae sapien nec sem convallis porta. Fusce sodales ligula sodales neque vehicula, non dapibus ipsum sodales. Integer luctus lacus non ullamcorper vestibulum.'
      }
      else if (oai >= 0.0) {
        typology.textContent = 'VERY ABNORMAL';
        resultDesc.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus id lorem vel dui euismod elementum. Curabitur sed nibh non urna pulvinar interdum. Vestibulum eu purus id ex auctor pulvinar in sed mauris. Morbi auctor viverra sodales. Mauris vitae sapien nec sem convallis porta. Fusce sodales ligula sodales neque vehicula, non dapibus ipsum sodales. Integer luctus lacus non ullamcorper vestibulum.'
      }
    }
    else {
      const pctg = document.createElement('percentage');
      percentage.textContent = '--%';
      typology.textContent = 'UNOPINIONATED';
      resultDesc.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus id lorem vel dui euismod elementum. Curabitur sed nibh non urna pulvinar interdum. Vestibulum eu purus id ex auctor pulvinar in sed mauris. Morbi auctor viverra sodales. Mauris vitae sapien nec sem convallis porta. Fusce sodales ligula sodales neque vehicula, non dapibus ipsum sodales. Integer luctus lacus non ullamcorper vestibulum.'
      rects.forEach(r => {
        r.style.backgroundColor = '#FFFFFF';
      });
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

    // wrapper to enable scrolling
    const wrapper = document.createElement('div');
    wrapper.style.maxHeight = '60vh';
    wrapper.style.overflow = 'auto';
    wrapper.style.marginLeft = "-10%";
    wrapper.style.marginRight = "-10%";

    // create table
    const tbl = document.createElement('table');
    tbl.style.textAlign = 'left';
    tbl.style.width = '100%';
    tbl.style.borderCollapse = 'collapse';

    // build thead with one header row
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');

    const qNum = document.createElement('th');
    qNum.textContent = 'Q.';
    headRow.appendChild(qNum);

    const titlePolicy = document.createElement('th');
    titlePolicy.textContent = 'POLICY';
    headRow.appendChild(titlePolicy);

    const urAns = document.createElement('th');
    urAns.textContent = 'YOUR ANSWER';
    urAns.style.textAlign = 'right';
    headRow.appendChild(urAns);

    thead.appendChild(headRow);
    tbl.appendChild(thead);

    

    // build tbody and rows
    const tbody = document.createElement('tbody');

    for (let i = 0; i < (payload.questions || []).length; i++) {
      const row = document.createElement('tr');
      row.style.marginBottom = '10px';

      const n = document.createElement('td');
      n.textContent = (i + 1) + '.';
      row.appendChild(n);
      n.style.width = '10px';

      const q = payload.questions[i];
      const ans = (payload.answers || []).find(a => a.index === i);
      const title = q['Policy'] || '';
      const answerText = ans ? ans.answer : 'unseen';

      const policy = document.createElement('td');
      policy.textContent = `${title}`;
      policy.style.width = '200px';
      row.appendChild(policy);

      const urans = document.createElement('td');
      if (answerText == 'skip') {
        urans.textContent = '●';
        urans.style.color = '#756c69';
      }
      else if (answerText == 'agree') {
        urans.textContent = '●';
        urans.style.color = '#57bb8a';
      }
      else if (answerText == 'disagree') {
        urans.textContent = '●';
        urans.style.color = '#e67c73';
      }
      urans.style.textAlign = 'right';
      urans.style.paddingRight = '10px';
      urans.style.fontSize = '24px';
      urans.style.verticalAlign = 'middle';
      row.appendChild(urans);

      tbody.appendChild(row);
    }

    tbl.appendChild(tbody);
    wrapper.appendChild(tbl);
    container.appendChild(wrapper);


    // wire restart button — redirect back to short quiz if payload.source === 'short'
    const restart = document.createElement('button');
    restart.style.fontFamily = 'Inconsolata';
    restart.textContent = 'RESTART QUIZ';
    restart.style.width = '135px';
    restart.style.fontSize = '20px';
    restart.style.border = 'none';
    restart.style.backgroundColor = '#FCBA04';
    restart.style.color = '#FFFFFF';
    restart.style.padding = '4px';
    restart.style.borderRadius = '5px';
    restart.style.fontWeight = 'bold';
    restart.style.cursor = 'pointer';
    restart.onmouseover = () => {
		  restart.style.backgroundColor = '#e3a703';
		};
		restart.onmouseout = () => {
			restart.style.backgroundColor = '#FCBA04';
		};
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

    // add a "Return to home" button next to the restart button
    const home = document.createElement('button');
    home.id = 'home';
    home.textContent = 'RETURN HOME';
    home.style.fontFamily = 'Inconsolata';
    home.style.marginLeft = '8px';
    home.style.width = '135px';
    home.style.fontSize = '20px';
    home.style.border = 'none';
    home.style.backgroundColor = '#FCBA04';
    home.style.color = '#FFFFFF';
    home.style.padding = '4px';
    home.style.borderRadius = '5px';
    home.style.fontWeight = 'bold';
    home.style.cursor = 'pointer';
    home.onmouseover = () => {
		  home.style.backgroundColor = '#e3a703';
		};
		home.onmouseout = () => {
			home.style.backgroundColor = '#FCBA04';
		};    
    home.addEventListener('click', () => {
      // navigate to the site index (do not remove saved results by default)
      window.location.href = './index.html';
    });
    container.appendChild(restart);
    container.appendChild(home);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();

})();
