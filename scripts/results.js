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
    const pct = (oai * 100).toFixed(0);
    const rects = document.querySelectorAll('.rectangle');
    if (totalMax > 0) {
      percentage.textContent = pct + '%';
      rects.forEach((r, i) => {
        const filled =  Math.round(12*pct/100);
        if (i < filled) {
          r.style.backgroundColor = '#FCBA04';
        }
      });
      if (oai >= 0.8) {
        typology.textContent = 'NORMIE';
        resultDesc.textContent = 'Twitter can’t stand you. You are the aggregate of what every neighbor in America thinks across every issue. You pretty much align with the popular consensus on every conceivable issue, and in those few areas where you don’t agree with the majority, the public is pretty evenly split: the median voter in the truest sense of the word. If you haven’t considered running for elected office, you should. The wonks will hate you and your idiosyncratic views, but you’re the exact sort of person that Americans say they want their politicians to be. Don’t gamble on winning though: competitive partisan primaries tend to weed out milquetoast moderates like you.';
        resultQuote.textContent = '“In a democracy, the people get the government they deserve.” ~ Alexis de Tocqueville';
      }
      else if (oai >= 0.6) {
        typology.textContent = 'MR. POPULAR-IST';
        resultDesc.textContent = 'Admit it: you work in consulting, right? You like your token hot takes, but you like electability more. Or maybe, you’re not even cynical and you just genuinely hold normal opinions that are generally popular with the American public. At any rate, it’s very impressive, and it frankly makes you something of an oddity among your increasingly ideological peers.You probably seriously hate what’s happened to political discourse in your own party or America at-large in recent years. You’re the type of guy who’s in a good position to fix it.';
        resultQuote.textContent = '“You campaign in poetry. You govern in prose.” ~ Mario Cuomo';     
      }
      else if (oai >= 0.4) {
        typology.textContent = 'THE PARTISAN';
        resultDesc.textContent = 'Politics isn’t your personality, but it’s a team sport and one you feel obliged to play. Whether or not you have an “ideology” per se, you certainly know who “your people” are and what “your side” believes. You probably enjoy respectable, partisan media of the sort one might find on cable TV or in legacy newspapers, and you’re nagged by a mild, but persistent sense that the country would be so much better off if those other guys were just a bit less insane. You’re persuadable within an Overton window facing in a given direction, and you’re reasonable, at least to all the other guys within a standard deviation of your own views. For all our talk of the “median voter”, you are probably the most common type of American voter.';
        resultQuote.textContent = '“Treat everyone as your friend, but know who your friends are.” ~ Nancy Pelosi';
      }
      else if (oai >= 0.2) {
        typology.textContent = 'THE IDEOLOGUE';
        resultDesc.textContent = 'You do not merely support some positions and oppose others. You drink, eat, breath, and shelter in the sublime object of ideology. It is not only a lens through which to view the world, but a framework, a theory of power, and a list of villains that writes your existence into a grand historical narrative in which you and your compatriots are the heroes of history, the hand of God, the final synthesis of the dialectic. Moderation is not a neutral stance, but a rhetorical cudgel. Compromise is not a secular disappointment, but a moral failure. Fine, you may be unpopular, but you’re right. If so, let’s hope the world comes around to your view.';
        resultQuote.textContent = '“Extremism in the defense of liberty is no vice; and moderation in the pursuit of justice is no virtue.” ~ Barry Goldwater';
      }
      else if (oai >= 0.0) {
        typology.textContent = 'FREAK DEVIANT';
        resultDesc.textContent = 'Saying that you are outside the mainstream would imply that you have some relation to it. This could scarcely be further from the truth. Your views do not cluster in existing coalitions, and attempts to place you somewhere between left and right are more likely to send the tester up and down walls. Most people probably find your political views, and I mean most if not all of them, kinda gross– Not that you care all that much. You may share your takes or you may not, depending on whether you can be bothered to wage the inevitable conflict that would follow. You’re unlikely to be elected, but hey, at least you’re pretty likely to be screenshotted!'; 
        resultQuote.textContent = '“Sanity is not statistical.” ~ Winston Smith in 1984';    
      }
    }
    else {
      const pctg = document.createElement('percentage');
      percentage.textContent = '--%';
      typology.textContent = 'UNOPINIONATED';
      resultDesc.textContent = '???'
      rects.forEach(r => {
        r.style.backgroundColor = '#ffffff';
      });
    }

    const nonSkipped = (payload.answers).filter(a => a && a.answer !== 'skip').length || 0;
    const answeredP = document.createElement('p');
    answeredP.style.marginBottom = '-14px';
    answeredP.textContent = `Answered questions: ${nonSkipped} / ${payload.questions.length}`;
    resultDescBox.appendChild(answeredP);

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
    resultDescBox.appendChild(countsP);

    const wrapper = document.createElement('div');
    wrapper.style.maxHeight = '60vh';
    wrapper.style.overflow = 'auto';
    wrapper.style.marginLeft = "0%";
    wrapper.style.marginRight = "0%";
    wrapper.style.border = "2px solid #443e3c";

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

      const supportValue = Math.trunc(Number(q['Net Support']));
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
        bar.style.marginRight = '0px';
        supportLabel.style.textAlign = 'right';
        supportLabel.style.left = `calc(50% - 45px - ${w})`;
        supportLabel.style.position = 'absolute';
      }

      if (window.innerWidth > 540) {
        barWrapper.appendChild(bar);
        barWrapper.appendChild(supportLabel)
        support.appendChild(barWrapper);
        row.appendChild(support);
      }

      if (window.innerWidth < 541) {
        const theirAns = document.createElement('td');
        theirAns.style.verticalAlign = 'middle';

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
      axisLine.style.background = '#ffffff';
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

    /* const restart = document.createElement('button');
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
      */

    const home = document.createElement('button');
    home.id = 'home';
    home.textContent = 'TAKE ANOTHER QUIZ?';
    home.style.fontFamily = 'Inconsolata';
    home.style.marginLeft = '8px';
    home.style.width = '220px';
    home.style.fontSize = '20px';
    home.style.marginTop = '10px';
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
      window.location.href = './instructions.html';
    });
    // container.appendChild(restart);
    container.appendChild(home);
  }

  if (document.readyState == 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();

})();
