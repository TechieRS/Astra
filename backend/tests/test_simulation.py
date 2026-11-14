from copy import deepcopy
from uuid import uuid4

import pytest

from app.schemas import Action
from app.simulation import (
    BLOCKED,
    RuleError,
    advance,
    apply_action,
    new_state,
    path_to,
    present,
    report,
)


def act(state, kind, **kwargs):
    return apply_action(
        state, Action(action_id=uuid4(), version=state["version"], kind=kind, **kwargs)
    )


def active(equipment=None, seed=42):
    state = new_state("a" * 43, "Pathfinder", seed)
    state = act(state, "prepare", equipment=equipment or [])
    state = act(state, "launch")
    return act(state, "inspect")


def science_path(equipment=None, repair=True, both=True):
    state = active(equipment)
    if repair:
        state = act(state, "travel", target="solar")
        state = act(state, "repair")
    else:
        state = act(state, "bypass")
    state = act(state, "travel", target="ridge")
    state = act(state, "sample", target="ridge")
    if both:
        state = act(state, "travel", target="crater")
        state = act(state, "sample", target="crater")
    state = act(state, "travel", target="habitat")
    return act(state, "return")


def test_initial_state_and_equipment():
    state = new_state("a" * 43, "Voyager", 9)
    assert state["status"] == "BRIEFING" and state["storm_at"] == 32
    prepared = act(state, "prepare", equipment=["oxygen_tank", "rover_battery"])
    assert prepared["oxygen"] == 125 and prepared["power"] == 140
    assert state["status"] == "BRIEFING"  # engine must not mutate its input


@pytest.mark.parametrize(
    "kind", ["move", "inspect", "repair", "sample", "return", "resume", "pause"]
)
def test_locked_phase(kind):
    with pytest.raises(RuleError):
        act(new_state("a" * 43, "Voyager", 42), kind)


def test_must_inspect_before_exploring():
    state = act(act(new_state("a" * 43, "Explorer", 42), "prepare"), "launch")
    with pytest.raises(RuleError, match="Inspect"):
        act(state, "travel", target="ridge")


def test_collision_and_adjacency():
    state = active()
    for point in BLOCKED:
        with pytest.raises(RuleError):
            path_to((3, 7), point)
    with pytest.raises(RuleError, match="one tile"):
        act(state, "move", x=5, y=5)
    path = path_to((3, 7), (12, 8))
    assert len(path) == 10
    assert all(p not in BLOCKED for p in path)


def test_movement_formulas():
    state = active()
    changed = act(state, "move", x=4, y=7)
    assert changed["oxygen"] == 99.1
    assert changed["power"] == 97.3
    assert changed["risk"] == 0.35
    assert changed["elapsed"] == 5
    assert changed["last_path"] == [[4, 7]]


def test_rover_cost_and_shield():
    state = active(["rover_battery", "radiation_shield"])
    changed = act(state, "move", x=4, y=7)
    assert changed["power"] == 136.5
    assert changed["risk"] == 0.17  # round(.175, 2) follows Python's decimal rounding


def test_array_has_persistent_future_benefit():
    state = act(active(["solar_tools"]), "travel", target="solar")
    before = deepcopy(state)
    state = act(state, "repair")
    assert state["power"] == before["power"] - 8
    assert state["oxygen"] == pytest.approx(before["oxygen"] - 7.2)
    state = act(state, "wait")
    assert state["power"] > before["power"] - 8
    assert state["array_status"] == "repaired"


def test_no_oxygen_generation_and_battery_cap():
    state = active()
    state["array_status"] = "repaired"
    state["power"] = 99.9
    changed = act(state, "wait")
    assert changed["power"] == 100
    assert changed["oxygen"] == state["oxygen"]


def test_unique_decisions_and_location_preconditions():
    state = active()
    with pytest.raises(RuleError):
        act(state, "repair")
    state = act(state, "bypass")
    with pytest.raises(RuleError):
        act(state, "bypass")
    state = act(state, "travel", target="ridge")
    state = act(state, "sample", target="ridge")
    with pytest.raises(RuleError):
        act(state, "sample", target="ridge")
    with pytest.raises(RuleError):
        act(state, "return")


def test_pause_resume_keeps_resources():
    state = active()
    paused = act(state, "pause")
    assert paused["status"] == "PAUSED"
    with pytest.raises(RuleError):
        act(paused, "wait")
    resumed = act(paused, "resume")
    assert resumed["oxygen"] == state["oxygen"] and resumed["elapsed"] == state["elapsed"]


def test_scripted_event_is_repeatable_and_shelter_does_not_erase_exposure():
    state = active(["radiation_shield"])
    state["elapsed"] = 28
    state = act(state, "travel", target="shelter")
    assert state["storm"]
    assert any(entry["kind"] == "event" for entry in state["log"])
    before = state["risk"]
    state = act(state, "shelter")
    assert state["risk"] == before
    state = act(state, "shelter")
    assert not state["storm"] and state["risk"] == before


@pytest.mark.parametrize(
    "equipment,repair,both,outcome",
    [
        (["oxygen_tank", "solar_tools"], True, True, "excellent"),
        (["oxygen_tank", "rover_battery"], False, True, "science_complete"),
        (["radiation_shield", "solar_tools"], False, False, "safe_return"),
    ],
)
def test_coherent_strategies(equipment, repair, both, outcome):
    state = science_path(equipment, repair, both)
    assert state["status"] == "COMPLETED"
    assert state["outcome"] == outcome
    assert report(state)["samples"] == (2 if both else 1)
    with pytest.raises(RuleError):
        act(state, "wait")


def test_partial_and_abort_outcomes():
    assert act(active(), "return")["outcome"] == "partial_completion"
    assert act(active(), "abort")["outcome"] == "mission_abort"


@pytest.mark.parametrize(
    "resource,value", [("oxygen", 0.5), ("power", 0.5), ("risk", 99.9), ("elapsed", 99)]
)
def test_failure_boundaries(resource, value):
    state = active()
    state = act(state, "move", x=4, y=7)
    state[resource] = value
    changed = act(state, "wait")
    assert changed["status"] == "FAILED" and changed["outcome"] == "mission_failure"
    assert changed["oxygen"] >= 0 and changed["power"] >= 0 and changed["risk"] <= 100


def test_travel_stops_at_exhaustion_not_at_destination():
    state = active()
    state["oxygen"] = 1.0
    state = act(state, "travel", target="crater")
    assert state["status"] == "FAILED" and len(state["last_path"]) == 2
    assert state["position"] != {"x": 12, "y": 8}


def test_risk_integrates_only_storm_overlap():
    state = active()
    state["elapsed"] = 28
    advance(state, 5, 0, 0)
    assert state["risk"] == pytest.approx(2 * 0.35 + 3 * 1.8)


def test_deterministic_replay_and_visible_objectives():
    first = active(["solar_tools"])
    second = deepcopy(first)
    action = Action(action_id=uuid4(), version=first["version"], kind="travel", target="ridge")
    assert apply_action(first, action) == apply_action(second, action)
    assert present(first)["objectives"][0]["done"]
    with pytest.raises(RuleError):
        report(first)
