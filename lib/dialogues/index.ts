import { Dialogue } from "@/types/dialogue";
import { FRONT_DESK_DIALOGUE } from "./frontDesk";

export const DIALOGUE_REGISTRY: Record<string, Dialogue> = {
  front_desk: FRONT_DESK_DIALOGUE,
};
