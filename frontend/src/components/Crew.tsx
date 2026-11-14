import type { ReactNode } from "react";
import { useState } from "react";
import type { MissionState } from "../types";

export type CrewMember = "nova" | "orbit" | "scout";
const CREW = {
  nova: { name: "Captain Nova", role: "Your mission guide" },
  orbit: { name: "ORBIT", role: "Your science buddy" },
  scout: { name: "Scout", role: "Your lunar rover" },
};
export function CrewPortrait({
  member,
  className = "",
}: {
  member: CrewMember;
  className?: string;
}) {
  return (
    <img
      className={`crew-portrait crew-${member} ${className}`}
      src={`/art/${member}.webp`}
      alt=""
      draggable={false}
    />
  );
}
export function CrewDialogue({
  member = "orbit",
  children,
  detail,
  title,
}: {
  member?: CrewMember;
  children: ReactNode;
  detail?: ReactNode;
  title?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`crew-dialogue dialogue-${member}`}>
      <CrewPortrait member={member} />
      <div className="dialogue-content">
        <span className="dialogue-speaker">
          {CREW[member].name} <span>{title || CREW[member].role}</span>
        </span>
        <p>{children}</p>
        {detail && (
          <>
            <button
              className="dialogue-more"
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "A little less" : "Tell me why"}{" "}
              <span aria-hidden="true">{expanded ? "−" : "+"}</span>
            </button>
            {expanded && <div className="dialogue-detail">{detail}</div>}
          </>
        )}
      </div>
    </div>
  );
}
export function MissionDialogue({ state }: { state: MissionState }) {
  const last = state.log.at(-1);
  const messages: Record<string, string> = {
    launch: "Boots on the Moon! First, check that our habitat is safe.",
    inspect:
      "Our home is safe, but the solar connector is broken. Fix it, or explore on battery power?",
    repair:
      "You did it! The array now adds power on later turns. What shall we discover next?",
    bypass: "Battery adventure it is! Leave enough energy for the trip home.",
    sample:
      "A little piece of the Moon, ready for our science lab! Check your supplies before the next stop.",
    shelter:
      "Good call. Shelter keeps our exposure from growing while we wait.",
    wait: "Instruments are still on. Even a quiet moment can use supplies.",
    resume: "Welcome back, commander. Your crew is ready when you are.",
  };
  const travel =
    state.oxygen < 30
      ? "Oxygen is getting low. How about a trip back to Artemis Base?"
      : "Nice exploring! Every step takes oxygen and time. Keep a reserve for the journey home.";
  const text = state.storm
    ? `Solar-particle alert! Shelter protects us. The training event ends at minute ${state.storm_at + 14}.`
    : messages[last?.kind || "launch"] || travel;
  return (
    <CrewDialogue
      member={
        last?.kind === "inspect" || last?.kind === "launch" ? "nova" : "orbit"
      }
      detail={last?.explanation}
    >
      {text}
    </CrewDialogue>
  );
}
