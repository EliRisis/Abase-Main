const WU = "worlds-greatest-stretch 2x5/side @0 # Warm-up: open the hips, hamstrings and T-spine";
const WU_SPRINT = "a-skip 2x20 yd @30 # Warm-up: knee up, toe up, stay tall";

const PLANS = [
  // ============================ PITCHER ============================
  {
    slug: "pitcher-baserunning-speed", goal: "speed",
    desc: "Leg speed and explosiveness for the pitcher: acceleration mechanics, elastic power and strength-speed work that also supports the lower-half drive on the mound.",
    w: [
      ["Acceleration", 45, [WU_SPRINT, "ten-yard-acceleration 5x10 yd @75", "resisted-sled-sprint 4x15 yd @90", "broad-jump 3x4 @60", "single-leg-romanian-deadlift 3x8/side @60", "hollow-body-hold 3x20 sec @30"]],
      ["Elastic Power", 45, ["pogo-hop 3x15 @45", "hurdle-hop 4x5 @60", "single-leg-bound 3x4/side @75", "trap-bar-jump 3x4 @90", "hamstring-slider-curl 3x8 @60"]],
      ["Strength-Speed", 50, ["hang-power-clean 3x3 @120", "front-squat 3x5 @150", "barbell-hip-thrust 3x8 @90", "step-up 3x8/side @60", "pallof-press 3x10/side @30"]],
    ],
  },
  {
    slug: "pitcher-lower-half-drive-power", goal: "strength_power",
    desc: "Velocity comes from the ground up. Squats and single-leg work build the drive leg, rotational medicine-ball training teaches hip-to-shoulder sequencing, and scapular strength keeps the arm healthy while you throw harder.",
    w: [
      ["Lower-Half Drive", 55, ["front-squat 4x5 @150", "bulgarian-split-squat 3x8/side @90", "barbell-hip-thrust 3x8 @90", "single-leg-romanian-deadlift 3x8/side @60", "single-leg-calf-raise 3x12/side @45"]],
      ["Rotational Power", 45, ["med-ball-rotational-throw 4x5/side @60", "med-ball-scoop-toss 4x5/side @60", "landmine-rotation 3x8/side @60", "cable-woodchop 3x10/side @45", "jump-squat 3x5 @75", "pallof-press 3x10/side @30"]],
      ["Upper Pull & Scapular Strength", 50, ["chin-up 4x6 @90", "one-arm-dumbbell-row 3x10/side @60", "inverted-row 3x10 @60", "face-pull 3x15 @45", "landmine-press 3x8/side @60 # Light and strict", "band-pull-apart 3x20 @30", "y-t-w-raise 3x8 @30"]],
    ],
  },
  {
    slug: "pitcher-fielding-pickoff-agility", goal: "agility_lateral_quickness",
    desc: "Movement for the fifth infielder: fielding footwork, pickoff and covering moves, and balance and deceleration control.",
    w: [
      ["Fielding Footwork", 45, [WU, "ground-ball-shuffle 5x1 @45", "defensive-slide-drill 4x10 yd @60", "ladder-in-out 3x2 @30", "lateral-bound 3x5/side @60", "cossack-squat 3x6/side @45"]],
      ["Pickoff & Cover", 45, ["drop-step-drill 4x8 yd/side @60", "t-drill 4x1 @75", "reactive-cone-sprint 6x1 @60", "skater-jump 3x6/side @60", "lateral-lunge 3x8/side @60", "single-leg-balance-reach 3x6/side @30"]],
      ["Balance & Deceleration", 45, ["box-drill 4x1 @60", "three-cone-drill 4x1 @75", "hop-and-stick 3x5/side @45", "single-leg-romanian-deadlift 3x8/side @60", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "pitcher-bullpen-stamina", goal: "conditioning",
    desc: "Conditioning to repeat quality pitches deep into outings and recover between them. Aerobic base, tempo work and leg-and-core endurance, without taxing the arm.",
    w: [
      ["Aerobic Base", 45, ["zone-2-run 1x30 min @0", "goblet-squat 3x12 @45", "push-up 3x15 @30", "inverted-row 3x12 @45", "dead-bug 3x10/side @30"]],
      ["Tempo Work", 45, ["tempo-run-200 6x200 m @60", "kettlebell-swing 4x15 @45", "jump-rope 4x60 sec @30", "inverted-row 3x12 @45", "plank 3x45 sec @30"]],
      ["Legs & Core Stamina", 45, ["assault-bike-intervals 6x30 sec @60", "sled-drag-backward 5x30 yd @45", "farmers-carry 3x40 yd @60", "side-plank 3x30 sec/side @30", "bear-crawl 3x20 yd @45"]],
    ],
  },
  {
    slug: "pitcher-arm-care-mobility", goal: "injury_prevention_mobility",
    desc: "The pitcher's daily insurance policy: rotator cuff and scapular strength, thoracic and hip mobility for a free delivery, and forearm and elbow resilience.",
    w: [
      ["Cuff & Scapula", 40, ["band-shoulder-warmup 2x10 @30", "band-external-rotation 3x15/side @30", "band-internal-rotation 3x15/side @30", "y-t-w-raise 3x8 @30", "serratus-wall-slide 3x10 @30", "sleeper-stretch 2x30 sec/side @0"]],
      ["Thoracic & Hip Mobility", 40, [WU, "thoracic-open-book 2x8/side @0", "hip-90-90 3x6/side @0", "hip-airplane 3x5/side @0", "couch-stretch 2x45 sec/side @0", "deep-squat-hold 3x30 sec @30"]],
      ["Forearm & Elbow", 40, ["forearm-flexor-extensor-curl 3x15 @30", "cuban-press 3x10 @45", "bottoms-up-kettlebell-carry 3x20 yd/side @45", "turkish-get-up 3x3/side @45", "pallof-press 3x10/side @30", "dead-bug 3x8/side @30"]],
    ],
  },

  // ============================ INFIELDER ============================
  {
    slug: "infielder-first-step-burst", goal: "speed",
    desc: "Burst for the infielder: steals and first-step reactions, home-to-first speed, and elastic power for getting to balls and around the bases.",
    w: [
      ["Steal & First Step", 45, [WU_SPRINT, "first-step-steal-start 6x1 @60", "ten-yard-acceleration 5x10 yd @75", "resisted-sled-sprint 4x15 yd @90", "broad-jump 3x4 @60", "nordic-hamstring-curl 3x5 @90"]],
      ["Home-to-First Speed", 45, [WU_SPRINT, "sixty-yard-dash 4x1 @150", "wicket-run 3x30 yd @60", "flying-sprint-30 4x30 yd @120", "hang-power-clean 3x3 @120", "barbell-hip-thrust 3x8 @75"]],
      ["Elastic Power", 45, ["pogo-hop 3x15 @45", "hurdle-hop 4x5 @60", "single-leg-bound 3x4/side @75", "trap-bar-jump 3x4 @90", "hamstring-slider-curl 3x8 @60"]],
    ],
  },
  {
    slug: "infielder-throwing-lower-power", goal: "strength_power",
    desc: "Power for the swing and the throw: lower-body strength, rotational power through the hips and trunk, and upper-body strength for a durable arm.",
    w: [
      ["Lower-Body Strength", 55, ["back-squat 4x5 @150", "bulgarian-split-squat 3x8/side @90", "barbell-hip-thrust 3x8 @90", "single-leg-romanian-deadlift 3x8/side @60", "single-leg-calf-raise 3x12/side @45"]],
      ["Rotational Power", 45, ["med-ball-rotational-throw 4x5/side @60", "med-ball-scoop-toss 4x5/side @60", "landmine-rotation 3x8/side @60", "cable-woodchop 3x10/side @45", "jump-squat 3x5 @75"]],
      ["Upper Body Strength", 50, ["dumbbell-bench-press 4x6 @120", "chin-up 4x6 @90", "one-arm-dumbbell-row 3x8/side @60", "landmine-press 3x8/side @60", "face-pull 3x15 @45", "pallof-press 3x10/side @30"]],
    ],
  },
  {
    slug: "infielder-lateral-quickness-plan", goal: "agility_lateral_quickness",
    desc: "Range and reaction at the six-foot level: shuffle and glove-side footwork, reactive range work, and the footwork that goes into turning double plays.",
    w: [
      ["Range & Shuffle", 45, [WU, "ground-ball-shuffle 5x1 @45", "defensive-slide-drill 4x10 yd @60", "ladder-lateral-run 3x2 @30", "lateral-bound 3x5/side @60", "lateral-lunge 3x8/side @60", "hop-and-stick 3x5/side @45"]],
      ["Reactive Range", 45, ["reactive-cone-sprint 6x1 @60", "tennis-ball-reaction-catch 4x8 @45", "t-drill 4x1 @75", "cone-shuttle-5-10-5 4x1 @90", "skater-jump 3x6/side @60", "cossack-squat 3x6/side @45"]],
      ["Turn & Throw Footwork", 45, ["box-drill 4x1 @60", "drop-step-drill 4x8 yd/side @60", "three-cone-drill 4x1 @75", "depth-jump 3x4 @90", "single-leg-romanian-deadlift 3x8/side @60", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "infielder-nine-inning-conditioning", goal: "conditioning",
    desc: "Conditioning to stay sharp for nine innings in the field and on the bases: tempo running, intervals and aerobic base work to keep reaction and recovery quick.",
    w: [
      ["Tempo Runs", 45, ["tempo-run-200 6x200 m @60", "jump-rope 4x60 sec @30", "goblet-squat 3x12 @45", "push-up 3x15 @30", "dead-bug 3x10/side @30"]],
      ["Interval Engine", 45, ["assault-bike-intervals 8x20 sec @40", "kettlebell-swing 4x15 @45", "rowing-intervals 5x250 m @90", "inverted-row 3x12 @45", "mountain-climber 3x30 sec @30"]],
      ["Aerobic Base", 45, ["zone-2-run 1x30 min @0", "goblet-squat 3x12 @45", "bear-crawl 3x20 yd @45", "farmers-carry 3x40 yd @60", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "infielder-hip-shoulder-care", goal: "injury_prevention_mobility",
    desc: "Durability for the throwing arm and the hips that carry an infielder through repeated fielding and throwing: shoulder stability, hip mobility, and core and ankle control.",
    w: [
      ["Shoulder Health", 40, ["shoulder-cars 2x8/dir @0", "band-external-rotation 3x15/side @30", "face-pull 3x15 @45", "y-t-w-raise 3x8 @30", "serratus-wall-slide 3x10 @30"]],
      ["Hip Mobility", 40, [WU, "hip-90-90 3x6/side @0", "hip-airplane 3x5/side @0", "couch-stretch 2x45 sec/side @0", "adductor-rockback 2x10 @0", "deep-squat-hold 3x30 sec @30"]],
      ["Core & Ankles", 40, ["bird-dog 3x8/side @30", "dead-bug 3x8/side @30", "side-plank 3x30 sec/side @30", "ankle-wall-mobility 2x10/side @0", "tibialis-raise 3x15 @30", "single-leg-balance-reach 3x6/side @30"]],
    ],
  },

  // ============================ OUTFIELDER ============================
  {
    slug: "outfielder-route-to-ball-speed", goal: "speed",
    desc: "Get to balls before they drop: acceleration off the crack of the bat, curved and angled route running, top-end speed and elastic power.",
    w: [
      ["Acceleration & First Routes", 50, [WU_SPRINT, "drop-step-route-run 6x15 yd @60", "ten-yard-acceleration 5x10 yd @75", "resisted-sled-sprint 4x15 yd @90", "broad-jump 3x4 @60", "nordic-hamstring-curl 3x5 @90"]],
      ["Top-End & Pursuit", 50, [WU_SPRINT, "flying-sprint-30 4x30 yd @150", "curved-sprint 4x25 yd/side @75", "wicket-run 3x30 yd @60", "hang-power-clean 3x3 @120", "barbell-hip-thrust 3x8 @75"]],
      ["Elastic Power", 45, ["pogo-hop 3x15 @45", "depth-jump 3x4 @90", "single-leg-bound 3x4/side @75", "trap-bar-jump 3x4 @90", "hamstring-slider-curl 3x8 @60", "hollow-body-hold 3x20 sec @30"]],
    ],
  },
  {
    slug: "outfielder-throwing-power", goal: "strength_power",
    desc: "Arm strength and lower-body power for the outfielder: strong legs to drive the throw, rotational power through the trunk, and upper-body strength for a durable arm.",
    w: [
      ["Lower-Body Strength", 55, ["trap-bar-deadlift 4x5 @150", "front-squat 3x5 @150", "bulgarian-split-squat 3x8/side @90", "barbell-hip-thrust 3x8 @90", "single-leg-calf-raise 3x12/side @45"]],
      ["Rotational & Throwing Power", 45, ["med-ball-rotational-throw 4x5/side @60", "med-ball-scoop-toss 4x5/side @60", "landmine-rotation 3x8/side @60", "cable-woodchop 3x10/side @45", "jump-squat 3x5 @75"]],
      ["Upper Body", 50, ["incline-dumbbell-press 4x8 @90", "chin-up 4x6 @90", "barbell-row 4x8 @90", "landmine-press 3x8/side @60", "face-pull 3x15 @45", "y-t-w-raise 3x8 @30"]],
    ],
  },
  {
    slug: "outfielder-reactive-agility", goal: "agility_lateral_quickness",
    desc: "Reaction and jump: the first read off the bat, angle routes and quick changes of direction, and the deceleration to set your base for the throw.",
    w: [
      ["Read & Jump", 45, [WU, "reactive-cone-sprint 6x1 @60", "drop-step-route-run 5x15 yd @60", "tennis-ball-reaction-catch 4x8 @45", "ladder-in-out 3x2 @30", "lateral-bound 3x5/side @60", "hop-and-stick 3x5/side @45"]],
      ["Angle Routes", 45, ["w-drill 4x1 @75", "t-drill 4x1 @75", "three-cone-drill 4x1 @75", "skater-jump 3x6/side @60", "cossack-squat 3x6/side @45"]],
      ["Stop & Throw Base", 45, ["cone-shuttle-5-10-5 4x1 @90", "box-drill 4x1 @60", "depth-jump 3x4 @90", "single-leg-romanian-deadlift 3x8/side @60", "carioca 3x20 yd @45", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "outfielder-conditioning", goal: "conditioning",
    desc: "Conditioning for long stretches of standing followed by full-speed sprints: repeat sprint work, aerobic base and intervals to run down a fly ball in the ninth as fast as in the first.",
    w: [
      ["Repeat Sprints", 45, ["repeat-sprint-30m 8x30 m @30", "jump-rope 4x60 sec @30", "goblet-squat 3x12 @45", "push-up 3x15 @30", "dead-bug 3x10/side @30"]],
      ["Aerobic Base", 45, ["zone-2-run 1x30 min @0", "bear-crawl 3x20 yd @45", "kettlebell-swing 4x15 @45", "inverted-row 3x12 @45", "plank 3x45 sec @30"]],
      ["Intervals & Drags", 45, ["assault-bike-intervals 6x30 sec @60", "sled-drag-backward 5x30 yd @45", "farmers-carry 3x40 yd @60", "burpee 3x10 @45", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "outfielder-shoulder-hamstring-care", goal: "injury_prevention_mobility",
    desc: "Protect the arm and the wheels: shoulder and scapular stability for throwing, hamstring strength for high-speed running, and hip and ankle mobility.",
    w: [
      ["Shoulder Health", 40, ["shoulder-cars 2x8/dir @0", "band-external-rotation 3x15/side @30", "face-pull 3x15 @45", "y-t-w-raise 3x8 @30", "serratus-wall-slide 3x10 @30", "sleeper-stretch 2x30 sec/side @0"]],
      ["Hamstrings", 40, ["nordic-hamstring-curl 3x5 @90", "hamstring-slider-curl 3x8 @60", "single-leg-romanian-deadlift 3x8/side @60", "glute-bridge 3x12 @30", "hip-90-90 2x6/side @0"]],
      ["Hips & Ankles", 40, [WU, "couch-stretch 2x45 sec/side @0", "ankle-wall-mobility 2x10/side @0", "tibialis-raise 3x15 @30", "single-leg-calf-raise 3x12/side @45", "single-leg-balance-reach 3x6/side @30"]],
    ],
  },
];
export default PLANS;
