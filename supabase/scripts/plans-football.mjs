// Line format: "exercise-slug SETSxREPS @REST_SECONDS # optional coaching note"
const WU = "worlds-greatest-stretch 2x5/side @0 # Warm-up: open the hips, hamstrings and T-spine";
const WU_SPRINT = "a-skip 2x20 yd @30 # Warm-up: knee up, toe up, stay tall";

const PLANS = [
  // ============================ QUARTERBACK ============================
  {
    slug: "qb-escape-scramble-speed", goal: "speed",
    desc: "Sprint work for the quarterback who has to beat a collapsing pocket. Short accelerations out of the drop, curved escape sprints, and posterior-chain power that transfers to scrambling, with hamstring insurance built in.",
    w: [
      ["Escape Starts & Acceleration", 50, [WU_SPRINT, "wall-drive-march 2x8/side @30", "ten-yard-acceleration 6x10 yd @75 # Start from a 3-step-drop finish position", "resisted-sled-sprint 4x15 yd @90 # Light sled, stay long and low", "broad-jump 3x4 @60", "nordic-hamstring-curl 3x5 @90"]],
      ["Scramble Speed & Curved Runs", 50, [WU_SPRINT, "flying-sprint-30 5x30 yd @120 # 20 yd build, 10 yd at max velocity", "curved-sprint 4x25 yd/side @90 # Simulates rolling out of the pocket", "wicket-run 3x30 yd @60", "hang-power-clean 4x3 @120", "single-leg-calf-raise 3x12/side @45"]],
      ["Power for Speed", 45, ["trap-bar-jump 4x3 @90", "depth-jump 3x4 @90", "barbell-hip-thrust 3x8 @90", "reverse-lunge 3x8/side @75", "med-ball-rotational-throw 3x6/side @60", "side-plank 2x30 sec/side @30"]],
    ],
  },
  {
    slug: "qb-off-season-foundations", goal: "strength_power", name: "QB Rotational Power & Strength Foundations",
    desc: "The base-building block for a quarterback: total-body strength, a healthy upper back, and rotational power that feeds the throw. Lower-body lifts build the drive leg; med-ball and landmine work teach the hips to lead the shoulders.",
    w: [
      ["Lower-Body Strength", 55, ["goblet-squat 3x8 @90 # Warm-up set feel", "trap-bar-deadlift 4x5 @150", "bulgarian-split-squat 3x8/side @90", "barbell-hip-thrust 3x8 @90", "pallof-press 3x10/side @45", "dead-bug 3x8/side @30"]],
      ["Upper Push, Pull & Scapular Health", 50, ["incline-dumbbell-press 4x8 @90", "chin-up 3x6 @90 # Use a band if needed", "one-arm-dumbbell-row 3x10/side @60", "landmine-press 3x8/side @60", "face-pull 3x15 @45", "band-pull-apart 3x20 @30"]],
      ["Rotational Power", 45, ["med-ball-rotational-throw 4x5/side @60 # Hips fire first, then the trunk", "med-ball-scoop-toss 4x5/side @60", "landmine-rotation 3x8/side @60", "cable-woodchop 3x10/side @45", "jump-squat 3x5 @75", "hanging-knee-raise 3x10 @45"]],
    ],
  },
  {
    slug: "qb-pocket-footwork-agility", goal: "agility_lateral_quickness",
    desc: "Footwork is the quarterback's first skill. This block drills drop-back mechanics, pocket slides and escape cuts, then layers in lower-body elasticity so the feet stay quick and the base stays balanced when throwing under pressure.",
    w: [
      ["Drop-Back Footwork", 45, ["three-step-drop-footwork 6x3 drops @30 # Balance at the top of every drop", "five-step-drop-footwork 6x3 drops @30", "pocket-slide-drill 4x6/side @45", "ladder-in-out 3x2 passes @30", "lateral-bound 3x5/side @60", "dead-bug 3x8/side @30"]],
      ["Pocket Escape & Reset", 45, ["box-drill 4x1 round @60", "zig-zag-cut-drill 4x20 yd @60", "mirror-drill 3x15 sec @45", "three-cone-drill 4x1 @75", "single-leg-bound 3x4/side @75", "single-leg-romanian-deadlift 3x8/side @60"]],
      ["Throw-on-the-Move Athleticism", 45, ["cone-shuttle-5-10-5 4x1 @90", "carioca 3x20 yd @45", "skater-jump 3x6/side @60", "med-ball-rotational-throw 3x6/side @45", "hop-and-stick 3x5/side @45", "pallof-press 3x10/side @30"]],
    ],
  },
  {
    slug: "qb-game-speed-conditioning", goal: "conditioning",
    desc: "Conditioning built around how a quarterback actually plays: bursts of activity between long recoveries, capped by two-minute-drill repeats. Tempo runs, bike intervals and short sprints build the engine without beating up the arm or hamstrings.",
    w: [
      ["Tempo Intervals", 45, ["tempo-run-200 6x200 m @60 # About 70 percent effort", "kettlebell-swing 4x15 @45", "jump-rope 4x60 sec @30", "bear-crawl 3x20 yd @45", "dead-bug 3x10/side @30"]],
      ["Drive Circuit", 45, ["assault-bike-intervals 8x20 sec hard @40 # Easy spin between efforts", "goblet-squat 3x12 @45", "push-up 3x15 @30", "inverted-row 3x12 @45", "mountain-climber 3x30 sec @30"]],
      ["Two-Minute Drill Repeats", 45, ["repeat-sprint-30m 8x30 m @45 # Simulates a hurry-up drive", "three-hundred-yard-shuttle 2x1 @180", "rowing-intervals 4x250 m @90", "farmers-carry 3x40 yd @60", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "qb-shoulder-hip-care", goal: "injury_prevention_mobility",
    desc: "Throwing-arm insurance and hip mobility for the quarterback. Rotator cuff and scapular work protect the shoulder, while hip and thoracic mobility let the trunk rotate freely so the arm isn't asked to do the work of the body.",
    w: [
      ["Shoulder Health", 40, ["shoulder-cars 2x8/dir @0", "band-shoulder-warmup 2x10 @30", "band-external-rotation 3x15/side @30", "sleeper-stretch 2x30 sec/side @0", "y-t-w-raise 3x8 @30", "serratus-wall-slide 3x10 @30"]],
      ["Hip & Trunk Stability", 40, [WU, "hip-90-90 3x6/side @0", "single-leg-glute-bridge 3x10/side @30", "banded-lateral-walk 3x12/side @30", "copenhagen-plank 3x20 sec/side @30", "thoracic-open-book 2x8/side @0"]],
      ["Rotator Cuff & Core", 40, ["cuban-press 3x10 @45", "bottoms-up-kettlebell-carry 3x20 yd/side @45", "pallof-press 3x12/side @30", "bird-dog 3x8/side @30", "dead-bug 3x8/side @30", "single-leg-balance-reach 3x6/side @30"]],
    ],
  },

  // ============================ WIDE RECEIVER ============================
  {
    slug: "wr-speed-acceleration-plan", goal: "speed",
    desc: "Linear speed for the receiver: start mechanics off the line, acceleration into the stem, and top-end velocity to run away from corners. Heavy emphasis on sprint volume with full rest, elastic plyometrics and hamstring durability.",
    w: [
      ["Start Mechanics & Acceleration", 55, [WU_SPRINT, "wall-drive-march 2x8/side @30", "three-point-start 6x10 yd @90 # Low first three steps", "resisted-sled-sprint 5x15 yd @120", "broad-jump 4x3 @75", "nordic-hamstring-curl 3x5 @90"]],
      ["Top-End Speed", 55, [WU_SPRINT, "wicket-run 3x30 yd @60", "flying-sprint-30 5x30 yd @150 # 20 yd build, 10 yd max", "forty-yard-sprint 3x1 @180", "hang-power-clean 4x3 @120", "barbell-hip-thrust 3x6 @90"]],
      ["Reactive Power & Elasticity", 50, ["pogo-hop 3x15 @45", "depth-jump 4x4 @90", "single-leg-box-jump 3x4/side @75", "trap-bar-jump 4x3 @90", "hamstring-slider-curl 3x8 @60", "hollow-body-hold 3x20 sec @30"]],
    ],
  },
  {
    slug: "wr-release-power-strength", goal: "strength_power",
    desc: "Strength and power for winning at the line and at the catch point. Olympic-style pulls and squats build explosive legs, upper-body pressing and pulling handle press coverage and contested balls, and single-leg work keeps the base sound.",
    w: [
      ["Lower-Body Power", 55, ["hang-power-clean 5x3 @120", "front-squat 4x5 @150", "single-leg-romanian-deadlift 3x8/side @75", "box-jump 3x4 @90", "step-up 3x8/side @60"]],
      ["Release & Contested-Catch Strength", 50, ["dumbbell-bench-press 4x6 @120", "chin-up 4x6 @90", "push-press 4x5 @120", "one-arm-dumbbell-row 3x8/side @60", "parallel-bar-dip 3x8 @75", "med-ball-chest-pass 3x6 @60"]],
      ["Single-Leg & Rotational Power", 50, ["bulgarian-split-squat 3x6/side @90", "trap-bar-jump 4x3 @90", "single-leg-box-jump 3x4/side @75", "med-ball-scoop-toss 3x5/side @60", "landmine-press 3x8/side @60", "ab-wheel-rollout 3x8 @45"]],
    ],
  },
  {
    slug: "wr-route-break-agility", goal: "agility_lateral_quickness",
    desc: "Get in and out of breaks faster than the defender can react. Plant-and-cut mechanics, reactive cuts, and deceleration training so the receiver can stop hard, change direction, and re-accelerate without losing speed.",
    w: [
      ["Plant & Cut Mechanics", 50, [WU, "t-drill 5x1 @75", "zig-zag-cut-drill 4x25 yd @60", "backpedal-break 4x2/side @60", "lateral-bound 3x5/side @60", "banded-lateral-walk 2x12/side @30"]],
      ["Break Speed & Reactive Cuts", 50, ["three-cone-drill 5x1 @75", "cone-shuttle-5-10-5 4x1 @90", "reactive-cone-sprint 6x1 @60", "ladder-in-out 3x2 @30", "skater-jump 3x6/side @60", "lateral-lunge 3x8/side @60"]],
      ["Deceleration & Re-Acceleration", 50, ["box-drill 4x1 @60", "w-drill 4x1 @75", "depth-jump 3x4 @90", "hop-and-stick 3x5/side @45", "cossack-squat 3x6/side @45", "hamstring-slider-curl 3x8 @60"]],
    ],
  },
  {
    slug: "wr-route-tree-conditioning", goal: "conditioning",
    desc: "Repeat-effort conditioning for running a full route tree play after play. Gassers, repeat sprints and bike intervals build the ability to hit top speed on the last snap of the drive, not just the first.",
    w: [
      ["Route-Tree Tempo", 45, ["gasser-sprints 4x1 @120", "repeat-sprint-30m 10x30 m @30", "kettlebell-swing 4x15 @45", "jump-rope 4x60 sec @30", "bear-crawl 3x20 yd @45"]],
      ["Repeat-Effort Intervals", 45, ["assault-bike-intervals 8x20 sec hard @40", "burpee 3x10 @45", "goblet-squat 3x12 @45", "inverted-row 3x12 @45", "mountain-climber 3x30 sec @30"]],
      ["Two-Minute Offense", 50, ["three-hundred-yard-shuttle 3x1 @180", "rowing-intervals 5x250 m @75", "farmers-carry 3x40 yd @60", "sled-drag-backward 4x30 yd @60", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "wr-hamstring-ankle-care", goal: "injury_prevention_mobility",
    desc: "Keep the wheels healthy. Eccentric hamstring work, ankle stiffness and calf strength, and hip and groin mobility target the soft-tissue injuries that most often sideline sprinters and cutters.",
    w: [
      ["Hamstring Resilience", 40, ["nordic-hamstring-curl 3x5 @90", "hamstring-slider-curl 3x8 @60", "single-leg-romanian-deadlift 3x8/side @60", "single-leg-glute-bridge 3x10/side @45", "hip-90-90 2x6/side @0"]],
      ["Ankle & Foot Stiffness", 40, ["ankle-wall-mobility 2x10/side @0", "tibialis-raise 3x15 @30", "single-leg-calf-raise 3x12/side @45", "pogo-hop 3x20 @45", "hop-and-stick 3x5/side @45", "single-leg-balance-reach 3x6/side @30"]],
      ["Hips & Groin", 40, ["couch-stretch 2x45 sec/side @0", "copenhagen-plank 3x20 sec/side @30", "adductor-rockback 2x10 @0", "banded-lateral-walk 3x12/side @30", "cossack-squat 3x6/side @45", "deep-squat-hold 3x30 sec @30"]],
    ],
  },

  // ============================ OFFENSIVE LINEMAN ============================
  {
    slug: "ol-first-step-acceleration", goal: "speed",
    desc: "Linemen win in the first five yards. Short, violent starts, sled work for drive-phase mechanics and heavy-hips power training build the explosive first step off the snap rather than long-distance speed.",
    w: [
      ["Explosive Start & Drive", 50, ["three-point-start 6x5 yd @90 # Fire out, low and long", "resisted-sled-sprint 5x10 yd @120", "sled-push 4x15 yd @120", "broad-jump 4x3 @75", "kettlebell-swing 4x10 @75", "barbell-hip-thrust 3x8 @90"]],
      ["Lower-Body Elasticity", 45, ["box-jump 4x4 @90", "trap-bar-jump 4x3 @120", "split-squat-jump 3x5/side @75", "ten-yard-acceleration 5x10 yd @90", "single-leg-romanian-deadlift 3x8/side @60", "ab-wheel-rollout 3x8 @45"]],
      ["Strength-Speed", 50, ["hang-power-clean 4x3 @120", "front-squat 3x5 @150", "step-up 3x8/side @75", "med-ball-slam 3x8 @45", "pallof-press 3x10/side @30"]],
    ],
  },
  {
    slug: "ol-strength-foundations-plan", goal: "strength_power",
    desc: "The lineman's foundation: squat, press and pull heavy, build the trunk and grip to anchor against rushers, and add sled and carry work for real-world strength. Low-rep, high-rest sets prioritize maximal force.",
    w: [
      ["Squat Day", 60, ["back-squat 5x5 @180", "good-morning 3x8 @90", "bulgarian-split-squat 3x8/side @90", "barbell-hip-thrust 3x8 @90", "ab-wheel-rollout 3x8 @45", "farmers-carry 3x40 yd @60"]],
      ["Press Day", 55, ["barbell-bench-press 5x5 @150", "overhead-press 4x6 @120", "incline-dumbbell-press 3x10 @90", "barbell-row 4x8 @90", "parallel-bar-dip 3x8 @75", "face-pull 3x15 @45"]],
      ["Pull & Posterior Chain", 55, ["trap-bar-deadlift 5x3 @180", "chin-up 4x6 @90", "seated-cable-row 3x10 @75", "single-leg-romanian-deadlift 3x8/side @60", "sled-push 4x20 yd @90", "suitcase-carry 3x30 yd/side @45"]],
    ],
  },
  {
    slug: "ol-pass-set-redirect-agility", goal: "agility_lateral_quickness",
    desc: "Short-area lateral quickness for pass protection: kick-slide footwork, mirroring rushers, and redirecting a heavy frame without losing your base. Emphasis on staying low, keeping the feet under the hips and re-anchoring on contact.",
    w: [
      ["Pass-Set Footwork", 45, [WU, "mirror-drill 5x10 sec @60", "defensive-slide-drill 4x10 yd @60", "ladder-lateral-run 3x2 @30", "lateral-bound 3x5/side @60", "lateral-lunge 3x8/side @60", "pallof-press 3x10/side @30"]],
      ["Redirect & Anchor", 50, ["box-drill 4x1 @75", "cone-shuttle-5-10-5 4x1 @90", "reactive-cone-sprint 4x1 @75", "cossack-squat 3x6/side @45", "goblet-squat 3x10 @60"]],
      ["Punch & Base Strength", 50, ["landmine-press 3x8/side @60", "med-ball-chest-pass 4x6 @60", "lateral-hurdle-hop 3x6/side @60", "copenhagen-plank 3x20 sec/side @30", "front-squat 3x5 @150"]],
    ],
  },
  {
    slug: "ol-drive-phase-conditioning", goal: "conditioning",
    desc: "Conditioning for a position that is 200-plus pounds of repeated short, violent effort. Sled work mimics the drive phase, while carries and low-impact intervals build the engine without pounding the joints.",
    w: [
      ["Sled Drive Intervals", 45, ["sled-push 8x20 yd @45 # Every rep is a drive block", "battle-rope-waves 4x30 sec @45", "farmers-carry 4x40 yd @60", "bear-crawl 3x20 yd @45", "kettlebell-swing 4x15 @45"]],
      ["Low-Impact Intervals", 45, ["assault-bike-intervals 6x30 sec @60", "rowing-intervals 5x250 m @90", "goblet-squat 3x12 @45", "push-up 3x15 @30", "dead-bug 3x10/side @30"]],
      ["Repeat-Effort Circuit", 50, ["sled-drag-backward 6x30 yd @45", "gasser-sprints 3x1 @150", "burpee 3x8 @45", "suitcase-carry 3x30 yd/side @45", "hanging-knee-raise 3x10 @45"]],
    ],
  },
  {
    slug: "ol-hip-knee-shoulder-care", goal: "injury_prevention_mobility",
    desc: "Big bodies take a lot of load through the hips, knees and shoulders. This block builds mobility and stability where linemen get hurt most, and strengthens the hamstrings and trunk that keep the base strong all season.",
    w: [
      ["Hips & Knees", 40, [WU, "hip-90-90 3x6/side @0", "couch-stretch 2x45 sec/side @0", "spanish-squat 3x30 sec @45", "single-leg-glute-bridge 3x10/side @30", "banded-lateral-walk 3x12/side @30"]],
      ["Shoulders & Upper Back", 40, ["shoulder-cars 2x8/dir @0", "band-external-rotation 3x15/side @30", "face-pull 3x15 @45", "y-t-w-raise 3x8 @30", "serratus-wall-slide 3x10 @30", "thoracic-open-book 2x8/side @0"]],
      ["Posterior Chain & Core", 40, ["nordic-hamstring-curl 3x5 @90", "single-leg-romanian-deadlift 3x8/side @60", "copenhagen-plank 3x20 sec/side @30", "bird-dog 3x8/side @30", "side-plank 3x30 sec/side @30"]],
    ],
  },

  // ============================ LINEBACKER ============================
  {
    slug: "lb-sideline-sideline-speed", goal: "speed",
    desc: "Range and pursuit speed for the linebacker. Acceleration and curved-pursuit sprints build the ability to close on ball carriers, while power cleans and plyometrics develop the explosiveness to arrive with force.",
    w: [
      ["Acceleration & Pursuit", 50, [WU_SPRINT, "three-point-start 6x10 yd @90", "resisted-sled-sprint 5x15 yd @120", "curved-sprint 4x25 yd/side @90 # Pursuit angles", "broad-jump 3x4 @75", "nordic-hamstring-curl 3x5 @90"]],
      ["Top-End & Recovery Speed", 50, [WU_SPRINT, "flying-sprint-30 4x30 yd @150", "wicket-run 3x30 yd @60", "backpedal-break 4x2/side @60", "hang-power-clean 4x3 @120", "barbell-hip-thrust 3x6 @90"]],
      ["Power to Pursuit", 50, ["trap-bar-jump 4x3 @90", "depth-jump 3x4 @90", "bulgarian-split-squat 3x6/side @90", "med-ball-scoop-toss 3x5/side @60", "lateral-bound 3x5/side @60", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "lb-closing-strength-power", goal: "strength_power",
    desc: "Strength and explosive power for the hit. Heavy squats and pulls build the base, presses and cleans develop the force needed to shed blockers and finish tackles, and med-ball throws train the hips to explode through contact.",
    w: [
      ["Lower-Body Strength", 55, ["back-squat 4x5 @150", "trap-bar-deadlift 3x5 @150", "reverse-lunge 3x8/side @75", "barbell-hip-thrust 3x8 @90", "farmers-carry 3x40 yd @60", "ab-wheel-rollout 3x8 @45"]],
      ["Upper Push & Hit Power", 50, ["barbell-bench-press 4x5 @120", "push-press 4x5 @120", "chin-up 4x6 @90", "one-arm-dumbbell-row 3x8/side @60", "med-ball-chest-pass 3x6 @60", "landmine-press 3x8/side @60"]],
      ["Explosive Hips", 50, ["hang-power-clean 5x3 @120", "box-jump 4x4 @90", "med-ball-slam 4x6 @45", "single-leg-box-jump 3x4/side @75", "sled-push 4x15 yd @90", "pallof-press 3x10/side @30"]],
    ],
  },
  {
    slug: "lb-read-react-agility", goal: "agility_lateral_quickness",
    desc: "Read-and-react quickness for the middle of the defense: shuffle and fit mechanics, breaks on the ball from a backpedal, and cut-and-collide preparation that keeps you under control at contact.",
    w: [
      ["Shuffle & Fit", 45, [WU, "defensive-slide-drill 4x10 yd @60", "mirror-drill 5x10 sec @45", "ladder-in-out 3x2 @30", "lateral-bound 3x5/side @60", "t-drill 4x1 @75"]],
      ["Break on the Ball", 50, ["backpedal-break 5x2/side @60", "w-drill 4x1 @75", "reactive-cone-sprint 6x1 @60", "cone-shuttle-5-10-5 4x1 @90", "skater-jump 3x6/side @60", "hop-and-stick 3x5/side @45"]],
      ["Cut & Collide Preparation", 50, ["three-cone-drill 5x1 @75", "zig-zag-cut-drill 4x25 yd @60", "drop-step-drill 4x8 yd/side @60", "depth-jump 3x4 @90", "cossack-squat 3x6/side @45", "copenhagen-plank 3x20 sec/side @30"]],
    ],
  },
  {
    slug: "lb-full-field-conditioning", goal: "conditioning",
    desc: "Conditioning for a position that covers the full field. Gassers and shuttles build the ability to repeat sideline-to-sideline efforts, and sled work builds the leg endurance to keep hitting late in the game.",
    w: [
      ["Field-Width Repeats", 45, ["gasser-sprints 4x1 @120", "sled-drag-backward 5x30 yd @45", "kettlebell-swing 4x15 @45", "burpee 3x10 @45", "farmers-carry 3x40 yd @60"]],
      ["Interval Engine", 45, ["assault-bike-intervals 8x20 sec @40", "rowing-intervals 5x250 m @90", "goblet-squat 3x12 @45", "push-up 3x15 @30", "mountain-climber 3x30 sec @30"]],
      ["Shuttle & Sled Repeats", 50, ["three-hundred-yard-shuttle 3x1 @180", "repeat-sprint-30m 8x30 m @30", "sled-push 6x20 yd @60", "bear-crawl 3x20 yd @45", "side-plank 3x30 sec/side @30"]],
    ],
  },
  {
    slug: "lb-hip-shoulder-care", goal: "injury_prevention_mobility",
    desc: "Tackling and pursuit take a toll. Hip and hamstring resilience, shoulder stability for contact, and knee and ankle robustness keep a linebacker on the field through a full season.",
    w: [
      ["Hips & Hamstrings", 40, [WU, "hip-airplane 3x5/side @0", "nordic-hamstring-curl 3x5 @90", "single-leg-glute-bridge 3x10/side @30", "adductor-rockback 2x10 @0", "couch-stretch 2x45 sec/side @0"]],
      ["Shoulders for Contact", 40, ["shoulder-cars 2x8/dir @0", "band-external-rotation 3x15/side @30", "face-pull 3x15 @45", "serratus-wall-slide 3x10 @30", "y-t-w-raise 3x8 @30", "sleeper-stretch 2x30 sec/side @0"]],
      ["Knees & Ankles", 40, ["spanish-squat 3x30 sec @45", "tibialis-raise 3x15 @30", "single-leg-calf-raise 3x12/side @45", "hop-and-stick 3x5/side @45", "single-leg-balance-reach 3x6/side @30", "copenhagen-plank 3x20 sec/side @30"]],
    ],
  },
];
export default PLANS;
