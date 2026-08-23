import {
  Activity,
  Bike,
  Dumbbell,
  Flame,
  Footprints,
  GitMerge,
  Globe,
  Lock,
  PersonStanding,
  Rocket,
  Scale,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Upload,
  VenetianMask,
  Wallet,
  Watch,
  Waves,
} from "lucide-react";

/**
 * Resolves a data-driven icon name (from categories/badges/constants) to a
 * lucide-react icon. Falls back to a neutral icon for unknown names.
 */
const ICONS = {
  Activity,
  Bike,
  Dumbbell,
  Flame,
  Footprints,
  GitMerge,
  Globe,
  Lock,
  PersonStanding,
  Rocket,
  Scale,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Upload,
  VenetianMask,
  Wallet,
  Watch,
  Waves,
};

export function Icon({ name, ...props }) {
  const Resolved = ICONS[name] ?? Activity;
  return <Resolved {...props} />;
}
