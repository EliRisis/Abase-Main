const WU = "worlds-greatest-stretch 2x5/side @0 # Warm-up: open the hips, hamstrings and T-spine";
const WU_SPRINT = "a-skip 2x20 yd @30 # Warm-up: knee up, toe up, stay tall";

const PLANS = [
  // ============================ FORWARD ============================
  {
    slug: "forward-explosive-finishing-plan", goal: "speed",
    desc: "Speed to get in behind and finish. Acceleration out of the first step, top-end sprinting and elastic plyometrics, with hamstring work to keep the legs healthy under high-speed running.",
    w: [
      ["Acceleration", 50, [WU_SPRINT, "ten-yard-acceleration 6x10 yd @75", "resisted-sled-sprint 5x15 yd @90", "broad-jump 4x3 @75", "nordic-hamstring-curl 3x5 @90", "hollow-body-hold 3x20 sec @30"]],
      ["Top Speed & Repeat Runs", 50, [WU_SPRINT, "flying-sprint-30 5x30 m @150 # 20 m build, 10 m max", "wicket-run 3x30 yd @60", "curved-sprint 4x25 yd/side @75", "hang-power-clean 4x3 @120", "single-leg-calf-raise 3x12/side @45"]],
      ["Elastic Power", 45, ["pogo-hop 3x15 @45", "depth-jump 4x4 @90", "single-leg-bound 3x4/side @75", "trap-bar-jump 4x3 @90", "hamstring-slider-curl 3x8 @60"]],
    ],
  },
  {
    slug: "forward-finishing-power", goal: "strength_power",
    desc: "Strength and power for shielding the ball, winning duels and striking with authority. Lower-body lifts for the base, upper-body work for hold-up play, and jumping and rotational power for headers and shots.",
    w: [
      ["Lower-Body Strength", 55, ["back-squat 4x5 @150", "bulgarian-split-squat 3x8/side @90", "barbell-hip-thrust 3x8 @90", "single-leg-romanian-deadlift 3x8/side @60", "single-leg-calf-raise 3x12/side @45"]],
      ["Upper Body & Hold-Up Strength", 50, ["dumbbell-bench-press 4x6 @120", "chin-up 4x6 @90", "one-arm-dumbbell-row 3x8/side @60", "push-press 3x5 @120", "face-pull 3x15 @45", "side-plank 3x30 sec/side @30"]],
      ["Kicking & Jumping Power", 50, ["hang-power-clean 4x3 @120", "single-leg-box-jump 3x4/side @75", "med-ball-rotational-throw 3x6/side @60", "box-jump 3x4 @90", "landmine-rotation 3x8/side @60", "ab-wheel-rollout 3x8 @45"]],
    ],
  },
  {
    slug: "forward-box-movement-agility", goal: "agility_lateral_quickness",
    desc: "Movement to lose defenders in the box: check runs, sharp cuts and reactive changes of direction, plus shooting-turn footwork and deceleration control.",
    w: [
      ["Check-Runs & Shakes", 45, [WU, "zig-zag-cut-drill 5x20 yd @60", "t-drill 4x1 @75", "ladder-in-out 3x2 @30", "lateral-bound 3x5/side @60", "hop-and-stick 3x5/side @45"]],
      ["Reactive Cuts", 50, ["reactive-cone-sprint 6x1 @60", "three-cone-drill 4x1 @75", "cone-shuttle-5-10-5 4x1 @90", "skater-jump 3x6/side @60", "mirror-drill 5x12 sec @45", "cossack-squat 3x6/side @45"]],
      ["Turn & Shoot Footwork", 45, ["drop-step-drill 4x8 yd/side @60", "box-drill 4x1 @60", "carioca 3x20 yd @45", "depth-jump 3x4 @90", "single-leg-romanian-deadlift 3x8/side @60", "lateral-lunge 3x8/side @60"]],
    ],
  },
  {
    slug: "forward-match-day-conditioning", goal: "conditioning",
    desc: "Repeat-sprint ability and aerobic base for a forward who makes high-intensity runs all match. Repeat sprints, high-intensity intervals and an aerobic base to recover between efforts.",
    w: [
      ["Repeat-Sprint Ability", 45, ["repeat-sprint-30m 10x30 m @30", "jump-rope 4x60 sec @30", "goblet-squat 3x12 @45", "push-up 3x15 @30", "dead-bug 3x10/side @30"]],
      ["High-Intensity Intervals", 45, ["assault-bike-intervals 8x20 sec @40", "rowing-intervals 5x250 m @90", "kettlebell-swing 4x15 @45", "inverted-row 3x12 @45", "mountain-climber 3x30 sec @30"]],
      ["Aerobic Base", 45, ["zone-2-run 1x30 min @0", "goblet-squat 3x12 @45", "bear-crawl 3x20 yd @45", "farmers-carry 3x40 yd @60", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "forward-hamstring-groin-care", goal: "injury_prevention_mobility",
    desc: "Hamstring strains and groin pain are the forward's occupational hazards. Eccentric hamstring work, adductor strength and hip mobility protect the sprint and the strike.",
    w: [
      ["Hamstrings", 40, ["nordic-hamstring-curl 3x5 @90", "hamstring-slider-curl 3x8 @60", "single-leg-romanian-deadlift 3x8/side @60", "single-leg-glute-bridge 3x10/side @30", "hip-90-90 2x6/side @0"]],
      ["Groin & Adductors", 40, ["copenhagen-plank 3x20 sec/side @30", "adductor-rockback 2x10 @0", "lateral-lunge 3x8/side @60", "cossack-squat 3x6/side @45", "banded-lateral-walk 3x12/side @30", "hip-airplane 3x5/side @0"]],
      ["Hips & Ankles", 40, ["couch-stretch 2x45 sec/side @0", "ankle-wall-mobility 2x10/side @0", "tibialis-raise 3x15 @30", "single-leg-balance-reach 3x6/side @30", "deep-squat-hold 3x30 sec @30", "hop-and-stick 3x5/side @45"]],
    ],
  },

  // ============================ MIDFIELDER ============================
  {
    slug: "midfielder-box-to-box-speed", goal: "speed",
    desc: "Speed that holds up for 90 minutes: repeated sprint mechanics, top-end running and elastic power for the midfielder who covers every blade of grass.",
    w: [
      ["Repeat-Sprint Mechanics", 50, [WU_SPRINT, "repeat-sprint-30m 8x30 m @45", "ten-yard-acceleration 5x10 yd @75", "wall-drive-march 2x8/side @30", "broad-jump 3x4 @60", "nordic-hamstring-curl 3x5 @90"]],
      ["Top Speed", 50, [WU_SPRINT, "flying-sprint-30 4x30 m @150", "wicket-run 3x30 yd @60", "curved-sprint 4x25 yd/side @75", "hang-power-clean 3x3 @120", "barbell-hip-thrust 3x8 @75"]],
      ["Elastic Power", 45, ["pogo-hop 3x15 @45", "hurdle-hop 4x5 @60", "single-leg-bound 3x4/side @75", "trap-bar-jump 3x4 @90", "hamstring-slider-curl 3x8 @60", "hollow-body-hold 3x20 sec @30"]],
    ],
  },
  {
    slug: "midfielder-functional-strength-power", goal: "strength_power",
    desc: "Functional strength for winning the midfield battle: single-leg strength for stability, trunk strength for shielding, and explosive lifts and throws for power over the ball.",
    w: [
      ["Lower-Body Strength", 55, ["back-squat 4x6 @120", "reverse-lunge 3x8/side @75", "barbell-hip-thrust 3x8 @90", "single-leg-romanian-deadlift 3x8/side @60", "pallof-press 3x10/side @30"]],
      ["Upper Body & Trunk", 50, ["incline-dumbbell-press 3x10 @90", "inverted-row 3x10 @60", "landmine-press 3x8/side @60", "face-pull 3x15 @45", "farmers-carry 3x40 yd @60"]],
      ["Explosive Power", 45, ["trap-bar-deadlift 4x5 @150", "jump-squat 3x5 @75", "med-ball-rotational-throw 3x6/side @60", "step-up 3x8/side @60", "hanging-knee-raise 3x10 @45"]],
    ],
  },
  {
    slug: "midfielder-change-of-direction-agility", goal: "agility_lateral_quickness",
    desc: "Agility to receive under pressure, turn away from it and press: turning and receiving footwork, pressing steps and deceleration control.",
    w: [
      ["Turn & Receive", 45, [WU, "mirror-drill 5x12 sec @45", "ladder-in-out 3x2 @30", "carioca 3x20 yd @45", "lateral-bound 3x5/side @60", "cossack-squat 3x6/side @45"]],
      ["Pressing Steps", 50, ["defensive-slide-drill 4x10 yd @60", "t-drill 4x1 @75", "reactive-cone-sprint 6x1 @60", "cone-shuttle-5-10-5 4x1 @90", "skater-jump 3x6/side @60"]],
      ["Deceleration", 45, ["three-cone-drill 4x1 @75", "box-drill 4x1 @60", "zig-zag-cut-drill 4x20 yd @60", "hop-and-stick 3x5/side @45", "depth-jump 3x4 @90", "single-leg-romanian-deadlift 3x8/side @60"]],
    ],
  },
  {
    slug: "soccer-midfielder-engine-builder", goal: "conditioning",
    desc: "The engine room. Aerobic base, tempo intervals and match-simulation work build the capacity to run high-intensity for 90 minutes and recover fast between efforts.",
    w: [
      ["Aerobic Engine", 50, ["zone-2-run 1x35 min @0", "goblet-squat 3x12 @45", "push-up 3x15 @30", "inverted-row 3x12 @45", "bird-dog 3x8/side @30"]],
      ["Tempo Intervals", 45, ["tempo-run-200 8x200 m @60", "kettlebell-swing 4x15 @45", "jump-rope 4x60 sec @30", "inverted-row 3x12 @45", "plank 3x45 sec @30"]],
      ["Match Simulation", 50, ["assault-bike-intervals 8x30 sec @45", "repeat-sprint-30m 8x30 m @30", "bear-crawl 3x20 yd @45", "farmers-carry 3x40 yd @60", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "midfielder-hamstring-groin-care", goal: "injury_prevention_mobility",
    desc: "Protect the muscles that carry a midfielder through the season: hamstring strength, groin and hip resilience, and core and ankle control.",
    w: [
      ["Hamstrings", 40, ["single-leg-romanian-deadlift 3x8/side @60", "hamstring-slider-curl 3x8 @60", "good-morning 3x10 @60", "glute-bridge 3x12 @30", "nordic-hamstring-curl 3x5 @90"]],
      ["Groin & Hips", 40, ["adductor-rockback 2x10 @0", "copenhagen-plank 3x20 sec/side @30", "hip-airplane 3x5/side @0", "hip-90-90 3x6/side @0", "banded-lateral-walk 3x12/side @30"]],
      ["Core & Ankles", 40, ["dead-bug 3x8/side @30", "bird-dog 3x8/side @30", "side-plank 3x30 sec/side @30", "ankle-wall-mobility 2x10/side @0", "tibialis-raise 3x15 @30", "single-leg-balance-reach 3x6/side @30"]],
    ],
  },

  // ============================ DEFENDER ============================
  {
    slug: "defender-recovery-speed", goal: "speed",
    desc: "Recovery speed to track down runners: backpedal-to-sprint transitions, acceleration and top-end speed, with power and elastic training to close gaps fast.",
    w: [
      ["Recovery Runs", 50, [WU_SPRINT, "backpedal-break 5x2/side @60", "twenty-yard-sprint 5x20 yd @90", "resisted-sled-sprint 4x15 yd @90", "curved-sprint 4x25 yd/side @75", "nordic-hamstring-curl 3x5 @90"]],
      ["Top End", 50, [WU_SPRINT, "flying-sprint-30 4x30 m @150", "wicket-run 3x30 yd @60", "hang-power-clean 4x3 @120", "barbell-hip-thrust 3x8 @75", "single-leg-calf-raise 3x12/side @45"]],
      ["Power", 45, ["trap-bar-jump 4x3 @90", "depth-jump 3x4 @90", "single-leg-bound 3x4/side @75", "split-squat-jump 3x5/side @75", "hamstring-slider-curl 3x8 @60", "hollow-body-hold 3x20 sec @30"]],
    ],
  },
  {
    slug: "defender-aerial-tackling-strength", goal: "strength_power",
    desc: "Strength to win aerial duels and tackles: heavy lower-body work, upper-body strength for contact, and jumping and heading power.",
    w: [
      ["Lower-Body Strength", 55, ["back-squat 4x5 @150", "trap-bar-deadlift 3x5 @150", "bulgarian-split-squat 3x8/side @90", "barbell-hip-thrust 3x8 @90", "single-leg-calf-raise 3x12/side @45"]],
      ["Upper Body for Duels", 50, ["barbell-bench-press 4x5 @120", "chin-up 4x6 @90", "one-arm-dumbbell-row 3x8/side @60", "push-press 3x5 @120", "face-pull 3x15 @45", "farmers-carry 3x40 yd @60"]],
      ["Aerial Power", 50, ["box-jump 4x4 @90", "hang-power-clean 4x3 @120", "high-ball-jump-catch 4x5 @60 # Time the jump, attack the ball", "med-ball-slam 3x8 @45", "single-leg-box-jump 3x4/side @75", "pallof-press 3x10/side @30"]],
    ],
  },
  {
    slug: "defender-jockey-recovery-agility", goal: "agility_lateral_quickness",
    desc: "Agility to stay in front of attackers: jockeying and mirroring, turning and recovering, and stepping and blocking quickly.",
    w: [
      ["Jockey & Mirror", 45, [WU, "defensive-slide-drill 5x10 yd @45", "mirror-drill 5x12 sec @45", "ladder-lateral-run 3x2 @30", "lateral-lunge 3x8/side @60", "lateral-bound 3x5/side @60"]],
      ["Turn & Recover", 50, ["w-drill 4x1 @75", "backpedal-break 5x2/side @60", "t-drill 4x1 @75", "cone-shuttle-5-10-5 4x1 @90", "reactive-cone-sprint 6x1 @60", "hop-and-stick 3x5/side @45"]],
      ["Step & Block", 45, ["drop-step-drill 4x8 yd/side @60", "box-drill 4x1 @60", "three-cone-drill 4x1 @75", "skater-jump 3x6/side @60", "depth-jump 3x4 @90", "single-leg-romanian-deadlift 3x8/side @60"]],
    ],
  },
  {
    slug: "defender-ninety-minute-conditioning", goal: "conditioning",
    desc: "Conditioning to stay sharp for a full match: aerobic base, tempo intervals and repeat efforts to keep recovery sprints crisp in the final minutes.",
    w: [
      ["Aerobic Base", 45, ["zone-2-run 1x30 min @0", "goblet-squat 3x12 @45", "push-up 3x15 @30", "dead-bug 3x10/side @30", "farmers-carry 3x40 yd @60"]],
      ["Intervals", 45, ["tempo-run-200 8x200 m @60", "assault-bike-intervals 6x30 sec @60", "kettlebell-swing 4x15 @45", "inverted-row 3x12 @45", "mountain-climber 3x30 sec @30"]],
      ["Repeat Efforts", 45, ["repeat-sprint-30m 8x30 m @30", "three-hundred-yard-shuttle 2x1 @180", "sled-drag-backward 4x30 yd @60", "bear-crawl 3x20 yd @45", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "defender-hamstring-groin-care", goal: "injury_prevention_mobility",
    desc: "Keep defenders available: hamstring and posterior-chain strength, groin and hip resilience, and knee and ankle durability for a season of duels and recovery runs.",
    w: [
      ["Hamstrings & Posterior Chain", 40, ["nordic-hamstring-curl 3x5 @90", "single-leg-romanian-deadlift 3x8/side @60", "hamstring-slider-curl 3x8 @60", "glute-bridge 3x12 @30", "good-morning 3x10 @60"]],
      ["Groin & Hips", 40, ["copenhagen-plank 3x20 sec/side @30", "cossack-squat 3x6/side @45", "adductor-rockback 2x10 @0", "couch-stretch 2x45 sec/side @0", "hip-90-90 3x6/side @0", "banded-lateral-walk 3x12/side @30"]],
      ["Knees & Ankles", 40, ["spanish-squat 3x30 sec @45", "step-up 3x10/side @60", "tibialis-raise 3x15 @30", "single-leg-calf-raise 3x12/side @45", "hop-and-stick 3x5/side @45", "single-leg-balance-reach 3x6/side @30"]],
    ],
  },

  // ============================ GOALKEEPER ============================
  {
    slug: "goalkeeper-reaction-speed", goal: "speed",
    desc: "Reaction and short-burst speed for the keeper: first-step reaction to shots, explosive feet and hands, and power to close down angles and get off the line.",
    w: [
      ["First-Step Reaction", 45, [WU, "tennis-ball-reaction-catch 4x8 @45", "reaction-ball-drill 4x8 catches @45", "ten-yard-acceleration 5x10 yd @75", "lateral-bound 3x5/side @60", "ladder-in-out 3x2 @30"]],
      ["Explosive Feet", 45, ["depth-jump 4x4 @90", "pogo-hop 3x15 @45", "hurdle-hop 4x5 @60", "single-leg-box-jump 3x4/side @75", "broad-jump 3x4 @60", "hollow-body-hold 3x20 sec @30"]],
      ["Hips & Hands Power", 45, ["med-ball-chest-pass 4x6 @60", "med-ball-slam 3x8 @45", "hang-power-clean 4x3 @120", "lateral-hurdle-hop 3x6/side @60", "plank 3x45 sec @30"]],
    ],
  },
  {
    slug: "goalkeeper-diving-catching-power", goal: "strength_power",
    desc: "Strength and power for diving, catching and distributing. Lower-body strength for explosive dives, upper-body strength for catching and punching, and jumping power for high balls.",
    w: [
      ["Lower-Body Strength", 55, ["back-squat 4x5 @150", "trap-bar-deadlift 3x5 @150", "bulgarian-split-squat 3x8/side @90", "barbell-hip-thrust 3x8 @90", "single-leg-calf-raise 3x12/side @45"]],
      ["Upper Body for Catching", 50, ["incline-dumbbell-press 4x8 @90", "chin-up 4x6 @90", "push-press 4x5 @120", "one-arm-dumbbell-row 3x8/side @60", "med-ball-chest-pass 3x6 @60", "face-pull 3x15 @45"]],
      ["Diving Power", 50, ["high-ball-jump-catch 5x4 @60", "diving-save-progression 4x4/side @60 # Progress from knees to standing", "box-jump 4x4 @90", "med-ball-rotational-throw 3x6/side @60", "lateral-bound 3x5/side @60", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "goalkeeper-lateral-dive-agility", goal: "agility_lateral_quickness",
    desc: "Lateral quickness and dive mechanics: footwork to set your feet, dive progressions, and recover-and-reset drills for the second save.",
    w: [
      ["Footwork", 45, [WU, "ladder-in-out 3x2 @30", "ladder-lateral-run 3x2 @30", "defensive-slide-drill 4x10 yd @60", "lateral-bound 3x5/side @60", "skater-jump 3x6/side @60"]],
      ["Dive Mechanics", 45, ["diving-save-progression 5x4/side @60", "tennis-ball-reaction-catch 4x8 @45", "reaction-ball-drill 4x8 catches @45", "lateral-lunge 3x8/side @60", "cossack-squat 3x6/side @45", "hollow-body-hold 3x20 sec @30"]],
      ["Recover & Reset", 45, ["t-drill 4x1 @75", "box-drill 4x1 @60", "drop-step-drill 4x8 yd/side @60", "reactive-cone-sprint 6x1 @60", "depth-jump 3x4 @90", "single-leg-balance-reach 3x6/side @30"]],
    ],
  },
  {
    slug: "goalkeeper-match-sharpness-conditioning", goal: "conditioning",
    desc: "Conditioning for a position of long stillness and sudden effort: repeat explosive efforts, an aerobic base to speed recovery, and intervals to stay sharp late in the match.",
    w: [
      ["Repeat Explosive Efforts", 45, ["ten-yard-acceleration 10x10 yd @30", "burpee 3x10 @45", "jump-rope 4x60 sec @30", "mountain-climber 3x30 sec @30", "goblet-squat 3x12 @45"]],
      ["Aerobic Base", 45, ["zone-2-run 1x25 min @0", "bear-crawl 3x20 yd @45", "kettlebell-swing 4x15 @45", "inverted-row 3x12 @45", "dead-bug 3x10/side @30"]],
      ["Intervals", 45, ["assault-bike-intervals 8x20 sec @40", "rowing-intervals 5x250 m @90", "push-up 3x15 @30", "farmers-carry 3x40 yd @60", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "goalkeeper-shoulder-wrist-care", goal: "injury_prevention_mobility",
    desc: "The keeper's shoulders, wrists and hips take repeated impact from dives, catches and punches. This block builds shoulder stability, wrist and forearm resilience, and hip and landing mechanics.",
    w: [
      ["Shoulders", 40, ["shoulder-cars 2x8/dir @0", "band-external-rotation 3x15/side @30", "face-pull 3x15 @45", "y-t-w-raise 3x8 @30", "serratus-wall-slide 3x10 @30", "sleeper-stretch 2x30 sec/side @0"]],
      ["Wrists & Hands", 40, ["forearm-flexor-extensor-curl 3x15 @30", "bottoms-up-kettlebell-carry 3x20 yd/side @45", "cuban-press 3x10 @45", "side-plank 3x30 sec/side @30", "thoracic-open-book 2x8/side @0"]],
      ["Hips & Landing", 40, ["hip-90-90 3x6/side @0", "adductor-rockback 2x10 @0", "glute-bridge 3x12 @30", "hop-and-stick 3x5/side @45", "tibialis-raise 3x15 @30", "deep-squat-hold 3x30 sec @30"]],
    ],
  },
];
export default PLANS;
