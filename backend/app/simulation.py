"""Pure, deterministic, turn-based simulation. All coefficients are educational assumptions."""

from collections import deque
from copy import deepcopy

from app.schemas import Action

MISSION = {
    "id": "lunar-outpost",
    "title": "The Lunar Outpost Emergency",
    "number": "01",
    "description": "Restore your outpost's power, investigate two lunar sites, and bring your crew home.",
    "duration": "15–20 min",
    "difficulty": "Junior commander",
    "location": "Lunar south pole",
}
SITES = {
    "habitat": {
        "x": 3,
        "y": 7,
        "name": "Artemis Base",
        "hint": "Inspect your habitat. Return here to finish.",
    },
    "solar": {
        "x": 5,
        "y": 4,
        "name": "Solar array",
        "hint": "Repair the array for power on future turns.",
    },
    "ridge": {
        "x": 9,
        "y": 3,
        "name": "Sunlit Ridge",
        "hint": "Collect a rock sample. 8 min · 12 Wh.",
    },
    "crater": {
        "x": 12,
        "y": 8,
        "name": "Shackleton Edge",
        "hint": "Collect a shadow-soil sample. 12 min · 18 Wh.",
    },
    "shelter": {
        "x": 9,
        "y": 8,
        "name": "Field shelter",
        "hint": "Wait safely during the simulated solar event.",
    },
}
BLOCKED = {(7, 3), (7, 4), (7, 5), (6, 6), (11, 5), (12, 5), (13, 5), (10, 10), (4, 9), (5, 9)}
EQUIPMENT = [
    {
        "id": "oxygen_tank",
        "name": "Extra oxygen",
        "description": "+25 suit units. Explore a little farther.",
        "benefit": "+25 O₂",
        "icon": "oxygen",
    },
    {
        "id": "solar_tools",
        "name": "Repair toolkit",
        "description": "Fix the array in 6 min using 8 Wh, instead of 9 min and 12 Wh.",
        "benefit": "Faster repairs",
        "icon": "tools",
    },
    {
        "id": "rover_battery",
        "name": "Lunar rover",
        "description": "+40 Wh capacity. Driving uses 1.5 Wh per tile; walking uses 0.7 Wh.",
        "benefit": "+40 Wh",
        "icon": "rover",
    },
    {
        "id": "radiation_shield",
        "name": "Radiation shielding",
        "description": "Halves your simulated exposure-risk increase.",
        "benefit": "½ exposure risk",
        "icon": "shield",
    },
]
EXPLANATIONS = {
    "oxygen": "Every trip uses oxygen from your suit. Take enough for the trip home, too! Our suit units are a game model, not real oxygen measurements.",
    "power": "Sunlight can make electricity in a solar array. Repairing yours costs energy now, but adds 1.2 Wh for each mission minute afterward. Those amounts are game settings.",
    "radiation": "Space radiation can harm astronauts. Habitats and shielding offer protection. This game's risk points help you compare choices; they are not a real radiation dose or space-weather forecast.",
    "samples": "Lunar rocks tell us about the Moon's past. NASA has detected evidence of water ice in polar shadows, but finding ice in one place does not guarantee it is everywhere. Our sample discoveries are fictional.",
    "strategy": "Make a plan for getting home before setting out. Repairing the array helps future power; extra oxygen helps longer trips; shielding makes exposure grow more slowly. There is more than one good plan!",
}


class RuleError(ValueError):
    pass


def require(condition: bool, message: str):
    if not condition:
        raise RuleError(message)


def new_state(session_id: str, callsign: str, seed: int) -> dict:
    return {
        "id": session_id,
        "version": 0,
        "mission_id": MISSION["id"],
        "callsign": callsign,
        "seed": seed,
        "status": "BRIEFING",
        "equipment": [],
        "oxygen": 100.0,
        "oxygen_capacity": 100.0,
        "power": 100.0,
        "power_capacity": 100.0,
        "risk": 0.0,
        "elapsed": 0,
        "position": {"x": 3, "y": 7},
        "inspected": False,
        "array_status": "unknown",
        "samples": [],
        "storm_at": 30 + seed % 7,
        "storm": False,
        "sheltered": True,
        "outcome": None,
        "log": [],
        "last_path": [],
    }


def at(state: dict, target: str) -> bool:
    site = SITES[target]
    return state["position"] == {"x": site["x"], "y": site["y"]}


def path_to(start: tuple[int, int], end: tuple[int, int]) -> list[tuple[int, int]]:
    require(
        end not in BLOCKED and 0 <= end[0] < 16 and 0 <= end[1] < 12,
        "That terrain is not passable.",
    )
    queue = deque([(start, [])])
    seen = {start}
    while queue:
        pos, path = queue.popleft()
        if pos == end:
            return path
        for dx, dy in ((1, 0), (0, -1), (-1, 0), (0, 1)):
            nxt = (pos[0] + dx, pos[1] + dy)
            if 0 <= nxt[0] < 16 and 0 <= nxt[1] < 12 and nxt not in BLOCKED and nxt not in seen:
                seen.add(nxt)
                queue.append((nxt, [*path, nxt]))
    raise RuleError("No safe route to that location.")


def advance(state: dict, minutes: int, oxygen_rate: float, energy: float, protected=False):
    start = state["elapsed"]
    end = start + minutes
    storm_minutes = max(0, min(end, state["storm_at"] + 14) - max(start, state["storm_at"]))
    risk = 0 if protected else (minutes - storm_minutes) * 0.35 + storm_minutes * 1.8
    if "radiation_shield" in state["equipment"]:
        risk *= 0.5
    generation = minutes * 1.2 if state["array_status"] == "repaired" else 0
    state["oxygen"] = round(max(0, state["oxygen"] - minutes * oxygen_rate), 2)
    state["power"] = round(
        max(0, min(state["power_capacity"], state["power"] - energy + generation)), 2
    )
    state["risk"] = round(min(100, state["risk"] + risk), 2)
    state["elapsed"] = end
    state["storm"] = state["storm_at"] <= end < state["storm_at"] + 14
    if state["oxygen"] <= 0 or state["power"] <= 0 or state["risk"] >= 100 or end >= 100:
        state["status"] = "FAILED"
        state["outcome"] = "mission_failure"


def apply_action(previous: dict, action: Action) -> dict:
    state = deepcopy(previous)
    kind = action.kind
    state["last_path"] = []
    message = ""
    explanation = ""
    if kind == "prepare":
        require(state["status"] == "BRIEFING", "Equipment can only be chosen during briefing.")
        require(len(set(action.equipment)) == len(action.equipment), "Choose each item only once.")
        state["equipment"] = action.equipment
        state["oxygen_capacity"] = 125.0 if "oxygen_tank" in action.equipment else 100.0
        state["power_capacity"] = 140.0 if "rover_battery" in action.equipment else 100.0
        state["oxygen"] = state["oxygen_capacity"]
        state["power"] = state["power_capacity"]
        state["status"] = "PREPARATION"
        message = "Loadout secured. Your crew is ready for landing."
        explanation = (
            "Cargo space is limited. Your equipment choices will change the mission ahead."
        )
    elif kind == "launch":
        require(state["status"] == "PREPARATION", "Prepare your equipment before launch.")
        state["status"] = "ACTIVE"
        message = "Touchdown! Welcome to Artemis Base. Inspect your habitat first."
        explanation = "Real crews check their life-support systems before exploring."
    elif kind == "pause":
        require(state["status"] == "ACTIVE", "Only an active mission can be paused.")
        state["status"] = "PAUSED"
        message = "Mission paused. Your resources are safe."
    elif kind == "resume":
        require(state["status"] == "PAUSED", "This mission is not paused.")
        state["status"] = "ACTIVE"
        message = "Mission resumed. Ready when you are, commander."
    else:
        require(
            state["status"] == "ACTIVE", "Start or resume your mission before taking an action."
        )
        if kind in ("move", "travel"):
            require(state["inspected"], "Inspect your habitat before leaving base.")
            if kind == "travel":
                require(action.target in SITES, "Choose a mission site.")
                site = SITES[action.target]
                end = (site["x"], site["y"])
            else:
                require(action.x is not None and action.y is not None, "Choose a destination tile.")
                end = (action.x, action.y)
                require(
                    abs(end[0] - state["position"]["x"]) + abs(end[1] - state["position"]["y"])
                    == 1,
                    "Move one tile at a time.",
                )
            path = path_to((state["position"]["x"], state["position"]["y"]), end)
            require(bool(path), "You are already at that location.")
            traversed = []
            for x, y in path:
                advance(state, 1, 0.9, 1.5 if "rover_battery" in state["equipment"] else 0.7)
                state["position"] = {"x": x, "y": y}
                traversed.append([x, y])
                if state["status"] == "FAILED":
                    break
            state["last_path"] = traversed
            state["sheltered"] = at(state, "habitat") or at(state, "shelter")
            message = f"Traveled {len(traversed)} tiles. {len(traversed)} mission minutes elapsed."
            explanation = EXPLANATIONS["oxygen"]
        elif kind == "inspect":
            require(
                at(state, "habitat") and not state["inspected"],
                "Inspect the habitat once, while at base.",
            )
            advance(state, 4, 0, 2, protected=True)
            state["inspected"] = True
            state["array_status"] = "broken"
            message = "Habitat safe. Alert: a solar-array connector has failed!"
            explanation = "Your stored battery works, but it cannot refill until the array is repaired. Visit the array, or choose to conserve power and continue."
        elif kind == "repair":
            require(
                at(state, "solar") and state["array_status"] in ("broken", "bypassed"),
                "Visit the damaged solar array to repair it.",
            )
            tools = "solar_tools" in state["equipment"]
            advance(state, 6 if tools else 9, 1.2, 8 if tools else 12)
            if state["status"] != "FAILED":
                state["array_status"] = "repaired"
            message = "Solar array repaired. Future mission turns now generate power."
            explanation = EXPLANATIONS["power"]
        elif kind == "bypass":
            require(state["array_status"] == "broken", "The array decision has already been made.")
            state["array_status"] = "bypassed"
            message = (
                "Battery-only plan selected. Science is possible, but your power cannot refill."
            )
            explanation = "Skipping repairs saves time and oxygen now. Every later action will use your limited battery. You can still repair the array later."
        elif kind == "sample":
            require(action.target in ("ridge", "crater"), "Choose a scientific sample site.")
            require(at(state, action.target), "Travel to the sample site first.")
            require(
                state["array_status"] in ("repaired", "bypassed"),
                "Choose a power plan before collecting samples.",
            )
            require(
                action.target not in state["samples"], "You have already collected this sample."
            )
            crater = action.target == "crater"
            advance(state, 12 if crater else 8, 1.2, 18 if crater else 12)
            if state["status"] != "FAILED":
                state["samples"].append(action.target)
            message = "Shadow-soil sample secured!" if crater else "Ancient rock sample secured!"
            explanation = EXPLANATIONS["samples"]
        elif kind == "shelter":
            require(state["sheltered"], "Travel to the habitat or field shelter for protection.")
            require(
                state["elapsed"] < state["storm_at"] + 14,
                "The environmental event has already passed.",
            )
            advance(state, 8, 0 if at(state, "habitat") else 0.4, 2, protected=True)
            message = "Your crew waited safely under shelter for 8 mission minutes."
            explanation = "Shielding lowers exposure during an event. Waiting still takes mission time and power. Risk already accumulated does not disappear."
        elif kind == "wait":
            advance(state, 5, 0 if at(state, "habitat") else 0.9, 2, protected=state["sheltered"])
            message = "Five mission minutes passed. Your instruments remain on."
            explanation = "Even standing still outside uses oxygen. A repaired array can add power while you wait."
        elif kind == "return":
            require(
                at(state, "habitat") and state["inspected"],
                "Return to the habitat before finishing your mission.",
            )
            count = len(state["samples"])
            state["status"] = "COMPLETED"
            state["outcome"] = (
                "excellent"
                if count == 2
                and state["array_status"] == "repaired"
                and state["oxygen"] >= 20
                and state["power"] >= 20
                and state["risk"] < 70
                else "science_complete"
                if count == 2
                else "safe_return"
                if count == 1
                else "partial_completion"
            )
            message = (
                "Crew home. Mission complete. Every safe return is a success worth learning from."
            )
            explanation = "You balanced exploration with the resources needed to get home. Compare your choices in the learning report."
        elif kind == "abort":
            state["status"] = "COMPLETED"
            state["outcome"] = "mission_abort"
            message = "Mission aborted. Your fictional emergency support team recovered the crew."
            explanation = "Calling for help is a responsible decision. In this game, emergency recovery ends your mission; real lunar rescue is much more complex."
        else:
            raise RuleError("That action is not available.")
    if state["status"] == "FAILED":
        message = "Mission ended: your safety reserve was exhausted."
        explanation = "This was a practice mission. Try a shorter route, extra supplies, or an earlier return. Your next plan can be stronger."
    storm_started = previous["elapsed"] < state["storm_at"] <= state["elapsed"]
    if storm_started:
        state["log"].append(
            {
                "id": f"event-{state['version'] + 1}",
                "kind": "event",
                "title": "Simulated solar-particle event",
                "explanation": "Exposure grows faster outside until mission minute "
                + str(state["storm_at"] + 14)
                + ". Head to shelter or use your shielding. This is a scripted event, not live NASA weather.",
                "time": state["elapsed"],
                "delta": {},
            }
        )
    delta = {
        key: round(state[key] - previous[key], 2) for key in ("oxygen", "power", "risk", "elapsed")
    }
    state["version"] += 1
    state["log"].append(
        {
            "id": str(action.action_id),
            "kind": kind,
            "title": message,
            "explanation": explanation,
            "time": state["elapsed"],
            "delta": delta,
        }
    )
    return state


def present(state: dict) -> dict:
    output = deepcopy(state)
    output["objectives"] = [
        {"id": "inspect", "title": "Inspect Artemis Base", "done": state["inspected"]},
        {
            "id": "power",
            "title": "Choose your power plan",
            "done": state["array_status"] in ("repaired", "bypassed"),
        },
        {
            "id": "ridge",
            "title": "Collect a ridge rock sample",
            "done": "ridge" in state["samples"],
        },
        {
            "id": "crater",
            "title": "Collect a shadow-soil sample",
            "done": "crater" in state["samples"],
        },
        {
            "id": "return",
            "title": "Bring your crew home",
            "done": state["status"] == "COMPLETED" and state["outcome"] != "mission_abort",
        },
    ]
    actions = []
    if state["status"] == "ACTIVE":
        if at(state, "habitat"):
            if not state["inspected"]:
                actions.append(
                    {"kind": "inspect", "label": "Inspect habitat", "cost": "4 min · 2 Wh"}
                )
            else:
                actions.append(
                    {"kind": "return", "label": "Complete mission", "cost": "Finish safely at base"}
                )
        if at(state, "solar") and state["array_status"] in ("broken", "bypassed"):
            tools = "solar_tools" in state["equipment"]
            actions.append(
                {
                    "kind": "repair",
                    "label": "Repair solar array",
                    "cost": "6 min · 7.2 O₂ · 8 Wh" if tools else "9 min · 10.8 O₂ · 12 Wh",
                }
            )
        if state["array_status"] == "broken":
            actions.append(
                {
                    "kind": "bypass",
                    "label": "Use battery power",
                    "cost": "Save time · no solar generation",
                }
            )
        for target in ("ridge", "crater"):
            if (
                at(state, target)
                and target not in state["samples"]
                and state["array_status"] in ("repaired", "bypassed")
            ):
                actions.append(
                    {
                        "kind": "sample",
                        "target": target,
                        "label": "Collect rock sample"
                        if target == "ridge"
                        else "Collect soil sample",
                        "cost": "8 min · 9.6 O₂ · 12 Wh"
                        if target == "ridge"
                        else "12 min · 14.4 O₂ · 18 Wh",
                    }
                )
        if state["sheltered"] and state["elapsed"] < state["storm_at"] + 14:
            actions.append(
                {
                    "kind": "shelter",
                    "label": "Wait under shelter",
                    "cost": "8 min · 0 O₂ · 2 Wh · protected"
                    if at(state, "habitat")
                    else "8 min · 3.2 O₂ · 2 Wh · protected",
                }
            )
    output["available_actions"] = actions
    return output


def report(state: dict) -> dict:
    require(
        state["status"] in ("COMPLETED", "FAILED"),
        "Finish your mission to unlock the learning report.",
    )
    lessons = [EXPLANATIONS["oxygen"], EXPLANATIONS["power"], EXPLANATIONS["radiation"]]
    badges = ["First touchdown"]
    if state["array_status"] == "repaired":
        badges.append("Power engineer")
    if len(state["samples"]) == 2:
        badges.append("Lunar scientist")
    if state["status"] == "COMPLETED" and state["outcome"] != "mission_abort":
        badges.append("Crew comes first")
    return {
        "session_id": state["id"],
        "outcome": state["outcome"],
        "minutes": state["elapsed"],
        "samples": len(state["samples"]),
        "resources": {key: state[key] for key in ("oxygen", "power", "risk")},
        "badges": badges,
        "lessons": lessons,
        "decisions": state["log"],
        "next_tip": "Try a different equipment pair or power plan. Can you bring home both samples with more oxygen left?",
        "source_ids": [
            "spacesuit-life-support",
            "lunar-illumination",
            "lunar-radiation",
            "lunar-ice",
        ],
    }
