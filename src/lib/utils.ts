import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our type-scale tokens are font sizes. Without this, tailwind-merge reads `text-button` or `text-label`
// as a text COLOR and drops it when a real color class (text-muted, text-primary-foreground...) follows.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl",
            "display",
            "title",
            "heading",
            "label",
            "label-sm",
            "button",
            "stat-xl",
            "stat",
            "stat-sm",
            "stat-xs",
            "subheading",
            "body",
            "caption",
            "micro",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
