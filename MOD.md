# A Dark Room: The Night Council

A mod of [A Dark Room](https://github.com/doublespeakgames/adarkroom) (Michael Townsend and contributors, MPL 2.0) that hides a murderer in the village. This mod is under the same license. Everything here works in plain browser play. Nothing needs a model or an API key.

**Play:** https://nicoh-yay.github.io/adarkroom/
**Run locally:** clone the repo, run `python -m http.server 8000` in the folder, then open `http://localhost:8000`.

AI-use disclosure: the mod code and this document were drafted with Claude (Anthropic) in Claude Code. I directed the design, set the rules, and am responsible for the playtests and any errors.

## The rule change

In the original, a villager is a number in `game.population`. In the mod, every villager has a name, a temperament and a visible mark, like a limp or a red scarf. When people arrive, each one has a 10% chance of being a murderer, and only one murderer can live in the village at a time. Once the village has four or more people, the murderer kills one villager each night. A night comes every 3 minutes of play, or 90 seconds in hyper mode.

The player never learns who the murderer is directly. After each killing the player opens **the council** (a button in the village) and works from four kinds of evidence:

1. **The scene.** It always says how the victim died, and the elders keep that quiet. Sometimes it also shows a trace that matches the murderer's mark ("a red thread is caught on the door frame").
2. **Testimony.** Five villagers were seen near the hut. Each gives an alibi, an opinion of another suspect, and a line about the victim. Innocent alibis are true. The murderer's alibi is false, and 25% of the time the murderer names the cause of death, which only the killer could know.
3. **Alibi checks.** The player can check one alibi a day (two with a sheriff). A true alibi is confirmed 80% of the time. A false alibi is denied 60% of the time. Every other answer is "not sure."
4. **Repeat faces.** The murderer shows up among the suspects every night. One innocent from the previous night also comes back, so a repeat face alone proves nothing.

The village can stone one person per day. If that person is the murderer, the killings stop, fear lifts, and the village pays a reward of wood, fur, meat and any advanced goods already unlocked. The reward is 1.5 times larger if the murderer is caught within two days. If the person is innocent, they die, the village learns they were innocent, and fear gets worse.

**Economy.** Starting from the first killing, every village income (gatherers, hunters, miners and so on) runs at 80% while the murderer lives. Each innocent stoned lowers it another 10%, down to a floor of 50%. So leaving the case open costs resources, and guessing wrong costs more.

**Sheriff.** The village can build a **watchhouse** (150 wood, 30 fur), and the player can then appoint a sheriff from three candidates. With a sheriff, the player gets two alibi checks a day. The sheriff also vouches for one innocent suspect each day and blocks half of all wrongful stonings. The murderer targets the sheriff 25% of the time. Without a sheriff, whatever the player decides happens.

**Catching them in the act.** Each killing has an 8% chance to raise "A Scream in the Night." If the player seizes the figure (70% success), the murderer is stoned on the spot. If not, the player still sees the trace. A rarer "Night Watch" event can also report the trace.

**Halved cooldowns.** Every action button cooldown is cut in half (`Button.COOLDOWN_SCALE = 0.5`). That covers gather wood (60 s to 30 s), check traps (90 s to 45 s), stoke fire (10 s to 5 s), and every combat weapon, eating and meds cooldown. Timers that are not buttons keep their original lengths, including fire cooling, villager arrivals, random events and enemy attacks. Combat is therefore easier than in the original.

## MDA reading

- **Mechanic:** one hidden murderer, one death per night, one stoning per day, and evidence that is partial and noisy.
- **Dynamic:** the player has to decide under a deadline. Waiting a night brings more evidence (the suspect lists narrow) and costs a villager plus a day of slowed income. Accusing early saves both but risks killing an innocent and deepening the slowdown.
- **Aesthetic:** suspicion and dread that sit on top of A Dark Room's existing loneliness. The village you built stops feeling safe.

A playing agent can perceive the mechanics and the dynamics, meaning the text, the counts and the income drop. It cannot perceive whether a human player feels dread or just feels busy. That has to be tested with people.

## Rule and source map

Labels follow the course's four evidence labels: `code`, `manual`, `observed`, `assumed`.

| Rule | Evidence |
|---|---|
| Original: a hut holds 4 villagers | `code`, script/outside.js line 11 (`_HUT_ROOM: 4`) |
| Original: new villagers arrive every 0.5 to 3 minutes while there is room | `code`, script/outside.js line 10 (`_POP_DELAY`) |
| Original: gather wood cooldown is 60 s | `code`, script/outside.js line 8 |
| Mod: all button cooldowns scaled by 0.5 | `code`, script/Button.js lines 53 and 84 |
| Mod: each arrival has a 10% murderer chance, and only one murderer at a time | `code`, script/mafia.js `reconcile` |
| Mod: one killing per night once the village has 4 or more people | `code`, script/mafia.js `nightfall` / `murder` |
| Mod: the murderer is always among the 5 suspects | `code`, script/mafia.js `openCase` |
| Mod: fear multiplies village income by 0.8, down to a floor of 0.5 | `code`, script/mafia.js `workRate`, script/outside.js line 522 |
| Mod: a careful player can identify the murderer within 1 to 2 days | `observed` in simulation: a perfect-logic solver over 3,000 random cases found the murderer on day 1 in about 52 to 53% of cases and by day 2 in about 94 to 95%, with no wrong deductions (about 63% and 99% with a sheriff). Rerun it by pasting `tools/mafia-sim.js` into the browser console. This is not yet `observed` with human players. |
| Mod: people feel suspicion, and the game does not play like a spreadsheet | `assumed`, needs a human playtest |

## Acceptance trace

Starting state: 4 huts, population 14, a lodge, no watchhouse, a murderer present, and no killings yet.

1. Night 1 falls. A random non-murderer is removed from the roster, and population goes from 14 to 13. The notification reads "a body is found at dawn. *name* is dead." "the villagers are afraid. work slows" is posted. Gatherer income falls from 11 wood to 8 wood per 10 s. One gatherer died, and the 10 left work at 80%.
2. The council button appears in the village. Opening it lists 5 suspects. One of them is the murderer.
3. The player checks one alibi. It comes back confirmed, denied or not sure, and the "alibis you can still chase today" count drops from 1 to 0.
4. The player accuses the murderer. The population drops by 1, the killer is set to none, and income returns to 100%. Stores gain 450 wood, 150 fur and 150 meat (the fast-catch 1.5× reward). The case closes, and the council now reads "the village is quiet."

Expected outcome: no more killings until a new murderer arrives with future villagers.

I ran this trace in a browser on 2026-09-23. It matched, except for the reward amount, which depends on which stores are unlocked.

## Checking the hidden state

Villagers, the murderer and the case file live in `State.game.mafia` inside the browser's saved game. A player who wants a fair game should not open it. For agent play, `Mafia.observation()` returns only what the council screen shows. A playing agent should get that and nothing else, never `State`. `Mafia.debugNight()` skips to the next night for playtesting.

## Unresolved

- Does a new player find the council button without being told? It shows up in the village only after the first killing (or once a watchhouse exists).
- A 3-minute day is a guess. It may feel too slow early and too fast late.
- The Google Analytics tag from upstream is removed in this fork, so the mod sends nothing to doublespeak's analytics.
