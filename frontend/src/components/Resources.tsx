import { BatteryCharging, HeartPulse, Wind } from "lucide-react";
import type { MissionState } from "../types";
import { useEffect, useRef, useState } from "react";

export function Resources({ state }: { state: MissionState }) {
  const previous = useRef({
    oxygen: state.oxygen,
    power: state.power,
    risk: state.risk,
  });
  const [changes, setChanges] = useState<Record<string, number>>({});
  useEffect(() => {
    const next = { oxygen: state.oxygen, power: state.power, risk: state.risk };
    setChanges({
      oxygen: +(next.oxygen - previous.current.oxygen).toFixed(1),
      power: +(next.power - previous.current.power).toFixed(1),
      risk: +(next.risk - previous.current.risk).toFixed(1),
    });
    previous.current = next;
    const timeout = setTimeout(() => setChanges({}), 2000);
    return () => clearTimeout(timeout);
  }, [state.oxygen, state.power, state.risk]);
  const resources = [
    {
      name: "Suit oxygen",
      key: "oxygen",
      value: state.oxygen,
      max: state.oxygen_capacity,
      unit: "units",
      Icon: Wind,
      color: "mint",
      low: state.oxygen < 25,
    },
    {
      name: "Battery power",
      key: "power",
      value: state.power,
      max: state.power_capacity,
      unit: "Wh",
      Icon: BatteryCharging,
      color: "yellow",
      low: state.power < 25,
    },
    {
      name: "Exposure risk",
      key: "risk",
      value: state.risk,
      max: 100,
      unit: "points",
      Icon: HeartPulse,
      color: "purple",
      low: state.risk >= 70,
    },
  ];
  return (
    <div className="resources">
      {resources.map(({ name, key, value, max, unit, Icon, color, low }) => (
        <div
          key={name}
          className={`resource resource-${color} ${low ? "resource-warning" : ""}`}
        >
          <div className="resource-label">
            <Icon size={17} />
            <span>{name}</span>
            <span className="resource-status">
              {low
                ? "CAUTION"
                : name === "Exposure risk"
                  ? "LOWER IS BETTER"
                  : "RESERVE"}
            </span>
          </div>
          <div className="resource-value">
            {Math.round(value)}
            <span>
              {" "}
              / {max} {unit}
            </span>
            {!!changes[key] && (
              <em key={`${state.version}-${key}`} className="resource-change">
                {changes[key] > 0 ? "+" : ""}
                {changes[key]}
              </em>
            )}
          </div>
          <div
            className="resource-track"
            role="progressbar"
            aria-label={name}
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuetext={`${value} ${unit}${low ? ", caution" : ""}`}
          >
            <span style={{ width: `${(value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
