// Abase icon set. Drawn on a 24px grid with a heavy 2.5 stroke, square caps and mitred joins, so
// it reads as one family (angular, athletic) instead of a stock pack. Training categories and the
// seven athletic attributes are bespoke marks; the utility icons share the same construction.
// Names match the previous pack so call sites keep their JSX.
import type { ReactNode, SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  size?: number | string;
  strokeWidth?: number | string;
}

function make(name: string, body: ReactNode) {
  const Icon = ({ size = 24, strokeWidth = 2.5, className, ...rest }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {body}
    </svg>
  );
  Icon.displayName = name;
  return Icon;
}

/* ------------------------------------------------------------ training categories (bespoke) */

/** Weight room: barbell with plates. */
export const WeightRoomIcon = make(
  "WeightRoomIcon",
  <>
    <path d="M2 10v4M22 10v4M6 6v12M18 6v12M6 12h12" />
    <path d="M9 9v6M15 9v6" strokeWidth="1.5" />
  </>,
);
/** Field: a training cone on the ground line. */
export const FieldIcon = make(
  "FieldIcon",
  <>
    <path d="M12 3L7.5 17h9zM3 21h18M9.2 11h5.6" />
  </>,
);
/** Mobility: two arrows chasing around a joint. */
export const MobilityIcon = make(
  "MobilityIcon",
  <>
    <path d="M4 12a8 8 0 0 1 13.5-5.8M20 12a8 8 0 0 1-13.5 5.8" />
    <path d="M18 2.5v4.5h-4.5M6 21.5V17h4.5" />
  </>,
);
/** Conditioning: stopwatch. */
export const ConditioningIcon = make(
  "ConditioningIcon",
  <>
    <circle cx="12" cy="14" r="7.5" />
    <path d="M12 14l3.5-3.5M9 2.5h6M12 2.5v4" />
  </>,
);
/** Recovery: a single horizontal wave. */
export const RecoveryIcon = make("RecoveryIcon", <path d="M2 12c3-6 5-6 8 0s5 6 8 0 3-3 4-3" />);

/* ------------------------------------------------------------ athletic attributes (bespoke) */

export const SpeedIcon = make("SpeedIcon", <path d="M3 18l6-6-6-6M11 18l6-6-6-6M19 6v12" />);
export const StrengthIcon = WeightRoomIcon;
export const PowerIcon = make("PowerIcon", <path d="M13 2L4.5 13.5H11L10 22l9-12h-6.5z" />);
export const AgilityIcon = make("AgilityIcon", <path d="M3 20l5-13 6 11 3-6 4 0M17 12l4 0M21 12l-3-3M21 12l-3 3" />);
export const CoordinationIcon = make(
  "CoordinationIcon",
  <>
    <circle cx="12" cy="12" r="6.5" />
    <path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
  </>,
);
export const AttrConditioningIcon = ConditioningIcon;
export const AttrMobilityIcon = MobilityIcon;

/* ------------------------------------------------------------ actions and marks */

export const Plus = make("Plus", <path d="M12 4v16M4 12h16" />);
export const Minus = make("Minus", <path d="M4 12h16" />);
export const X = make("X", <path d="M5 5l14 14M19 5L5 19" />);
export const Check = make("Check", <path d="M4 12.5l5.5 5.5L20 6.5" />);
export const CheckCheck = make("CheckCheck", <path d="M1.5 12.5l5 5L15 8M10.5 16l2 2L22 8" />);
export const CheckCircle2 = make(
  "CheckCircle2",
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M7.5 12.5l3 3 6-6.5" />
  </>,
);
export const Trash2 = make("Trash2", <path d="M4 6.5h16M9 6.5V3h6v3.5M6 6.5L7 21h10l1-14.5M10 11v6M14 11v6" />);
export const Pencil = make("Pencil", <path d="M4 20l1-5L16 4l4 4L9 19z" />);
export const Search = make(
  "Search",
  <>
    <circle cx="10" cy="10" r="6.5" />
    <path d="M15 15l6 6" />
  </>,
);
export const Clock = make(
  "Clock",
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 6.5V12l4 2.5" />
  </>,
);
export const Info = make(
  "Info",
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 11v6M12 7.25v.01" />
  </>,
);
export const AlertTriangle = make("AlertTriangle", <path d="M12 3L22 20.5H2zM12 10v5M12 17.75v.01" />);
export const ArrowUp = make("ArrowUp", <path d="M12 20V4M5 11l7-7 7 7" />);
export const ArrowDown = make("ArrowDown", <path d="M12 4v16M5 13l7 7 7-7" />);
export const ArrowLeft = make("ArrowLeft", <path d="M20 12H4M11 5l-7 7 7 7" />);
export const ArrowRight = make("ArrowRight", <path d="M4 12h16M13 5l7 7-7 7" />);
export const ChevronRight = make("ChevronRight", <path d="M9 4l8 8-8 8" />);
export const ChevronDown = make("ChevronDown", <path d="M4 9l8 8 8-8" />);
export const LogOut = make("LogOut", <path d="M10 4H4v16h6M14 8l5 4-5 4M19 12H9" />);
export const EyeOff = make(
  "EyeOff",
  <>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
    <path d="M4 20L20 4" />
  </>,
);
export const SlidersHorizontal = make(
  "SlidersHorizontal",
  <>
    <path d="M3 7h9M17 7h4M3 17h3M11 17h10" />
    <rect x="13" y="4.5" width="4" height="5" />
    <rect x="6" y="14.5" width="5" height="5" />
  </>,
);
export const Settings2 = SlidersHorizontal;
export const ListChecks = make("ListChecks", <path d="M3 6l2 2 3-4M3 16l2 2 3-4M12 7h9M12 17h9" />);
export const ListTree = make("ListTree", <path d="M3 5h4v4H3zM11 7h10M7 7v10h4M11 17h10M9 12h12" />);

/* ------------------------------------------------------------ navigation and objects */

export const Home = make("Home", <path d="M3 11.5L12 3l9 8.5M5 10v11h14V10M10 21v-6h4v6" />);
export const CalendarRange = make(
  "CalendarRange",
  <>
    <rect x="3" y="5" width="18" height="16" />
    <path d="M3 10h18M8 2.5v5M16 2.5v5M7 15h10" />
  </>,
);
export const CalendarDays = make(
  "CalendarDays",
  <>
    <rect x="3" y="5" width="18" height="16" />
    <path d="M3 10h18M8 2.5v5M16 2.5v5M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
  </>,
);
export const CalendarCheck = make(
  "CalendarCheck",
  <>
    <rect x="3" y="5" width="18" height="16" />
    <path d="M3 10h18M8 2.5v5M16 2.5v5M8.5 15.5l2.5 2.5 4.5-4.5" />
  </>,
);
export const Calendar = make(
  "Calendar",
  <>
    <rect x="3" y="5" width="18" height="16" />
    <path d="M3 10h18M8 2.5v5M16 2.5v5" />
  </>,
);
export const LineChart = make("LineChart", <path d="M3 3v18h18M7 16l4-4 3 3 6-7" />);
export const TrendingUp = make("TrendingUp", <path d="M2 18l7-7 4 4 8-9M15 6h6v6" />);
export const Dumbbell = WeightRoomIcon;
export const User = make(
  "User",
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7" />
  </>,
);
export const Users = make(
  "Users",
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2.5.7 4 2.6 4 6.2" />
  </>,
);
export const Flame = make("Flame", <path d="M12 2c0 5-6 7-6 13a6 6 0 0 0 12 0c0-3-1.5-5-3-6.5 0 2-1 3-2.5 3C11 11 12 6 12 2z" />);
export const Flag = make("Flag", <path d="M5 21V3M5 4h13l-3 4.5 3 4.5H5" />);
export const Target = make(
  "Target",
  <>
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="12" cy="12" r="5" />
    <path d="M12 12h.01" />
  </>,
);
export const Trophy = make("Trophy", <path d="M7 3h10v7a5 5 0 0 1-10 0zM7 5.5H3v2.5a4 4 0 0 0 4 4M17 5.5h4V8a4 4 0 0 1-4 4M12 15v4M8 21h8" />);
export const HeartPulse = make("HeartPulse", <path d="M2 12h5l2.5-6 5 12 2.5-6H22" />);
export const Sun = make(
  "Sun",
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
  </>,
);
export const Moon = make("Moon", <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z" />);
export const Bolt = PowerIcon;
export const Shield = make("Shield", <path d="M12 3l8 3v6c0 5-3.5 8-8 9.5C7.5 20 4 17 4 12V6z" />);
export const ShieldCheck = make("ShieldCheck", <path d="M12 3l8 3v6c0 5-3.5 8-8 9.5C7.5 20 4 17 4 12V6zM8.5 12l2.5 2.5 4.5-5" />);
export const MailCheck = make(
  "MailCheck",
  <>
    <path d="M21 12V5H3v14h10M3 5l9 8 9-8" />
    <path d="M16 19l2.5 2.5L23 17" />
  </>,
);
export const Compass = make(
  "Compass",
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M16 8l-2 6-6 2 2-6z" />
  </>,
);
export const LayoutDashboard = make("LayoutDashboard", <path d="M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z" />);
export const Shapes = make("Shapes", <path d="M12 3l-8 8h16zM4 14h7v7H4zM17.5 17.5m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0" />);

import type { ComponentType } from "react";
import type { ModuleCategory, TrainingAttribute } from "@/lib/database.types";

export const ATTRIBUTE_ICON: Record<TrainingAttribute, ComponentType<IconProps>> = {
  speed: SpeedIcon,
  strength: StrengthIcon,
  power: PowerIcon,
  agility: AgilityIcon,
  coordination: CoordinationIcon,
  conditioning: AttrConditioningIcon,
  mobility: AttrMobilityIcon,
};

export const CATEGORY_ICON: Record<ModuleCategory, ComponentType<IconProps>> = {
  strength: WeightRoomIcon,
  speed_acceleration: SpeedIcon,
  agility_cod: AgilityIcon,
  conditioning: ConditioningIcon,
  mobility_injury_prevention: MobilityIcon,
  position_skill: CoordinationIcon,
};
