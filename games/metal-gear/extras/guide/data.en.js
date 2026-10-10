/* English (original version) texts — overlays the French fields when MGS_LANG === 'en'.
   Same order as data.js; only text fields are given (ids, stages, tags, colors, costs, icons stay from data.js). */
(function () {
  if (window.MGS_LANG !== 'en') return;
  const ap = window.MGS_applyEN;
  // overlay an array of objects element by element (same index = same entry)
  const byIndex = (target, en) => { if (target) en.forEach((e, i) => { if (target[i] && e) ap(target[i], e); }); };

  /* ---------- FAQ / Errata ---------- */
  const FAQ = [
    { cat: "Official errata", items: [
      { q: "Psycho Mantis — Codec book", a: "During the Psycho Mantis mission, any reference to Codec <b>3.14</b> should read <b>3.11</b>." },
      { q: "Ocelot — RELOAD card", a: "The <b>RELOAD</b> ability on Ocelot's Boss card is a <b>Reaction</b> (it should carry the reaction icon). A printable corrected card is provided with the errata." },
      { q: "Stage 13 — map icons", a: "Only one <b>Barracks</b> in the Warehouse, whatever the player count. The Barracks with the Terminal had lost its <b>2/3/4</b> icon (Otacon with more players). An extra <b>1</b> icon was removed from the Underground Base Barracks. The guide uses the corrected setup page." },
      { q: "Otacon — Interact cost", a: "On Otacon's dashboard, Interact shows <b>X</b>: that's a typo, it costs <b>1 action</b> like everyone else." },
    ]},
    { cat: "General", items: [
      { q: "The Codec Book: when do I use it?", a: "Whenever you like, for free: as soon as a component (Equipment card, boss dashboard, tile, book page…) shows a <b>Codec number</b>, look it up in the Codec Book for details, tips… and sometimes a secret. It's optional." },
      { q: "Two figures on the same space?", a: "No, never. You jump over them (Leapfrog)." },
      { q: "Can a die be modified beyond 1–6?", a: "Yes. −2 on a 2 gives 0, +2 on a 6 gives 8. Only the <b>!</b> on the white die can't be modified (it's not a number) — but it can be rerolled." },
      { q: "Refresh a Focus token and use it the same turn?", a: "Yes, nothing prevents it." },
      { q: "I pass over an Event token during a Dash: do I stop?", a: "No. You resolve the Event immediately, then continue your Dash." },
    ]},
    { cat: "Line of Sight (LOS)", items: [
      { q: "Do figures block LOS?", a: "No. Neither players nor guards block LOS (you can also shoot through figures)." },
      { q: "Does a guard in my column, facing sideways, see me?", a: "No. He must be <b>facing toward</b> the row/column you're in. And even if he faces you, the \"box\" between the two of you must not cross any wall (red or thick black line)." },
      { q: "Do cameras follow the same rules?", a: "Yes, like a guard standing on its space, facing according to the visible color of the Camera Facing token (orange or green). A camera does <b>not see its own space</b>: take advantage of it." },
    ]},
    { cat: "Attention & noise", items: [
      { q: "I make noise, change zones, then roll a ! on the Noise check?", a: "The Attention token goes <b>where you are now</b>, not where you made the noise." },
      { q: "Elevator with my Attention token inside?", a: "It follows you into the next zone." },
      { q: "No guard in my zone: Noise check?", a: "No guard = no Noise check. Your Attention token stays where it is until you're told to remove it." },
      { q: "Knock while my token is already on !?", a: "It stays on <b>!</b>. Knock just moves it to your space." },
    ]},
    { cat: "Guard AI", items: [
      { q: "Does a guard that wakes up activate this turn?", a: "Woken during section I (Guard Action): <b>yes</b>, he activates normally. Woken by a Guard Reaction card: <b>no</b>." },
      { q: "Can one guard's activation change another's mode?", a: "Yes. Each guard determines his mode <b>at the start of his own activation</b>. If a farther guard moves first and becomes the closest to your ?, the other one stays on Patrol." },
      { q: "Can a guard change mode mid-activation?", a: "No. The mode is set at the start. A guard on Patrol who spots a KO guard keeps patrolling." },
      { q: "Alerted guard reaching my !", a: "He stops immediately and resolves a Guard Reaction. In Alert mode he ignores the rotation arrows on the map. He keeps his facing (unless he's facing a wall)." },
      { q: "Shortest path and Leapfrog?", a: "Count spaces only. On a tie, the path with the <b>fewest turns</b>. A Leapfrog (even over several guards) = 1 single move, and it works around corners." },
      { q: "When do I use the blue arrow on the Guard Order card?", a: "Only if there's a possible path to the left AND to the right (e.g. facing a wall). Only one side possible → he ignores it. The arrow is from <b>the guard's</b> point of view: right = clockwise." },
      { q: "I leapfrog over a guard: does he turn toward me?", a: "No. He attacks you but doesn't turn. You place your ! token at the end of the jump." },
      { q: "When do guards attack?", a: "During their activation in the Enemy Phase, or when you leapfrog over them during your turn." },
      { q: "Where do guards appear in the Barracks?", a: "On the space with the <b>Radio</b> icon. If it's occupied: \"Spawning a Guard\" rule (adjacent empty space)." },
      { q: "Out of Guard Reaction cards?", a: "Flip the discard pile face down to form a new draw pile." },
      { q: "\"Reveal a Guard Order card and put it on the bottom\"?", a: "You don't activate it: you only reveal it in case it's the Game Over card. It brings you closer to failure." },
    ]},
    { cat: "Characters", items: [
      { q: "Disguised Meryl", a: "As long as they're not suspicious, guards treat her as one of their own, and can even leapfrog over her." },
      { q: "Can Otacon help with his Focus tokens?", a: "Yes: <b>Codec Call</b> — whenever a teammate rolls <b>black dice</b>, Otacon can use his 4 Focus tokens on them, including +1 black die." },
      { q: "Does Otacon need to hack a Terminal for Boss System cards?", a: "No, in Boss stages he's already connected to the Terminal on his space: he draws and activates cards with System Search / Access Systems." },
    ]},
    { cat: "Bosses & VR", items: [
      { q: "Boss reaction: every time or once?", a: "<b>Every time</b> the condition is met, immediately." },
      { q: "Level 4 locked door, alone?", a: "A teammate within 2 spaces can help with their Focus tokens (including one extra white die); Otacon via Codec Call." },
      { q: "VR missions: how many players? which characters?", a: "1 to 4 players, <b>any combination</b> of characters (even Otacon alone)." },
      { q: "Does a VR boss use its Boss deck?", a: "No: it follows the rules on the <b>green (VR)</b> side of its dashboard. The number of dice varies by boss. If it sees you, it raises the alarm." },
    ]},
    { cat: "Weapons & equipment", items: [
      { q: "The SOCOM has no ammo counter?", a: "No counter on the card = unlimited ammo." },
      { q: "Can one attack hit several enemies?", a: "No, unless the Equipment card explicitly says so." },
      { q: "Shoot through figures?", a: "Yes, figures don't block firearm LOS." },
      { q: "Detonate C4 by shooting it?", a: "No." },
      { q: "Is a used-up unlocked Equipment card lost?", a: "Only for the current Stage. You get it back for the following missions." },
    ]},
    { cat: "Stage questions", items: [
      { q: "Stage 2 — Event B without being seen?", a: "Impossible: the camera always sees Event B (you can enter its space, but it will have seen you first). It's an <b>optional</b> objective." },
      { q: "Stage 3 — 12 guards defeated: immediate end?", a: "Yes, the Stage ends right away, no need for Event C or the exit." },
      { q: "Stage 3 — who must exit with marker C?", a: "Any of the players (Snake or Meryl), not necessarily the one who picked it up." },
      { q: "Stage 4 — Ocelot \"moves away from the active player\"", a: "He takes the path that puts the most distance between you… which can sometimes bring him closer from the other side." },
      { q: "Stage 6 — can guards shoot in L1 and Truck?", a: "Yes! The No Fire Zone only applies to players (the guards wear radiation suits)." },
      { q: "Stage 6 — can everyone use the Nikita?", a: "No, only the one who picked it up in Nuke Building B1." },
      { q: "Stage 6 — does the Nikita missile stay in place?", a: "Yes: it only moves if you spend an action to guide it. You can do other things in the meantime." },
      { q: "Stage 6 — Nuke Building B1: protruding walls and LOS", a: "Ignore drawn walls that stick out: if a figure can cross the space, LOS goes through." },
    ]},
  ];
  (window.MGS_FAQ || []).forEach((c, i) => {
    const e = FAQ[i]; if (!e) return;
    c.cat = e.cat;
    byIndex(c.items, e.items);
  });

  /* ---------- Characters ---------- */
  byIndex(window.MGS_CHARS, [
    { // Snake
      start: "None — \"On-site procurement\" (he finds everything on site).",
      actions: [
        ["Silent Takedown", "2", "Behind an adjacent guard (at his back): replace him with a <b>Dead</b> token. Silent."],
      ],
      abilities: [
        ["Sneak Attack", "Once per round, after dealing damage to a target you're <b>behind</b> (same row/column), +1 damage of the same type."],
        ["\"I work alone\"", "Once per round, if no player is within 2 spaces: +/−1 to one die when you use a weapon."],
      ],
      focus: ["Reroll 1 die", "+2 to 1 die", "−2 to 1 die", "Roll 1 fewer die <i>or</i> move 1 space"],
    },
    { // Meryl
      start: "Defense 3 (booklet example). Handgun (.50 Cal) + Light Assault Rifle (ammo on the card). Disguise Reference card + disguised Meryl figure (Sneaking stages).",
      actions: [
        ["Gain Disguise", "2", "Adjacent to a <b>KO</b> or <b>Dead</b> guard and your Attention token isn't on the map: replace your figure with disguised Meryl."],
      ],
      abilities: [
        ["Disguised", "Guards and cameras treat her as a guard (they can even leapfrog over her). She switches back to her real figure if her ! is placed, if she draws attention in a guard's/camera's LOS, or if she does anything other than Sneak, Dash or Focus in their LOS. \"A female guard?\": in the LOS of an adjacent guard, roll 2 white dice — a ! and she draws attention. (Disguise Reference card.)"],
        ["2 special abilities", "At the bottom of her dashboard (read them during setup)."],
      ],
      focus: ["+2 to 1 die", "+/−1 to 1 die", "Gain 1 action this turn", "Roll +1 white die (before or after the roll)"],
    },
    { // Otacon
      start: "ADV Stealth Camouflage + Rations. System deck (standard in Sneaking stages, specific in Boss stages).",
      actions: [
        ["Hack Terminal", "1", "Terminal on your space or adjacent: roll <b>4 black dice</b> (+ bonus). Repeat the action to reroll as many dice as you like. When you get the Terminal's combination → hacked (flip it). All in <b>the same turn</b>, without moving away."],
        ["System Search", "1", "On/adjacent to a hacked Terminal: draw 1 System card (max 3 in hand, the 4th goes back on top/bottom of the deck)."],
        ["Access Systems", "1", "On/adjacent to a hacked Terminal with at least 1 System card: roll up to 4 black dice and place each die on a slot of the same value. Dice stay from one round to the next. Card full → resolve the effect (level ≤ the Terminal's), then put the card on the bottom of the deck."],
      ],
      abilities: [
        ["\"I'm no soldier\"", "Cannot use weapons."],
        ["Codec Call", "Can use his Focus tokens on black dice rolled by a teammate."],
        ["Hacker", "When hacking or accessing systems, roll up to +2 white dice."],
        ["Disconnection", "If he moves away from the hacked Terminal: all dice on System cards are lost, the cards go back to the deck."],
      ],
      focus: ["+/−1 to 1 die", "+/−2 to 1 die", "Reroll 1 black die", "+1 black die (before or after)"],
    },
    { // Gray Fox
      start: "Stealth Camouflage + High-Frequency Blade + Arm Cannon.",
      actions: [],
      abilities: [
        ["\"Hurry, get away!\"", "Once per round, when an adjacent figure is attacked, you can become the target instead."],
        ["Cornered Fox", "Each time you take damage, you can put 1 charge/ammo token on one of your Equipment cards."],
        ["\"I'm losing myself\"", "No Focus action while your ! token is in your zone."],
      ],
      focus: ["+2 to 1 die", "+/−2 to 1 die", "Roll 1 fewer black die", "Dash: +2 spaces"],
    },
  ]);

  /* ---------- Common actions (fr = short English gloss shown next to the official name) ---------- */
  byIndex(window.MGS_ACTIONS, [
    { fr: "Move quietly", desc: "Move 1 space (never diagonally)." },
    { fr: "Run", desc: "Move 2 spaces. <b>Noisy</b> 🔊." },
    { fr: "Melee", desc: "Attack an adjacent figure: 1 white die, <b>KO</b> damage." },
    { fr: "Combo", desc: "Adjacent attack: 2 white dice + 1 black, <b>KO</b> damage." },
    { fr: "Refocus", desc: "Refresh a grayed-out Focus token (X = cost printed on it)." },
    { fr: "Hide a body", desc: "Take a KO/Dead token on your space or adjacent, move 1 space, place it next to you. 🔊" },
    { fr: "Use / open", desc: "Elevator, locked door, item with the hand icon. Lock: roll 1 white + 2 black (Snake), reroll by repeating the action." },
    { fr: "Knock on a wall", desc: "Draw attention to your space (? token placed, or moved if it's already out)." },
    { fr: "Silent kill", desc: "Snake only: behind an adjacent guard → Dead token." },
  ]);

  /* ---------- Quick reference ---------- */
  byIndex(window.MGS_REF, [
    { t: "Start of the round", d: "Each player takes back their 4 Action tokens." },
    { t: "Player Phase", d: "In any order you like, one player at a time, full turn. Up to 4 actions (same action several times is OK, cost paid each time). End of turn: <b>Noise check</b> if a guard is in your zone → 1 white die per token placed on a 🔊 action. A ! = attention on your space." },
    { t: "Enemy Phase — Boss", d: "Draw the top card of the Boss deck, resolve it (+ dashboard rules), put it on the <b>bottom</b> of the deck. Never shuffled." },
    { t: "Enemy Phase — Sneaking", d: "Draw a Guard Order card (Game Over = failure). Resolve: <b>I</b> Guard Action → <b>II</b> Cameras → <b>III</b> Activate guards." },
    { t: "I · Waken Guard (active zones)", d: "KO 1★ token → standing guard. Then KO 2★ tokens become 1★." },
    { t: "I · Radio-In (active zones)", d: "Fewer guards than the Barracks Guard Count? Spawn the difference on the radio icon, one by one." },
    { t: "I · Lost Contact (all zones)", d: "For every 3 Dead tokens on the map: reveal the top Guard Order card and put it on the bottom." },
    { t: "I · Stay Alert (active zones)", d: "Any player within 2 spaces of a guard (unobstructed) places their ? token under them (if it isn't already on the map)." },
    { t: "II · Cameras", d: "Flip the Camera Facing token if indicated, then check LOS for every camera." },
    { t: "III · Activate guards", d: "Active zones, starting with the one closest to the Guard Priority token (= top-left corner); top to bottom, left to right." },
    { t: "ALERT mode", d: "There's a ! in the guard's zone → he rushes toward the nearest !, up to the <b style='color:#ff5a5a'>RED</b> number, by the shortest path." },
    { t: "INVESTIGATE mode", d: "No alert, and he's the guard closest to a ? (or sees a KO/Dead token, himself or via a camera in his zone) → he goes there, <b style='color:#4aa3ff'>BLUE</b> number." },
    { t: "PATROL mode", d: "Otherwise: straight ahead, <b style='color:#4aa3ff'>BLUE</b> number. Rotation arrow on the floor: he turns. Blocked: he looks for a new path (blue arrow on the card if both left AND right are possible)." },
    { t: "End of movement", d: "The guard stops as soon as he attacks, enters a token (Attention, KO, Dead → Guard Reaction), or can't move any further. Attack: the player rolls 2 black dice against their own Defense." },
    { t: "Stage failure", d: "A player is KIA (health at 0), the Game Over card is revealed, or the Stage's failure condition occurs." },
  ]);
})();
