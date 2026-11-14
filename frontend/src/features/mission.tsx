import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Compass,
  Flag,
  FlaskConical,
  Home,
  MapPin,
  Pause,
  Play,
  Radio,
  Rocket,
  Save,
  Shield,
  Sparkles,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import {
  ActionButton,
  ButtonLink,
  ErrorPanel,
  Loading,
  Orbit,
  PageHeading,
  Stepper,
} from "../components/ui";
import { Resources } from "../components/Resources";
import {
  CrewDialogue,
  CrewPortrait,
  MissionDialogue,
} from "../components/Crew";
import { useCatalog, useCommand, useMission } from "../hooks/useMission";
import { usePreferences } from "../stores/preferences";
import type { Command, Mission, MissionState, SiteId } from "../types";

const LunarMap = lazy(() => import("../game/LunarMap"));
const SITE_ICONS = {
  habitat: Home,
  solar: Wrench,
  ridge: Flag,
  crater: FlaskConical,
  shelter: Shield,
};

export function MissionGate({
  children,
}: {
  children: (state: MissionState) => ReactNode;
}) {
  const id = usePreferences((s) => s.sessionId);
  const { data, isPending, error, refetch } = useMission();
  if (!id)
    return (
      <div className="state-panel">
        <Compass size={32} />
        <h1>Your mission is waiting.</h1>
        <p>Choose your callsign, meet the crew, and make a plan.</p>
        <ButtonLink to="/missions">
          Choose a mission <ArrowRight size={18} />
        </ButtonLink>
      </div>
    );
  if (isPending) return <Loading />;
  if (error) return <ErrorPanel error={error} retry={() => void refetch()} />;
  return data ? children(data) : null;
}

export function Control() {
  return <MissionGate>{(state) => <ControlView state={state} />}</MissionGate>;
}
function ControlView({ state }: { state: MissionState }) {
  const command = useCommand();
  const navigate = useNavigate();
  const finished = ["COMPLETED", "FAILED"].includes(state.status);
  const launch = async () => {
    try {
      await command.mutateAsync({
        kind: state.status === "PAUSED" ? "resume" : "launch",
      });
      navigate("/explore");
    } catch {
      /* Error shown below. */
    }
  };
  return (
    <>
      {state.status === "PREPARATION" && <Stepper step={3} />}
      <PageHeading
        eyebrow="The launch cabin"
        title={`Ready, Commander ${state.callsign}?`}
        description={
          finished
            ? "Your crew is back. Time to see what you discovered."
            : state.status === "PREPARATION"
              ? "Equipment secured. Crew ready. One small step is all it takes."
              : "Your adventure is saved, just as you left it."
        }
      />
      <div className="launch-cabin">
        <div className="cabin-window">
          <img
            src="/art/lunar-outpost.webp"
            alt="Your crew waiting on the lunar surface"
          />
          <span className="cabin-caption">Artemis Base is waiting for you</span>
        </div>
        <div className="cabin-checklist">
          <span className="chapter-label">Flight plan · Mission 01</span>
          <h2>The Lunar Outpost Emergency</h2>
          <Objectives state={state} />
          {state.status === "BRIEFING" ? (
            <ButtonLink to="/equipment">
              Choose your equipment <ArrowRight size={20} />
            </ButtonLink>
          ) : finished ? (
            <ButtonLink to="/results">
              View mission results <ArrowUpRight size={20} />
            </ButtonLink>
          ) : state.status === "PREPARATION" || state.status === "PAUSED" ? (
            <ActionButton
              busy={command.isPending}
              onClick={() => void launch()}
            >
              <Rocket size={22} />
              {state.status === "PAUSED"
                ? "Resume exploration"
                : "Begin lunar landing"}
            </ActionButton>
          ) : (
            <ButtonLink to="/explore">
              Enter lunar exploration <ArrowRight size={20} />
            </ButtonLink>
          )}
          {command.error && <ErrorPanel error={command.error} />}
        </div>
      </div>
      <Resources state={state} />
      <CrewDialogue member="nova">
        {state.status === "PREPARATION"
          ? "Touchdown puts you beside the habitat. Inspect our home first, then choose how to tackle the solar problem."
          : "Take a peek at your supplies before heading out. Every safe return is worth celebrating."}
      </CrewDialogue>
      <div className="control-links">
        <Link className="text-link" to="/journal">
          <BookOpen size={19} /> Open mission journal <ArrowRight size={18} />
        </Link>
        <span className="save-hint">
          <Save size={16} /> Every move is saved
        </span>
      </div>
    </>
  );
}

function Objectives({ state }: { state: MissionState }) {
  return (
    <section className="panel objectives">
      <div className="panel-heading">
        <span className="micro-label">MISSION OBJECTIVES</span>
        <span className="muted">
          {state.objectives.filter((o) => o.done).length} / 5
        </span>
      </div>
      {state.objectives.map((objective) => (
        <div
          key={objective.id}
          className={`objective ${objective.done ? "objective-done" : ""}`}
        >
          {objective.done ? (
            <span className="objective-check">
              <Check size={13} />
            </span>
          ) : (
            <Circle size={18} />
          )}
          <span>{objective.title}</span>
        </div>
      ))}
    </section>
  );
}

export function Exploration() {
  return (
    <MissionGate>{(state) => <ExplorationView state={state} />}</MissionGate>
  );
}

function ExplorationView({ state }: { state: MissionState }) {
  const { data: mission, isPending, error, refetch } = useCatalog();
  const command = useCommand();
  const navigate = useNavigate();
  const guidance = usePreferences((s) => s.guidance);
  const [selected, setSelected] = useState<SiteId>("habitat");
  const [abortConfirm, setAbortConfirm] = useState(false);
  const [showRover, setShowRover] = useState(false);
  useEffect(() => {
    if (state.status === "COMPLETED" || state.status === "FAILED")
      navigate("/results", { replace: true });
  }, [state.status, navigate]);
  if (isPending) return <Loading label="Getting our Moon boots ready…" />;
  if (error) return <ErrorPanel error={error} retry={() => void refetch()} />;
  if (!mission) return null;
  if (state.status === "BRIEFING" || state.status === "PREPARATION")
    return (
      <div className="state-panel">
        <Rocket size={40} />
        <h1>Pre-flight check.</h1>
        <p>Finish preparing and launch from mission control.</p>
        <ButtonLink to="/control">
          Open mission control <ArrowRight size={20} />
        </ButtonLink>
      </div>
    );
  const send = (action: Command) => {
    if (!command.isPending) command.mutate(action);
  };
  const currentSite = (
    Object.entries(mission.map.sites) as [
      SiteId,
      Mission["map"]["sites"][SiteId],
    ][]
  ).find(([, s]) => s.x === state.position.x && s.y === state.position.y);
  const next = state.objectives.find((objective) => !objective.done);
  const latest = state.log.at(-1);
  return (
    <div className="exploration-page">
      <div className="flight-bar">
        <Link to="/control" className="back-link">
          <ArrowLeft size={18} /> Base camp
        </Link>
        <div className="flight-objective">
          <Flag size={20} />
          <span>
            <small>Your next step</small>
            <strong>{next?.title || "Bring your discoveries home"}</strong>
          </span>
          <span className="mission-progress">
            {state.objectives.filter((o) => o.done).length}/5
          </span>
        </div>
        <div className="flight-tools">
          <span className="mission-clock">
            <Clock3 size={17} />
            {state.elapsed}
            <small>/100 min</small>
          </span>
          <ActionButton
            secondary
            busy={command.isPending}
            onClick={() =>
              send({ kind: state.status === "PAUSED" ? "resume" : "pause" })
            }
          >
            {state.status === "PAUSED" ? (
              <Play size={18} />
            ) : (
              <Pause size={18} />
            )}{" "}
            {state.status === "PAUSED" ? "Resume" : "Pause"}
          </ActionButton>
          <Link
            to="/journal"
            className="icon-button"
            aria-label="Open mission journal"
          >
            <BookOpen size={21} />
          </Link>
        </div>
      </div>
      <h1 className="sr-only">The lunar surface</h1>
      <Resources state={state} />
      {state.storm && (
        <div className="storm-alert" role="status">
          <TriangleAlert size={25} />
          <div>
            <strong>Solar-particle alert! Let's find cover.</strong>
            <p>
              Our training event ends at minute {state.storm_at + 14}. Shelter
              protects your crew. This event is simulated.
            </p>
          </div>
          <Shield size={25} />
        </div>
      )}
      <div className="exploration-layout">
        <div className="map-column">
          <section className="map-panel">
            <div className="map-topline">
              <span>
                <MapPin size={17} />
                {currentSite?.[1].name || "Exploring the lunar surface"}
              </span>
              <span>Imagined training terrain</span>
            </div>
            <div className="map-stage">
              <Suspense fallback={<Loading label="Drawing our adventure…" />}>
                <LunarMap
                  state={state}
                  mission={mission}
                  selected={selected}
                  onSelect={setSelected}
                  onMove={send}
                  onRover={() => setShowRover(true)}
                  busy={command.isPending}
                />
              </Suspense>
              {state.status === "PAUSED" && (
                <div className="pause-overlay">
                  <CrewPortrait member="orbit" />
                  <h2>Take your time, commander.</h2>
                  <p>Your supplies are safe. Resume when you’re ready.</p>
                  <ActionButton
                    busy={command.isPending}
                    onClick={() => send({ kind: "resume" })}
                  >
                    <Play size={20} /> Resume mission
                  </ActionButton>
                </div>
              )}
            </div>
            <div className="map-bottomline">
              <span>
                <span className="legend-dot orange-bg" /> Your commander
              </span>
              <span>
                <span className="legend-dot blue-bg" /> Discovery sites
              </span>
              <span>Tap a flag to plan a trip</span>
            </div>
          </section>
          <div className="movement-panel">
            <span>
              <strong>One step at a time.</strong>
              <small>
                Focus the map, then use arrows or WASD. Each step takes
                supplies.
              </small>
            </span>
            <div className="direction-pad">
              {[
                { label: "Move left", dx: -1, dy: 0, Icon: ArrowLeft },
                { label: "Move up", dx: 0, dy: -1, Icon: ArrowUp },
                { label: "Move down", dx: 0, dy: 1, Icon: ArrowDown },
                { label: "Move right", dx: 1, dy: 0, Icon: ArrowRight },
              ].map(({ label, dx, dy, Icon }) => (
                <button
                  key={label}
                  className="icon-button"
                  aria-label={label}
                  disabled={
                    command.isPending ||
                    state.status !== "ACTIVE" ||
                    !state.inspected
                  }
                  onClick={() =>
                    send({
                      kind: "move",
                      x: state.position.x + dx,
                      y: state.position.y + dy,
                    })
                  }
                >
                  <Icon size={22} />
                </button>
              ))}
            </div>
          </div>
          {command.error && <ErrorPanel error={command.error} />}
          {guidance && <MissionDialogue state={state} />}
          <div
            className="latest-transmission"
            aria-live="polite"
            aria-atomic="true"
          >
            <Radio size={19} />
            <span>
              {command.isPending ? "Saving your command…" : latest?.title}
            </span>
            {latest && (
              <span className="transmission-time">T+{state.elapsed}</span>
            )}
          </div>
        </div>
        <aside className="mission-sidebar">
          <section className="field-console">
            <span className="chapter-label">Your field notebook</span>
            <h2>Where to, commander?</h2>
            <div className="site-list">
              {(
                Object.entries(mission.map.sites) as [
                  SiteId,
                  Mission["map"]["sites"][SiteId],
                ][]
              ).map(([id, site], index) => {
                const Icon = SITE_ICONS[id];
                const here =
                  state.position.x === site.x && state.position.y === site.y;
                return (
                  <button
                    key={id}
                    className={`site-button ${selected === id ? "site-selected" : ""}`}
                    aria-pressed={selected === id}
                    onClick={() => setSelected(id)}
                  >
                    <span className={`site-icon site-${id}`}>
                      <Icon size={21} />
                    </span>
                    <span>
                      {site.name}
                      <small>
                        {here
                          ? "You are here"
                          : state.samples.includes(id)
                            ? "Sample collected ✓"
                            : [
                                "Your home on the Moon",
                                "Fix the power",
                                "Find an ancient rock",
                                "Investigate shadow soil",
                                "Wait under protection",
                              ][index]}
                      </small>
                    </span>
                    {here ? (
                      <span className="signal-dot" />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </button>
                );
              })}
            </div>
            <Destination
              selected={selected}
              mission={mission}
              state={state}
              busy={command.isPending}
              send={send}
            />
            <div className="context-task">
              <span className="chapter-label">What you can do here</span>
              <ActionChoices
                state={state}
                busy={command.isPending}
                send={send}
              />
              <Link to="/decisions" className="text-link">
                Compare your choices <ArrowUpRight size={16} />
              </Link>
            </div>
          </section>
          <details className="objectives-drawer">
            <summary>
              Our mission checklist <Check size={18} />
            </summary>
            <Objectives state={state} />
          </details>
          <button
            className="scout-status"
            onClick={() => setShowRover(!showRover)}
            aria-expanded={showRover}
          >
            <CrewPortrait member="scout" />
            <span>
              Check in with Scout
              <small>
                {state.equipment.includes("rover_battery")
                  ? "Rover packed for this mission"
                  : "Parked at base this mission"}
              </small>
            </span>
            <ChevronRight size={18} />
          </button>
          {showRover && (
            <div className="scout-dialog">
              <CrewDialogue member="scout">
                {state.equipment.includes("rover_battery")
                  ? "Beep! Your rover loadout gives you 140 Wh capacity. Each traveled tile uses 1.5 Wh before solar generation."
                  : "I am keeping the base company! You are walking this mission: each tile uses 0.7 Wh before solar generation. Pack me on your next adventure for extra capacity."}
              </CrewDialogue>
              <button
                className="quiet-button"
                onClick={() => setShowRover(false)}
              >
                Thanks, Scout!
              </button>
            </div>
          )}
          <div className="mission-safety-actions">
            <ActionButton
              secondary
              disabled={state.status !== "ACTIVE"}
              busy={command.isPending}
              onClick={() => send({ kind: "wait" })}
            >
              <Clock3 size={18} /> Wait 5 min
            </ActionButton>
            <button
              className="quiet-button"
              onClick={() => setAbortConfirm(!abortConfirm)}
              aria-expanded={abortConfirm}
            >
              End sortie early
            </button>
          </div>
          {abortConfirm && (
            <div
              className="abort-panel"
              role="group"
              aria-label="End sortie confirmation"
            >
              <strong>Call emergency recovery?</strong>
              <p>This ends your training mission with an abort outcome.</p>
              <ActionButton
                secondary
                busy={command.isPending}
                disabled={state.status !== "ACTIVE"}
                onClick={() => send({ kind: "abort" })}
              >
                Confirm recovery
              </ActionButton>
              <button
                className="quiet-button"
                onClick={() => setAbortConfirm(false)}
              >
                Keep exploring
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export function distanceTo(
  mission: Mission,
  state: MissionState,
  target: SiteId,
) {
  const blocked = new Set(mission.map.blocked.map(([x, y]) => `${x},${y}`));
  const end = mission.map.sites[target];
  const queue = [{ ...state.position, n: 0 }];
  const seen = new Set([`${state.position.x},${state.position.y}`]);
  for (let index = 0; index < queue.length; index++) {
    const node = queue[index];
    if (node.x === end.x && node.y === end.y) return node.n;
    for (const [dx, dy] of [
      [1, 0],
      [0, -1],
      [-1, 0],
      [0, 1],
    ]) {
      const x = node.x + dx;
      const y = node.y + dy;
      const key = `${x},${y}`;
      if (
        x >= 0 &&
        x < 16 &&
        y >= 0 &&
        y < 12 &&
        !blocked.has(key) &&
        !seen.has(key)
      ) {
        seen.add(key);
        queue.push({ x, y, n: node.n + 1 });
      }
    }
  }
  return 0;
}
function Destination({
  selected,
  mission,
  state,
  busy,
  send,
}: {
  selected: SiteId;
  mission: Mission;
  state: MissionState;
  busy: boolean;
  send: (action: Command) => void;
}) {
  const distance = distanceTo(mission, state, selected);
  const oxygen = (distance * 0.9).toFixed(1);
  const energy = (
    distance * (state.equipment.includes("rover_battery") ? 1.5 : 0.7)
  ).toFixed(1);
  return (
    <div className="destination-preview">
      <p>{mission.map.sites[selected].hint}</p>
      {distance > 0 ? (
        <>
          <div className="travel-cost">
            <span>{distance} min</span>
            <span>{oxygen} O₂</span>
            <span>{energy} Wh</span>
          </div>
          <small className="cost-note">
            Base costs before any solar generation.
          </small>
          <ActionButton
            busy={busy}
            disabled={state.status !== "ACTIVE" || !state.inspected}
            onClick={() => send({ kind: "travel", target: selected })}
          >
            Travel to site <ArrowRight size={16} />
          </ActionButton>
          {!state.inspected && (
            <small className="cost-note">
              Inspect the habitat before you leave.
            </small>
          )}
          {Number(oxygen) >= state.oxygen && (
            <p className="danger-text">
              This trip would exhaust your oxygen. Try a closer destination.
            </p>
          )}
        </>
      ) : (
        <span className="here-label">
          <MapPin size={13} /> You are at this site
        </span>
      )}
    </div>
  );
}

function ActionChoices({
  state,
  busy,
  send,
}: {
  state: MissionState;
  busy: boolean;
  send: (action: Command) => void;
}) {
  return (
    <div className="action-choices">
      {state.available_actions.length ? (
        state.available_actions.map((action) => (
          <button
            className={`action-choice ${action.kind === "return" ? "action-choice-safe" : ""}`}
            key={`${action.kind}-${action.target || ""}`}
            disabled={busy || state.status !== "ACTIVE"}
            onClick={() =>
              send({
                kind: action.kind,
                ...(action.target ? { target: action.target } : {}),
              })
            }
          >
            <span>
              <strong>{action.label}</strong>
              <small>{action.cost}</small>
            </span>
            <ArrowUpRight size={17} />
          </button>
        ))
      ) : (
        <p className="muted small">
          Select a mission site to find your next task.
        </p>
      )}
    </div>
  );
}

export function Decisions() {
  return <MissionGate>{(state) => <DecisionView state={state} />}</MissionGate>;
}
function DecisionView({ state }: { state: MissionState }) {
  const command = useCommand();
  const navigate = useNavigate();
  const send = async (action: Command) => {
    try {
      await command.mutateAsync(action);
      navigate("/explore");
    } catch {
      /* Error shown below. */
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="COMMANDER'S DECISION DESK"
        title="Every choice leaves a footprint."
        description="Think about what your crew needs now—and what they might need later."
        back="/explore"
      />
      <Resources state={state} />
      <div className="decision-grid">
        <section className="panel decision-card">
          <span className="feature-icon yellow">
            <Wrench size={25} />
          </span>
          <h2>Repair the solar array</h2>
          <p>
            Spend time and supplies now. Generate energy on every later turn.
          </p>
          <ul>
            <li>Costs 6–9 mission minutes</li>
            <li>Uses 7.2–10.8 oxygen units</li>
            <li>Restores 1.2 Wh per future minute</li>
          </ul>
          <ButtonLink to="/explore" secondary>
            Plan a route to the array <ArrowRight size={16} />
          </ButtonLink>
        </section>
        <section className="panel decision-card">
          <span className="feature-icon mint">
            <FlaskConical size={25} />
          </span>
          <h2>Explore on battery power</h2>
          <p>
            Save your repair supplies. Use the battery you brought, and watch
            your return reserve.
          </p>
          <ul>
            <li>No repair costs</li>
            <li>No energy generation</li>
            <li>You can change your plan later</li>
          </ul>
          <ActionButton
            secondary
            disabled={
              state.array_status !== "broken" || state.status !== "ACTIVE"
            }
            busy={command.isPending}
            onClick={() => void send({ kind: "bypass" })}
          >
            {state.array_status === "bypassed"
              ? "Battery plan selected"
              : "Choose battery power"}{" "}
            <ArrowRight size={16} />
          </ActionButton>
        </section>
        <section className="panel decision-card">
          <span className="feature-icon lavender">
            <Home size={25} />
          </span>
          <h2>Keep the crew safe</h2>
          <p>
            A short mission can still teach you a lot. Return to base to finish
            with what you have.
          </p>
          <ul>
            <li>Bring home your discoveries</li>
            <li>Reduce future exposure</li>
            <li>Try a longer trip next time</li>
          </ul>
          <ButtonLink to="/explore" secondary>
            Plan your return <ArrowRight size={16} />
          </ButtonLink>
        </section>
      </div>
      {command.error && <ErrorPanel error={command.error} />}
      <Orbit>
        A good commander thinks ahead. The best plan is one that gives your crew
        enough supplies to return safely. Your mission journal will remember
        what you decide.
      </Orbit>
      <div className="page-actions">
        <ButtonLink to="/explore">
          Back to exploration <ArrowRight size={17} />
        </ButtonLink>
        <Link className="text-link" to="/science">
          Why do these choices matter? <Sparkles size={16} />
        </Link>
      </div>
    </>
  );
}
