// Re-exports the generated Supabase types plus friendly enum aliases.
// Regenerate the source of truth with:
//   supabase gen types typescript --linked > src/lib/database.types.generated.ts
import type { Database as GeneratedDatabase, Enums } from "./database.types.generated";

export type { Json, Tables, TablesInsert, TablesUpdate, Enums } from "./database.types.generated";
export { Constants } from "./database.types.generated";
export type Database = GeneratedDatabase;

export type UserRole = Enums<"user_role">;
export type ExperienceLevel = Enums<"experience_level">;
export type EnrollmentStatus = Enums<"enrollment_status">;
export type WeightUnit = Enums<"weight_unit">;
export type ModuleCategory = Enums<"module_category">;
export type IntensityLevel = Enums<"intensity_level">;
export type TrainingPhase = Enums<"training_phase">;
export type MetricDirection = Enums<"metric_direction">;
export type ProgramStatus = Enums<"program_status">;
export type TrainingAttribute = Enums<"training_attribute">;
export type MovementPattern = Enums<"movement_pattern">;
export type PrescriptionMode = Enums<"prescription_mode">;
export type LimitationBodyArea = Enums<"limitation_body_area">;
export type LimitationSide = Enums<"limitation_side">;
export type CalendarEventType = Enums<"calendar_event_type">;
export type EquipmentAccess = Enums<"equipment_access">;
export type SessionFeedback = Enums<"session_feedback">;
export type TrainingSetting = Enums<"training_setting">;
