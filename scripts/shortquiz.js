// Quiz logic for Normiemeter
// Loads data/surveyData.csv, steps through questions, and computes a running score.
// Scoring rules (from user):
// - If netSupport >= 0, agree adds +1 * salience * netSupport
// - If netSupport <  0, agree adds -1 * salience * netSupport
// - Disagree adds the negative of the agree contribution
// - Skip adds 0

(() => {
	// DOM element helpers
	const $ = id => document.getElementById(id);

	// Create a results area if not present
	function ensureResultArea() {
		let r = $('results');
		if (!r) {
			r = document.createElement('div');
			r.id = 'results';
			r.style.marginTop = '20px';
			const content = document.getElementById('content') || document.body;
			content.appendChild(r);
		}
		return r;
	}

	// Robust CSV parser that handles quoted fields and newlines inside quoted fields.
	function parseCSV(text) {
		const rows = [];
		let cur = '';
		let row = [];
		let inQuotes = false;
		for (let i = 0; i < text.length; i++) {
			const ch = text[i];
			if (ch === '"') {
				// If next char is also a quote, it's an escaped quote
				if (inQuotes && text[i + 1] === '"') {
					cur += '"';
					i++; // skip next
				} else {
					inQuotes = !inQuotes;
				}
			} else if (ch === ',' && !inQuotes) {
				row.push(cur);
				cur = '';
			} else if ((ch === '\n' || ch === '\r') && !inQuotes) {
				// handle CRLF and LF
				if (cur !== '' || row.length > 0) {
					row.push(cur);
					rows.push(row);
					row = [];
					cur = '';
				}
				// skip additional \n in CRLF
				if (ch === '\r' && text[i + 1] === '\n') i++;
			} else {
				cur += ch;
			}
		}
		// push last
		if (cur !== '' || row.length > 0) {
			row.push(cur);
			rows.push(row);
		}
		return rows;
	}

	// Convert CSV rows to question objects using header row
	function rowsToObjects(rows) {
		if (!rows || rows.length === 0) return [];
		const header = rows[0].map(h => h.trim());
		const objs = [];
		for (let i = 1; i < rows.length; i++) {
			const row = rows[i];
			// skip if empty or shorter than header
			if (!row || row.length === 0) continue;
			const obj = {};
			for (let j = 0; j < header.length; j++) {
				obj[header[j]] = (row[j] !== undefined) ? row[j].trim() : '';
			}
			objs.push(obj);
		}
		return objs;
	}

	// In-place Fisher-Yates shuffle
	function shuffleArray(arr) {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const tmp = arr[i];
			arr[i] = arr[j];
			arr[j] = tmp;
		}
	}

	// Compute contribution given question object and answer ('agree'|'disagree'|'skip')
	function computeContribution(q, answer) {
		const netSupport = Number(q['Net Support']) || 0;
		const salience = Number(q['Salience']) || 0;
		// contribution: agreeing gives salience * netSupport (positive when public supports, negative when public opposes)
		const agreeScore = salience * netSupport;
		if (answer === 'agree') return agreeScore;
		if (answer === 'disagree') return -agreeScore;
		return 0; // skip
	}

	// Render a question into the page (uses elements: #proposal, #lefttake, #righttake, #question)
	function renderQuestion(q, index, total) {
		const proposal = $('proposal');
		const left = $('lefttake');
		const right = $('righttake');
		if (!proposal || !left || !right) return;

		// Title and policy text
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

		// Ensure the proposal fades in on the first render only. If content is injected
		// after CSS animations have already run, reapply the animation once.
		try {
			if (!state._proposalAnimated) {
				proposal.style.animation = 'none';
				// force reflow
				void proposal.offsetWidth;
				proposal.style.animation = 'fadeIn 6s ease';
				state._proposalAnimated = true;
			} else {
				proposal.style.animation = '';
			}
		} catch (e) {
			// ignore failures
		}

		// left / right arguments - short quiz: show a single randomly chosen argument from each side
		left.innerHTML = '';
		right.innerHTML = '';
		const dHeader = document.createElement('p');
		dHeader.className = 'dem';
		dHeader.textContent = 'Democrats say...';
		left.appendChild(dHeader);
		const demP = document.createElement('p');
		demP.textContent = q._chosenDem || q['Democratic Argument 1'] || q['Democratic Argument 2'] || '';
		left.appendChild(demP);

		const rHeader = document.createElement('p');
		rHeader.className = 'rep';
		rHeader.textContent = 'Republicans say...';
		right.appendChild(rHeader);
		const repP = document.createElement('p');
		repP.textContent = q._chosenRep || q['Republican Argument 1'] || q['Republican Argument 2'] || '';
		right.appendChild(repP);

		// Update progress and optional debug info
		const progress = $('progress');
		if (progress) progress.textContent = `Question ${index + 1} / ${total}`;
	}

	// Main quiz state
	const state = {
		questions: [],
		index: 0,
		totalScore: 0,
		answers: []
	};

	function nextQuestion() {
		if (state.index >= state.questions.length - 1) {
			finishQuiz();
		} else {
			state.index++;
			renderQuestion(state.questions[state.index], state.index, state.questions.length);
		}
	}

	function finishQuiz() {
		const r = ensureResultArea();
		r.innerHTML = '';
		const h = document.createElement('h3');
		h.textContent = 'Results';
		r.appendChild(h);
		const scoreP = document.createElement('p');
		scoreP.textContent = `Raw score: ${state.totalScore.toFixed(3)}`;
		r.appendChild(scoreP);

		// Compute Overall Alignment Index (OAI)
		// OAI = totalScore / sum(salience * abs(netSupport)) over answered (non-skip) questions
		let totalMax = 0;
		for (const a of state.answers) {
			if (!a || a.answer === 'skip') continue;
			const q = state.questions[a.index];
			const netSupport = Number(q['Net Support']) || 0;
			const salience = Number(q['Salience']) || 0;
			totalMax += salience * Math.abs(netSupport);
		}
		let oai = null;
		if (totalMax > 0) {
			oai = state.totalScore / totalMax; // in range [-1, 1]
			const oaiPct = (oai * 100).toFixed(1);
			const oaiP = document.createElement('p');
			oaiP.textContent = `Overall Alignment Index (OAI): ${oaiPct}%`;
			r.appendChild(oaiP);
			// short interpretation
			const interpret = document.createElement('p');
			if (oai >= 0.9) {
				interpret.textContent = 'Very high alignment with the public consensus.';
			} else if (oai >= 0.6) {
				interpret.textContent = 'High alignment with the public consensus.';
			} else if (oai >= 0.2) {
				interpret.textContent = 'Moderate alignment with the public consensus.';
			} else if (oai > -0.2) {
				interpret.textContent = 'Mixed or near-neutral alignment.';
			} else if (oai > -0.6) {
				interpret.textContent = 'Low alignment with the public consensus.';
			} else {
				interpret.textContent = 'Strongly opposed to the public consensus.';
			}
			r.appendChild(interpret);
		} else {
			const oaiP = document.createElement('p');
			oaiP.textContent = 'Overall Alignment Index (OAI): — (no answered questions)';
			r.appendChild(oaiP);
		}

		// Save results to localStorage and open the separate results page
		try {
			const payload = {
				questions: state.questions.map(q => ({
					Policy: q['Policy'] || q['Policy Text'] || '',
					"Policy Text": q['Policy Text'] || '',
					"Democratic Argument 1": q['Democratic Argument 1'] || '',
					"Democratic Argument 2": q['Democratic Argument 2'] || '',
					"Republican Argument 1": q['Republican Argument 1'] || '',
					"Republican Argument 2": q['Republican Argument 2'] || '',
					"Net Support": Number(q['Net Support']) || 0,
					Salience: Number(q['Salience']) || 0,
					_chosenDem: q._chosenDem || '',
					_chosenRep: q._chosenRep || '',
					_origIndex: q._origIndex
				})),
				answers: state.answers,
				totalScore: state.totalScore
			};
			// mark that these results came from the short quiz
			payload.source = 'short';
			localStorage.setItem('normiemeter_results', JSON.stringify(payload));
			// redirect to results page
			window.location.href = './results.html';
		} catch (err) {
			console.error('Failed to save/redirect to results page:', err);
			// fall back to inline results if localStorage or redirect fails
			const r = ensureResultArea();
			r.innerHTML = '';
			const h = document.createElement('h3');
			h.textContent = 'Results (inline fallback)';
			r.appendChild(h);
			const scoreP = document.createElement('p');
			scoreP.textContent = `Raw score: ${state.totalScore.toFixed(3)}`;
			r.appendChild(scoreP);
			const nonSkipped = state.answers.filter(a => a.answer !== 'skip').length || 0;
			const avgP = document.createElement('p');
			avgP.textContent = `Answered questions: ${nonSkipped} / ${state.questions.length}`;
			r.appendChild(avgP);
			renderResultsBreakdown(r);
			console.log('Quiz complete. State:', state);
		}
	}

	// Render a breakdown list of proposals and chosen positions
	function renderResultsBreakdown(container) {
		const list = document.createElement('div');
		list.style.textAlign = 'left';
		list.style.marginTop = '12px';
		const header = document.createElement('p');
		header.style.fontWeight = 'bold';
		header.textContent = 'Per-question breakdown:';
		list.appendChild(header);
		const ul = document.createElement('ul');
		for (let i = 0; i < state.questions.length; i++) {
			const q = state.questions[i];
			const ans = state.answers.find(a => a.index === i);
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

	// Attach handlers to buttons
	function attachHandlers() {
		const agree = document.createElement('button');
		agree.id = 'agreeBtn';
		agree.className = 'button';
		agree.textContent = 'Agree';
		agree.style.marginRight = '10px';
		agree.style.marginLeft = '10px';
		agree.style.marginBottom = '0px';
		agree.onclick = () => {
			const q = state.questions[state.index];
			const contrib = computeContribution(q, 'agree');
			state.totalScore += contrib;
			state.answers.push({index: state.index, answer: 'agree', contrib});
			console.log(`Q${state.index+1} agree -> ${contrib.toFixed(3)}`);
			nextQuestion();
		};

		const disagree = document.createElement('button');
		disagree.id = 'disagreeBtn';
		disagree.className = 'button';
		disagree.style.marginRight = '0px';
		disagree.textContent = 'Disagree';
		disagree.onclick = () => {
			const q = state.questions[state.index];
			const contrib = computeContribution(q, 'disagree');
			state.totalScore += contrib;
			state.answers.push({index: state.index, answer: 'disagree', contrib});
			console.log(`Q${state.index+1} disagree -> ${contrib.toFixed(3)}`);
			nextQuestion();
		};

		// Skip as plain text (styled paragraph) per design request
		const skip = document.createElement('p');
		skip.id = 'skipBtn';
		skip.style.fontWeight = 'bold';
		skip.style.color = '#ab9d98';
		skip.style.fontSize = '18px';
		skip.style.textDecoration = 'underline';
		skip.style.cursor = 'pointer';
		skip.style.margin = '-6px 0 0 0';
		skip.textContent = 'Skip this question';
		skip.onclick = () => {
			const q = state.questions[state.index];
			const contrib = computeContribution(q, 'skip');
			state.answers.push({index: state.index, answer: 'skip', contrib});
			console.log(`Q${state.index+1} skip -> ${contrib.toFixed(3)}`);
			nextQuestion();
		};
		skip.tabIndex = 0;
		skip.setAttribute('role', 'button');
		skip.onkeydown = (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				skip.onclick();
			}
		};

		// Skip to end button for debugging: mark remaining unseen questions as skipped and finish
		// Skip to end as plain text
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
		skipToEnd.onclick = () => {
			// For any question index not yet recorded in state.answers, add a skip entry
			for (let j = state.index; j < state.questions.length; j++) {
				if (!state.answers.some(a => a.index === j)) {
					state.answers.push({index: j, answer: 'skip', contrib: 0});
				}
			}
			// Set index to last question so finish logic (if any) is consistent
			state.index = state.questions.length - 1;
			finishQuiz();
		};
		skipToEnd.tabIndex = 0;
		skipToEnd.setAttribute('role', 'button');
		skipToEnd.onkeydown = (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				skipToEnd.onclick();
			}
		};

			// Insert UI buttons into placeholder if present, otherwise append after question area
			const placeholder = $('quizControlsPlaceholder');
			const content = document.getElementById('content') || document.body;
			const controls = document.createElement('div');
			controls.id = 'quizControls';
			controls.style.marginTop = '10px';
			controls.appendChild(agree);
			controls.appendChild(disagree);
			controls.appendChild(document.createElement('br'));
			controls.appendChild(skip);
			controls.appendChild(skipToEnd);

			if (placeholder) {
				// replace placeholder with controls
				placeholder.parentNode.replaceChild(controls, placeholder);
			} else {
				// Insert controls near the bottom of #content but before results
				content.appendChild(controls);
			}
	}

	// Initialize quiz: fetch CSV, parse, set state, render first question
	async function initQuiz() {
		try {
					// short quiz: no visible status box; use console for progress
					console.log('Loading short quiz data...');

			const res = await fetch('./data/surveyData.csv');
			if (!res.ok) throw new Error('Failed to fetch CSV: ' + res.status);
			const text = await res.text();
				console.log('Parsing quiz data...');
			const rows = parseCSV(text);
			const objs = rowsToObjects(rows);
			// tag original indices for traceability, filter out malformed rows (no Policy name)
			for (let k = 0; k < objs.length; k++) {
				objs[k]._origIndex = k;
			}
			let pool = objs.filter(o => o['Policy'] && o['Policy'].length > 0);

			// Randomize pool and take up to 40 questions for the short quiz
			shuffleArray(pool);
			const maxQuestions = 40;
			state.questions = pool.slice(0, Math.min(maxQuestions, pool.length));

			// For each chosen question, pick one argument from each side (if multiple exist) at random
			for (const q of state.questions) {
				// choose one Democratic argument
				const demOpts = [];
				if (q['Democratic Argument 1'] && q['Democratic Argument 1'].trim()) demOpts.push(q['Democratic Argument 1'].trim());
				if (q['Democratic Argument 2'] && q['Democratic Argument 2'].trim()) demOpts.push(q['Democratic Argument 2'].trim());
				if (demOpts.length === 0) q._chosenDem = '';
				else q._chosenDem = demOpts[Math.floor(Math.random() * demOpts.length)];

				// choose one Republican argument
				const repOpts = [];
				if (q['Republican Argument 1'] && q['Republican Argument 1'].trim()) repOpts.push(q['Republican Argument 1'].trim());
				if (q['Republican Argument 2'] && q['Republican Argument 2'].trim()) repOpts.push(q['Republican Argument 2'].trim());
				if (repOpts.length === 0) q._chosenRep = '';
				else q._chosenRep = repOpts[Math.floor(Math.random() * repOpts.length)];
			}
			if (state.questions.length === 0) {
						alert('No questions found in CSV.');
				return;
			}
			// Add a simple progress element
			let progress = $('progress');
			if (!progress) {
				progress = document.createElement('div');
				progress.id = 'progress';
				progress.style.marginTop = '6px';
				const content = document.getElementById('content') || document.body;
				content.insertBefore(progress, content.firstChild);
			}

			attachHandlers();
			state.index = 0;
			state.totalScore = 0;
			state.answers = [];
			renderQuestion(state.questions[0], 0, state.questions.length);
					console.log(`Loaded ${state.questions.length} questions.`);
		} catch (err) {
			console.error('Error initializing quiz:', err);
					// Friendly, visible instructions when fetch fails (common if opened via file://)
					const r = ensureResultArea();
					r.innerHTML = '';
					const p = document.createElement('p');
					p.textContent = 'Error loading quiz data: ' + err.message;
					r.appendChild(p);
					const hint = document.createElement('p');
					hint.innerHTML = 'If you opened this page as a file (file://) the browser blocks fetching the CSV. Run a local HTTP server from the project folder and open <code>http://localhost:8000/quiz.html</code> instead.';
					r.appendChild(hint);
					const cmd = document.createElement('pre');
					cmd.style.textAlign = 'left';
					cmd.style.background = '#222';
					cmd.style.padding = '8px';
					cmd.style.borderRadius = '4px';
					cmd.textContent = "PowerShell:\nSet-Location 'C:\\Users\\nico\\Documents\\Code\\OTT' ; python -m http.server 8000 --bind 127.0.0.1";
					r.appendChild(cmd);
		}
	}

	// start when DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initQuiz);
	} else {
		initQuiz();
	}

	// Expose computeContribution for quick console testing
	window.computeContribution = computeContribution;

})();

