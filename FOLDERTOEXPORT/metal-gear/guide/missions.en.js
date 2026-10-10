/* English (original version) texts for MGS_MISSIONS — overlays the French fields when MGS_LANG === 'en'. */
(function () {
  const EN = {
    1: {
      subtitle: "Tutorial part 1",
      tiles: [
        "1A – Cargo Dock (board tile)",
        "S – Elevator Shaft",
        "E – Elevator (set aside at the start)"
      ],
      guardDeck: "7 red + 10 blue (drawn at random from the 20); blue cards stacked on top of the red ones",
      legend: { obstacles: "yes (block LOS)" },
      setup: [
        "Place board tile 1A (Cargo Dock), the Elevator Shaft to its right, and the Elevator tile next to it, off the map, with a Guard on it (it only enters play with Event A).",
        "Place the Guard Priority token at the top left of the map.",
        "Place the Event A token (right of the bottom crate, near the Elevator Shaft).",
        "Place the Guards facing the right way: 1 in the center facing down, 1 on the right facing up, 1 at the bottom facing left, + 1 on the Elevator tile facing left (4 in total).",
        "Place Snake on the starting area at the top left.",
        "Guard dashboard: set it next to the map.",
        "Guard Order deck: shuffle the 7 red cards; shuffle 10 of the 20 blue cards (return the rest to the box); stack the blue cards on top of the red ones.",
        "Guard Reaction deck: shuffle the 6 Guard Reaction cards and place them next to the Guard dashboard.",
        "Player: set out Snake's dashboard, his 4 Action tokens and his double-sided Attention token; put all the black and white dice and the damage/KO/skull tokens in a supply."
      ],
      objective: [
        "Take an Interact action on the Elevator while your Alert (!) token is not on the map."
      ],
      special: [
        { t: "Single zone", d: "The orange border outlines a zone; this map has only one, so every Guard activates each round." },
        { t: "Missing Elevator", d: "The Elevator isn't there at the start: you have to trigger Event A to bring it down." }
      ],
      events: [
        { k: "A", d: "Remove token A and place the Elevator tile on the Elevator Shaft, with a Guard on it as shown in the diagram (the Guard arrives with the Elevator)." }
      ],
      failure: [
        "Snake is killed (KIA).",
        "The Game Over card is revealed (Guard Order deck run down to it)."
      ],
      cleared: [
        "No Equipment card: turn to the next page (Chapter 2)."
      ],
      briefing: "Snake infiltrates the Shadow Moses base alone through the cargo dock. Colonel Campbell explains that the only way up to the surface is the elevator at the back, as long as he isn't spotted.",
      tips: [
        "Step on the A as early as possible: the Elevator only comes down then, and a Guard steps out of it — plan to stay out of his line of sight.",
        "The objective requires your Alert (!) token to be off the map: if you're spotted, move away and wait for things to calm down before interacting with the Elevator.",
        "Crates block line of sight: move from cover to cover and watch which way the Guards are facing.",
        "A Guard with his back to you and adjacent can be taken out silently (Silent Takedown, 2 actions); a failed melee attack triggers the alert.",
        "Don't waste turns: each enemy phase uses up a Guard Order card, and the Game Over card is in the red deck."
      ],
      rulesNotes: [
        "Round order: all players take their turns (in any order they like, one player finishes before the next starts), then the enemy phase (draw and resolve 1 Guard Order card).",
        "4 Action tokens per turn. Most actions cost 1; Combo Attack and Silent Takedown cost 2. You can repeat an action by stacking tokens on the same space.",
        "Snake's dashboard: 3 (blue) / 3 (green) / 4 (red) — based on the Guard dashboard (green = defense 3, red = health 2), probably equipment limit 3, defense 3, health 4.",
        "Guards: attack with 2 black dice, defense 3, health 2.",
        "Actions: Sneak (1) = 1 space; Dash (1) = 2 spaces, loud; Hand-to-Hand (1) = 1 white die, KO damage; Combo Attack (2) = 2 white dice + 1 black, KO damage; Silent Takedown (2) = from behind an adjacent Guard, replace him with a skull token; Drag Body (1) = pick up an adjacent KO/skull token, move 1 space and put it down, loud; Interact (1) = elevators, locked doors; Knock (1) = draws attention to your space (? token placed or moved).",
        "Orthogonal movement only; two figures can never share a space; you leapfrog over adjacent figures for a single move.",
        "Events: entering an Event token resolves it immediately; if it happens mid-Dash, finish the action afterwards.",
        "Enemy LOS: the figure must face the target's row/column AND the rectangle between them must contain no obstacle (wall, locked door).",
        "Attention token: ? side (Investigate, the nearest Guard comes to check) / ! side (Alerted, every Guard in the zone hunts you). Being in a Guard's LOS, even one that just spawned, puts the ! under your figure.",
        "White dice: any ! rolled draws attention to your space. Noise check at end of turn: if a Guard is in your zone, roll 1 white die per Action token placed on a loud action.",
        "Attacking: each die ≥ the target's defense = 1 damage. Unarmed melee = KO damage; a KO'd Guard is replaced by a star token, 2-star side up. Wounding without KO'ing/killing before the end of the turn = alert.",
        "Guard Order card, section I: Waken Guard (each 1★ KO token is replaced by a Guard, then 2★ tokens flip to 1★), Radio-In (if there are fewer Guards than the Barracks Guard Count, spawn some), Lost Contact (for every 3 skulls on the map, put the top card at the bottom of the deck), Stay Alert (players within 2 spaces of a Guard with no obstacle get a ?).",
        "Section II: Cameras (ignored without cameras). Section III: Guard activation, zone closest to the Priority token first, top to bottom then left to right.",
        "Guard modes: Alert (a ! in the zone → rushes toward the ! using the RED number), Investigate (nearest to a ?, or KO/skull in sight → BLUE number), Patrol (moves straight ahead by the BLUE number, turns at > arrows, looks for a new path at ↺ icons).",
        "A Guard ends his movement after an attack, a Guard Reaction, or when he can't move further. He attacks the nearest player in his LOS (2 black dice). On an Attention/KO/skull token: draw a Guard Reaction card.",
        "Shortest path = fewest spaces, then fewest turns; on a tie the players choose.",
        "If the Game Over card is revealed, the game ends immediately (failure). You can restart a stage at any time."
      ]
    },

    2: {
      subtitle: "Tutorial part 2",
      guardDeck: "7 red + 13 blue",
      legend: { obstacles: "yes (block LOS)", cameraFacingToken: "1 (green side up)" },
      setup: [
        "Assemble the 4 Heliport tiles (2x2 layout: 2B top left, 1B top right, 3B bottom left, 4B bottom right, per the diagram).",
        "Place the Guard Priority token at the top left and the Camera Facing token green side up.",
        "Place the 3 Cameras (green/orange edge facing as in the diagram), the 4 Guards (with their facing), the Event tokens A (near the central building, at the top) and B (on the left), and the 2 Exits (at the top, near the facility entrance).",
        "Place Snake on the starting area at the bottom center.",
        "Guard dashboard: 7 red + 13 blue cards (blue on top), shuffled deck of 6 Reactions.",
        "Set up Snake (dashboard, 4 Actions, Attention) and his 4 Focus tokens."
      ],
      objective: [
        "In order: 1) reach Event A; 2) reach an Exit (end your turn on the Exit space)."
      ],
      optional: [
        "Reach Event B."
      ],
      special: [
        { t: "Cameras", d: "A camera that sees a player, a KO token or a skull in its LOS alerts or draws the Guards. It only looks in one direction: the color of its cone (green/orange) matches the side of the Camera Facing token that is face up." },
        { t: "Camera rotation", d: "Section II of each Guard Order card says whether to flip the Camera Facing token this round, which changes the direction of every camera. Recheck every camera's LOS after each flip." },
        { t: "Exits", d: "Just end your turn on an Exit space to meet the condition." }
      ],
      events: [
        { k: "A", d: "When you enter the space, place token A next to your dashboard (objective 1 complete)." },
        { k: "B", d: "When you enter the space, place token B next to your dashboard (optional objective). FAQ: the camera always sees space B, so you will be spotted when you go there." }
      ],
      failure: [
        "The Game Over card is revealed.",
        "Snake is killed (KIA)."
      ],
      cleared: [
        "Unlocks Equipment card #001 (look for the number on the back without looking at the other cards).",
        "Unlocks Equipment card #002.",
        "If optional objective B is met: unlocks Equipment card #003.",
        "Put the unlocked cards in the Memory Box at the end of the session."
      ],
      briefing: "Snake reaches the disposal facility at the heliport while an air diversion draws the terrorists' attention. A Russian gunship is parked there. Mei Ling introduces him to the Focus system; he has to get into the building to find the DARPA Chief.",
      tips: [
        "Check the camera icon on the revealed Guard Order card: anticipate the cameras flipping before crossing their field of view.",
        "B is a bonus (card #003) but the camera watches it constantly: only go if you can handle an alert, or come back later better equipped.",
        "After A, both Exits are very close; stay out of the LOS of the Guard in the upper corridor.",
        "Save your Focus tokens (reroll, +2, -2) for critical rolls: they are refreshed with the Focus action (cost printed on the back).",
        "Reminder: you have no weapon at the start (only the binoculars) — avoid combat."
      ],
      rulesNotes: [
        "Focus tokens: free to use by flipping them (gray side). Those that modify dice apply to your rolls or to enemy rolls targeting you; those that move you can only be used during your turn. Focus action (X actions): pay the cost printed on the back to refresh one.",
        "Snake's Focus: Reroll a die; +2 to a die; -2 to a die; -1 white die on the roll OR move 1 space.",
        "The ! symbol is not a number: +/- don't modify it, but a reroll can.",
        "Codec: a Codec number on a component refers you to the Codec book for info/secrets.",
        "Memory Box: every unlocked Equipment card is stored there and reusable in all later missions (you never lose them, even if discarded during a stage).",
        "Equipment limit: at the start of each stage, choose up to 3 Equipment cards; you can't change them until the next stage.",
        "Shooting: the weapon's Shoot action (1 action), target in your LOS; each die ≥ defense = 1 damage; killing a Guard replaces him with a skull. Shooting is loud and alerts the Guards in the zone.",
        "Player LOS: same as the Guards', except players look in every direction.",
        "From here on, stages allow more characters (roster under the player count): 1 = Snake, 2 = +Meryl, 3 = +Gray Fox (Ninja), 4 = +Otacon. The VR Missions book offers standalone missions (60-120 min) that also unlock equipment."
      ]
    },

    3: {
      subtitle: "Cell breakout",
      guardDeck: "7 red + 13 blue",
      legend: { startingArea: "Snake + Meryl (in the cells)", obstacles: "yes (block LOS)" },
      setup: [
        "Upper zone (Holding Cells 5A): Elevator Shaft (S) on the left, Barracks (Guard Count 3) below it; Snake and Meryl in the central cells; 3 Guards at the bottom of the central corridor facing up; Events B and A in the lower corridor.",
        "Lower zone (Armory 6A): Elevator Shaft (S) above it; 3 Guards (center-left facing right, right facing up, bottom facing left); Event C in the left cell; Exit at the bottom right.",
        "Place the Guard Priority token at the top left.",
        "Place each player's Alert (!) token under their figure (you start spotted!).",
        "Place the Elevator on the Elevator Shaft of the starting zone (Holding Cells).",
        "Guard dashboard: 7 red + 13 blue, Reaction deck shuffled.",
        "If Meryl is playing: dashboard, Action/Focus/Attention tokens, starting equipment cards (Handgun .50 Cal + Light Assault Rifle with its ammo tokens), Disguise Reference card and the disguised Meryl figure nearby."
      ],
      objective: [
        "Defeat 12 Guards in the Holding Cells",
        "OR reach C, then reach the Exit."
      ],
      special: [
        { t: "Multiple zones", d: "Each zone has an orange border; Elevator Shafts, the Elevator and Barracks belong to the zone they connect to. A zone is active if it contains a player figure or a player's ! token." },
        { t: "Reinforcements", d: "While the Holding Cells zone is active, resolve an extra Radio-In in that zone before resolving the Guard Order card." },
        { t: "Defeating Guards", d: "Whenever you would place a KO or skull token in the Holding Cells, instead place 1 counter token (green ?) on the Guard dashboard: these count toward the 12 objective." },
        { t: "Elevator", d: "Interact on the Elevator space: it moves, with every figure inside, to any other shaft. Interact on an Elevator Shaft to call it." },
        { t: "Solo (1 player)", d: "All Guards in the Holding Cells have only 1 health." }
      ],
      events: [
        { k: "A", d: "Remove the token. Read Cutscene 3A (page 27 of the book)." },
        { k: "B", d: "Remove the token. Read Cutscene 3B (page 28 of the book)." },
        { k: "C", d: "Place token C on your dashboard (any player can then reach the Exit)." }
      ],
      failure: [
        "The Game Over card is revealed.",
        "A player is killed (KIA)."
      ],
      cleared: [
        "If 12+ Guards defeated: unlocks Equipment card #004.",
        "If Event C was reached: unlocks Equipment card #005.",
        "Go to page 29 of the book."
      ],
      briefing: "After the DARPA Chief's mysterious death in his cell, Snake is trapped in the detention block as the alarm goes off. He meets Meryl, a rookie who held out against the terrorists. Campbell is clear: get out of there by any means necessary.",
      tips: [
        "You start on alert: either fight the waves of Guards (reinforcements every round) or flee by Elevator to the Armory to grab C and then reach the Exit.",
        "Solo, the Guards in the cells have only 1 health: the 12 Guards option is more doable, even in melee.",
        "Going for both objectives earns two cards (#004 and #005), but the stage ends as soon as 12 Guards are defeated (FAQ).",
        "Leaving the Holding Cells zone (and leaving no ! there) cuts off the extra reinforcements.",
        "Meryl can disguise herself (2 actions, adjacent to a KO/skull token and with no ! on the map) to walk past Guards, but any action other than Sneak/Dash/Focus in their LOS blows her cover."
      ],
      rulesNotes: [
        "Meryl is playable from this stage on. Starting equipment: Handgun (.50 Cal) and Light Assault Rifle (ammo tokens per the icon at the top right of the card). Starting cards can be swapped for cards from the Memory Box, within the equipment limit.",
        "Meryl has 2 special abilities at the bottom of her dashboard; she replaces Silent Takedown with Gain Disguise (2 actions).",
        "Meryl's Focus: +2 to 1 die's result; +/-1 to 1 die's result; gain 1 extra action this turn; roll +1 white die (before or after the roll).",
        "Disguised (Disguise Reference card, hard to read): Guards and cameras treat her as a Guard (they can leapfrog her). She goes back to her real figure if her ! is placed, if she draws attention in a Guard's/camera's LOS, or if she takes any action other than Sneak, Dash or Focus in their LOS. \"A female guard?\": in the LOS of an adjacent Guard, roll 2 white dice; on a ! she draws attention.",
        "Meryl's defense: 3 (example from the rules)."
      ]
    },

    4: {
      subtitle: "Boss fight",
      legend: {
        startingArea: "Snake + Meryl (bottom center)",
        boss: "Ocelot (top left)",
        traps: "trip wires (dotted yellow lines: impassable, do not block LOS)",
        kennethBaker: "center of the map"
      },
      setup: [
        "Place the Ocelot Stage tile (13A).",
        "Place Ocelot's Boss dashboard on the table and his figure on the map (top, left side, facing up).",
        "Place the Boss Stage Reference card over the highlighted part of each player's dashboard (it covers the actions not used in boss stages).",
        "Set Ocelot's RELOAD card aside face down. Draw 4 Ocelot Boss cards at random (return the 2 unused ones to the box), then place RELOAD face down under those 4 cards: this is the Boss deck.",
        "Place Snake (and Meryl) on the starting area at the bottom center.",
        "No Guard dashboard, Guard decks or Guard figures."
      ],
      objective: [
        "Defeat Revolver Ocelot (1 player: 12 health; 2 players: 20 health)."
      ],
      special: [
        { t: "Trip Wires", d: "Players can't cross the dotted yellow lines. They don't block LOS: you can shoot through them." },
        { t: "Shooting through the trip wire area", d: "Every time a player shoots through the wires, each ! rolled deals 1 damage to Kenneth Baker (place a damage token in the center of the map). At 3 or more damage, the mission fails." }
      ],
      failure: [
        "A player is killed (KIA).",
        "Kenneth Baker takes 3 or more damage."
      ],
      cleared: [
        "Unlocks Equipment card #006.",
        "Go to page 35 of the book."
      ],
      boss: {
        health: "1P: 12 / 2P: 20",
        notes: [
          "Each round: the players take their turns, then the Boss reveals and resolves the top card of its deck, which then goes to the bottom. The deck is never shuffled.",
          "Deck: 4 random Boss cards + RELOAD at the bottom (Ocelot reloads after his 4 actions).",
          "Errata: the RELOAD ability is a Reaction (reaction icon).",
          "A Boss's Reactions trigger every time their condition is met, immediately (FAQ).",
          "If a card says he attacks without specifying the number of dice, use the attack stat on his dashboard.",
          "KO damage is dealt to him as normal damage.",
          "When he moves away from the active player, he picks the path that maximizes distance, which can sometimes bring him closer (FAQ).",
          "Special abilities detailed on his dashboard (not legible on this page)."
        ]
      },
      briefing: "Snake finds Kenneth Baker, president of ArmsTech, tied up and rigged with explosives in the middle of a room. Revolver Ocelot, FOXHOUND member and revolver virtuoso, challenges him to a duel.",
      tips: [
        "Avoid shooting through the wire area around Baker: each ! can hurt him, and 3 damage = failure. Go around to get a clean LOS.",
        "Use the 4 obstacles as cover: Ocelot needs LOS to hit you.",
        "Ocelot has to reload when RELOAD comes up (5th card): that's the moment to step out and shoot.",
        "Ocelot's defense is 4: use the +2 Focus tokens (Snake/Meryl) to turn 2s and 3s into hits.",
        "With 2 players, flank him so he can't move away from both of you at once."
      ],
      rulesNotes: [
        "Boss stages: no Guards; the boss has its own dashboard, deck and figure. Read the boss's setup and dashboard carefully.",
        "Dealing damage to a boss with a ranged weapon works like against a Guard: as long as it's in LOS, each die ≥ its defense = 1 damage (tokens placed on the boss's dashboard).",
        "The boss's health depends on the number of players.",
        "No Game Over card listed for this stage."
      ]
    },

    5: {
      subtitle: "Boss fight (Tank)",
      legend: {
        startingArea: "Snake + Meryl (lower half, center)",
        boss: "Tank (large base in the center of the map)"
      },
      setup: [
        "Assemble Snow Field A (7A) at the top and Snow Field B (8A) at the bottom.",
        "Place the Tank in the center of the map and the players on the starting area below it.",
        "Shuffle the Tank's Boss deck.",
        "Place the \"Grenades\" Special Action card over the highlighted part of each player's dashboard, with 2 Grenade tokens on each card.",
        "Place the Tank's dashboard next to the map (health/defense shown on it)."
      ],
      objective: [
        "Destroy the Tank."
      ],
      special: [
        { t: "Grenades", d: "Each player has the Grenades Special Action card with 2 Grenade tokens (card text not legible on the scan: check the card)." }
      ],
      failure: [
        "A player is killed (KIA)."
      ],
      cleared: [
        "Unlocks Equipment card #007.",
        "Go to page 48 of the book."
      ],
      boss: {
        name: "Tank (M1, driven by Vulcan Raven)",
        health: "see the Tank's dashboard (not given on the page)",
        defense: "see the Tank's dashboard",
        notes: [
          "The Tank's Boss deck is shuffled at the start and never reshuffled; a resolved card goes to the bottom of the deck.",
          "Abilities and stats are on the Tank's dashboard (not reproduced in the book).",
          "The Grenades card replaces the standard Boss Stage Reference on the dashboards."
        ]
      },
      briefing: "Crossing the snowfield, Snake runs into an ambush: a battle tank blocks his way and opens fire. Its pilot, a FOXHOUND giant, challenges him to fight.",
      tips: [
        "The terrain is almost empty: mobility is your only protection, don't stay lined up with the cannon.",
        "You only have 2 grenades per player: save them for when the Tank is in range and vulnerable.",
        "Read the Tank's dashboard before starting to know its defense and reactions.",
        "With 2 players, split up to divide its attention."
      ],
      rulesNotes: [
        "No Game Over card listed for this stage.",
        "The small green elements visible on the map seem to be scenery (not in the legend)."
      ]
    },

    6: {
      subtitle: "Nuclear Warhead Storage Building – Chapter 6",
      guardDeck: "7 red + 18 blue",
      legend: {
        obstacles: "Obstacles (block LOS): crates/warheads",
        startingArea: "Bottom of Nuke Building L1 (Snake + Meryl)"
      },
      setup: [
        "Assemble the tiles as shown: B2 (10A) top left and B1 (9A) top right, each with an Elevator Shaft (S) to the north; below them, Nuke Building Truck (15A) with the Barracks (B) and the Elevator (E), then Nuke Building L1 (11A) at the very bottom.",
        "Guard Order deck: 7 red cards + 18 blue cards.",
        "Place 6 Guards as shown on the map: 3 on B1, 3 on Truck/L1 (facing shown by the arrows).",
        "Place the Event tokens A (B2, central corridor), B (B1, southwest corner) and C (B2, west side) and the EXIT in the southeast corner of B2.",
        "Players start in the starting area at the bottom of Nuke Building L1."
      ],
      objective: [
        "In order: 1) Destroy the Switchboard in Nuke Building B2 by flying a missile (Nikita) into its space.",
        "2) A player reaches the Exit in Nuke Building B2."
      ],
      optional: [
        "Pick up Event C (B2) and keep it on your dashboard: unlocks Equipment card #010."
      ],
      special: [
        { t: "No Fire Zone", d: "Players can't use any ranged weapon or explosive on Nuke Building L1 and Nuke Building Truck." },
        { t: "Elevator", d: "Interact action on the Elevator space: move the Elevator tile and every figure inside to any other Elevator Shaft tile. An Interact action on an Elevator Shaft calls the Elevator." },
        { t: "Electrified floor (Event A)", d: "From Event A on (including immediately): a player who enters an electrified floor space takes 2 damage and is pushed back to the nearest non-electrified space. Active until the B2 Switchboard is destroyed." },
        { t: "Toxic gas (Event A)", d: "Nuke Building B2 is filled with gas. Zones with a yellow border are safe. If Snake or Meryl ends their turn on B2 outside a yellow-bordered zone, they die and the mission fails." }
      ],
      events: [
        { k: "A", d: "Remove A from the map. Activates the Electrified floor and Toxic gas rules (Campbell advises destroying the Switchboard on the northwest wall with a guided missile)." },
        { k: "B", d: "Remove B from the map and take the Nikita Special Action card (guided missile)." },
        { k: "C", d: "Remove C and place it on your dashboard (end bonus: Equipment #010)." }
      ],
      failure: [
        "The Game Over card is revealed.",
        "A player is killed (KIA).",
        "Snake or Meryl ends their turn on B2 outside a yellow zone after Event A (gas)."
      ],
      cleared: [
        "Unlocks Equipment card #009",
        "If a player has C on their dashboard: unlocks Equipment card #010",
        "Go to page 53"
      ],
      rulesNotes: [
        "Nikita (Special Action card, obtained through Event B in B1): only the player who picked it up can use it.",
        "The Nikita missile only moves when you spend an action to guide it; otherwise it stays put, and the player can take other actions while it's on the map.",
        "Missiles, firearms and grenades are LOUD actions: place your Attention token under your figure after use.",
        "Elevator: a player's Attention token follows the Elevator if the player is in the car (FAQ)."
      ],
      errata: [
        "GUARDS can use ranged weapons on L1 and Truck; only the players can't.",
        "Only the person who picked up the Nikita (in B1) can use it.",
        "A Nikita missile stays in place if you don't spend an action to guide it.",
        "Nuke Building B1: the drawn protruding walls don't block LOS if the space is passable."
      ],
      briefing: "Snake must cross the nuclear warhead storage building, where weapons are forbidden: a single shot could pierce a warhead. In basement B2, toxic gas and an electrified floor block the way; he needs to grab a Nikita missile launcher in B1 and guide a missile to the switchboard.",
      tips: [
        "On L1 and Truck you can't shoot but the Guards can: advance stealthily and use the warheads (obstacles) to break LOS.",
        "Typical route: L1 → Elevator → B1 for Event B (Nikita) → Elevator → B2. Only step on Event A once the Nikita carrier is ready.",
        "After Event A, end your turns inside B2's yellow-bordered zones and guide the missile space by space to the Switchboard (northwest wall).",
        "The missile only moves if you spend actions: you can leave it waiting while you deal with a Guard, then resume guiding it.",
        "Pick up C on B2 before leaving for the bonus Equipment #010."
      ]
    },

    7: {
      subtitle: "Fight against the Ninja in the Laboratory – Chapter 7",
      legend: {
        boss: "Ninja (1 figure)",
        numberedSpaces: "Markers numbered 1 to 8 printed on the map",
        obstacles: "Obstacles (block LOS): lab benches/furniture"
      },
      setup: [
        "Place the Laboratory tile (3A).",
        "Place the (standard) Boss Stage Reference card over the highlighted area of each player's dashboard.",
        "Shuffle the 5 Cyborg Ninja Boss cards to form the Boss deck.",
        "Gather the 4 Shadow tokens for this mission.",
        "Place the Ninja and the players (Snake then Meryl) as shown on the map: Ninja near markers 1-2 to the west, players just below."
      ],
      objective: [
        "Defeat the Cyborg Ninja."
      ],
      special: [
        { t: "Always on Guard", d: "Snake can't make a Sneak Attack against the Cyborg Ninja." }
      ],
      failure: [
        "A player is killed (KIA)."
      ],
      cleared: [
        "Unlocks Equipment card #011",
        "Go to page 59"
      ],
      boss: {
        health: "Not given in the book – see the Ninja's dashboard",
        defense: "Not given in the book – see the Ninja's dashboard",
        notes: [
          "5-card Boss deck, never reshuffled: the resolved card goes to the bottom of the deck (the cycle is predictable).",
          "Uses 4 Shadow tokens (effects described on the dashboard/Boss cards).",
          "Markers 1 to 8 on the map most likely serve as reference positions for the Boss cards (Ninja movement / Shadow tokens).",
          "Immune to Snake's Sneak Attacks."
        ]
      },
      rulesNotes: [
        "Boss mission: no Guard dashboard, Guard decks or Guards. In the Enemy phase, draw and resolve the top card of the Boss deck, then put it at the bottom.",
        "The Boss Stage Reference card covers the player actions not used in Boss missions.",
        "A Boss resolves its reactions every time the condition is met (FAQ)."
      ],
      briefing: "In Otacon's lab, Snake finds Guards cut down by a blade: an invisible cybernetic ninja is on the prowl. The fight reveals it's Gray Fox, Snake's old comrade believed dead in Zanzibar and brought back to life by experiments.",
      tips: [
        "No Sneak Attack possible: rely on direct attacks and positioning.",
        "Track the Boss cards played: with 5 cards never reshuffled, you know the order after one full cycle.",
        "The L-shaped obstacles block LOS: use them for cover and force the Ninja to come to you.",
        "With 2 players, stay within support range of each other without bunching up in the same area."
      ]
    },

    8: {
      subtitle: "Fight against Psycho Mantis in the Commander's Room – Chapter 8",
      legend: {
        boss: "Mantis (1 figure)",
        impassable: "Dotted yellow lines: impassable but do not block LOS",
        grid: "Printed coordinates: columns 0-8, rows 0-6"
      },
      setup: [
        "Place the Commander's Room tile (12A).",
        "Place the (standard) Boss Stage Reference card over the highlighted area of each player's dashboard.",
        "Shuffle the 7 Psycho Mantis Boss cards to form the Boss deck.",
        "Place the Threat marker on the highest space of the Threat track on Psycho Mantis's dashboard.",
        "Place Mantis at column 4 / row 2 (in front of the desk), Meryl at (3,5) and Snake at (4,5)."
      ],
      objective: [
        "Defeat Psycho Mantis."
      ],
      special: [
        { t: "Office Furniture", d: "Players can't cross the dotted yellow lines. They don't block LOS: you can shoot through them." }
      ],
      failure: [
        "A player is killed (KIA)."
      ],
      cleared: [
        "Unlocks Equipment card #013",
        "Go to page 74"
      ],
      boss: {
        health: "Not legible on the scan (1P/2P values in the red boxes of the dashboard) – see the dashboard",
        defense: "A green \"12\" box is visible on the dashboard art (probably a defensive stat) – check the dashboard",
        notes: [
          "7-card Boss deck, never reshuffled.",
          "Threat track with 4 color levels (blue, yellow, orange, red); the marker starts at the very top. The effects of each level are on the dashboard (not legible on the scan).",
          "The 0-8 / 0-6 coordinate grid is used by the Boss cards to position Mantis."
        ]
      },
      rulesNotes: [
        "Boss mission: no Guards; in the Enemy phase, resolve the top card of the Boss deck then put it at the bottom."
      ],
      errata: [
        "Codec book: during the fight against Psycho Mantis, any reference to frequency 3.14 should read 3.11 (FAQ 1.2)."
      ],
      briefing: "In the Commander's Room, Psycho Mantis, FOXHOUND's telepath, reads minds and claims to predict Snake's every move. He must be defeated to learn the way to Metal Gear's underground base, hidden behind a bookcase.",
      tips: [
        "Furniture with dotted yellow lines blocks you but not your shots: fire over the desk and the couches.",
        "Watch the Threat track: its level changes Mantis's behavior.",
        "Note the coordinates: the Boss cards teleport/place Mantis using the grid, so anticipate his positions.",
        "Remember the Codec errata (3.14 → 3.11) if the Codec book is used during the fight."
      ]
    },

    9: {
      subtitle: "Breakout – Otacon and Gray Fox free Snake and Meryl (Chapter 9 – Breakout)",
      tiles: [
        "Interrogation Room (4A)",
        "Prison Cell (5B)",
        "Security Room (12B)",
        "3 Elevator Shafts (S)",
        "Elevator (E)",
        "Barracks (B) – shown in the diagram but missing from the \"Tiles used\" list"
      ],
      guardDeck: {
        "1": "7 red + 16 blue",
        "2": "7 red + 12 blue"
      },
      legend: {
        terminalLevels: "1× lvl 2, 1× lvl 3, 1× lvl 4",
        lockedDoorLevels: "3× lvl 2, 3× lvl 3, 1× lvl 4",
        startingArea: "Security Room (12B), northwest room (Otacon + Gray Fox)",
        obstacles: "Obstacles (block LOS)"
      },
      setup: [
        "Assemble: Interrogation Room (4A) top left with the Barracks (B) to the west and an Elevator Shaft to the north; Prison Cell (5B) top right with an Elevator Shaft to the north; Security Room (12B) at the bottom with the Elevator (E) to the north.",
        "Guard Order deck: 1 player = 7 red + 16 blue; 2 players = 7 red + 12 blue.",
        "Place 9 Guards (3 per large tile), 7 locked doors, 3 Terminals and Event A as shown.",
        "Shuffle 6 \"?\" Objective tokens (5 crosses ✗ and 1 check ✓) and place them at random, face down, on the 6 spots in the Prison Cell.",
        "Shuffle the standard System deck and place it face down near Otacon's dashboard.",
        "Place Snake's figure as shown (south cell of the Interrogation Room, behind the level 4 door).",
        "Place Meryl's figure next to the map.",
        "Otacon (and Gray Fox) start in the Security Room starting area."
      ],
      objective: [
        "In any order:",
        "Free Snake: unlock the door to Snake's cell (level 4 door).",
        "Free Meryl: unlock the door to Meryl's cell."
      ],
      optional: [
        "Keep Event A (Ketchup) on your dashboard until the end: unlocks Equipment card #015."
      ],
      special: [
        { t: "\"?\" Objectives", d: "When a player gains LOS to a \"?\" token, flip it. If it's the check ✓, replace the token with Meryl's figure; otherwise discard the token." },
        { t: "Elevator", d: "Interact action on the Elevator space: move the Elevator tile and every figure inside to another Elevator Shaft tile. Interact on an Elevator Shaft calls the Elevator." },
        { t: "Locked Doors", d: "Interact action + roll the dice combination shown; you can repeat the action to reroll any dice. When the dice match, discard the token. Levels 2 to 5; it must all be done in the same turn, otherwise progress is lost (same if the player moves away)." }
      ],
      events: [
        { k: "A", d: "Ketchup: remove A and place it on the player's dashboard. They can discard A from the space adjacent to the level 4 door to complete the \"Free Snake\" objective without picking the lock." }
      ],
      failure: [
        "The Game Over card is revealed.",
        "A player is killed (KIA)."
      ],
      cleared: [
        "Unlocks Equipment card #016",
        "If a player still has A on their dashboard (not discarded): unlocks Equipment card #015",
        "Go to page 98"
      ],
      rulesNotes: [
        "GRAY FOX – Starting equipment: Stealth Camouflage, High-Frequency Blade, Arm Cannon.",
        "GRAY FOX – Has most of Snake's and Meryl's actions, plus unique abilities.",
        "GRAY FOX – \"Hurry, Get Away!\": once per round, when an adjacent figure is attacked, he can become the target instead.",
        "GRAY FOX – Cornered Fox: each time he takes damage, he can place a token (orange gear icon, most likely a Charge token) on one of his pieces of equipment.",
        "GRAY FOX – \"I'm Losing Myself\": he can't take Focus actions while his Attention token (Alert \"!\" side) is in his zone.",
        "GRAY FOX – Focus: +2 to a die's result; +/-2 to a die's result; roll 1 fewer black die; +2 spaces of movement on a Dash.",
        "OTACON – Starting equipment: ADV. Stealth Camouflage and Rations.",
        "OTACON – I'm No Soldier: can't use weapons. The only character able to hack Terminals and use System cards.",
        "OTACON – Codec Call: can use his Focus tokens to modify or reroll black dice rolled by another player (including his +1 black die Focus).",
        "OTACON – Hacker: when hacking a Terminal or accessing a System card, can roll up to +2 white dice.",
        "OTACON – Hack Terminal (1 action): hack a Terminal on or adjacent to his space by rolling 4 black dice (+ bonuses). Can repeat the action to reroll any dice. When the Terminal's combination is rolled, flip the Terminal to its hacked side. Levels 2 to 5; must succeed in the same turn (progress is lost if he moves away or his turn ends).",
        "OTACON – System Search (1 action): on/adjacent to a hacked Terminal, draw 1 System card. Maximum 3 System cards; when drawing a 4th, put 1 back on the top or bottom of the deck.",
        "OTACON – Access Systems (1 action): on/adjacent to a hacked Terminal with at least 1 System card face up, roll up to 4 black dice and place each die on an empty slot of matching value on a System card. Dice stay from one round to the next (you can take them back to reroll). Total black dice (placed + rolled) is limited to 4, except temporary bonuses.",
        "OTACON – When every slot of a System card is covered, he can resolve an effect during his turn or when the card's condition is met; the effect's level must be less than or equal to the level of the hacked Terminal he is on/adjacent to. Then remove the dice and put the card at the bottom of the System deck.",
        "OTACON – Disconnection: if he moves away from the hacked Terminal (or an effect disconnects him), all dice on all System cards are discarded and all System cards go back on the top or bottom of the deck (your choice, in any order).",
        "OTACON – Focus: +/-1 to a die's result; reroll 1 black die; +/-2 to a die's result; roll +1 black die (before or after the roll).",
        "General rule – Locked objects: Interact + roll the dice combination; rerolls allowed by repeating the action; levels 2 to 5; must succeed in the same turn."
      ],
      errata: [
        "Otacon: his Interact action costs 1 action (the printed \"X\" is a mistake).",
        "Otacon can use his Focus on teammates' black dice via Codec Call, including the +1 black die Focus.",
        "Otacon doesn't need to hack a Terminal to access Boss System cards (only relevant in Boss missions)."
      ],
      briefing: "Snake has been captured and tortured by Ocelot, and Meryl is locked up too. Otacon, invisible thanks to his camouflage, and Gray Fox sneak into the detention area to free them.",
      tips: [
        "Otacon can't fight: stay camouflaged, avoid LOS and let Gray Fox handle the Guards (\"Hurry, Get Away!\" to take hits in his place).",
        "Snake's door is level 4 (hard): Event A (Ketchup) lets you complete \"Free Snake\" without picking it, but discarding it costs you Equipment #015. Choose based on how confident you are with the dice.",
        "The level 4 Terminal in the Interrogation Room lets you resolve System effects up to level 4; the level 2/3 Terminals in the Security Room are easier to hack to start with.",
        "Flip the \"?\" tokens from a distance (LOS is enough) to find Meryl without opening every cell.",
        "Doors and Terminals must succeed in the same turn: keep enough actions to reroll, and use Otacon's Codec Call on Gray Fox's black dice.",
        "Don't move away from a hacked Terminal while dice are placed on System cards: you would lose them all."
      ]
    },

    10: {
      legend: {
        startingArea: "Snake, Meryl, Gray Fox (Otacon on his Terminal tile)",
        obstacles: "Obstacles blocking line of sight (crates on the Comms Tower Roof)"
      },
      setup: [
        "Place the \"Surface-to-Air Missile Launcher\" (S.A.M. Launcher) Special Action card over the highlighted area of each player's dashboard.",
        "Place the (blue) Missile token near the map.",
        "Shuffle the 6 Helicopter Gunship Boss cards to form the Boss deck.",
        "Place the Threat marker on the leftmost space of the Helicopter Gunship's Threat track.",
        "Place Snake, Meryl and Gray Fox in the Comms Tower Roof starting area (at the bottom).",
        "4 players (Otacon): place the Terminal Reference card (Boss Stage Terminal) over the highlighted area of Otacon's dashboard.",
        "Take Otacon's Terminal tile, place his figure on it as shown and put his (?) token on the leftmost space of the Terminal tile.",
        "Use the \"Helicopter Gunship\" System deck instead of Otacon's standard System deck.",
        "Take the 2 Wall tokens and place them next to Otacon."
      ],
      objective: [
        "Destroy the Helicopter Gunship by reducing its health to 0."
      ],
      special: [
        { t: "S.A.M. Launcher", d: "Players attack the helicopter with the special action on the S.A.M. Launcher card (surface-to-air missile launcher) placed on their dashboard; the covered actions aren't used." },
        { t: "Threat track", d: "The Hind's Threat advances along its track (3 → 4 → 5 → 6 → …): the further it goes, the more dangerous its attacks. Read the boss's dashboard." },
        { t: "Otacon's Walls", d: "With 4 players, Otacon can deploy 2 Wall tokens through the Helicopter Gunship System deck to create cover." }
      ],
      failure: [
        "A player is killed in action (KIA)."
      ],
      cleared: [
        "Unlocks Equipment card #017",
        "Go to page 102 (cutscene)."
      ],
      boss: {
        name: "Helicopter Gunship (Hind D, flown by Liquid Snake)",
        health: "Depends on the number of players: see the boss's dashboard (not legible on the scan)",
        defense: "See the boss's dashboard",
        notes: [
          "Visible Threat track: 3 / 4 / 5 / 6 / last purple space.",
          "The boss acts by drawing 1 card from its 6-card deck each Enemy phase; the card then goes to the bottom of the deck (never reshuffled).",
          "The Helicopter Gunship tile has numbered target spaces and arrows (blue on the left, green on the right) showing its movement."
        ]
      },
      briefing: "Snake reaches the roof of the communications tower while Otacon tries to get the elevator running again. Liquid Snake shows up at the controls of a Hind D gunship: it has to be brought down with the Stinger missile launcher.",
      tips: [
        "The Boss deck is never reshuffled: note the order of the cards already seen to anticipate the 6 attacks in the cycle.",
        "Use the roof's obstacles to break the helicopter's line of sight between shots.",
        "Focus fire: the longer the fight lasts, the further the Threat track advances.",
        "With 4 players, Otacon needs to keep a hacked Terminal to drop his Walls at the right time."
      ]
    },

    11: {
      players: {
        note: [
          "Boss Stage for 1-3 players (Snake, Meryl, Gray Fox).",
          "Otacon (Sneaking Stage) can be added to any number of players, e.g. 2 players Snake + Otacon, but never solo."
        ]
      },
      tiles: [
        "Sniper Wolf (8A)",
        "Snowfield B (6B)",
        "Elevator Shaft (S)",
        "Otacon only: Security (12B), Elevator (E), 2 Elevator Shafts"
      ],
      guardDeck: {
        Otacon: "7 red cards, 10 blue cards (only for Otacon's Sneaking part)"
      },
      legend: {
        wolfTokens: "3 blank + 1 per character on the Snowfield + 1 Sniper Wolf",
        startingArea: "Snake, Meryl, Gray Fox (Snowfield); Otacon in Security",
        obstacles: "Trees = obstacles blocking LOS"
      },
      setup: [
        "Place the \"Sniper Rifle\" Special Action card over the highlighted area of Snake's, Meryl's and Gray Fox's dashboards.",
        "Take blank Sniper Wolf tokens: 3 + 1 per character on the Snowfield tile (Otacon excluded).",
        "Shuffle these blank tokens with the Sniper Wolf token and place them face down on the numbered spaces (trees) in ascending order, starting with space 1.",
        "Place the Threat marker on the leftmost space of Sniper Wolf's Threat track.",
        "Place Sniper Wolf's Crosshairs token as shown on the map.",
        "Otacon (optional, Sneaking): Security, Elevator, 2 Elevator Shafts tiles; Guard Order deck 7 red + 10 blue; 3 Guards, 2 locked doors, 2 Terminals.",
        "Otacon's System deck: shuffle only 2× Remote Unlock, 1× Misdirection, 1× Distraction."
      ],
      objective: [
        "Snake / Meryl / Gray Fox: defeat Sniper Wolf.",
        "Otacon (separate objectives, in order): 1) unlock the level 5 security door; 2) end his turn on any space of the Sniper Wolf tile."
      ],
      special: [
        { t: "Trees", d: "Trees are obstacles, but Crosshairs tokens can still pass through them." },
        { t: "Boss and Sneaking", d: "Snake, Meryl and Gray Fox play a Boss Stage; Otacon plays a Sneaking Stage. In the Enemy phase, resolve Sniper Wolf's turn before activating the Guards." },
        { t: "Otacon", d: "Otacon affects neither Sniper Wolf's starting health nor the number of Wolf tokens. He can't use his Codec Call ability during this Stage." },
        { t: "Elevator (Otacon)", d: "Otacon can travel by taking an Interact action on the Elevator space: move the Elevator and every figure inside to another Elevator Shaft. He can also call the Elevator with an Interact action on an Elevator Shaft." },
        { t: "Wolf tokens", d: "Sniper Wolf hides among blank tokens placed face down: you have to flush her out before you can finish her off." }
      ],
      failure: [
        "A player is killed in action (KIA).",
        "OR Otacon: the Game Over card is revealed."
      ],
      cleared: [
        "If Sniper Wolf is defeated first: unlocks Equipment card #018, read Cutscene 11A (pages 106-110).",
        "If Otacon reaches a space of the Sniper Wolf tile first: unlocks Equipment card #020, read Cutscene 11B (pages 111-114)."
      ],
      boss: {
        health: "Depends on the number of characters: see the dashboard (red boxes not legible on the scan)",
        defense: "4 (green box on the dashboard, likely reading)",
        notes: [
          "Attack: 3 black dice (dashboard icons, likely reading).",
          "Threat track: 3 / 3 / 4 / 4 / 5 / 5 / 6.",
          "Her Crosshairs move across the Snowfield and pass through trees.",
          "The Sniper Wolf token is hidden among blank tokens on the numbered trees."
        ]
      },
      briefing: "In the middle of a blizzard, Snake finds himself in the sights of Sniper Wolf, who has already wounded Meryl. While the team takes on the sharpshooter on the snowy plain, Otacon can try to sneak through to join them.",
      tips: [
        "Don't stay in the line of fire of the Crosshairs: trees don't protect you from them.",
        "Reveal the Wolf tokens methodically in number order to find the real Sniper Wolf.",
        "With Otacon, it's a real race: the cutscene and the unlocked Equipment card change depending on who finishes first.",
        "Otacon has a mini System deck (Remote Unlock ×2): save it for the level 5 door."
      ]
    },

    12: {
      legend: {
        startingArea: "Snake, Meryl, Gray Fox (bottom of the Warehouse)",
        raven: "Vulcan Raven figure placed as shown (middle row, facing down)",
        obstacles: "Containers (block LOS)"
      },
      setup: [
        "Place the standard \"Boss Stage Reference\" card over the highlighted area of each player's dashboard.",
        "Shuffle the 6 Vulcan Raven Boss cards to form the Boss deck.",
        "Place the Threat marker on the leftmost space of Vulcan Raven's Threat track.",
        "Place Snake, Meryl and Gray Fox in the starting area (bottom of the Warehouse) and Vulcan Raven as shown.",
        "4 players (Otacon): place the Terminal Reference card (Boss Stage Terminal) over the highlighted area of Otacon's dashboard.",
        "Take Otacon's Terminal tile, place his figure on it as shown and put his (?) token on the leftmost space of the Terminal tile.",
        "Use the \"Vulcan Raven\" System deck instead of Otacon's standard System deck.",
        "Take the 2 Turret tokens and place them next to Otacon."
      ],
      objective: [
        "Defeat Vulcan Raven."
      ],
      special: [
        { t: "Boss Stage Reference", d: "No Special Action card: you fight Raven with the standard actions and your equipment." },
        { t: "Otacon's Turrets", d: "With 4 players, Otacon has 2 Turret tokens usable through the Vulcan Raven System deck." }
      ],
      failure: [
        "A player is killed in action (KIA)."
      ],
      cleared: [
        "Unlocks Equipment card #021",
        "Go to page 119 (cutscene)."
      ],
      boss: {
        health: "Depends on the number of players: see the dashboard (not legible on the scan)",
        defense: "4 (green box on the dashboard, likely reading)",
        notes: [
          "Attack: 2 black dice base (likely reading).",
          "Threat track: 6 / 7 / 8 / 9 / 9+ / 10 / 11 / 12.",
          "Armed with a Vulcan cannon: the aisles between containers are firing lanes."
        ]
      },
      briefing: "In the frozen warhead warehouse, the giant shaman Vulcan Raven waits for Snake with his Vulcan cannon. A brutal duel among the containers, where every blind spot counts.",
      tips: [
        "Containers block line of sight: move from cover to cover and attack from the flanks.",
        "Avoid staying lined up in the same aisle as Raven.",
        "The Threat track climbs very high (up to 12): finish the fight fast."
      ]
    },

    13: {
      subtitle: "PAL Key",
      guardDeck: {
        "1": "7 red, 20 blue",
        "2": "7 red, 16 blue",
        "3": "7 red, 12 blue",
        "4": "7 red, 10 blue"
      },
      legend: {
        startingArea: "4 figures in the Elevator Shaft above the Blast Furnace"
      },
      setup: [
        "Assemble the Blast Furnace, Warehouse A/B, Underground Base, 3 Elevator Shafts, the Elevator and 2 Barracks as shown on the map (use the corrected errata page).",
        "Build the Guard Order deck based on the number of players (always 7 red + 20/16/12/10 blue for 1/2/3/4 players).",
        "Place Events A (Blast Furnace), B (Warehouse A, left side) and C (Underground Base).",
        "Errata: only one Barracks in the Warehouse regardless of player count — with 1 player, the Barracks marked \"1\" (middle right of Warehouse B); with 2-4 players, the Barracks with Terminal 3 (left of Warehouse A, 2/3/4 icon).",
        "The 2nd Barracks goes in the Underground Base (bottom left, Guard Count 3) at every player count.",
        "1 player: no locked doors, no Camera tokens. Use the Maintenance Scaffold. Place the Barracks as shown in the Warehouse. All Barracks count as Guard Count 2.",
        "2 players: camera at the top right of Warehouse B. Yellow locked door (level 2) in the Underground Base. Use the Maintenance Scaffold.",
        "3 players: cameras at the top right of Warehouse B and on the Blast Furnace. All locked doors (yellow lvl 2 in the Underground Base, orange lvl 3 near Event B). No Maintenance Scaffold.",
        "4 players: everything except the Maintenance Scaffold — so also the 3rd camera (bottom left of Warehouse A) and Terminal 2 in the Blast Furnace (4 icon, for Otacon).",
        "Map icons: the colored 1/2/3/4 markers next to an element show which player counts it is used for."
      ],
      objective: [
        "In order: 1) reach Events A and B (in any order);",
        "2) then the player with the PAL Card Key equipped must reach Event C."
      ],
      special: [
        { t: "Temperature Sensitive Keys", d: "A player must have the PAL Card Key equipped." },
        { t: "Elevator", d: "Interact action on the Elevator space: move the Elevator tile and every figure inside to any other Elevator Shaft. You can also call the Elevator with an Interact action on an Elevator Shaft." },
        { t: "Steam Tunnel", d: "When a player interacts with the Steam Tunnel token, they move their figure to the space bearing that symbol in the Blast Furnace (Codec 04.07)." },
        { t: "Maintenance Scaffold (1-2 players)", d: "By interacting with one of the two Scaffold tokens in the Underground Base, the player moves to the other Scaffold token (Codec 04.07)." }
      ],
      events: [
        { k: "A", d: "Remove token A and place it on the player's dashboard." },
        { k: "B", d: "Remove token B and place it on the player's dashboard." },
        { k: "C", d: "If A and B are no longer on the map and you have the PAL Card Key equipped, go to the Stage Cleared section." }
      ],
      failure: [
        "The Game Over card is revealed.",
        "OR a player is killed in action (KIA)."
      ],
      cleared: [
        "Unlocks Equipment card #022",
        "Go to page 128 (cutscene)."
      ],
      briefing: "Master Miller warns Snake about Naomi and the FOXDIE virus. Snake now has to activate the PAL codes: the shape-memory key must go through the cold of the warehouse and the heat of the blast furnace before being inserted into Metal Gear's terminal.",
      tips: [
        "Pick the PAL Card Key carrier right from the start: they're the one who must finish on Event C.",
        "The other players can pick up A and B while the carrier moves toward C.",
        "Use the Elevator to fall back quickly between zones, but your Attention token follows you (FAQ).",
        "Barracks spawn Guards on the Radio space: avoid hanging around nearby.",
        "Long game (60-90 min) with a big blue deck solo: take your time, stealth pays off."
      ],
      errata: [
        "FAQ/Errata v1.2 p.2: only one Barracks in the Warehouse regardless of player count.",
        "The Barracks with the Terminal (Warehouse A) was missing the \"2/3/4\" icon: it is used with 2-4 players (Terminal for Otacon at higher player counts).",
        "A superfluous \"1\" icon was removed from the Underground Base Barracks (this Barracks is used at every player count).",
        "Corrected 1-player setup: \"Place the Barracks as shown in the Warehouse\" (the one marked 1).",
        "Use the corrected setup page (pages/errata_p2.jpg) rather than the book's map (p127)."
      ]
    },

    14: {
      subtitle: "Final battle",
      tiles: [
        "Metal Gear Platform A (10B)",
        "Metal Gear Platform B (9B)",
        "Metal Gear REX Boss tile"
      ],
      legend: {
        startingArea: "Snake, Meryl, Gray Fox (center of the platform)",
        metalGearRex: "REX tile at the top of the platform"
      },
      setup: [
        "Take the Crosshairs tokens of Snake, Meryl and Gray Fox and place them near the map.",
        "Place the \"Radar Homing Missile Launcher\" Special Action card over the highlighted area of each player's dashboard.",
        "Shuffle the Metal Gear REX Boss cards to form the Boss deck.",
        "Shuffle the Metal Gear REX Special Attack cards face down, then turn this deck face up.",
        "Place the Metal Gear REX tile at the top of the platform and the players in the starting area.",
        "4 players (Otacon): place the Terminal Reference card (Boss Stage Terminal) over the highlighted area of Otacon's dashboard.",
        "Take Otacon's Terminal tile, place his figure on it as shown and put his (?) token on the leftmost space of the Terminal tile.",
        "Use the \"Metal Gear REX\" System deck instead of Otacon's standard System deck."
      ],
      objective: [
        "Destroy REX's Radome by reducing its health to 0."
      ],
      special: [
        { t: "Radar Homing Missile Launcher", d: "Players target REX's Radome with the homing missile special action and their Crosshairs tokens." },
        { t: "REX Special Attacks", d: "The Special Attack deck is face up: REX's next special attack is known in advance." }
      ],
      failure: [
        "A player is killed in action (KIA)."
      ],
      cleared: [
        "After winning, read the final cutscene (pages 134-145).",
        "Unlocks Equipment card #023 (p145)",
        "Go to page 146."
      ],
      boss: {
        name: "Metal Gear REX (piloted by Liquid Snake)",
        health: "Radome: depends on the number of players, see the REX dashboard (not shown in the book)",
        defense: "See the REX dashboard",
        notes: [
          "Two decks: REX Boss cards (shuffled) + Special Attack cards (face up).",
          "Target: the Radome (circular radar antenna on the left arm); REX's armor is indestructible."
        ]
      },
      briefing: "Liquid Snake has taken the controls of Metal Gear REX. Otacon reveals the bipedal tank's weak point: the Radome, its radar. Destroying that sensor with homing missiles is the only chance to blind REX and stop the nuclear launch.",
      tips: [
        "Always check the face-up Special Attack card: get out of the targeted area before the Enemy phase.",
        "Spread the team across the platform so a single area attack doesn't hit everyone.",
        "Coordinate the Crosshairs tokens to focus fire on the Radome.",
        "It's the last Stage: use your Rations and unlocked equipment freely."
      ]
    },

    VR60: {
      players: {
        note: [
          "1 to 4 players, any combination of characters (even Otacon alone)."
        ]
      },
      guardDeck: "7 red, 17 blue + 1 extra blue per player beyond the first",
      legend: {
        bossSpawn: "X token (Objective X) in the center of the heliport"
      },
      setup: [
        "Guard Order deck: 7 red + 17 blue, plus 1 extra blue per player beyond the first.",
        "Each player places their figure on one of the starting spaces (red stars around the EXIT space, at the bottom).",
        "Shuffle the 5 Trap tokens (red ? on a gray background) and place 2 of them face down on the map as shown.",
        "Place 1 X token face up on the map as shown (center of the heliport): this is the VR boss spawn space.",
        "Place the 5 Objective tokens (? on a khaki folder), Events A-D, Terminals, locked doors, cameras and Guards as shown on the map.",
        "Prepare the VR dashboards (green side) of the available bosses for spawning."
      ],
      objective: [
        "1) Each player must collect 1 objective.",
        "2) Then any player must reach the Exit space."
      ],
      special: [
        { t: "Collecting an objective", d: "Move onto an Objective token (?). Place it next to your dashboard to keep track of which characters have collected an objective." },
        { t: "VR boss spawns", d: "Each time a spawn icon (radio) is resolved on a Guard Order card and at least 1 Guard should spawn, instead of the first Guard spawn 1 random available VR boss on the X space, facing the top of the board. Then spawn any additional Guards normally." },
        { t: "Defeating a VR boss", d: "Each VR boss defeated automatically unlocks the lowest-level locked door on the map. Defeated bosses are removed from the game and don't respawn." },
        { t: "Events A/B/C/D", d: "When moving onto an Event token, a player can discard it to fully refill the ammo, charges or uses of 1 of their pieces of equipment." }
      ],
      events: [
        { k: "A", d: "Discard to fully refill 1 piece of equipment (ammo, charges or uses)." },
        { k: "B", d: "Same as A." },
        { k: "C", d: "Same as A." },
        { k: "D", d: "Same as A." }
      ],
      failure: [
        "The Game Over card is revealed.",
        "OR a player is killed in action (KIA)."
      ],
      cleared: [
        "VR Stage 60 Cleared: QR code on the sheet (no Equipment card listed)."
      ],
      boss: {
        name: "Random VR bosses",
        health: "Per the VR (green) side of each boss dashboard",
        defense: "Per the VR side of the dashboard",
        notes: [
          "They spawn on the X space in place of the first Guard of a spawn.",
          "They don't use their Boss deck: apply the rules on the green (VR) side of their dashboard.",
          "The number of attack dice varies by boss: read the dashboard.",
          "A VR boss that sees you triggers the alarm."
        ]
      },
      briefing: "After a successful infiltration, the team has been captured and each member is wearing an explosive that will go off if they try to escape. They have to take the elevator, defuse the charges at a disarming station, then get one operative out with the intel.",
      tips: [
        "Each player must pick up an objective: split up the ? tokens from the start.",
        "VR boss spawns are dangerous, but defeating them opens the locked doors (level 3, then 4, then 5).",
        "Save Events A-D to refill a key piece of equipment at the right moment rather than grabbing them right away.",
        "The exit is at the starting point: plan a loop and head back to the EXIT once all objectives are collected."
      ],
      errata: [
        "VR missions are played with 1 to 4 players and any characters (no restriction like in the campaign).",
        "VR bosses do NOT use their Boss deck: follow the rules on the green (VR) side of their dashboard.",
        "A VR boss that sees you triggers the alarm."
      ]
    }
  };
  (window.MGS_MISSIONS || []).forEach(m => { if (EN[m.id]) window.MGS_applyEN(m, EN[m.id]); });
})();
