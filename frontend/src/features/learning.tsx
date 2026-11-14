import type { CSSProperties } from "react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FlaskConical,
  HeartPulse,
  Leaf,
  Moon,
  Radio,
  RotateCcw,
  Shield,
  Sparkles,
  Sun,
  Type,
  VolumeX,
  Wind,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  ActionButton,
  ButtonLink,
  ErrorPanel,
  Loading,
  Orbit,
  PageHeading,
} from "../components/ui";
import { Resources } from "../components/Resources";
import { CrewPortrait, CrewDialogue } from "../components/Crew";
import { GearArt } from "./preparation";
import { MissionGate } from "./mission";
import { api } from "../services/api";
import { usePreferences } from "../stores/preferences";
import type { LogEntry, MissionState, Source } from "../types";

export function Science() {
  const [tab, setTab] = useState<"notes" | "gallery">("notes");
  const sources = useQuery({
    queryKey: ["sources"],
    queryFn: api.sources,
    staleTime: Infinity,
  });
  const images = useQuery({
    queryKey: ["nasa-images"],
    queryFn: api.images,
    enabled: tab === "gallery",
    staleTime: 3_600_000,
  });
  const guide = useMutation({ mutationFn: api.explain });
  return (
    <>
      <PageHeading
        eyebrow="ORBIT’s science lab"
        title="Field notes from the Moon."
        description="The mission is a story. The curiosity is real. Discover the NASA science behind your choices."
      />
      <div className="science-banner">
        <span className="science-banner-icon">
          <Sparkles size={27} />
        </span>
        <div>
          <strong>Know what's real.</strong>
          <p>
            NASA references explain real science. Our map, mission events,
            oxygen units, and risk points are simplified game models. This is
            not live lunar telemetry.
          </p>
        </div>
        <span className="tag">SOURCE TRANSPARENCY</span>
      </div>
      <div className="science-tabs" role="group" aria-label="Science content">
        <button
          aria-pressed={tab === "notes"}
          className={tab === "notes" ? "tab-active" : ""}
          onClick={() => setTab("notes")}
        >
          <BookOpen size={17} /> Field notes
        </button>
        <button
          aria-pressed={tab === "gallery"}
          className={tab === "gallery" ? "tab-active" : ""}
          onClick={() => setTab("gallery")}
        >
          <Moon size={17} /> NASA image library
        </button>
      </div>
      {tab === "notes" ? (
        sources.isPending ? (
          <Loading label="Opening the science notebook…" />
        ) : sources.error ? (
          <ErrorPanel
            error={sources.error}
            retry={() => void sources.refetch()}
          />
        ) : (
          <div className="science-grid">
            {sources.data.sources
              .filter((s) => s.kind !== "historical_media")
              .map((source, index) => (
                <ScienceCard key={source.id} source={source} index={index} />
              ))}
          </div>
        )
      ) : images.isPending ? (
        <Loading label="Checking NASA's public media catalog…" />
      ) : images.error ? (
        <ErrorPanel error={images.error} retry={() => void images.refetch()} />
      ) : (
        images.data && (
          <>
            <div className="gallery-notice">
              <Radio size={17} />
              <span>
                <strong>
                  {images.data.mode === "nasa_api"
                    ? "NASA API response · historical media"
                    : "Offline reference · bundled historical record"}
                </strong>
                <small>
                  {images.data.note} Retrieved: {images.data.retrieved_at}.
                </small>
              </span>
            </div>
            <div className="gallery-grid">
              {images.data.items.map((image) => (
                <article className="panel gallery-card" key={image.nasa_id}>
                  <div className="gallery-image">
                    <img
                      src={image.thumbnail}
                      alt={image.title}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                    <span className="image-fallback">
                      <Moon size={40} />
                      Image may need an internet connection
                    </span>
                  </div>
                  <div>
                    <span className="micro-label mint">
                      NASA / {image.nasa_id}
                    </span>
                    <h2>{image.title}</h2>
                    <p>{image.credit}</p>
                    <small>
                      Media catalog date: {image.catalog_date}. Observation date
                      not supplied.
                    </small>
                    <a
                      className="text-link"
                      href={`https://images.nasa.gov/details/${encodeURIComponent(image.nasa_id)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open NASA record <ExternalLink size={13} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </>
        )
      )}
      <section className="panel ask-orbit">
        <div>
          <span className="micro-label mint">MEET ORBIT</span>
          <h2>Big questions welcome.</h2>
          <p>
            Pick a topic. Your science guide will explain it in a few small
            steps.
          </p>
          <span className="micro-label muted">
            CURATED EXPLANATIONS · NO GENERATIVE AI
          </span>
        </div>
        <div className="orbit-topics">
          {[
            { id: "oxygen", text: "Why watch my oxygen?", Icon: Wind },
            { id: "power", text: "Why repair the array?", Icon: Sun },
            { id: "radiation", text: "What does shielding do?", Icon: Shield },
            {
              id: "samples",
              text: "What can rocks tell us?",
              Icon: FlaskConical,
            },
            { id: "strategy", text: "How do I make a plan?", Icon: Sparkles },
          ].map(({ id, text, Icon }) => (
            <button
              className="topic-button"
              key={id}
              disabled={guide.isPending}
              onClick={() => guide.mutate(id)}
            >
              <Icon size={16} />
              {text}
              <ArrowUpRight size={14} />
            </button>
          ))}
        </div>
      </section>
      {guide.isPending && <Loading label="ORBIT is opening a field note…" />}
      {guide.data && (
        <div aria-live="polite">
          <Orbit>{guide.data.explanation}</Orbit>
        </div>
      )}
      {guide.error && <ErrorPanel error={guide.error} />}
      <div className="science-attribution">
        <p>
          Independent educational project. NASA references and media do not
          imply NASA endorsement.
        </p>
        <a
          className="text-link small"
          href="https://www.nasa.gov/nasa-brand-center/images-and-media/"
          target="_blank"
          rel="noreferrer"
        >
          NASA media usage guidance <ExternalLink size={13} />
        </a>
      </div>
    </>
  );
}

function ScienceCard({ source, index }: { source: Source; index: number }) {
  const icons = [Sun, FlaskConical, Wind, Shield];
  const Icon = icons[index] || Moon;
  return (
    <article className="panel science-card">
      <div className="science-illustration">
        {index === 2 ? (
          <GearArt id="oxygen_tank" />
        ) : index === 3 ? (
          <GearArt id="radiation_shield" />
        ) : (
          <div
            className={`science-moon science-moon-${index}`}
            aria-hidden="true"
          >
            <span className="science-sun">☀</span>
            <span className="illustrated-moon">
              <span />
              <span />
              <span />
            </span>
            {index === 1 && <span className="sample-flag">⚑</span>}
          </div>
        )}
      </div>
      <div className="science-card-top">
        <span
          className={`feature-icon ${["yellow", "lavender", "mint", "orange"][index]}`}
        >
          <Icon size={25} />
        </span>
        <span className="micro-label muted">NASA REFERENCE / 0{index + 1}</span>
      </div>
      <h2>{source.title}</h2>
      <p>{source.summary}</p>
      <div className="science-connection">
        <span className="micro-label mint">IN YOUR MISSION</span>
        <p>{source.gameplay_use}</p>
      </div>
      <details>
        <summary>
          Source & scientific limits <span>+</span>
        </summary>
        <div className="source-details">
          <dl>
            <dt>Dataset / reference</dt>
            <dd>{source.title}</dd>
            <dt>Source</dt>
            <dd>{source.organization}</dd>
            <dt>Observation date</dt>
            <dd>
              {source.observation_date ||
                "Not specified; explanatory reference"}
            </dd>
            <dt>Reference retrieved</dt>
            <dd>{source.retrieved_at}</dd>
            <dt>Credit</dt>
            <dd>{source.credit}</dd>
            <dt>Limitations</dt>
            <dd>{source.limitations}</dd>
          </dl>
          <a
            className="text-link"
            href={source.url}
            target="_blank"
            rel="noreferrer"
          >
            Read the NASA source <ExternalLink size={14} />
          </a>
        </div>
      </details>
    </article>
  );
}

const OUTCOMES: Record<
  string,
  { title: string; description: string; label: string }
> = {
  excellent: {
    title: "One extraordinary mission.",
    description:
      "Two samples. A working solar array. A safe crew with supplies to spare. That’s thoughtful command.",
    label: "EXCELLENT MISSION",
  },
  science_complete: {
    title: "Discovery, delivered.",
    description:
      "You brought home both samples and your crew. Look at your reserves and see what your next plan could improve.",
    label: "SCIENCE COMPLETE",
  },
  safe_return: {
    title: "A discovery. A safe return.",
    description:
      "You brought home a sample and your crew. Keeping the mission manageable is a smart strategy.",
    label: "SAFE RETURN · REDUCED SCIENCE",
  },
  partial_completion: {
    title: "Your crew comes first.",
    description:
      "You returned before collecting a sample. Your preparation still taught you something useful for next time.",
    label: "PARTIAL COMPLETION",
  },
  mission_abort: {
    title: "A responsible call.",
    description:
      "You ended the sortie and called the fictional recovery team. Review your plan and try a fresh approach.",
    label: "MISSION ABORTED",
  },
  mission_failure: {
    title: "Every attempt teaches you.",
    description:
      "Your practice mission ran out of a safety reserve or time. No worries—take what you learned into your next adventure.",
    label: "PRACTICE MISSION ENDED",
  },
};

export function Results() {
  return <MissionGate>{(state) => <ResultView state={state} />}</MissionGate>;
}
function ResultView({ state }: { state: MissionState }) {
  const finished = ["COMPLETED", "FAILED"].includes(state.status);
  const report = useQuery({
    queryKey: ["report", state.id],
    queryFn: () => api.report(state.id),
    enabled: finished,
    staleTime: Infinity,
  });
  if (!finished)
    return (
      <div className="state-panel">
        <FlagIcon />
        <h1>The adventure is still unfolding.</h1>
        <p>Return to base and complete the mission to see your results.</p>
        <ButtonLink to="/control">
          Continue your mission <ArrowRight size={17} />
        </ButtonLink>
      </div>
    );
  if (report.isPending)
    return <Loading label="Preparing your mission debrief…" />;
  if (report.error)
    return (
      <ErrorPanel error={report.error} retry={() => void report.refetch()} />
    );
  const outcome = OUTCOMES[state.outcome || "mission_failure"];
  return (
    <>
      <div
        className={`results-hero ${state.status === "FAILED" ? "friendly-retry" : "mission-celebration"}`}
      >
        <CrewPortrait
          member={state.status === "FAILED" ? "orbit" : "nova"}
          className="result-guide"
        />
        {state.status !== "FAILED" && (
          <div className="celebration-stars" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} style={{ "--star-index": i } as CSSProperties}>
                ✦
              </span>
            ))}
          </div>
        )}
        <div
          className={`results-emblem ${state.status === "FAILED" ? "results-practice" : ""}`}
        >
          <OrbitStar />
          <span>ASTRA · MISSION 01</span>
        </div>
        <span className="micro-label mint">{outcome.label}</span>
        <h1>{outcome.title}</h1>
        <p>{outcome.description}</p>
      </div>
      <div className="results-stats">
        <div>
          <FlaskConical size={23} />
          <strong>
            {report.data.samples} <span>/ 2</span>
          </strong>
          <span>SAMPLES BROUGHT HOME</span>
        </div>
        <div>
          <Clock3 size={23} />
          <strong>
            {report.data.minutes} <span>min</span>
          </strong>
          <span>MISSION TIME</span>
        </div>
        <div>
          <CheckCircle2 size={23} />
          <strong>
            {state.array_status === "repaired" ? "Restored" : "Battery"}
          </strong>
          <span>YOUR POWER PLAN</span>
        </div>
      </div>
      <Resources state={state} />
      <div className="achievement-row">
        {report.data.badges.map((badge) => (
          <span key={badge}>
            <Award size={18} />
            {badge}
          </span>
        ))}
      </div>
      <CrewDialogue member={state.status === "FAILED" ? "nova" : "orbit"}>
        {state.status === "FAILED"
          ? "Practice makes a stronger commander. Next time, check the trip-home cost before choosing your next destination."
          : report.data.next_tip}
      </CrewDialogue>
      <div className="results-actions">
        <ButtonLink to="/report">
          Open your learning report <BookOpen size={17} />
        </ButtonLink>
        <ButtonLink to="/missions" secondary>
          <RotateCcw size={17} /> Try another strategy
        </ButtonLink>
      </div>
    </>
  );
}
function OrbitStar() {
  return <span className="emblem-star">✦</span>;
}
function FlagIcon() {
  return <Moon size={32} />;
}

export function Journal({ reportOnly = false }: { reportOnly?: boolean }) {
  return (
    <MissionGate>
      {(state) => <JournalView state={state} reportOnly={reportOnly} />}
    </MissionGate>
  );
}
function JournalView({
  state,
  reportOnly,
}: {
  state: MissionState;
  reportOnly: boolean;
}) {
  const finished = ["COMPLETED", "FAILED"].includes(state.status);
  const report = useQuery({
    queryKey: ["report", state.id],
    queryFn: () => api.report(state.id),
    enabled: finished,
    staleTime: Infinity,
  });
  const download = () => {
    const output = {
      mission: "The Lunar Outpost Emergency",
      callsign: state.callsign,
      outcome: state.outcome,
      equipment: state.equipment,
      resources: { oxygen: state.oxygen, power: state.power, risk: state.risk },
      minutes: state.elapsed,
      decisions: state.log,
      lessons: report.data?.lessons || [],
      simulation_notice: "Educational game values. Not real telemetry.",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(output, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "astra-mission-journal.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <div className="journal-heading">
        <PageHeading
          eyebrow={reportOnly ? "YOUR LEARNING REPORT" : "YOUR MISSION JOURNAL"}
          title={
            finished
              ? "Look at the choices you made."
              : "Every small step, remembered."
          }
          description="Your decisions tell the story. See what changed, why it mattered, and what you can try next."
          back={finished ? "/results" : "/control"}
        />
        <ActionButton secondary onClick={download}>
          <ArrowDownToLine size={16} /> Export journal
        </ActionButton>
      </div>
      <div className="journal-summary">
        <span>
          <span className="signal-dot" />
          {state.status}
        </span>
        <span>Commander {state.callsign}</span>
        <span>{state.elapsed} mission min</span>
        <span>{state.samples.length} / 2 samples</span>
      </div>
      {report.error && (
        <ErrorPanel error={report.error} retry={() => void report.refetch()} />
      )}
      {finished && report.data && (
        <>
          <div className="learning-cards">
            {report.data.lessons.map((lesson, i) => {
              const Icon = [Wind, Sun, HeartPulse][i];
              return (
                <section className="panel learning-card" key={lesson}>
                  <Icon size={22} />
                  <span className="micro-label">LESSON 0{i + 1}</span>
                  <h2>
                    {
                      [
                        "Plan the trip home",
                        "Think beyond this turn",
                        "Protection is part of the plan",
                      ][i]
                    }
                  </h2>
                  <p>{lesson}</p>
                </section>
              );
            })}
          </div>
          <Orbit>
            {state.outcome === "excellent"
              ? "You restored power, collected both samples, and kept a safety reserve. Next time, compare how shielding or a battery-only plan changes your trip."
              : state.outcome === "mission_failure"
                ? "Before leaving for a sample site, compare the travel cost with the oxygen you need to return. You can finish safely with just one sample."
                : "You made a plan and saw its consequences. Try a different loadout next time and compare your saved journal."}
          </Orbit>
        </>
      )}
      <section className="journal-timeline">
        <div className="section-heading">
          <h2>Mission timeline</h2>
          <span className="micro-label muted">
            DECISION → IMPACT → WHAT YOU LEARNED
          </span>
        </div>
        {state.log.length ? (
          [...state.log]
            .reverse()
            .map((entry) => <LogCard key={entry.id} entry={entry} />)
        ) : (
          <div className="panel empty-journal">
            <BookOpen size={27} />
            <p>Your first mission decision will appear here.</p>
            <ButtonLink to="/control" secondary>
              Back to mission control <ArrowRight size={16} />
            </ButtonLink>
          </div>
        )}
      </section>
      <div className="page-actions">
        <ButtonLink to={finished ? "/missions" : "/explore"}>
          {finished ? "Try a fresh mission" : "Return to exploration"}{" "}
          <ArrowRight size={17} />
        </ButtonLink>
        <Link className="text-link" to="/science">
          Explore the NASA references <ExternalLink size={14} />
        </Link>
      </div>
    </>
  );
}
function LogCard({ entry }: { entry: LogEntry }) {
  return (
    <article
      className={`log-card ${entry.kind === "event" ? "log-event" : ""}`}
    >
      <span className="log-time">
        T+{String(entry.time).padStart(2, "0")}
        <small>MIN</small>
      </span>
      <div>
        <div className="log-title">
          <h3>{entry.title}</h3>
          <span className="micro-label muted">{entry.kind}</span>
        </div>
        <div className="log-deltas">
          {Object.entries(entry.delta)
            .filter(([, value]) => value !== 0)
            .map(([key, value]) => (
              <span key={key}>
                {value > 0 ? "+" : ""}
                {value}{" "}
                {
                  (
                    {
                      oxygen: "O₂ units",
                      power: "Wh",
                      risk: "risk points",
                      elapsed: "min",
                    } as Record<string, string>
                  )[key]
                }
              </span>
            ))}
        </div>
        {entry.explanation && <p>{entry.explanation}</p>}
      </div>
    </article>
  );
}

export function Settings() {
  const preferences = usePreferences();
  return (
    <>
      <PageHeading
        eyebrow="MAKE YOURSELF AT HOME"
        title="Your mission. Your pace."
        description="A few simple settings to make your adventure feel right for you."
      />
      <div className="settings-layout">
        <section className="panel settings-panel">
          <h2>Comfort & accessibility</h2>
          {[
            {
              key: "reducedMotion" as const,
              title: "Reduce motion",
              text: "Skip travel animations and use quieter transitions.",
              Icon: Leaf,
            },
            {
              key: "largeText" as const,
              title: "Larger text",
              text: "Give explanations and instructions a little more room.",
              Icon: Type,
            },
            {
              key: "guidance" as const,
              title: "ORBIT mission tips",
              text: "Show a helpful science explanation after mission actions.",
              Icon: Sparkles,
            },
          ].map(({ key, title, text, Icon }) => (
            <label className="setting-row" key={key}>
              <Icon size={22} />
              <span>
                <strong>{title}</strong>
                <small>{text}</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={preferences[key]}
                onChange={(e) =>
                  preferences.setPreference(key, e.target.checked)
                }
              />
              <span className="toggle-track" aria-hidden="true">
                <span />
                {preferences[key] && <Check size={12} />}
              </span>
            </label>
          ))}
          <div className="setting-row">
            <VolumeX size={22} />
            <span>
              <strong>A quiet universe</strong>
              <small>
                This mission has no audio. All instructions are readable.
              </small>
            </span>
          </div>
        </section>
        <aside className="panel privacy-panel">
          <span className="feature-icon mint">
            <Shield size={25} />
          </span>
          <h2>Curiosity, without an account.</h2>
          <p>
            No real names, emails, locations, or tracking. Your anonymous
            mission is saved on the server. This browser remembers its private
            session link and your settings.
          </p>
          <p>
            Keep using the same browser to resume your progress. Export your
            journal to take your discoveries with you.
          </p>
          <span className="micro-label mint">NO AI KEY REQUIRED</span>
          <p>
            ORBIT uses curated explanations. It never changes your mission
            resources.
          </p>
        </aside>
      </div>
      <div className="page-actions">
        <ButtonLink to={preferences.sessionId ? "/control" : "/missions"}>
          Ready to explore <ArrowRight size={17} />
        </ButtonLink>
      </div>
    </>
  );
}
