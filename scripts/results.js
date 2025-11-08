// read results payload from and crate the results page
(function() {

  function render() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';
    const raw = localStorage.getItem('normiemeter_results');

    var payload;
    payload = JSON.parse(raw);

    const title = document.createElement('h1');
    title.textContent = 'Results';

    var totalMax = 0;
    for (const a of (payload.answers)) {
      if (!a || a.answer == 'skip') continue;
      const q = payload.questions[a.index];
      const netSupport = Number(q['Net Support']) || 0;
      const salience = Number(q['Salience']) || 0;
      totalMax += salience * Math.abs(netSupport);
    }
    var oai = null;
    // make it from 0 - 100
    oai = ((payload.totalScore / totalMax)+1)/2;
    const pct = (oai * 100).toFixed(1);
    const pctg = document.getElementById('percentage');
    const type = document.getElementById('typology');
    const typeDesc = document.getElementById('resultDesc');
    const rects = document.querySelectorAll('.rectangle');
    if (totalMax > 0) {
      percentage.textContent = `${Math.trunc(pct)}%`;

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

    const nonSkipped = (payload.answers).filter(a => a && a.answer !== 'skip').length || 0;
    const answeredP = document.createElement('p');
    answeredP.style.marginBottom = '-14px';
    answeredP.textContent = `Answered questions: ${nonSkipped} / ${payload.questions.length}`;
    resultDesc.appendChild(answeredP);

    var agreeCount = 0;
    var disagreeCount = 0;
    for (const a of (payload.answers)) {
      if (!a) continue;
      if (a.answer == 'agree') agreeCount++;
      if (a.answer == 'disagree') disagreeCount++;
    }
    const countsP = document.createElement('p');
    countsP.textContent = `Agreed: ${agreeCount} — Disagreed: ${disagreeCount}`;
    countsP.style.marginBottom = '0px';
    resultDesc.appendChild(countsP);

    const wrapper = document.createElement('div');
    wrapper.style.maxHeight = '60vh';
    wrapper.style.overflow = 'auto';
    wrapper.style.marginLeft = "-10%";
    wrapper.style.marginRight = "-10%";

    const tbl = document.createElement('table');
    tbl.style.textAlign = 'left';
    tbl.style.width = '100%';
    tbl.style.borderCollapse = 'collapse';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');

    const qNum = document.createElement('th');
    qNum.textContent = 'Q.';
    qNum.style.width = '10px';
    headRow.appendChild(qNum);

    const titlePolicy = document.createElement('th');
    titlePolicy.textContent = 'POLICY';
    headRow.appendChild(titlePolicy);

    const supportHead = document.createElement('th');
    if (window.innerWidth > 600) {
    supportHead.textContent = 'POPULARITY';
    }
    else {
      supportHead.textContent = 'NET SUPPORT'
    }
    supportHead.style.textAlign = 'center';
    headRow.appendChild(supportHead);

    const urAns = document.createElement('th');
    urAns.textContent = 'YOUR ANSWER';
    urAns.style.textAlign = 'right';
    headRow.appendChild(urAns);

    thead.appendChild(headRow);
    tbl.appendChild(thead);

    const tbody = document.createElement('tbody');

    for (var i = 0; i < (payload.questions).length; i++) {
      const row = document.createElement('tr');
      row.style.marginBottom = '10px';
      row.style.alignItems = 'center'; 

      const n = document.createElement('td');
      n.textContent = (i + 1) + '.';
      row.appendChild(n);
      n.style.width = '10px';

      const q = payload.questions[i];
      const ans = (payload.answers || []).find(a => a.index == i);
      const title = q['Policy'] || '';
      const answerText = ans ? ans.answer : 'unseen';

      const policy = document.createElement('td');
      policy.textContent = `${title}`;
      policy.style.width = '200px';
      row.appendChild(policy);

      const supportValue = Number(q['Net Support']);
      const support = document.createElement('td');


      const barWrapper = document.createElement('div');
      barWrapper.style.position = 'relative';
      barWrapper.style.width = '300px';
      barWrapper.style.height = '14px';
      barWrapper.style.margin = '0 auto';
      barWrapper.style.display = 'flex';
      barWrapper.style.alignItems = 'center'; 

      const bar = document.createElement('div');
      bar.style.position = 'absolute';
      bar.style.height = '100%';
      bar.style.backgroundColor = supportValue >= 0 ? '#57bb8a' : '#e67c73';
      const magnitude = Math.min(Math.abs(supportValue), 100); // clamp
      bar.style.width = magnitude + '%';
      const w = bar.style.width;

      const supportLabel = document.createElement('div');
      supportLabel.style.width = '40px';
      supportLabel.style.textAlign = 'center';
      supportLabel.style.margin = '0 auto';
      supportLabel.style.fontSize = '18px';
      supportLabel.textContent = supportValue + '%';

      if (supportValue >= 0) {
        bar.style.left = '50%';
        bar.style.marginLeft = '1px';
        supportLabel.style.textAlign = 'left';
        supportLabel.style.position = 'absolute';
        supportLabel.style.right = `calc(50% - 45px - ${w})`;
      }
      else {
        bar.style.right = '50%';
        bar.style.marginRight = '1px';
        supportLabel.style.textAlign = 'right';
        supportLabel.style.left = `calc(50% - 45px - ${w})`;
        supportLabel.style.position = 'absolute';
      }

      if (window.innerWidth > 600) {
        barWrapper.appendChild(bar);
        barWrapper.appendChild(supportLabel)
        support.appendChild(barWrapper);
        row.appendChild(support);
      }

      if (window.innerWidth < 601) {
        const theirAns = document.createElement('td');
        theirAns.style.verticalAlign = 'middle';

        // fix vtcl cetner
        const inner = document.createElement('div');
        inner.style.display = 'flex';
        inner.style.alignItems = 'center';
        inner.style.justifyContent = 'center';
        inner.style.gap = '5px';
        inner.style.height = '100%';

        const dot = document.createElement('span');
        dot.textContent = '●';
        dot.style.fontSize = '32px';

        if (supportValue == 0) {
          dot.style.color = '#756c69';
        }
        else if (supportValue > 0) {
          dot.style.color = '#57bb8a';
        }
        else {
          dot.style.color = '#e67c73';
        }
        
        const netPct = document.createElement('span');
        netPct.textContent = supportValue + '%';
        netPct.style.fontSize = '18px';
    
        inner.appendChild(dot);
        inner.appendChild(netPct);
        theirAns.appendChild(inner);
        row.appendChild(theirAns);
      }

      const urans = document.createElement('td');
      urans.textContent = '●';
      if (answerText == 'skip') {
        urans.style.color = '#756c69';
      }
      else if (answerText == 'agree') {
        urans.style.color = '#57bb8a';
      }
      else if (answerText == 'disagree') {
        urans.style.color = '#e67c73';
      }
      urans.style.textAlign = 'right';
      urans.style.paddingRight = '15px';
      urans.style.fontSize = '32px';
      urans.style.width = '190px';
      row.appendChild(urans);
      
      tbody.appendChild(row);
    }

    tbl.appendChild(tbody);
    wrapper.appendChild(tbl);
    container.appendChild(wrapper);
    wrapper.style.position = 'relative';

    if (window.innerWidth > 600) {
      // vertical line btwn bars kinda gets messed up on weird screen sizes 
      const axisLine = document.createElement('div');
      axisLine.style.position = 'absolute';
      axisLine.style.width = '2px';
      axisLine.style.background = '#fff';
      axisLine.style.zIndex = '1';
      wrapper.appendChild(axisLine);
      requestAnimationFrame(() => {
        const supportIndex = Array.from(thead.rows[0].cells).findIndex(th => th.textContent == 'POPULARITY');
        if (supportIndex < 0 || tbody.rows.length == 0) {
          return;
        }
      const firstCell = tbody.rows[0].cells[supportIndex];
      const lastCell = tbody.rows[tbody.rows.length - 1].cells[supportIndex];
      axisLine.style.left = (firstCell.offsetLeft + firstCell.offsetWidth / 2 - 1) + 'px';
      axisLine.style.top = firstCell.offsetTop + 'px';
      axisLine.style.height = (lastCell.offsetTop + lastCell.offsetHeight - firstCell.offsetTop) + 'px';
      });
    }

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
        if (payload && payload.source == 'short') {
          window.location.href = './shortquiz.html';
        } else {
          window.location.href = './quiz.html';
        }
      });
    }

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
      window.location.href = './index.html';
    });
    container.appendChild(restart);
    container.appendChild(home);
  }

  if (document.readyState == 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();

})();
