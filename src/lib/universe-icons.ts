import type { LucideIcon } from "lucide-react";
import {
  Heart,
  Users,
  Briefcase,
  Plane,
  Lightbulb,
  LayoutGrid,
} from "lucide-react";

export const UNIVERSE_ICONS: Record<string, LucideIcon> = {
  all: LayoutGrid,
  mariage: Heart,
  amitie: Users,
  professionnel: Briefcase,
  voyage: Plane,
  projets: Lightbulb,
};
