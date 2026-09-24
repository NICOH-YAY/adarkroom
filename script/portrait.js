/**
 * Mod: The Night Council
 *
 * Draws a small one-colour pixel portrait for a villager. The same villager
 * always gets the same face (seeded from name, temperament and mark). The
 * temperament sets the expression and some marks show up (scarf, necklace,
 * smoke, cough, height). Colours come from the panel's own text colour, so the
 * portrait follows the game's lights on / lights off setting.
 */
var Portrait = {
	W: 16,
	H: 20,
	SCALE: 4,
	ACCENT: '#9b1c1c', // the red scarf, the only colour in the mod

	hash: function(s) {
		var h = 2166136261;
		for(var i = 0; i < s.length; i++) {
			h ^= s.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		return h >>> 0;
	},

	// small seeded generator (mulberry32) so a face never changes between visits
	rng: function(seed) {
		return function() {
			seed = (seed + 0x6D2B79F5) | 0;
			var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	},

	// person: { name, trait, mark }. ref: an element whose text colour to draw in.
	draw: function(person, ref) {
		var S = Portrait.SCALE;
		var canvas = document.createElement('canvas');
		canvas.width = Portrait.W * S;
		canvas.height = Portrait.H * S;
		canvas.className = 'portrait';
		var g = canvas.getContext('2d');
		var ink = window.getComputedStyle(ref).color;
		var rand = Portrait.rng(Portrait.hash(person.name + '|' + person.trait + '|' + person.mark));
		var px = function(x, y, colour, alpha) {
			g.globalAlpha = alpha || 1;
			g.fillStyle = colour || ink;
			g.fillRect(x * S, y * S, S, S);
		};
		var line = function(x0, x1, y0) {
			for(var i = x0; i <= x1; i++) px(i, y0);
		};

		var tall = person.mark === 1;
		var cx = 8;
		var hw = rand() < 0.5 ? 3 : 4;
		var top = tall ? 2 : 3;
		var bot = tall ? 13 : 12;

		// head outline, narrowed at the top and bottom so it reads as an oval
		var edges = {};
		for(var y = top; y <= bot; y++) {
			var shrink = (y === top || y === bot) ? 2 : (y === top + 1 || y === bot - 1) ? 1 : 0;
			var left = cx - hw + shrink;
			var right = cx + hw - 1 - shrink;
			edges[y] = [left, right];
			if(y === top || y === bot) {
				line(left, right, y);
			} else {
				px(left, y);
				px(right, y);
			}
		}

		var ey = top + Math.round((bot - top) * 0.45);
		var my = ey + (tall ? 4 : 3);
		var lx = cx - 2, rx = cx + 1; // eye columns

		// hair
		var hair = person.trait === 'pious' ? 'hood' : ['bald', 'fringe', 'long', 'shaggy'][Math.floor(rand() * 4)];
		if(hair === 'fringe') {
			line(edges[top + 1][0], edges[top + 1][1], top + 1);
		} else if(hair === 'long') {
			for(var ly = top; ly <= ey + 2; ly++) {
				px(edges[ly][0] - 1, ly);
				px(edges[ly][1] + 1, ly);
			}
		} else if(hair === 'shaggy') {
			for(var sx = edges[top][0] - 1; sx <= edges[top][1] + 1; sx++) {
				if(rand() < 0.7) px(sx, top - 1);
			}
		} else if(hair === 'hood') {
			for(var hy = top; hy <= bot; hy++) {
				px(edges[hy][0] - 1, hy);
				px(edges[hy][1] + 1, hy);
			}
			line(edges[top][0] - 1, edges[top][1] + 1, top - 1);
		}

		// ears and nose
		if(rand() < 0.5 && hair !== 'hood' && hair !== 'long') {
			px(edges[ey][0] - 1, ey);
			px(edges[ey][1] + 1, ey);
		}
		var nose = rand() < 0.5 ? 1 : 2;
		var nx = cx - 1 + (rand() < 0.5 ? 0 : 1);
		for(var n = 1; n <= nose; n++) px(nx, ey + n);

		// expression
		switch(person.trait) {
			case 'nervous':
				px(lx, ey); px(lx, ey - 1); px(rx, ey); px(rx, ey - 1);
				px(cx - 2, my); px(cx - 1, my + 1); px(cx, my); px(cx + 1, my + 1);
				break;
			case 'gruff':
				px(lx - 1, ey - 2); px(lx, ey - 1); px(rx, ey - 1); px(rx + 1, ey - 2);
				px(lx, ey); px(rx, ey);
				line(cx - 2, cx + 1, my); px(cx - 3, my + 1); px(cx + 2, my + 1);
				break;
			case 'cheerful':
				px(lx, ey); px(rx, ey);
				px(cx - 3, my - 1); line(cx - 2, cx + 1, my); px(cx + 2, my - 1);
				break;
			case 'suspicious':
				line(lx - 1, lx, ey - 1); line(rx, rx + 1, ey - 1);
				px(lx, ey); px(rx + 1, ey);
				line(cx, cx + 1, my);
				break;
			case 'pious':
				line(lx - 1, lx, ey); line(rx, rx + 1, ey);
				line(cx - 1, cx, my);
				break;
			case 'quiet':
				px(lx, ey); px(rx, ey);
				px(cx - 1, my);
				break;
			case 'boastful':
				px(lx, ey - 2); px(rx, ey - 2);
				px(lx, ey); px(rx, ey);
				line(cx - 3, cx + 2, my); line(cx - 2, cx + 1, my + 1);
				break;
			case 'bitter':
				line(lx - 1, lx, ey - 1); line(rx, rx + 1, ey - 1);
				px(lx, ey); px(rx, ey);
				px(cx - 2, my + 1); line(cx - 1, cx, my); px(cx + 1, my + 1);
				break;
		}

		// neck and shoulders
		px(cx - 2, bot + 1); px(cx + 1, bot + 1);
		px(cx - 2, bot + 2); px(cx + 1, bot + 2);
		var sy = bot + 3;
		line(2, 13, sy);
		for(var yy = sy + 1; yy < Portrait.H; yy++) {
			px(2 - (yy - sy), yy);
			px(13 + (yy - sy), yy);
		}

		// marks that show on a face
		if(person.mark === 3) { // red scarf
			for(var r = cx - 3; r <= cx + 2; r++) {
				px(r, bot + 1, Portrait.ACCENT);
				px(r, bot + 2, Portrait.ACCENT);
			}
		} else if(person.mark === 7) { // necklace of teeth
			for(var t = cx - 4; t <= cx + 3; t += 2) px(t, sy + 1);
		} else if(person.mark === 6) { // woodsmoke
			for(var k = 0; k < 6; k++) {
				px(Math.floor(rand() * 12) + 2, Math.floor(rand() * Math.max(1, top - 1)), null, 0.3);
			}
		} else if(person.mark === 9) { // cough
			px(edges[my][1] + 2, my, null, 0.4);
			px(edges[my][1] + 3, my - 1, null, 0.3);
		}
		g.globalAlpha = 1;
		return canvas;
	}
};
