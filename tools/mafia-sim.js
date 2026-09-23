/**
 * Balance check for the Night Council mod (see MOD.md).
 *
 * Paste into the browser console on a loaded game that has reached the village.
 * It plays thousands of seeded cases with a solver that uses every clue perfectly,
 * then restores your save. Prints how often the killer is identified by each day.
 */
(function() {
	var N = 3000;
	var realState = JSON.parse(JSON.stringify(Mafia.state()));
	var realSave = Mafia.save;
	Mafia.save = function() {};

	var slipPattern = new RegExp(Mafia.METHODS.map(function(m) { return m.verb; }).join('|'));

	// one day of deduction: narrow `cands` with the day's case file
	function solveDay(cands, c, killer) {
		var left = cands.filter(function(id) { return c.suspects.indexOf(id) >= 0; });
		if(c.tracks) left = left.filter(function(id) { return Mafia.MARKS[c.people[id].mark].trace === c.tracks; });
		var slip = left.filter(function(id) {
			return c.testimony[id].some(function(l) { return slipPattern.test(l); });
		});
		if(slip.length) left = slip;
		if(c.cleared) left = left.filter(function(id) { return id !== c.cleared; });
		var checks = c.checksLeft;
		Mafia.shuffle(left).forEach(function(id) {
			if(checks <= 0 || left.length <= 1 || c.alibis[id].partner === null) return;
			checks--;
			var r = Math.random();
			if(id === killer) {
				if(r < Mafia._KILLER_DENIED) left = [id];
			} else if(r < Mafia._INNOCENT_CONFIRMED) {
				left = left.filter(function(x) { return x !== id; });
			}
		});
		return left;
	}

	function run(withSheriff) {
		var solved = [0, 0, 0, 0], wrong = 0;
		for(var t = 0; t < N; t++) {
			var st = Mafia.state();
			st.villagers = []; st.caseFile = null; st.sheriff = null;
			for(var i = 0; i < 16; i++) Mafia.makeVillager();
			var killer = st.villagers[0];
			st.killer = killer.id;
			if(withSheriff) st.sheriff = st.villagers[15].id;
			var left = null, day = 0;
			for(var d = 1; d <= 3 && !day; d++) {
				var victim = st.villagers.filter(function(v) { return v.id !== killer.id && v.id !== st.sheriff; })[0];
				Mafia.openCase(victim, killer);
				Mafia.removeVillager(victim.id);
				left = solveDay(left || st.caseFile.suspects.slice(), st.caseFile, killer.id);
				if(left.length === 1) day = left[0] === killer.id ? d : -1;
			}
			if(day === -1) wrong++; else solved[day]++;
		}
		return {
			day1: solved[1] / N,
			byDay2: (solved[1] + solved[2]) / N,
			byDay3: (solved[1] + solved[2] + solved[3]) / N,
			wrong: wrong / N
		};
	}

	var result = { noSheriff: run(false), sheriff: run(true) };
	State.game.mafia = realState;
	Mafia.save = realSave;
	console.log(JSON.stringify(result, null, 1));
	return result;
})();
