import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { usePreferences } from "../stores/preferences";
import type { Command, Mission, MissionState, SiteId } from "../types";

const CELL = 48,
  OX = 60,
  OY = 28;
const px = (x: number) => OX + x * CELL + CELL / 2;
const py = (y: number) => OY + y * CELL + CELL / 2;
const INK = 0x253e5a;
export default function LunarMap({
  state,
  mission,
  selected,
  onSelect,
  onMove,
  onRover,
  busy,
}: {
  state: MissionState;
  mission: Mission;
  selected: SiteId;
  onSelect: (id: SiteId) => void;
  onMove: (action: Command) => void;
  onRover: () => void;
  busy: boolean;
}) {
  const parent = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  const latest = useRef({ state, selected, onSelect, onMove, onRover, busy });
  latest.current = { state, selected, onSelect, onMove, onRover, busy };
  const reducedMotion = usePreferences((s) => s.reducedMotion);
  const noMotion = useRef(reducedMotion);
  noMotion.current =
    reducedMotion ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (!parent.current) return;
    class LunarScene extends Phaser.Scene {
      astronaut!: Phaser.GameObjects.Container;
      marker!: Phaser.GameObjects.Graphics;
      route!: Phaser.GameObjects.Graphics;
      arrayLight!: Phaser.GameObjects.Arc;
      lastVersion = -1;
      constructor() {
        super("lunar-surface");
      }
      create() {
        const g = this.add.graphics();
        g.fillGradientStyle(0xdccba5, 0xc9bc9d, 0xc9aa7f, 0xddc49a, 1);
        g.fillRect(0, 0, 888, 640);
        // Original illustrated terrain. Tile coordinates and collisions come from the mission API.
        for (let i = 0; i < 46; i++) {
          const x = (i * 173 + 32) % 888,
            y = (i * 97 + 26) % 640,
            r = 5 + ((i * 11) % 26);
          g.fillStyle(0x8f857c, 0.28);
          g.fillEllipse(x, y, r * 2, r * 1.4);
          g.lineStyle(2, 0xf4e5bd, 0.75);
          g.strokeEllipse(x - 1, y + 2, r * 2, r * 1.4);
          g.fillStyle(0x6d6c71, 0.2);
          g.fillEllipse(x - 3, y - 2, r * 1.4, r * 0.8);
        }
        g.fillStyle(0x71717e, 0.55);
        g.fillEllipse(px(12), py(8), 240, 196);
        g.lineStyle(5, 0xead6ae, 0.7);
        g.strokeEllipse(px(12), py(8), 245, 202);
        g.lineStyle(2, 0xa09589, 0.6);
        g.strokeEllipse(px(12), py(8), 268, 221);
        g.lineStyle(1, 0x756e63, 0.09);
        for (let x = 0; x <= 16; x++)
          g.lineBetween(OX + x * CELL, OY, OX + x * CELL, OY + 12 * CELL);
        for (let y = 0; y <= 12; y++)
          g.lineBetween(OX, OY + y * CELL, OX + 16 * CELL, OY + y * CELL);
        // Stones provide a visible boundary for the exact server collision mask.
        mission.map.blocked.forEach(([x, y], i) => {
          const cx = px(x),
            cy = py(y);
          g.fillStyle(0x5e574e, 0.2);
          g.fillEllipse(cx + 7, cy + 13, 48, 20);
          g.fillStyle(0x8d9194);
          g.lineStyle(2, 0x646c77);
          const points = [
            new Phaser.Geom.Point(cx - 20, cy + 10),
            new Phaser.Geom.Point(cx - 15, cy - 11),
            new Phaser.Geom.Point(cx + (i % 2 ? 4 : 10), cy - 18),
            new Phaser.Geom.Point(cx + 20, cy + 4),
            new Phaser.Geom.Point(cx + 8, cy + 14),
          ];
          g.fillPoints(points, true);
          g.strokePoints(points, true);
          g.fillStyle(0xc3c4b8, 0.8);
          g.fillTriangle(cx - 15, cy - 11, cx + 4, cy - 18, cx - 3, cy + 4);
        });
        for (let i = 0; i < 35; i++) {
          const t = i / 35;
          g.fillStyle(0x816e50, 0.35);
          g.fillCircle(
            px(3) + (px(9) - px(3)) * t,
            py(7) - Math.sin(t * Math.PI) * 115,
            2,
          );
        }
        this.drawHabitat(px(3), py(7));
        this.drawSolar(px(5), py(4));
        this.drawScience(px(9), py(3), false);
        this.drawScience(px(12), py(8), true);
        const hut = this.add.graphics({ x: px(9), y: py(8) });
        hut.fillStyle(0x506e83);
        hut.fillRoundedRect(-26, -20, 52, 41, 10);
        hut.lineStyle(3, INK);
        hut.strokeRoundedRect(-26, -20, 52, 41, 10);
        hut.fillStyle(0x9ac5c5);
        hut.fillRoundedRect(-21, -20, 42, 24, 8);
        hut.fillStyle(0xf2e4c5);
        hut.fillRect(-8, -9, 16, 29);
        hut.lineStyle(3, 0xd99752);
        hut.lineBetween(-24, 7, 24, 7);
        const hasRover =
          latest.current.state.equipment.includes("rover_battery");
        if (!hasRover) {
          const parked = this.drawRover(px(4), py(7) + 6);
          parked
            .setSize(64, 64)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
              if (!noMotion.current)
                this.tweens.add({
                  targets: parked,
                  angle: { from: -3, to: 3 },
                  duration: 100,
                  yoyo: true,
                  repeat: 2,
                });
              latest.current.onRover();
            });
        }
        this.route = this.add.graphics();
        this.marker = this.add.graphics();
        (
          Object.entries(mission.map.sites) as [
            SiteId,
            Mission["map"]["sites"][SiteId],
          ][]
        ).forEach(([id, site], index) => {
          this.add
            .text(px(site.x), py(site.y) + 33, site.name, {
              fontFamily: "Nunito Sans, sans-serif",
              fontSize: "14px",
              fontStyle: "bold",
              color: "#fdf3dc",
              backgroundColor: "#263d58",
              padding: { x: 9, y: 5 },
            })
            .setOrigin(0.5, 0)
            .setDepth(12);
          this.add
            .text(px(site.x) - 33, py(site.y) - 42, String(index + 1), {
              fontFamily: "sans-serif",
              fontSize: "13px",
              fontStyle: "bold",
              color: "#fff5de",
              backgroundColor: "#aa512c",
              padding: { x: 6, y: 4 },
            })
            .setOrigin(0.5)
            .setDepth(11);
          this.add
            .zone(px(site.x), py(site.y), 72, 65)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => latest.current.onSelect(id));
        });
        this.astronaut = this.add
          .container(
            px(latest.current.state.position.x),
            py(latest.current.state.position.y),
          )
          .setDepth(20);
        if (hasRover) {
          const rover = this.drawRover(0, 9);
          this.astronaut.add(rover);
          this.astronaut.add(this.drawAstronaut(0, -15, 0.7));
          this.astronaut
            .setSize(64, 74)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => latest.current.onRover());
        } else this.astronaut.add(this.drawAstronaut(0, 0, 1.12));
        this.add.text(23, 20, "N ↑", {
          fontFamily: "sans-serif",
          fontSize: "16px",
          fontStyle: "bold",
          color: "#354c60",
        });
        this.add.text(25, 611, "Imagined Moon terrain · not to scale", {
          fontFamily: "sans-serif",
          fontSize: "12px",
          color: "#354c60",
        });
        this.game.events.on("mission-update", this.sync, this);
        this.events.once("shutdown", () =>
          this.game.events.off("mission-update", this.sync, this),
        );
        this.sync(latest.current.state, latest.current.selected);
      }
      drawAstronaut(x: number, y: number, scale: number) {
        const a = this.add.graphics({ x, y }).setScale(scale);
        a.fillStyle(0x3d3b39, 0.2);
        a.fillEllipse(4, 21, 37, 14);
        a.lineStyle(7, INK);
        a.lineBetween(-7, 7, -8, 20);
        a.lineBetween(7, 7, 9, 20);
        a.lineStyle(5, 0xf4e8ce);
        a.lineBetween(-7, 6, -8, 17);
        a.lineBetween(7, 6, 9, 17);
        a.lineStyle(7, 0xe57e40);
        a.lineBetween(-9, -6, -16, 4);
        a.lineBetween(9, -6, 16, 3);
        a.fillStyle(0x8d9b9c);
        a.fillRoundedRect(-15, -13, 29, 25, 5);
        a.fillStyle(0xf9efd9);
        a.fillRoundedRect(-10, -13, 21, 26, 7);
        a.lineStyle(2, INK);
        a.strokeRoundedRect(-10, -13, 21, 26, 7);
        a.fillStyle(0xed8c43);
        a.fillRect(-10, 3, 21, 5);
        a.fillStyle(0xf8e8c8);
        a.fillCircle(0, -24, 15);
        a.lineStyle(2, INK);
        a.strokeCircle(0, -24, 15);
        a.fillStyle(0x477da4);
        a.fillRoundedRect(-11, -33, 22, 18, 8);
        a.fillStyle(0xdca576);
        a.fillEllipse(0, -23, 15, 16);
        a.fillStyle(0x543b32);
        a.fillEllipse(-1, -29, 15, 9);
        a.fillStyle(INK);
        a.fillCircle(-4, -23, 1.2);
        a.fillCircle(4, -23, 1.2);
        a.lineStyle(1.3, 0x794930);
        a.beginPath();
        a.arc(0, -21, 4, 0.1, Math.PI - 0.1);
        a.strokePath();
        a.fillStyle(0xee8c43);
        a.fillCircle(-14, -24, 5);
        a.fillCircle(14, -24, 5);
        a.fillStyle(0x376c98);
        a.fillRect(-4, -5, 8, 5);
        return a;
      }
      drawHabitat(x: number, y: number) {
        const g = this.add.graphics({ x, y });
        g.fillStyle(0x4d4b47, 0.18);
        g.fillEllipse(12, 21, 112, 49);
        g.fillStyle(0xe8bb7e);
        g.fillRoundedRect(-41, -18, 82, 48, 12);
        g.fillStyle(0xf9edd2);
        g.fillRoundedRect(-43, -34, 82, 48, 12);
        g.lineStyle(3, INK);
        g.strokeRoundedRect(-43, -34, 82, 48, 12);
        g.fillStyle(0x5b8ca5);
        g.fillRoundedRect(-30, -24, 20, 16, 5);
        g.fillRoundedRect(10, -24, 18, 16, 5);
        g.fillStyle(0xd7793c);
        g.fillRoundedRect(-10, -4, 22, 32, 5);
        g.fillStyle(0x314c62);
        g.fillRoundedRect(-5, 0, 12, 24, 3);
        g.lineStyle(4, INK);
        g.lineBetween(-9, 29, -16, 39);
        g.lineBetween(11, 29, 18, 39);
        g.lineBetween(-15, 36, 16, 36);
        g.lineStyle(3, INK);
        g.lineBetween(27, -34, 27, -59);
        g.fillStyle(0xe58443);
        g.fillTriangle(28, -58, 48, -51, 28, -44);
      }
      drawSolar(x: number, y: number) {
        const g = this.add.graphics({ x, y });
        g.lineStyle(5, INK);
        g.lineBetween(0, 5, 0, 28);
        g.lineBetween(-23, 28, 23, 28);
        g.fillStyle(0x366caf);
        g.fillRoundedRect(-42, -28, 84, 38, 3);
        g.lineStyle(3, INK);
        g.strokeRoundedRect(-42, -28, 84, 38, 3);
        g.lineStyle(1.5, 0x9cbce0);
        for (let i = 1; i < 6; i++)
          g.lineBetween(-42 + i * 14, -28, -42 + i * 14, 10);
        g.lineBetween(-42, -9, 42, -9);
        this.arrayLight = this.add
          .circle(x, y + 18, 5, 0xe5823f)
          .setStrokeStyle(2, INK);
      }
      drawRover(x: number, y: number) {
        const container = this.add.container(x, y),
          g = this.add.graphics();
        container.add(g);
        g.fillStyle(0x524a40, 0.2);
        g.fillEllipse(8, 26, 75, 26);
        g.fillStyle(INK);
        for (const rx of [-27, 27])
          for (const ry of [-9, 15]) {
            g.fillRoundedRect(rx - 6, ry - 9, 12, 19, 5);
            g.fillStyle(0xcf985b);
            g.fillCircle(rx, ry, 4);
            g.fillStyle(INK);
          }
        g.fillStyle(0xf3e9cf);
        g.fillRoundedRect(-25, -21, 50, 46, 8);
        g.lineStyle(3, INK);
        g.strokeRoundedRect(-25, -21, 50, 46, 8);
        g.fillStyle(0x417ba5);
        g.fillRoundedRect(-18, -16, 36, 17, 3);
        g.lineStyle(1, 0xb7d0da);
        g.lineBetween(-6, -16, -6, 1);
        g.lineBetween(6, -16, 6, 1);
        g.fillStyle(0xe58541);
        g.fillRect(-24, 11, 48, 8);
        g.fillStyle(0xf6dea0);
        g.fillCircle(-17, 19, 4);
        g.fillCircle(17, 19, 4);
        g.lineStyle(4, INK);
        g.lineBetween(12, -20, 12, -43);
        g.fillStyle(0xf5e3bb);
        g.fillRoundedRect(-1, -50, 29, 17, 6);
        g.lineStyle(2, INK);
        g.strokeRoundedRect(-1, -50, 29, 17, 6);
        g.fillStyle(0x386c87);
        g.fillCircle(8, -42, 5);
        g.fillStyle(0xe58a42);
        g.fillCircle(22, -42, 2);
        return container;
      }
      drawScience(x: number, y: number, shadow: boolean) {
        const g = this.add.graphics({ x, y });
        g.lineStyle(2, 0xf1d6a3, 0.6);
        g.strokeCircle(0, 0, 28);
        g.lineStyle(4, INK);
        g.lineBetween(-1, 17, -1, -27);
        g.fillStyle(shadow ? 0x8860a6 : 0xe78142);
        g.fillTriangle(1, -27, 26, -18, 1, -9);
        g.lineStyle(2, INK);
        g.strokeTriangle(1, -27, 26, -18, 1, -9);
        g.fillStyle(0xc3b58e);
        g.fillTriangle(-24, 15, -13, -3, 3, 15);
        g.lineStyle(2, 0x776958);
        g.strokeTriangle(-24, 15, -13, -3, 3, 15);
      }
      sync(next: MissionState, target: SiteId) {
        if (!this.marker) return;
        const site = mission.map.sites[target];
        this.marker
          .clear()
          .lineStyle(3, 0x285883, 0.95)
          .strokeRoundedRect(px(site.x) - 34, py(site.y) - 38, 68, 70, 12);
        if (next.version === this.lastVersion) return;
        this.lastVersion = next.version;
        this.arrayLight.setFillStyle(
          next.array_status === "repaired" ? 0x5d9d83 : 0xe5823f,
        );
        this.route.clear().lineStyle(3, 0x315e83, 0.65);
        const path = next.last_path;
        for (let i = 1; i < path.length; i++)
          this.route.lineBetween(
            px(path[i - 1][0]),
            py(path[i - 1][1]),
            px(path[i][0]),
            py(path[i][1]),
          );
        this.tweens.killTweensOf(this.astronaut);
        if (noMotion.current || !path.length)
          this.astronaut
            .setPosition(px(next.position.x), py(next.position.y))
            .setAngle(0);
        else
          this.tweens.chain({
            targets: this.astronaut,
            tweens: path.map(([x, y], index) => ({
              x: px(x),
              y: py(y),
              angle: index === path.length - 1 ? 0 : index % 2 ? 2 : -2,
              duration: 100,
              ease: "Sine.easeInOut",
            })),
          });
      }
    }
    let instance: Phaser.Game | null = null;
    const host = parent.current;
    const frame = requestAnimationFrame(() => {
      instance = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        width: 888,
        height: 640,
        transparent: true,
        antialias: true,
        scene: LunarScene,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        audio: { noAudio: true },
        fps: { target: 30 },
        banner: false,
      });
      game.current = instance;
      instance.canvas.setAttribute("aria-hidden", "true");
    });
    return () => {
      cancelAnimationFrame(frame);
      if (instance) {
        instance.canvas.remove();
        instance.destroy(true);
      }
      game.current = null;
    };
  }, [mission]);
  useEffect(() => {
    game.current?.events.emit("mission-update", state, selected);
  }, [state, selected]);
  return (
    <div
      ref={parent}
      className="phaser-container"
      tabIndex={0}
      role="group"
      aria-label="Lunar exploration map. Use arrow keys or WASD to move. Every step consumes supplies. Site destinations are also available in the Plan your next move list."
      onKeyDown={(event) => {
        const direction: Record<string, number[]> = {
          ArrowLeft: [-1, 0],
          a: [-1, 0],
          ArrowRight: [1, 0],
          d: [1, 0],
          ArrowUp: [0, -1],
          w: [0, -1],
          ArrowDown: [0, 1],
          s: [0, 1],
        };
        const d = direction[event.key];
        if (!d) return;
        event.preventDefault();
        if (
          busy ||
          event.repeat ||
          state.status !== "ACTIVE" ||
          !state.inspected
        )
          return;
        onMove({
          kind: "move",
          x: state.position.x + d[0],
          y: state.position.y + d[1],
        });
      }}
    />
  );
}
