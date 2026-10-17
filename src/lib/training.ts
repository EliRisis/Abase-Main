import type {
  CalendarEventType,
  EquipmentAccess,
  ExperienceLevel,
  IntensityLevel,
  LimitationBodyArea,
  LimitationSide,
  ModuleCategory,
  MovementPattern,
  PrescriptionMode,
  TrainingAttribute,
  TrainingPhase,
} from "./database.types";

export const CATEGORIES: ModuleCategory[] = [
  "strength",
  "speed_acceleration",
  "agility_cod",
  "conditioning",
  "mobility_injury_prevention",
  "position_skill",
];

export const CATEGORY_LABEL: Record<ModuleCategory, string> = {
  strength: "Strength",
  speed_acceleration: "Speed / Acceleration",
  agility_cod: "Agility / Change of Direction",
  conditioning: "Conditioning",
  mobility_injury_prevention: "Mobility / Injury Prevention",
  position_skill: "Position Skill",
};

export const CATEGORY_SHORT: Record<ModuleCategory, string> = {
  strength: "Strength",
  speed_acceleration: "Speed",
  agility_cod: "Agility",
  conditioning: "Conditioning",
  mobility_injury_prevention: "Mobility",
  position_skill: "Skill",
};

export const PHASES: TrainingPhase[] = ["off_season", "pre_season", "in_season", "post_season"];

export const PHASE_LABEL: Record<TrainingPhase, string> = {
  off_season: "Off-season",
  pre_season: "Pre-season",
  in_season: "In-season",
  post_season: "Post-season",
};

export const INTENSITIES: IntensityLevel[] = ["low", "moderate", "high"];

export const INTENSITY_LABEL: Record<IntensityLevel, string> = {
  low: "Low intensity",
  moderate: "Moderate intensity",
  high: "High intensity",
};

export const INTENSITY_RANK: Record<IntensityLevel, number> = { low: 1, moderate: 2, high: 3 };

/** Badge variant names used by <Badge />. */
export const INTENSITY_VARIANT: Record<IntensityLevel, "success" | "warning" | "danger"> = {
  low: "success",
  moderate: "warning",
  high: "danger",
};

export const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const WEEKDAY_SHORT_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---------------------------------------------------------------------------
// Attribute taxonomy (smart matching). Fixed vocabulary - never free text.
// ---------------------------------------------------------------------------
export const ATTRIBUTES: TrainingAttribute[] = [
  "speed",
  "strength",
  "power",
  "agility",
  "coordination",
  "conditioning",
  "mobility",
];

export const ATTRIBUTE_LABEL: Record<TrainingAttribute, string> = {
  speed: "Speed",
  strength: "Strength",
  power: "Power",
  agility: "Agility",
  coordination: "Coordination",
  conditioning: "Conditioning",
  mobility: "Mobility",
};

export const ATTRIBUTE_HINT: Record<TrainingAttribute, string> = {
  speed: "Sprinting and acceleration",
  strength: "Force you can produce",
  power: "Explosive jumps, throws and lifts",
  agility: "Cutting and changing direction",
  coordination: "Footwork, timing and skill",
  conditioning: "Repeating hard efforts",
  mobility: "Range of motion and recovery",
};

export const MOVEMENT_PATTERNS: MovementPattern[] = [
  "upper_push",
  "upper_pull",
  "hinge",
  "squat",
  "single_leg",
  "core",
  "carry",
  "rotational",
  "plyometric",
  "locomotion",
  "mobility",
];

export const PATTERN_LABEL: Record<MovementPattern, string> = {
  upper_push: "Upper push",
  upper_pull: "Upper pull",
  hinge: "Hinge",
  squat: "Squat",
  single_leg: "Single-leg",
  core: "Core",
  carry: "Carry",
  rotational: "Rotational",
  plyometric: "Plyometric",
  locomotion: "Sprint / drill",
  mobility: "Mobility",
};

export const PRESCRIPTION_MODES: PrescriptionMode[] = [
  "loaded",
  "bodyweight",
  "ballistic",
  "drill",
  "hold",
  "interval",
  "steady",
  "mobility",
];

export const PRESCRIPTION_MODE_LABEL: Record<PrescriptionMode, string> = {
  loaded: "Loaded (weight × reps)",
  bodyweight: "Bodyweight reps",
  ballistic: "Explosive / jumps",
  drill: "Distance or timed drill",
  hold: "Timed hold",
  interval: "Work / rest intervals",
  steady: "Steady effort",
  mobility: "Mobility flow",
};

export const BODY_AREAS: LimitationBodyArea[] = [
  "knee",
  "ankle_foot",
  "hip",
  "low_back",
  "shoulder",
  "elbow_wrist",
  "hamstring_groin",
  "other",
];

export const BODY_AREA_LABEL: Record<LimitationBodyArea, string> = {
  knee: "Knee",
  ankle_foot: "Ankle / foot",
  hip: "Hip",
  low_back: "Low back",
  shoulder: "Shoulder",
  elbow_wrist: "Elbow / wrist",
  hamstring_groin: "Hamstring / groin",
  other: "Other",
};

export const SIDES: LimitationSide[] = ["both", "left", "right"];
export const SIDE_LABEL: Record<LimitationSide, string> = { both: "Both sides", left: "Left", right: "Right" };

export const EVENT_TYPES: CalendarEventType[] = ["game", "practice"];
export const EVENT_TYPE_LABEL: Record<CalendarEventType, string> = { game: "Game", practice: "Practice" };

// ---------------------------------------------------------------------------
// Phase picker: two plain choices, each with an optional refinement. Maps onto the
// same four underlying phases the program logic uses.
// ---------------------------------------------------------------------------
export type SeasonChoice = "off" | "in";

export const SEASON_CHOICE_LABEL: Record<SeasonChoice, string> = { off: "Off Season", in: "In Season" };
export const SEASON_CHOICE_HINT: Record<SeasonChoice, string> = {
  off: "Building strength, speed and power between seasons",
  in: "Games and practices are on; training keeps you fresh",
};
export const SEASON_REFINE_LABEL: Record<SeasonChoice, string> = {
  off: "Ramping up for the season",
  in: "Season just ended",
};
export const SEASON_REFINE_HINT: Record<SeasonChoice, string> = {
  off: "Sharpen speed, skills and conditioning in the last weeks before it starts",
  in: "Recover with lighter, restorative work for a few weeks",
};

export function phaseFromChoice(choice: SeasonChoice, refined: boolean): TrainingPhase {
  if (choice === "off") return refined ? "pre_season" : "off_season";
  return refined ? "post_season" : "in_season";
}

export function choiceFromPhase(phase: TrainingPhase): { choice: SeasonChoice; refined: boolean } {
  switch (phase) {
    case "pre_season":
      return { choice: "off", refined: true };
    case "in_season":
      return { choice: "in", refined: false };
    case "post_season":
      return { choice: "in", refined: true };
    default:
      return { choice: "off", refined: false };
  }
}

// ---------------------------------------------------------------------------
// Build-screen personalization
// ---------------------------------------------------------------------------

export const LEVELS: ExperienceLevel[] = ["beginner", "intermediate", "advanced"];
export const LEVEL_LABEL: Record<ExperienceLevel, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export const EQUIPMENT: EquipmentAccess[] = ["bodyweight", "home", "full_gym"];
export const EQUIPMENT_LABEL: Record<EquipmentAccess, string> = { bodyweight: "Bodyweight only", home: "Home setup", full_gym: "Full gym" };
export const EQUIPMENT_HINT: Record<EquipmentAccess, string> = {
  bodyweight: "No equipment: just you and some space",
  home: "Dumbbells, bands, a bar or bench, a box",
  full_gym: "Barbells, racks, sleds and machines",
};

export const DAY_OPTIONS = [2, 3, 4, 5, 6] as const;
export const SESSION_MINUTE_OPTIONS = [30, 45, 60, 90] as const;
