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
		const netSupport = Number(q['Net Support']);
		// arbitrary weights rn
		const salience = Number(q['Salience']);
		// redundant now since salience is dead
		const agreeScore = salience * netSupport;
		if (answer == 'agree') return agreeScore;
		if (answer == 'disagree') return -agreeScore;
		// if skipped
		return 0;
	}

	// tentative partisan version
	function computeContribution2(q, answer) {
		const demSupport = Number(q['Democratic Position Support']);
		const proposer = q['Coding'];
		if (proposer == 'Democratic') {
			if (answer == 'agree') return demSupport;
			if (answer == 'disagree') return -demSupport;
			return 0;
		}
		if (proposer == 'Republican') {
			if (answer == 'agree') return -demSupport;
			if (answer == 'disagree') return demSupport;
			return 0;
		}
		return 0;
	}

	function computeContribution3(q, answer) {
		const repSupport = Number(q['Republican Position Support']);
		const proposer = q['Coding'];
		if (proposer == 'Republican') {
			if (answer == 'agree') return repSupport;
			if (answer == 'disagree') return -repSupport;
			return 0;
		}
		if (proposer == 'Democratic') {
			if (answer == 'agree') return -repSupport;
			if (answer == 'disagree') return repSupport;
			return 0;
		}
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
		const title = q['Policy'];
		const policyText = q['Policy Text'];
		proposal.innerHTML = '';
		const h = document.createElement('h2');
		h.style.marginBottom = '-3px';
		h.style.marginTop = '3px';
		h.textContent = title;
		proposal.appendChild(h);
		const p = document.createElement('p');
		p.textContent = policyText;
		proposal.appendChild(p);

		if(q['Bipartisan']) {
			// supporter arguments
			left.innerHTML = '';
			const sHeader = document.createElement('p');
			sHeader.className = 'sup';
			sHeader.textContent = 'SUPPORTERS SAY...';
			left.appendChild(sHeader);
			const supArgs = [];
			if (q['Supporter Argument 1'] && q['Supporter Argument 1']) supArgs.push(q['Supporter Argument 1']);
			if (q['Supporter Argument 2'] && q['Supporter Argument 2']) supArgs.push(q['Supporter Argument 2']);
			const chosenSup = supArgs.length ? supArgs[Math.floor(Math.random() * supArgs.length)] : '';
			const sP = document.createElement('p');
			sP.textContent = chosenSup;
			left.appendChild(sP);

			// opponent argyments
			right.innerHTML = '';
			const oHeader = document.createElement('p');
			oHeader.className = 'opp';
			oHeader.textContent = 'OPPONENTS SAY...';
			right.appendChild(oHeader);
			const oppArgs = [];
			if (q['Opponent Argument 1'] && q['Opponent Argument 1']) oppArgs.push(q['Opponent Argument 1']);
			if (q['Opponent Argument 2'] && q['Opponent Argument 2']) oppArgs.push(q['Opponent Argument 2']);
			const chosenOpp = oppArgs.length ? oppArgs[Math.floor(Math.random() * oppArgs.length)] : '';
			const oP = document.createElement('p');
			oP.textContent = chosenOpp;
			right.appendChild(oP);
		}

		else {
			// left arguments
			left.innerHTML = '';
			const dHeader = document.createElement('p');
			dHeader.className = 'dem';
			dHeader.textContent = 'DEMOCRATS SAY...';
			left.appendChild(dHeader);
			const demArgs = [];
			if (q['Democratic Argument 1'] && q['Democratic Argument 1']) demArgs.push(q['Democratic Argument 1']);
			if (q['Democratic Argument 2'] && q['Democratic Argument 2']) demArgs.push(q['Democratic Argument 2']);
			const chosenDem = demArgs.length ? demArgs[Math.floor(Math.random() * demArgs.length)] : '';
			const dP = document.createElement('p');
			dP.textContent = chosenDem;
			left.appendChild(dP);

			// right arguments
			right.innerHTML = '';
			const rHeader = document.createElement('p');
			rHeader.className = 'rep';
			rHeader.textContent = 'REPUBLICANS SAY...';
			right.appendChild(rHeader);
			const repArgs = [];
			if (q['Republican Argument 1'] && q['Republican Argument 1']) repArgs.push(q['Republican Argument 1']);
			if (q['Republican Argument 2'] && q['Republican Argument 2']) repArgs.push(q['Republican Argument 2']);
			const chosenRep = repArgs.length ? repArgs[Math.floor(Math.random() * repArgs.length)] : '';
			const rP = document.createElement('p');
			rP.textContent = chosenRep;
			right.appendChild(rP);
		}

		// show user their progress
		const progress = document.getElementById('progress');
		if (progress) progress.textContent = `Question ${index + 1} / ${total}`;
		
	}		

	const state = {
		questions: [],
		index: 0,
		totalScore: 0,
		demScore: 0,
		repScore: 0,
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
				"Democratic Position Support": Number(q['Democratic Position Support']),
				"Republican Position Support": Number(q['Republican Position Support'])
			})),
			answers: state.answers,
			totalScore: state.totalScore,
			demScore: state.demScore,
			repScore: state.repScore,
		};
		payload.source = 'short';
		localStorage.setItem('normiemeter_results', JSON.stringify(payload));
		// go to results page
		window.location.href = './results.html';
	}

	// setting up the buttons + main question
	function renderButtons() {
		// do u agree tbh
		const yesNo = document.createElement('p');
		yesNo.style.fontSize = '24px';
		yesNo.style.textAlign = 'center';
		if (window.innerWidth < 601) {
			yesNo.style.fontSize = '16px';
		}
		yesNo.textContent = 'This proposal should be implemented.';
		yesNo.style.marginTop = '0px';
		yesNo.style.marginBottom = '0px';

		// agree button
		const agree = document.createElement('button');
		agree.id = 'agreeBtn';
		agree.className = 'button';
		agree.textContent = 'AGREE';
		agree.style.fontFamily = 'Inconsolata';
		agree.style.fontWeight = 'bold';
		agree.style.marginBottom = '0px'
		agree.style.marginTop = '0px';
		agree.onclick = () => {
			const q = state.questions[state.index];
			const contrib = computeContribution(q, 'agree');
			const contrib2 = computeContribution2(q, 'agree');
			const contrib3 = computeContribution3(q, 'agree');
			state.totalScore += contrib;
			state.demScore += contrib2;
			state.repScore += contrib3;
			state.answers.push({index: state.index, answer: 'agree', contrib, contrib2, contrib3});
			nextQuestion();
		};

		// disagree button
		const disagree = document.createElement('button');
		disagree.id = 'disagreeBtn';
		disagree.className = 'button';
		disagree.textContent = 'DISAGREE';
		disagree.style.fontFamily = 'Inconsolata';
		disagree.style.fontWeight = 'bold'
		disagree.style.marginRight = '0px';
		disagree.style.marginBottom = '0px'
		disagree.style.marginTop = '0px';
		disagree.onclick = () => {
			const q = state.questions[state.index];
			const contrib = computeContribution(q, 'disagree');
			const contrib2 = computeContribution2(q, 'disagree');
			const contrib3 = computeContribution3(q, 'disagree');
			state.totalScore += contrib;
			state.demScore += contrib2;
			state.repScore += contrib3;
			state.answers.push({index: state.index, answer: 'disagree', contrib, contrib2, contrib3});
			nextQuestion();
		};
		
		// back button
		const back = document.createElement('p');
		back.id = 'backBtn';
		back.style.fontWeight = 'bold';
		back.style.fontSize = '20px';
		back.style.color = '#ab9d98';
		back.onmouseover = () => {
			back.style.color = '#7a605b';
		};
		back.onmouseout = () => {
			back.style.color = '#ab9d98';
		};
		back.style.textDecoration = 'underline'
		back.style.cursor = 'pointer';
		back.style.fontFamily = 'Inconsolata';
		back.textContent = '⏮ PREV.';
		back.style.margin = '0 auto';
		back.style.marginTop = '2px';
		back.style.display = 'inline-block';
		// prev question
		// adjust score
		back.onclick = () => {
			if (state.index > 0) {
				state.index--;
				const answerIndex = state.answers.findIndex(q => q.index == state.index);
				if (answerIndex !== -1) {
					const removedAnswer = state.answers.splice(answerIndex, 1)[0];
					state.totalScore -= removedAnswer.contrib;
					state.demScore -= removedAnswer.contrib2;
					state.repScore -= removedAnswer.contrib3;
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
		skip.style.fontSize = '20px';
		skip.onmouseover = () => {
			skip.style.color = '#7a605b';
		};
		skip.onmouseout = () => {
			skip.style.color = '#ab9d98';
		};
		skip.style.fontFamily = 'Inconsolata';
		skip.style.textDecoration = 'underline';
		skip.style.cursor = 'pointer';
		skip.textContent = 'SKIP ⏭';
		skip.style.width = 'fit-content';
		skip.style.margin = '0 auto';
		skip.style.marginTop = '2px';
		skip.style.display = 'inline-block';
		// skips, 0 contrib
		skip.onclick = () => {
			const q = state.questions[state.index];
			const contrib = computeContribution(q, 'skip');
			const contrib2 = computeContribution2(q, 'skip');
			const contrib3 = computeContribution3(q, 'skip');
			state.answers.push({index: state.index, answer: 'skip', contrib, contrib2, contrib3});
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
		skipToEnd.style.marginTop = '5px';
		skipToEnd.style.marginBottom = '0px';
		skipToEnd.style.display = 'inline-block';
		skipToEnd.textContent = 'Skip to the end of quiz';
		// skip = contrib 0
		skipToEnd.onclick = () => {
			for (var j = state.index; j < state.questions.length; j++) {
				if (!state.answers.some(a => a.index == j)) {
					state.answers.push({index: j, answer: 'skip', contrib: 0, contrib2: 0, contrib3: 0});
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
			spacer.style.width = '15px';
			agree.style.width = '40%'
			disagree.style.width = '40%'
			disagree.style.marginTop = "2px";
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
			// only 40 questions 
			state.questions = state.questions.slice(0, 40);
			state.index = 0;
			state.totalScore = 0;
			state.demScore = 0;
			state.repScore = 0;
			state.answers = [];
			renderQuestion(state.questions[0], 0, state.questions.length);
			renderButtons();
		});
	}
	initQuiz();

})();

