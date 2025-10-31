// normiemeter quiz logic

(() => {
	// parse csv
	function parseCSV(text) {
		return Papa.parse(text).data;
	}

	// create array from csv
	function rowsToObjects(rows) {
		const header = rows[0].map(h => h.trim());
		const objs = [];
		// start after header
		for (var i = 1; i < rows.length; i++) {
			const row = rows[i];
			const obj = {};
			for (var j = 0; j < header.length; j++) {
				obj[header[j]] = row[j].trim();
			}
			objs.push(obj);
		}
		return objs;
	}

	// shuffle the questions
	function shuffleArray(arr) {
		arr.sort(() => Math.random() - 0.5);
	}

	// calc how much question contributes to the score
	function computeContribution(q, answer) {
		// net support determined from the original PAC survey
		const netSupport = Number(q['Net Support']);
		// arbitrary weights rn
		const salience = Number(q['Salience']);
		// calculate
		const agreeScore = salience * netSupport;
		if (answer == 'agree') return agreeScore;
		if (answer == 'disagree') return -agreeScore;
		// if skipped
		return 0;
	}

	// progress element
	let progress = document.getElementById('progress');
	if (!progress) {
		progress = document.createElement('div');
		progress.id = 'progress';
		progress.style.marginTop = '6px';
		const content = document.getElementById('content');
		content.insertBefore(progress, content.firstChild);
	}

	// render policy and arguments
	function renderQuestion(q, index, total) {
		const proposal = document.getElementById('proposal');
		const left = document.getElementById('lefttake');
		const right = document.getElementById('righttake');
		if (!proposal || !left || !right) return;

		// policy title and description
		const title = q['Policy'] || q['Policy Text'] || 'Untitled';
		const policyText = q['Policy Text'] || q['Policy'] || '';
		proposal.innerHTML = '';
		const h = document.createElement('h2');
		h.style.marginBottom = '-3px';
		h.style.marginTop = '3px';
		h.textContent = title;
		proposal.appendChild(h);
		const p = document.createElement('p');
		p.textContent = policyText;
		proposal.appendChild(p);

		// left arguments
		left.innerHTML = '';
		right.innerHTML = '';
		const dHeader = document.createElement('p');
		dHeader.className = 'dem';
		dHeader.textContent = 'Democrats say...';
		const d1 = document.createElement('p');
		const d2 = document.createElement('p');
		d1.textContent = q['Democratic Argument 1'] || '';
		d2.textContent = q['Democratic Argument 2'];
		left.appendChild(dHeader);
		left.appendChild(d1);
		left.appendChild(d2);


		// right arguments
		const rHeader = document.createElement('p');
		rHeader.className = 'rep';
		rHeader.textContent = 'Republicans say...';
		const r1 = document.createElement('p');
		const r2 = document.createElement('p');
		r1.textContent = q['Republican Argument 1'] || '';
		r2.textContent = q['Republican Argument 2'];
		right.appendChild(rHeader);
		right.appendChild(r1);	
		right.appendChild(r2);

		// show user their progress
		const progress = document.getElementById('progress');
		if (progress) progress.textContent = `Question ${index + 1} / ${total}`;
		
	}		

	const state = {
		questions: [],
		index: 0,
		totalScore: 0,
		answers: []
	};

	function renderCurrentQuestion() {
    	renderQuestion(state.questions[state.index], state.index, state.questions.length);
	}

	function nextQuestion() {
		if (state.index >= state.questions.length - 1) {
			finishQuiz();
		} else {
			state.index++;
			
			renderCurrentQuestion();
		}
	}

	function finishQuiz() {
		var totalMax = 0;
		for (const a of state.answers) {
			if (!a || a.answer == 'skip') continue;
			const q = state.questions[a.index];
			const netSupport = Number(q['Net Support']);
			const salience = Number(q['Salience']);
			totalMax += salience * Math.abs(netSupport);
		}
		var oai = null;
		if (totalMax > 0) oai = state.totalScore / totalMax;

		// save results
		const payload = {
			questions: state.questions.map(q => ({
				Policy: q['Policy'] || q['Policy Text'] || '',
				"Policy Text": q['Policy Text'] || '',
				"Democratic Argument 1": q['Democratic Argument 1'] || '',
				"Democratic Argument 2": q['Democratic Argument 2'] || '',
				"Republican Argument 1": q['Republican Argument 1'] || '',
				"Republican Argument 2": q['Republican Argument 2'] || '',
				"Net Support": Number(q['Net Support']),
				Salience: Number(q['Salience'])
			})),
			answers: state.answers,
			totalScore: state.totalScore
		};
		localStorage.setItem('normiemeter_results', JSON.stringify(payload));
		// go to results page
		window.location.href = './results.html';
	}

	// proposals and choices
	function renderResultsBreakdown(container) {
		const list = document.createElement('div');
		list.style.textAlign = 'left';
		list.style.marginTop = '12px';
		const header = document.createElement('p');
		header.style.fontWeight = 'bold';
		header.textContent = 'Per-question breakdown:';
		list.appendChild(header);
		const ul = document.createElement('ul');
		for (var i = 0; i < state.questions.length; i++) {
			const q = state.questions[i];
			const ans = state.answers.find(a => a.index == i);
			const li = document.createElement('li');
			const title = q['Policy'] || q['Policy Text'] || `Question ${i+1}`;
			const answerText = ans ? ans.answer : 'unseen';
			const contribText = ans ? (ans.contrib || 0).toFixed(3) : '0.000';
			li.textContent = `${title} — ${answerText} (contrib: ${contribText})`;
			ul.appendChild(li);
		}
		list.appendChild(ul);
		container.appendChild(list);
	}

	// setting up the buttons + main question
	function renderButtons() {
		// do u agree tbh
		const yesNo = document.createElement('p');
		yesNo.style.fontSize = '24px';
		yesNo.textContent = 'This proposal should be implemented.';
		yesNo.style.marginBottom = '0px';

		// agree button
		const agree = document.createElement('button');
		agree.id = 'agreeBtn';
		agree.className = 'button';
		agree.textContent = 'Agree';
		agree.style.fontFamily = 'Inconsolata';
		agree.style.fontWeight = 'bold';
		agree.style.marginBottom = '0px'
		agree.onclick = () => {
			const q = state.questions[state.index];
			const contrib = computeContribution(q, 'agree');
			state.totalScore += contrib;
			state.answers.push({index: state.index, answer: 'agree', contrib});
			nextQuestion();
		};

		// disagree button
		const disagree = document.createElement('button');
		disagree.id = 'disagreeBtn';
		disagree.className = 'button';
		disagree.textContent = 'Disagree';
		disagree.style.fontFamily = 'Inconsolata';
		disagree.style.fontWeight = 'bold'
		disagree.style.marginRight = '0px';
		disagree.style.marginBottom = '0px';
		disagree.onclick = () => {
			const q = state.questions[state.index];
			const contrib = computeContribution(q, 'disagree');
			state.totalScore += contrib;
			state.answers.push({index: state.index, answer: 'disagree', contrib});
			nextQuestion();
		};
		
		// back button
		const back = document.createElement('p');
		back.id = 'backBtn';
		back.style.fontWeight = 'bold';
		back.style.color = '#ab9d98';
		back.onmouseover = () => {
			back.style.color = '#7a605b';
		};
		back.onmouseout = () => {
			back.style.color = '#ab9d98';
		};
		back.style.fontSize = '40px';
		back.style.textDecoration = 'underline'
		back.style.cursor = 'pointer';
		back.style.fontFamily = 'Inconsolata';
		back.textContent = '⏮';
		back.style.margin = '0 auto';
		back.style.marginTop = '0px';
		back.style.display = 'inline-block';
		back.style.width = 'fit-content';
		// prev question
		// adjust score
		back.onclick = () => {
			if (state.index > 0) {
				state.index--;
				const answerIndex = state.answers.findIndex(q => q.index == state.index);
				if (answerIndex !== -1) {
					const removedAnswer = state.answers.splice(answerIndex, 1)[0];
					state.totalScore -= removedAnswer.contrib;
				}
				renderCurrentQuestion();
			}
			// home if it's the first question
			else {
				window.location.href = './index.html'
			}
		};

		// skip
		const skip = document.createElement('p');
		skip.id = 'skipBtn';
		skip.style.fontWeight = 'bold';
		skip.style.color = '#ab9d98';
		skip.onmouseover = () => {
			skip.style.color = '#7a605b';
		};
		skip.onmouseout = () => {
			skip.style.color = '#ab9d98';
		};
		skip.style.fontSize = '40px';
		skip.style.fontFamily = 'Inconsolata';
		skip.style.textDecoration = 'underline';
		skip.style.cursor = 'pointer';
		skip.textContent = '⏭';
		skip.style.width = 'fit-content';
		skip.style.margin = '0 auto';
		skip.style.marginTop = '0px';
		skip.style.display = 'inline-block';
		// skips, 0 contrib
		skip.onclick = () => {
			const q = state.questions[state.index];
			const contrib = computeContribution(q, 'skip');
			state.answers.push({index: state.index, answer: 'skip', contrib});
			nextQuestion();
		};

		// skips to end
		const skipToEnd = document.createElement('p');
		skipToEnd.id = 'skipToEndBtn';
		skipToEnd.style.color = '#ab9d98';
		skipToEnd.style.fontSize = '16px';
		skipToEnd.style.textDecoration = 'underline';
		skipToEnd.style.cursor = 'pointer';
		skipToEnd.style.marginLeft = '0px';
		skipToEnd.style.marginTop = '10px';
		skipToEnd.style.display = 'inline-block';
		skipToEnd.textContent = 'Skip to the end of quiz';
		// skip = contrib 0
		skipToEnd.onclick = () => {
			for (var j = state.index; j < state.questions.length; j++) {
				if (!state.answers.some(a => a.index == j)) {
					state.answers.push({index: j, answer: 'skip', contrib: 0});
				}
			}
			finishQuiz();
		};

		// controls
		const content = document.getElementById('content') || document.body;
		const controls = document.createElement('div');
		content.appendChild(controls);

		const spacer = document.createElement('span');
			spacer.style.display = 'inline-block';
			spacer.style.width = '20px';

		// remove spacer on small screens
		if (window.innerWidth < 601) {
			spacer.style.width = '0px';
		}

		const spacer2 = document.createElement('span');
			spacer2.style.display = 'inline-block';
			spacer2.style.width = '40px';

		// all the buttons!!!!!!!!
		controls.id = 'quizControls';
		controls.style.marginTop = '10px';
		controls.appendChild(yesNo);
		controls.appendChild(agree);
			controls.appendChild(spacer);
		controls.appendChild(disagree);
			controls.appendChild(document.createElement('br'));
		controls.appendChild(back);
			controls.appendChild(spacer2);
		controls.appendChild(skip);
			controls.appendChild(document.createElement('br'));
		controls.appendChild(skipToEnd);
	}

	function initQuiz() {
		fetch('./data/surveyData.csv')
		.then(res => res.text())
		.then(text => {
			const rows = parseCSV(text);
			const objs = rowsToObjects(rows);
			state.questions = objs.filter(o => o['Policy'] && o['Policy'].length > 0);
			shuffleArray(state.questions);
			state.index = 0;
			state.totalScore = 0;
			state.answers = [];
			renderQuestion(state.questions[0], 0, state.questions.length);
			renderButtons();
		});
	}
	initQuiz();

})();

