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
    var demMax = 0;
    var repMax = 0;
    for (const a of (payload.answers)) {
      if (!a || a.answer == 'skip') continue;
      const q = payload.questions[a.index];
      const netSupport = Number(q['Net Support']);
      const demSupport = Number(q['Democratic Position Support']);
      const repSupport = Number(q['Republican Position Support']);
      totalMax += Math.abs(netSupport);
      demMax += Math.abs(demSupport);
      repMax += Math.abs(repSupport);
    }
    var agreeCount = 0;
    var disagreeCount = 0;
    var demCount = 0;
    var repCount = 0;
    const nonSkipped = (payload.answers).filter(a => a && a.answer !== 'skip').length;
      for (const a of (payload.answers)) {
      if (!a) continue;
      if (a.answer == 'agree') agreeCount++;
      if (a.answer == 'disagree') disagreeCount++;
      if(a.answer !== 'skip') {
        if (a.contrib2 > 0 || a.contrib3 == 0) demCount++;
        if (a.contrib3 > 0 || a.contrib2 == 0) repCount++;
      }
    }
    // make it from 0 - 100
    var oai = ((payload.totalScore / totalMax)+1)/2;
    const pct = Math.round(oai * 100);
    const rects = document.querySelectorAll('.rectangle');
    // arbitry threshold in order to get a real result
    if (nonSkipped > 5) {
      percentage.textContent = pct + '%';
      rects.forEach((r, i) => {
        const filled =  Math.round(12*pct/100);
        if (i < filled) {
          r.style.backgroundColor = '#FCBA04';
        }
      });
      // 20 answered Qs threshold to weed out the laziest yes-men. it has to be deserved.
      if (disagreeCount == 0 && nonSkipped > 20) {
        const pctg = document.createElement('percentage');
        percentage.textContent = 'YES%';
        const uhhh = document.getElementById('result');
        uhhh.textContent = 'YES';
        typology.textContent = 'THE YES-MAN';
        resultDesc.textContent = 'You’re either a bot, just clicking buttons for fun, or the unhealthiest people-pleaser alive. Do you not hold any opinions of your own, or are you just plain manipulative? Do you need to talk to a professional? Anyway, congratulations on finding this “secret” result!';
        resultQuote.textContent = '“The great art of pleasing is to appear pleased with others.”';
        quoteAuthor.textContent = '~ Lady Sarah Pennington';
        resultExamples.textContent = 'Examples: My dog, Joseph Goebbels';
        rects.forEach(r => {
        r.style.backgroundColor = '#87CEEB';
      });
      }
      else if (oai >= 0.7) {
        typology.textContent = 'THE MEDIAN VOTER';
        resultDesc.textContent = 'Twitter can’t stand you. You are the aggregate of what every neighbor in America thinks across every issue. You pretty much align with the popular consensus on every conceivable issue, and in those few areas where you don’t agree with the majority, the public is pretty evenly split. The wonks and ideologues hate you and your idiosyncratic views. Let them. You are more likely than practically anyone else to be the one who decides any election you vote in.';
        resultQuote.textContent = '“In a democracy, the people get the government they deserve.”';
        quoteAuthor.textContent = '~ Alexis de Tocqueville';
        resultExamples.textContent ='Examples: Joe Manchin, Tom Hanks, Hank Hill';
      }
      else if (oai >= 0.6) {
        typology.textContent = 'MR. POPULAR-IST';
        resultDesc.textContent = 'Admit it: you work in consulting, right? You like your token hot takes, but you like electability more. Or maybe, you’re not even cynical and you just genuinely hold normal opinions that are generally popular with the American public. At any rate, it frankly makes you something of an oddity among your increasingly ideological peers. You probably hate what’s happened to political discourse in your own party or America at-large in recent years, or you’ve become politically homeless on account of your eccentricities.';
        resultQuote.textContent = '“You campaign in poetry. You govern in prose.”';
        quoteAuthor.textContent = '~ Mario Cuomo';
        resultExamples.textContent = 'Examples: Matthew Yglesias, Tony Blair, Arnold Schwarzenegger';
      }
      else if (oai >= 0.4) {
        typology.textContent = 'THE AVERAGE JOE';
        resultDesc.textContent = 'In American politics, the median voter is a pretty eccentric character. Most Americans hold a heterogeneous mix of popular and unpopular views, and you are no exception. Odds are that your political party is a strong predictor of which unpopular views you hold. There’s really not much to say about you. While someone who holds political views closer to the median may be more normal on an issue-by-issue basis, you are probably the most common type of voter.';
        resultQuote.textContent = '“In America, anyone can be President. That’s one of the risks you take.”';
        quoteAuthor.textContent = '~ Adlai Stevenson II';
        resultExamples.textContent = 'Examples: Oprah Winfrey, Mitt Romney, Amy Klobuchar'
      }
      else if (oai >= 0.3) {
        typology.textContent = 'THE CONTRARIAN';
        resultDesc.textContent = 'You’re not confused; you’re just an asshole. That’s not a bad thing. Your political disposition is probably structured less by a coherent ideology than by a general sense of irritation. If an idea becomes fashionable, you see the stains. If an idea is ancient, you see who it serves. Whether this makes you profound or nihilistic is up for interpretation, but it certainly doesn’t win you many friends. For every election your preferred candidates lose, you can console yourself with the times history has vindicated you and your type. Abolitionists, liberals, democrats, and nationalists were all once decisive ideological minorities, and not too long ago. Today, they are hegemonic. The same, however, can also be said for eugenicists, revolutionary socialists, fascists, and isolationists, groups towards which history has been less kind.';
        resultQuote.textContent = '“Extremism in the defense of liberty is no vice; and moderation in the pursuit of justice is no virtue.”';
        quoteAuthor.textContent = '~ Barry Goldwater';
        resultExamples.textContent = 'Examples: Thomas Paine, Christopher Hitchens, Peter Thiel';
      }
      else if (oai >= 0.0) {
        typology.textContent = 'THE DEVIANT';
        resultDesc.textContent = 'Saying that you are outside the mainstream would imply that you have some relation to it. This could scarcely be further from the truth. Your views probably do not cluster in existing coalitions, and attempts to place you somewhere between left and right are more likely to send the tester up and down walls. Most people probably find your political views, and I mean most if not all of them, kinda gross– Not that you care all that much. You may share your takes or you may not, depending on whether you can be bothered to wage the inevitable conflict that would follow. You’re unlikely to be elected, but hey, at least you’re pretty likely to be screenshotted!';        resultQuote.textContent = '“Sanity is not statistical.”';
        quoteAuthor.textContent = '~ George Orwell, 1984';
        resultExamples.textContent = 'Examples: Nick Land, Lyndon LaRouche, Travis Bickle';
      }
    }
    else {
      const pctg = document.createElement('percentage');
      percentage.textContent = 'NULL%';
      const uhhh = document.getElementById('result');
      uhhh.textContent = 'LAZY';
      typology.textContent = 'UNOPINIONATED';
      resultDesc.textContent = 'You skipped (almost) every question, no fun label and description for you!'
      resultQuote.textContent = '“If you expect nothing from somebody you are never disappointed.”';
      quoteAuthor.textContent = '~ Sylvia Plath';
      resultExamples.textContent = 'Examples: ...';
      rects.forEach(r => {
        r.style.backgroundColor = '#756c69';
      });
    }
    
    const answeredP = document.createElement('p');
    answeredP.style.marginBottom = '0px';
    answeredP.textContent = `Answered questions: ${nonSkipped} / ${payload.questions.length}`;
    resultDescBox.appendChild(answeredP);

    const countsP = document.createElement('p');
    countsP.textContent = `Agreed: ${agreeCount} — Disagreed: ${disagreeCount}`;
    countsP.style.marginTop = '0px';
    countsP.style.marginBottom = '0px';
    resultDescBox.appendChild(countsP);

    const rawScore = document.createElement('p');
    rawScore.style.marginTop = '0px';
    rawScore.style.marginBottom = '0px';
    rawScore.textContent = `Raw score: ${payload.totalScore + totalMax} / ${2 * totalMax}`;
    resultDescBox.appendChild(rawScore);
    
    const partisanCount = document.createElement('p');
    partisanCount.style.marginTop = '0px';
    partisanCount.style.marginBottom = '0px';
    partisanCount.textContent = `Democratic: ${demCount} — Republican: ${repCount}`;
    resultDescBox.appendChild(partisanCount);
    
    const partisanScore = document.createElement('p');
    partisanScore.style.marginTop = '0px';
    partisanScore.style.marginBottom = '0px';
    partisanScore.textContent = `Raw Dem: ${payload.demScore + demMax} / ${demMax * 2} — Raw Rep: ${payload.repScore + repMax} / ${repMax * 2}`;
    resultDescBox.appendChild(partisanScore);

    percentDem = Math.round(((payload.demScore + demMax)/(demMax * 2))*100);
    percentRep = Math.round(((payload.repScore + repMax)/(repMax * 2))*100);

    const partisanPct = document.createElement('p');
    partisanPct.style.marginTop = '0px';
    partisanPct.style.marginBottom = '0px';
    partisanPct.textContent = `Pct Dem: ${percentDem}% — Pct Rep: ${percentRep}%`;
    resultDescBox.appendChild(partisanPct);

    const partisanRatio = document.createElement('p');
    partisanRatio.style.marginTop = '0px';
    partisanRatio.style.marginBottom = '0px';
    partisanRatio.textContent = `Dem/Rep ratio: ${(percentDem/percentRep).toFixed(2)}:1 — Rep/Dem ratio: ${(percentRep/percentDem).toFixed(2)}:1`;
    resultDescBox.appendChild(partisanRatio);

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
    qNum.style.cursor = 'pointer';
    qNum.addEventListener('click', () => {
      sortTable(0);
    })
    headRow.appendChild(qNum);

    const titlePolicy = document.createElement('th');
    titlePolicy.textContent = 'POLICY';
    titlePolicy.style.cursor = 'pointer';
    titlePolicy.addEventListener('click', () => {
      sortTable(0);
    })
    headRow.appendChild(titlePolicy);

    const supportHead = document.createElement('th');
    if (window.innerWidth > 540) {
    supportHead.textContent = 'POPULARITY';
    }
    else {
      supportHead.textContent = 'NET SUPPORT'
    }
    supportHead.style.textAlign = 'center';
    supportHead.style.cursor = 'pointer';
    supportHead.addEventListener('click', () => {
      sortTable(4);
    })
    headRow.appendChild(supportHead);

    const urAns = document.createElement('th');
    urAns.textContent = 'YOUR ANSWER';
    urAns.style.textAlign = 'right';
    urAns.style.cursor = 'pointer';
    urAns.addEventListener('click', () => {
      sortTable(5);
    })
    headRow.appendChild(urAns);

    const hiddenSptHead = document.createElement('th');
    hiddenSptHead.style.display = 'none';
    headRow.appendChild(hiddenSptHead);

    const hiddenAnsHead = document.createElement('th');
    hiddenAnsHead.style.display = 'none';
    headRow.appendChild(hiddenAnsHead);
    
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
      const magnitude = Math.abs(supportValue);
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

      const hiddenSptValue = supportValue + 101;
      const hiddenSpt = document.createElement('td');
      hiddenSpt.textContent = hiddenSptValue;
      hiddenSpt.style.display = 'none';
      row.appendChild(hiddenSpt);

      const hiddenAns = document.createElement('td');
      hiddenAns.textContent = answerText;
      hiddenAns.style.display = 'none';
      row.appendChild(hiddenAns);

      tbody.appendChild(row);
    }

    tbl.appendChild(tbody);
    wrapper.appendChild(tbl);
    container.appendChild(wrapper);
    wrapper.style.position = 'relative';

    if (window.innerWidth > 540) {
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
    
    //from W3 Schools with some edits
    function sortTable(n) {
      var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
      table = tbl;
      switching = true;
      // Set the sorting direction to ascending:
      dir = "asc";
      /* Make a loop that will continue until
      no switching has been done: */
      while (switching) {
        // Start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        /* Loop through all table rows (except the
        first, which contains table headers): */
        for (i = 1; i < (rows.length - 1); i++) {
          // Start by saying there should be no switching:
          shouldSwitch = false;
          /* Get the two elements you want to compare,
          one from current row and one from the next: */
          x = rows[i].getElementsByTagName("TD")[n];
          y = rows[i + 1].getElementsByTagName("TD")[n];
          x2 = x.innerHTML.toLowerCase();
          y2 = y.innerHTML.toLowerCase();
          /* Check if the two rows should switch place,
          based on the direction, asc or desc: */
          if (dir == "asc") {
            if (x2.localeCompare(y2, undefined, {numeric: true, sensitivity: 'base'}) == 1) {
              shouldSwitch = true;
              // If so, mark as a switch and break the loop:
              break;
            }
          } else if (dir == "desc") {
            if (y2.localeCompare(x2, undefined, {numeric: true, sensitivity: 'base'}) == 1) {
              // If so, mark as a switch and break the loop:
              shouldSwitch = true;
              break;
            }
          }
        }
        if (shouldSwitch) {
          /* If a switch has been marked, make the switch
          and mark that a switch has been done: */
          rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
          switching = true;
          // Each time a switch is done, increase this count by 1:
          switchcount ++;
        } else {
          /* If no switching has been done AND the direction is "asc",
          set the direction to "desc" and run the while loop again. */
          if (switchcount == 0 && dir == "asc") {
            dir = "desc";
            switching = true;
          }
        }
      }
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
