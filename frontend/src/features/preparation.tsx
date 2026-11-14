import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Backpack,
  Check,
  Clock3,
  Flag,
  FlaskConical,
  MapPin,
  Play,
  Rocket,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  ActionButton,
  ButtonLink,
  ErrorPanel,
  Loading,
  PageHeading,
  Stepper,
} from "../components/ui";
import { CrewDialogue, CrewPortrait } from "../components/Crew";
import { useCatalog, useCommand, useMission } from "../hooks/useMission";
import { api } from "../services/api";
import { usePreferences } from "../stores/preferences";
import type { EquipmentId } from "../types";

const BASE_OBJECTS = {
  habitat: {
    title: "Artemis Base",
    text: "Home sweet Moon! Inspect our habitat first. Come back here to finish your mission safely.",
    member: "nova" as const,
  },
  scout: {
    title: "Meet Scout",
    text: "Big wheels. Bigger adventures. Pack Scout to carry more energy—or walk and use less power per step.",
    member: "scout" as const,
  },
  science: {
    title: "A world to discover",
    text: "Moon rocks can tell stories billions of years old. On your mission, bring home a rock and a soil sample!",
    member: "orbit" as const,
  },
};
export function Landing() {
  const sessionId = usePreferences((s) => s.sessionId);
  const [object, setObject] = useState<keyof typeof BASE_OBJECTS | null>(null);
  const selected = object ? BASE_OBJECTS[object] : null;
  useEffect(() => {
    if (!object) return;
    const trigger = document.activeElement as HTMLElement | null;
    document.querySelector<HTMLButtonElement>(".discovery-close")?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setObject(null);
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
      trigger?.focus();
    };
  }, [object]);
  return (
    <div className="launch-world">
      <section
        className="adventure-scene"
        aria-label="Welcome to the lunar outpost"
      >
        <img
          className="scene-art"
          src="/art/lunar-outpost.webp"
          alt="Captain Nova and Scout the rover explore a golden lunar landscape, with Artemis Base, solar panels, ORBIT, and distant Earth."
          fetchPriority="high"
        />
        <div className="scene-shade" />
        <div className="scene-title">
          <span className="mission-ribbon">
            <Flag size={16} /> Your first lunar adventure
          </span>
          <h1>
            Commander,
            <br />
            the Moon needs you!
          </h1>
          <p>
            Explore the Moon. Look after your crew.{" "}
            <br />
            Make the big calls. Ready for touchdown?
          </p>
        </div>
        <button
          className="world-hotspot hotspot-habitat"
          onClick={() => setObject("habitat")}
          aria-label="Discover Artemis Base"
        >
          <span className="hotspot-point" aria-hidden="true">
            +
          </span>
          <span>Artemis Base</span>
        </button>
        <button
          className="world-hotspot hotspot-scout"
          onClick={() => setObject("scout")}
          aria-label="Meet Scout the rover"
        >
          <span className="hotspot-point" aria-hidden="true">
            +
          </span>
          <span>Meet Scout</span>
        </button>
        <button
          className="world-hotspot hotspot-science"
          onClick={() => setObject("science")}
          aria-label="Make discoveries with lunar science"
        >
          <span className="hotspot-point" aria-hidden="true">
            +
          </span>
          <span>Make discoveries</span>
        </button>
        <div className="launch-bottom">
          <div className="welcome-dialogue">
            <CrewDialogue member="nova">
              Hey, commander! I'm Nova. Our outpost needs a helping hand. Let's
              make a plan together.
            </CrewDialogue>
          </div>
          <div className="launch-actions">
            <ButtonLink to="/briefing" className="start-mission">
              <Play size={23} fill="currentColor" /> Start your mission{" "}
              <ArrowRight size={22} />
            </ButtonLink>
            {sessionId ? (
              <Link className="resume-link" to="/control">
                Continue your saved mission <ArrowRight size={16} />
              </Link>
            ) : (
              <span className="launch-reassurance">
                Ages 7–12 · No account needed · Play at your pace
              </span>
            )}
          </div>
        </div>
        <span className="scene-caption">
          An imagined outpost. Real science. Your decisions.
        </span>
        {selected && (
          <div
            className="world-discovery"
            role="dialog"
            aria-modal="false"
            aria-labelledby="discovery-title"
          >
            <button
              className="icon-button discovery-close"
              aria-label="Close discovery"
              onClick={() => setObject(null)}
            >
              <X size={18} />
            </button>
            <h2 id="discovery-title">{selected.title}</h2>
            <CrewDialogue member={selected.member}>
              {selected.text}
            </CrewDialogue>
            <ButtonLink to="/briefing">
              Let's go explore <ArrowRight size={18} />
            </ButtonLink>
          </div>
        )}
      </section>
      <div className="launch-caption">
        <span>
          <ShieldCheck size={17} /> Your choices change the adventure.
        </span>
        <Link to="/science">
          Curious about the real science? <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export function MissionSelection() {
  const { data, isPending, error, refetch } = useCatalog();
  return (
    <>
      <PageHeading
        eyebrow="Choose an adventure"
        title="Next stop: the Moon."
        description="One outpost. Two discoveries. A whole crew counting on you."
      />
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorPanel error={error} retry={() => void refetch()} />
      ) : (
        <article className="mission-selection">
          <div className="mission-art">
            <img
              src="/art/lunar-outpost.webp"
              alt="Your lunar crew beside Artemis Base"
            />
            <span className="art-badge">Mission 01 · Ready to explore</span>
          </div>
          <div className="mission-selection-copy">
            <span className="chapter-label">A lunar south pole adventure</span>
            <h2>{data.title}</h2>
            <p>{data.description}</p>
            <div className="detail-grid">
              <span>
                <Clock3 />
                15–20 min to play
              </span>
              <span>
                <FlaskConical />2 sample discoveries
              </span>
              <span>
                <ShieldCheck />
                First-time explorers welcome
              </span>
            </div>
            <ButtonLink to="/onboarding">
              <Rocket size={20} /> Accept the mission <ArrowRight size={20} />
            </ButtonLink>
          </div>
        </article>
      )}
      <CrewDialogue member="nova">
        There's no one perfect plan. Repair the power, bring extra supplies, or
        try a shorter trip. You're the commander!
      </CrewDialogue>
    </>
  );
}

function CallsignChoices({ compact = false }: { compact?: boolean }) {
  const callsign = usePreferences((s) => s.callsign);
  const setCallsign = usePreferences((s) => s.setCallsign);
  return (
    <div
      className={`callsign-grid ${compact ? "compact-callsigns" : ""}`}
      role="group"
      aria-label="Choose your callsign"
    >
      {["Pathfinder", "Explorer", "Voyager"].map((name, index) => (
        <button
          key={name}
          className={`callsign-card callsign-${index} ${callsign === name ? "selected" : ""}`}
          aria-pressed={callsign === name}
          onClick={() => setCallsign(name)}
        >
          <span className="callsign-patch" aria-hidden="true">
            {["✦", "☾", "✶"][index]}
            <small>0{index + 1}</small>
          </span>
          <span className="callsign-copy">
            <strong>{name}</strong>
            <small>
              {
                [
                  "Find a way forward.",
                  "Ask the big questions.",
                  "Go a little farther.",
                ][index]
              }
            </small>
          </span>
          <span className="choice-indicator">
            {callsign === name && <Check size={17} />}
          </span>
        </button>
      ))}
    </div>
  );
}
export function Onboarding() {
  const callsign = usePreferences((s) => s.callsign);
  return (
    <>
      <Stepper step={0} />
      <PageHeading
        eyebrow="Welcome aboard"
        title="A crew. A callsign. A big adventure."
        description="Pick your commander callsign. Your real name stays on Earth."
        back="/missions"
      />
      <div className="crew-introduction">
        <div className="crew-lineup">
          <div>
            <CrewPortrait member="nova" />
            <strong>Captain Nova</strong>
            <span>Your mission guide</span>
          </div>
          <div>
            <CrewPortrait member="orbit" />
            <strong>ORBIT</strong>
            <span>Your science buddy</span>
          </div>
          <div>
            <CrewPortrait member="scout" />
            <strong>Scout</strong>
            <span>Your exploration rover</span>
          </div>
        </div>
        <CrewDialogue member="nova">
          I'll help you get started. ORBIT explains the science. Pack Scout if
          you want extra battery capacity. And you? You make the big calls.
        </CrewDialogue>
      </div>
      <h2 className="small-section-title">
        What should we call you, commander?
      </h2>
      <CallsignChoices />
      <div className="page-actions">
        <span className="muted">All set, Commander {callsign}?</span>
        <ButtonLink to="/briefing">
          Meet your mission <ArrowRight size={20} />
        </ButtonLink>
      </div>
    </>
  );
}

function MissionRoute() {
  return (
    <div
      className="mission-route"
      aria-label="Your plan: check the habitat, choose power, collect samples, return home"
    >
      <svg viewBox="0 0 700 230" aria-hidden="true">
        <path
          d="M55 175Q180 165 198 98T365 94T545 105T650 172"
          fill="none"
          stroke="#b18d58"
          strokeWidth="3"
          strokeDasharray="6 9"
        />
        {[
          [65, 165],
          [225, 76],
          [425, 126],
          [620, 165],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r="28"
              fill={["#355e9b", "#c66c2e", "#52765e", "#355e9b"][i]}
              stroke="#fff3d4"
              strokeWidth="4"
            />
            <text
              x={x}
              y={y + 7}
              textAnchor="middle"
              fontSize="23"
              fontWeight="700"
              fill="#fff3d4"
            >
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <div className="route-stops">
        <span>Check our home</span>
        <span>Choose a power plan</span>
        <span>Collect discoveries</span>
        <span>Bring everyone home</span>
      </div>
    </div>
  );
}
export function Briefing() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const callsign = usePreferences((s) => s.callsign);
  const setSession = usePreferences((s) => s.setSession);
  const create = useMutation({
    mutationFn: () => api.create(callsign),
    onSuccess: (state) => {
      setSession(state.id);
      client.setQueryData(["session", state.id], state);
      navigate("/equipment");
    },
  });
  return (
    <>
      <Stepper step={1} />
      <PageHeading
        eyebrow="Mission 01 · Captain's briefing"
        title="Houston… our outpost needs a hand."
        description="We've landed near the lunar south pole. Now let's turn this little landing site into a safe home for our crew."
        back="/missions"
      />
      <div className="briefing-spread">
        <div className="briefing-picture">
          <img
            src="/art/lunar-outpost.webp"
            alt="Artemis Base and your crew on the Moon"
          />
          <span className="field-label">
            <MapPin size={17} /> Artemis Base · Lunar south pole
          </span>
        </div>
        <div className="briefing-story">
          <span className="chapter-label">Here's the challenge</span>
          <h2>
            Power up. Discover.
            <br />
            Make it home.
          </h2>
          <p>
            Our solar array has a faulty connector. We can fix it before
            exploring—or use the battery we brought.
          </p>
          <p>
            Two sample sites are waiting. Keep enough oxygen and energy for the
            way back!
          </p>
          <span className="science-stamp">
            <FlaskConical size={18} /> Imagined mission · NASA science
          </span>
        </div>
      </div>
      <MissionRoute />
      <div className="briefing-callsign">
        <h2>Choose your commander callsign</h2>
        <p>No real name needed. You can change it before accepting.</p>
        <CallsignChoices compact />
      </div>
      <CrewDialogue member="nova">
        Take your time thinking. The mission clock moves only when you do
        something. And a safe return with one sample is still a great adventure.
      </CrewDialogue>
      {create.error && (
        <ErrorPanel error={create.error} retry={() => create.mutate()} />
      )}
      <div className="page-actions">
        <Link className="text-link" to="/onboarding">
          Meet Nova, ORBIT & Scout <ArrowUpRight size={17} />
        </Link>
        <ActionButton busy={create.isPending} onClick={() => create.mutate()}>
          Accept briefing <ArrowRight size={20} />
        </ActionButton>
      </div>
    </>
  );
}

export function GearArt({ id }: { id: EquipmentId }) {
  return (
    <svg className="gear-art" viewBox="0 0 180 150" aria-hidden="true">
      <ellipse cx="90" cy="135" rx="55" ry="8" fill="#172d4a" opacity=".12" />
      {id === "oxygen_tank" ? (
        <>
          <rect
            x="50"
            y="35"
            width="75"
            height="95"
            rx="25"
            fill="#70bfc9"
            stroke="#224560"
            strokeWidth="4"
          />
          <path
            d="M61 47Q66 36 83 39"
            fill="none"
            stroke="#c9f3ed"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <rect
            x="75"
            y="18"
            width="25"
            height="19"
            rx="5"
            fill="#eed2a1"
            stroke="#224560"
            strokeWidth="4"
          />
          <path d="M95 22h25v50" fill="none" stroke="#224560" strokeWidth="6" />
          <rect x="62" y="77" width="52" height="32" rx="4" fill="#fcf3de" />
          <text
            x="88"
            y="100"
            textAnchor="middle"
            fontFamily="sans-serif"
            fontSize="24"
            fontWeight="bold"
            fill="#224560"
          >
            O₂
          </text>
        </>
      ) : id === "solar_tools" ? (
        <>
          <rect
            x="35"
            y="61"
            width="112"
            height="65"
            rx="12"
            fill="#eaa74f"
            stroke="#483c39"
            strokeWidth="4"
          />
          <path
            d="M67 61V43h45v18"
            fill="none"
            stroke="#483c39"
            strokeWidth="7"
          />
          <rect x="35" y="77" width="112" height="15" fill="#ba643a" />
          <rect
            x="78"
            y="77"
            width="22"
            height="30"
            rx="4"
            fill="#fff1cd"
            stroke="#483c39"
            strokeWidth="3"
          />
          <path
            d="m122 22-7 13 12 8 9-12q5 19-14 26l-22 33-11-8 23-35q-7-20 10-25"
            fill="#bed0d4"
            stroke="#334e65"
            strokeWidth="3"
          />
        </>
      ) : id === "rover_battery" ? (
        <>
          <g fill="#283c51" stroke="#e8b86b" strokeWidth="5">
            <circle cx="48" cy="115" r="17" />
            <circle cx="124" cy="115" r="17" />
          </g>
          <path
            d="m38 81 20-24h55l26 23v26H38Z"
            fill="#f1e5c8"
            stroke="#2a4560"
            strokeWidth="4"
          />
          <path
            d="M65 61h39l14 19H52Z"
            fill="#68a5b7"
            stroke="#2a4560"
            strokeWidth="3"
          />
          <rect x="76" y="88" width="25" height="12" fill="#e78145" />
          <path d="M119 60V26" stroke="#2a4560" strokeWidth="4" />
          <path
            d="m108 28 14-9 14 9-14 7Z"
            fill="#f4c56a"
            stroke="#2a4560"
            strokeWidth="3"
          />
        </>
      ) : (
        <>
          <path
            d="M90 22 141 43v37q0 37-51 57Q39 117 39 80V43Z"
            fill="#b7a4d5"
            stroke="#3c405e"
            strokeWidth="4"
          />
          <path
            d="M90 35 128 51v30q0 25-38 43Q52 106 52 81V51Z"
            fill="#e0d4e9"
            stroke="#655881"
            strokeWidth="2"
          />
          <path
            d="m71 78 14 14 28-32"
            fill="none"
            stroke="#655881"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
export function Equipment() {
  const {
    data: mission,
    error: catalogError,
    isPending: catalogPending,
    refetch: refetchCatalog,
  } = useCatalog();
  const { data: state, isPending, error, refetch } = useMission();
  const sessionId = usePreferences((s) => s.sessionId);
  const command = useCommand();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<EquipmentId[]>([
    "oxygen_tank",
    "solar_tools",
  ]);
  if (!sessionId)
    return (
      <div className="state-panel">
        <Backpack size={36} />
        <h1>Let's get you a mission first.</h1>
        <ButtonLink to="/missions">
          Choose your mission <ArrowRight size={20} />
        </ButtonLink>
      </div>
    );
  if (isPending || catalogPending) return <Loading />;
  if (error || catalogError)
    return (
      <ErrorPanel
        error={(error || catalogError)!}
        retry={() => {
          void refetch();
          void refetchCatalog();
        }}
      />
    );
  if (!state || !mission) return null;
  const pack = state.status === "BRIEFING" ? selected : state.equipment;
  const launch = async () => {
    try {
      if (state.status === "BRIEFING")
        await command.mutateAsync({ kind: "prepare", equipment: selected });
      navigate("/control");
    } catch {
      /* The error appears below. */
    }
  };
  return (
    <>
      <Stepper step={2} />
      <PageHeading
        eyebrow="The equipment bay"
        title="Big adventure. Small backpack."
        description="You have room for two extras. What will help your crew the most?"
        back="/briefing"
      />
      <div className="packing-header">
        <div className="cargo-summary">
          <Backpack size={25} />
          <strong>{pack.length} / 2 cargo slots filled</strong>
          <span>Suit & science tools already packed</span>
        </div>
        <div
          className="cargo-slots"
          aria-label={`${pack.length} of 2 cargo slots filled`}
        >
          {[0, 1].map((i) => (
            <span key={i} className={pack[i] ? "slot-filled" : ""}>
              {pack[i] ? <Check size={20} /> : "+"}
            </span>
          ))}
        </div>
      </div>
      <div className="equipment-grid">
        {mission.equipment.map((item) => {
          const chosen = pack.includes(item.id);
          return (
            <button
              key={item.id}
              className={`equipment-card ${chosen ? "selected" : ""}`}
              aria-pressed={chosen}
              disabled={
                state.status !== "BRIEFING" ||
                command.isPending ||
                (!chosen && selected.length === 2)
              }
              onClick={() =>
                setSelected((prev) =>
                  chosen
                    ? prev.filter((id) => id !== item.id)
                    : [...prev, item.id],
                )
              }
            >
              <span className="choice-indicator">
                {chosen && <Check size={17} />}
              </span>
              <GearArt id={item.id} />
              <span className="equipment-benefit">{item.benefit}</span>
              <h2>
                {item.id === "rover_battery" ? "Scout the rover" : item.name}
              </h2>
              <p>{item.description}</p>
              <span className="pack-label">
                {chosen ? "Packed!" : "Add to backpack"}
              </span>
            </button>
          );
        })}
      </div>
      <CrewDialogue
        member="scout"
        detail="Driving uses 1.5 Wh per tile; walking uses 0.7 Wh. These are simplified game values, and both take one mission minute per tile."
      >
        Beep beep! I carry a bigger battery, but driving uses more energy than
        walking. Choose the gear that fits your plan.
      </CrewDialogue>
      {command.error && <ErrorPanel error={command.error} />}
      <div className="page-actions">
        <span className="muted">
          {pack.length < 2
            ? "Travel light, or choose another extra."
            : "Backpack ready. Adventure next!"}
        </span>
        <ActionButton busy={command.isPending} onClick={() => void launch()}>
          {state.status === "BRIEFING"
            ? "Secure loadout"
            : "Continue to mission control"}{" "}
          <ArrowRight size={20} />
        </ActionButton>
      </div>
    </>
  );
}
