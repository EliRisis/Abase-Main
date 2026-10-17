const WU = "worlds-greatest-stretch 2x5/side @0 # Warm-up: open the hips, hamstrings and T-spine";
const WU_SPRINT = "a-skip 2x20 yd @30 # Warm-up: knee up, toe up, stay tall";

const PLANS = [
  // ============================ POINT GUARD ============================
  {
    slug: "pg-transition-speed", goal: "speed",
    desc: "Open-court speed for the ball handler: acceleration through the first 20 feet, curved sprints to beat the defense down the floor, and elastic power that lets you change pace without wasting energy.",
    w: [
      ["Open-Court Acceleration", 50, [WU_SPRINT, "wall-drive-march 2x8/side @30", "twenty-yard-sprint 6x20 yd @75 # Full-court starts, 0 to 20 yd", "resisted-sled-sprint 4x15 yd @90", "broad-jump 3x4 @60", "nordic-hamstring-curl 3x5 @90"]],
      ["Change of Pace & Pursuit", 50, [WU, "curved-sprint 4x25 yd/side @75", "backpedal-break 4x2/side @60", "suicide-sprints 3x1 @150 # Every line, full effort", "hang-power-clean 4x3 @120", "barbell-hip-thrust 3x8 @75"]],
      ["Elastic Power", 45, ["pogo-hop 3x15 @45", "box-jump 4x4 @90", "single-leg-bound 3x4/side @75", "trap-bar-jump 3x4 @90", "hamstring-slider-curl 3x8 @60", "hollow-body-hold 3x20 sec @30"]],
    ],
  },
  {
    slug: "pg-finishing-strength", goal: "strength_power",
    desc: "Guards need to be strong for their size to absorb contact and finish at the rim. Front squats and hip thrusts build the lower body, upper-body work handles contact, and cleans and depth jumps develop vertical power.",
    w: [
      ["Lower-Body Strength", 55, ["front-squat 4x5 @150", "bulgarian-split-squat 3x8/side @90", "barbell-hip-thrust 3x8 @90", "single-leg-calf-raise 3x12/side @45", "ab-wheel-rollout 3x8 @45", "suitcase-carry 3x30 yd/side @45"]],
      ["Upper Strength for Contact", 50, ["dumbbell-bench-press 4x6 @120", "chin-up 4x6 @90", "landmine-press 3x8/side @60", "inverted-row 3x10 @60", "face-pull 3x15 @45"]],
      ["Vertical Power", 50, ["hang-power-clean 5x3 @120", "box-jump 4x4 @90", "depth-jump 3x4 @90", "med-ball-slam 3x8 @45", "single-leg-box-jump 3x4/side @75", "pallof-press 3x10/side @30"]],
    ],
  },
  {
    slug: "point-guard-explosiveness", goal: "agility_lateral_quickness", name: "Point Guard Change-of-Direction Quickness",
    desc: "First-step quickness and change of direction for the ball handler. On-ball footwork, defensive slides and closeouts, and stop-and-go cutting drills build the ability to shake a defender or stay in front of one.",
    w: [
      ["On-Ball Footwork", 45, ["ladder-in-out 3x2 @30", "mirror-drill 5x12 sec @45", "t-drill 4x1 @75", "lateral-bound 3x5/side @60", "lateral-lunge 3x8/side @60", "hop-and-stick 3x5/side @45"]],
      ["Defensive Slide & Recover", 50, ["defensive-slide-drill 5x10 yd @45", "closeout-drill 5x1 @60", "cone-shuttle-5-10-5 4x1 @90", "reactive-cone-sprint 6x1 @60", "skater-jump 3x6/side @60", "cossack-squat 3x6/side @45"]],
      ["Cut & Stop", 50, ["zig-zag-cut-drill 5x20 yd @60", "three-cone-drill 4x1 @75", "box-drill 4x1 @60", "depth-jump 3x4 @90", "single-leg-romanian-deadlift 3x8/side @60", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "pg-full-court-conditioning", goal: "conditioning",
    desc: "Repeat-sprint conditioning for a guard who runs the floor for 30 minutes. Court-line sprints, bike intervals and short repeat sprints build the ability to keep pace with the ball late in the fourth quarter.",
    w: [
      ["Court-Line Sprints", 45, ["suicide-sprints 5x1 @90", "jump-rope 4x60 sec @30", "goblet-squat 3x12 @45", "push-up 3x15 @30", "mountain-climber 3x30 sec @30"]],
      ["Interval Engine", 45, ["assault-bike-intervals 8x20 sec @40", "rowing-intervals 5x250 m @90", "kettlebell-swing 4x15 @45", "inverted-row 3x12 @45", "dead-bug 3x10/side @30"]],
      ["Repeat Sprints", 45, ["repeat-sprint-30m 10x30 m @30", "three-hundred-yard-shuttle 2x1 @180", "burpee 3x10 @45", "bear-crawl 3x20 yd @45", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "pg-ankle-knee-care", goal: "injury_prevention_mobility",
    desc: "Ankle sprains and knee overload are the price of constant cutting. This block builds ankle stiffness and balance, knee robustness, and hip control so the joints can handle the change of direction demands of the position.",
    w: [
      ["Ankle Stability", 40, ["ankle-wall-mobility 2x10/side @0", "tibialis-raise 3x15 @30", "single-leg-calf-raise 3x12/side @45", "hop-and-stick 3x5/side @45", "single-leg-balance-reach 3x6/side @30", "pogo-hop 3x15 @45"]],
      ["Knee Robustness", 40, ["spanish-squat 3x30 sec @45", "step-up 3x10/side @60", "single-leg-romanian-deadlift 3x8/side @60", "banded-lateral-walk 3x12/side @30", "hip-airplane 3x5/side @0", "nordic-hamstring-curl 3x5 @90"]],
      ["Hips & Landing", 40, [WU, "hip-90-90 3x6/side @0", "single-leg-glute-bridge 3x10/side @30", "copenhagen-plank 3x20 sec/side @30", "deep-squat-hold 3x30 sec @30", "dead-bug 3x8/side @30"]],
    ],
  },

  // ============================ SHOOTING GUARD ============================
  {
    slug: "sg-closeout-speed", goal: "speed",
    desc: "Speed for the perimeter scorer: closing out on shooters, getting to open spots, and outrunning defenders in transition. Short acceleration work, flying sprints and elastic plyometrics.",
    w: [
      ["Closeout Acceleration", 50, [WU_SPRINT, "closeout-drill 6x1 @60", "ten-yard-acceleration 6x10 yd @75", "resisted-sled-sprint 4x15 yd @90", "lateral-bound 3x5/side @60", "nordic-hamstring-curl 3x5 @90"]],
      ["Fast-Break Speed", 50, [WU_SPRINT, "twenty-yard-sprint 5x20 yd @75", "flying-sprint-30 4x30 yd @120", "curved-sprint 4x25 yd/side @75", "hang-power-clean 4x3 @120", "barbell-hip-thrust 3x8 @75", "single-leg-calf-raise 3x12/side @45"]],
      ["Elastic Power", 45, ["pogo-hop 3x15 @45", "hurdle-hop 4x5 @60", "box-jump 4x4 @90", "single-leg-bound 3x4/side @75", "hamstring-slider-curl 3x8 @60", "hollow-body-hold 3x20 sec @30"]],
    ],
  },
  {
    slug: "sg-vertical-finishing-power", goal: "strength_power",
    desc: "Vertical leap and finishing strength for the wing. Heavy squats build the base, reactive plyometrics and cleans convert it into jump height, and upper-body work handles contact at the rim.",
    w: [
      ["Lower-Body Power", 55, ["back-squat 4x5 @150", "trap-bar-jump 4x3 @90", "bulgarian-split-squat 3x8/side @90", "barbell-hip-thrust 3x8 @90", "single-leg-calf-raise 3x12/side @45"]],
      ["Upper Push & Pull", 50, ["incline-dumbbell-press 4x8 @90", "one-arm-dumbbell-row 3x10/side @60", "push-press 4x5 @120", "chin-up 3x6 @90", "face-pull 3x15 @45"]],
      ["Reactive Vertical", 50, ["depth-jump 4x4 @90", "tuck-jump 3x6 @60", "box-jump 4x3 @90", "med-ball-scoop-toss 3x5/side @60", "split-squat-jump 3x5/side @75", "pallof-press 3x10/side @30"]],
    ],
  },
  {
    slug: "sg-cut-closeout-agility", goal: "agility_lateral_quickness",
    desc: "Agility for off-ball cutting and on-ball defense. Sharp cuts to get open, closeouts and defensive slides, and footwork off the catch so you're balanced and ready to shoot.",
    w: [
      ["Off-Ball Cuts", 45, [WU, "zig-zag-cut-drill 5x20 yd @60", "w-drill 4x1 @75", "t-drill 4x1 @75", "ladder-lateral-run 3x2 @30", "hop-and-stick 3x5/side @45"]],
      ["Closeouts & Stops", 50, ["closeout-drill 5x1 @60", "defensive-slide-drill 5x10 yd @45", "cone-shuttle-5-10-5 4x1 @90", "reactive-cone-sprint 6x1 @60", "skater-jump 3x6/side @60", "cossack-squat 3x6/side @45"]],
      ["Footwork Off the Catch", 45, ["box-drill 4x1 @60", "ladder-in-out 3x2 @30", "drop-step-drill 4x8 yd/side @60", "three-cone-drill 4x1 @75", "single-leg-romanian-deadlift 3x8/side @60", "lateral-lunge 3x8/side @60"]],
    ],
  },
  {
    slug: "sg-full-court-conditioning", goal: "conditioning",
    desc: "Conditioning for a wing who runs off screens and sprints in transition all game. A mix of court sprints, aerobic base work and repeat-effort intervals.",
    w: [
      ["Court Sprint Intervals", 45, ["suicide-sprints 4x1 @90", "battle-rope-waves 4x30 sec @45", "jump-rope 4x60 sec @30", "kettlebell-swing 4x15 @45", "bear-crawl 3x20 yd @45"]],
      ["Aerobic Base", 45, ["fartlek-run 1x20 min @0 # Surge for 30 sec every 2 minutes", "goblet-squat 3x12 @45", "inverted-row 3x12 @45", "plank 3x45 sec @30", "bird-dog 3x8/side @30"]],
      ["Repeat Efforts", 45, ["assault-bike-intervals 6x30 sec @60", "repeat-sprint-30m 8x30 m @30", "burpee 3x10 @45", "farmers-carry 3x40 yd @60", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "sg-ankle-knee-care", goal: "injury_prevention_mobility",
    desc: "Durability for the perimeter player's joints: ankle stiffness and balance, knee and quad tendon strength, and hip and trunk control for landing safely after every jump.",
    w: [
      ["Ankle & Foot", 40, ["ankle-wall-mobility 2x10/side @0", "tibialis-raise 3x15 @30", "single-leg-calf-raise 3x12/side @45", "single-leg-balance-reach 3x6/side @30", "pogo-hop 3x15 @45", "hop-and-stick 3x5/side @45"]],
      ["Knee & Quad Tendon", 40, ["spanish-squat 3x30 sec @45", "step-up 3x10/side @60", "reverse-lunge 3x8/side @60", "hamstring-slider-curl 3x8 @60", "hip-airplane 3x5/side @0", "banded-lateral-walk 3x12/side @30"]],
      ["Hips & Trunk", 40, ["couch-stretch 2x45 sec/side @0", "hip-90-90 3x6/side @0", "single-leg-glute-bridge 3x10/side @30", "copenhagen-plank 3x20 sec/side @30", "bird-dog 3x8/side @30", "dead-bug 3x8/side @30"]],
    ],
  },

  // ============================ CENTER ============================
  {
    slug: "center-rim-to-rim-speed", goal: "speed",
    desc: "Speed for the big man: rim-running acceleration and first-step burst, elastic ankles and hips, and explosive power so you can outrun the other team's center down the floor.",
    w: [
      ["Rim-Run Acceleration", 50, [WU_SPRINT, "wall-drive-march 2x8/side @30", "ten-yard-acceleration 6x10 yd @75", "resisted-sled-sprint 4x15 yd @120", "sled-push 4x15 yd @90", "broad-jump 3x4 @75"]],
      ["Elastic Big-Man Speed", 50, [WU_SPRINT, "twenty-yard-sprint 4x20 yd @90", "pogo-hop 3x15 @45", "hurdle-hop 4x5 @60", "hang-power-clean 4x3 @120", "single-leg-bound 3x4/side @75", "nordic-hamstring-curl 3x5 @90"]],
      ["Lower-Body Power", 50, ["trap-bar-jump 4x3 @90", "box-jump 4x4 @90", "barbell-hip-thrust 3x8 @90", "step-up 3x8/side @60", "med-ball-slam 3x8 @45", "hollow-body-hold 3x20 sec @30"]],
    ],
  },
  {
    slug: "center-post-strength-power", goal: "strength_power",
    desc: "Heavy strength for winning position in the paint. Squats and deadlifts for the base, pressing and rowing for post battles, plus vertical power work for rebounding and rim protection.",
    w: [
      ["Squat & Post Strength", 60, ["back-squat 5x5 @180", "good-morning 3x8 @90", "bulgarian-split-squat 3x8/side @90", "barbell-hip-thrust 3x8 @90", "single-leg-calf-raise 3x12/side @45", "ab-wheel-rollout 3x8 @45"]],
      ["Upper Push & Pull", 55, ["barbell-bench-press 5x5 @150", "overhead-press 4x6 @120", "chin-up 4x8 @90", "barbell-row 4x8 @90", "parallel-bar-dip 3x8 @75", "face-pull 3x15 @45"]],
      ["Vertical & Rebound Power", 50, ["trap-bar-deadlift 4x4 @180", "hang-power-clean 4x3 @120", "box-jump 4x4 @90", "depth-jump 3x4 @90", "med-ball-chest-pass 3x6 @60", "farmers-carry 3x40 yd @60"]],
    ],
  },
  {
    slug: "center-post-footwork-agility", goal: "agility_lateral_quickness",
    desc: "Quick feet for a big body: drop-step and post footwork, defensive slides and hedge-and-recover movement, with lower-body reactivity so you can stay in front of guards on switches.",
    w: [
      ["Drop-Step & Post Footwork", 45, [WU, "drop-step-drill 5x8 yd/side @60", "defensive-slide-drill 4x10 yd @60", "ladder-in-out 3x2 @30", "lateral-lunge 3x8/side @60", "pallof-press 3x10/side @30"]],
      ["Hedge & Recover", 50, ["t-drill 4x1 @75", "cone-shuttle-5-10-5 4x1 @90", "mirror-drill 5x10 sec @45", "skater-jump 3x6/side @60", "cossack-squat 3x6/side @45"]],
      ["Quick Feet at Size", 45, ["ladder-lateral-run 3x2 @30", "box-drill 4x1 @75", "depth-jump 3x4 @90", "hop-and-stick 3x5/side @45", "single-leg-romanian-deadlift 3x8/side @60", "lateral-bound 3x5/side @60"]],
    ],
  },
  {
    slug: "center-rebounding-conditioning", goal: "conditioning",
    desc: "Conditioning for a post player who battles every possession: sled and carry work for strength endurance, bike intervals to keep the engine running, and repeat-effort work to keep rebounding late.",
    w: [
      ["Sled & Carry Base", 45, ["sled-push 8x20 yd @45", "farmers-carry 4x40 yd @60", "battle-rope-waves 4x30 sec @45", "bear-crawl 3x20 yd @45", "kettlebell-swing 4x15 @45"]],
      ["Interval Bike & Row", 45, ["assault-bike-intervals 6x30 sec @60", "rowing-intervals 5x250 m @90", "goblet-squat 3x12 @45", "push-up 3x15 @30", "dead-bug 3x10/side @30"]],
      ["Repeat Sprints & Jumps", 45, ["repeat-sprint-30m 8x30 m @45", "jump-rope 4x60 sec @30", "burpee 3x8 @45", "suicide-sprints 3x1 @150", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "center-knee-shoulder-care", goal: "injury_prevention_mobility",
    desc: "Big men carry big loads through the knees and back, and overhead work stresses the shoulders. Knee and landing durability, shoulder stability and hip and spine mobility to keep you in the lane.",
    w: [
      ["Knees & Landing", 40, ["spanish-squat 3x30 sec @45", "step-up 3x10/side @60", "hop-and-stick 3x5/side @45", "tibialis-raise 3x15 @30", "single-leg-calf-raise 3x12/side @45", "nordic-hamstring-curl 3x5 @90"]],
      ["Shoulders & Overhead", 40, ["shoulder-cars 2x8/dir @0", "band-external-rotation 3x15/side @30", "face-pull 3x15 @45", "y-t-w-raise 3x8 @30", "serratus-wall-slide 3x10 @30", "sleeper-stretch 2x30 sec/side @0"]],
      ["Hips & Back", 40, ["hip-90-90 3x6/side @0", "couch-stretch 2x45 sec/side @0", "single-leg-glute-bridge 3x10/side @30", "bird-dog 3x8/side @30", "dead-bug 3x8/side @30", "thoracic-open-book 2x8/side @0"]],
    ],
  },
];
export default PLANS;
