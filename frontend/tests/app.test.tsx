import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/app/App";
import { Resources } from "../src/components/Resources";
import { MissionDialogue } from "../src/components/Crew";
import { usePreferences } from "../src/stores/preferences";
import type { MissionState } from "../src/types";

const mission = {
  id: "lunar-outpost",
  title: "The Lunar Outpost Emergency",
  description: "Restore power and return safely.",
  duration: "15–20 min",
  equipment: [],
  map: { width: 16, height: 12, sites: {}, blocked: [] },
};
const state: MissionState = {
  id: "a".repeat(43),
  version: 0,
  mission_id: "lunar-outpost",
  callsign: "Pathfinder",
  seed: 42,
  status: "ACTIVE",
  equipment: [],
  oxygen: 73,
  oxygen_capacity: 100,
  power: 65,
  power_capacity: 100,
  risk: 11,
  elapsed: 16,
  position: { x: 3, y: 7 },
  inspected: true,
  array_status: "broken",
  samples: [],
  storm_at: 30,
  storm: false,
  sheltered: true,
  outcome: null,
  log: [],
  objectives: [],
  available_actions: [],
  last_path: [],
};
const fetchMock = vi.fn();
function mount(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <ChakraProvider value={defaultSystem}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>,
  );
}
beforeEach(() => {
  usePreferences.setState({
    sessionId: null,
    callsign: "Pathfinder",
    reducedMotion: false,
    largeText: false,
    guidance: true,
  });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(
    async (url: string) =>
      new Response(
        JSON.stringify(
          url.endsWith("/missions/lunar-outpost") ? mission : state,
        ),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
  );
});

describe("mission experience", () => {
  it("lets explorers meet Scout before starting and restores keyboard focus", async () => {
    mount("/");
    const trigger = screen.getByRole("button", {
      name: "Meet Scout the rover",
    });
    await userEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Meet Scout" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Close discovery" }),
    ).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
  it("keeps in-mission science short and offers the full explanation on request", async () => {
    const explanation =
      "Repairing costs oxygen now and restores power generation on future turns.";
    render(
      <MissionDialogue
        state={{
          ...state,
          log: [
            {
              id: "repair-1",
              kind: "repair",
              title: "Array repaired",
              time: 16,
              delta: {},
              explanation,
            },
          ],
        }}
      />,
    );
    expect(screen.getByText(/You did it!/)).toBeVisible();
    expect(screen.queryByText(explanation)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tell me why" }));
    expect(screen.getByText(explanation)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "A little less" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
  it("opens the game start screen and goes directly to the mission briefing", async () => {
    mount("/");
    expect(
      screen.getByRole("heading", {
        name: /Commander,.*the Moon needs you/,
      }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("link", { name: "Start your mission" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Houston… our outpost needs a hand.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Accept briefing" }),
    ).toBeVisible();
  });
  it("persists a private callsign selection without asking for a name", async () => {
    mount("/onboarding");
    await userEvent.click(screen.getByRole("button", { name: /Voyager/ }));
    expect(usePreferences.getState().callsign).toBe("Voyager");
    expect(screen.getByRole("button", { name: /Voyager/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("shows loading and retryable errors", async () => {
    let fail!: (error: Error) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          fail = reject;
        }),
    );
    mount("/missions");
    expect(screen.getByRole("status")).toHaveTextContent("Connecting");
    fail(new Error("offline"));
    expect(await screen.findByRole("alert")).toHaveTextContent("unreachable");
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });
  it("keeps mission pages useful without a session", () => {
    mount("/control");
    expect(
      screen.getByRole("heading", { name: "Your mission is waiting." }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Choose a mission" }),
    ).toBeVisible();
  });
  it("renders meaningful resource units and accessible bars", () => {
    render(<Resources state={state} />);
    expect(
      screen.getByRole("progressbar", { name: "Suit oxygen" }),
    ).toHaveAttribute("aria-valuenow", "73");
    expect(
      screen.getByRole("progressbar", { name: "Battery power" }),
    ).toHaveAttribute("aria-valuetext", "65 Wh");
    expect(
      screen.getByRole("progressbar", { name: "Exposure risk" }),
    ).toHaveAttribute("aria-valuetext", "11 points");
  });
  it("applies accessibility preferences and remembers them", async () => {
    mount("/settings");
    await userEvent.click(
      screen.getByRole("switch", { name: /Reduce motion/ }),
    );
    await userEvent.click(screen.getByRole("switch", { name: /Larger text/ }));
    await userEvent.click(
      screen.getByRole("switch", { name: /ORBIT mission tips/ }),
    );
    expect(document.documentElement).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
    expect(document.documentElement).toHaveAttribute("data-large-text", "true");
    expect(usePreferences.getState().guidance).toBe(false);
  });
  it("submits a decision to the API with its version and action identity", async () => {
    usePreferences.setState({ sessionId: state.id });
    fetchMock.mockImplementation(
      async (_url: string, init?: RequestInit) =>
        new Response(
          JSON.stringify(
            init?.method === "POST"
              ? {
                  ...state,
                  version: 1,
                  array_status: "bypassed",
                  status: "COMPLETED",
                  outcome: "mission_abort",
                }
              : state,
          ),
          { status: 200 },
        ),
    );
    mount("/decisions");
    await userEvent.click(
      await screen.findByRole("button", { name: /Choose battery power/ }),
    );
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([, init]) => init?.method === "POST"),
      ).toBe(true),
    );
    const posted = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "POST",
    )!;
    expect(JSON.parse(posted[1].body)).toMatchObject({
      kind: "bypass",
      version: 0,
    });
    expect(JSON.parse(posted[1].body).action_id).toMatch(/^[\da-f-]{36}$/);
  });
  it("explains failed outcomes and offers a replay", async () => {
    usePreferences.setState({ sessionId: state.id });
    fetchMock.mockImplementation(
      async (url: string) =>
        new Response(
          JSON.stringify(
            url.endsWith("/report")
              ? {
                  samples: 0,
                  minutes: 100,
                  badges: ["First touchdown"],
                  next_tip: "Try a shorter route.",
                }
              : { ...state, status: "FAILED", outcome: "mission_failure" },
          ),
          { status: 200 },
        ),
    );
    mount("/results");
    expect(
      await screen.findByRole("heading", {
        name: "Every attempt teaches you.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Try another strategy" }),
    ).toHaveAttribute("href", "/missions");
    expect(
      screen.getByRole("link", { name: "Open your learning report" }),
    ).toHaveAttribute("href", "/report");
  });
});
