import { cn } from "../../../utils/commonUtils";
import type { SuccessConsoleParams } from "./matrixSessionCopy";

interface HackTerminalPanelProps {
  consoleDisplay: string;
  hackFeedback: string;
  hackInputRef: React.RefObject<HTMLInputElement | null>;
  hackProgress: number;
  handleHackInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleHackKeyDown: (event: React.KeyboardEvent) => void;
  handleViewportEngage: () => void;
  isHackingComplete: boolean;
  showConsoleCursor: boolean;
  successTelemetry: SuccessConsoleParams | null;
}

export function HackTerminalPanel({
  consoleDisplay,
  hackFeedback,
  hackInputRef,
  hackProgress,
  handleHackInputChange,
  handleHackKeyDown,
  handleViewportEngage,
  isHackingComplete,
  showConsoleCursor,
  successTelemetry,
}: HackTerminalPanelProps) {
  return (
    <div className="hack-terminal-frame">
      <div className="hack-terminal-titlebar">
        <div className="hack-terminal-titlebar__label">
          {hackProgress < 33
            ? "PHASE 1: FIREWALL PENETRATION // BREACHING..."
            : hackProgress < 66
              ? "PHASE 2: DECRYPTING SECURE HANDSHAKE..."
              : hackProgress < 100
                ? "PHASE 3: OVERRIDING CORE KERNEL..."
                : "ACCESS GRANTED // SYSTEM UNLOCKED"}
        </div>
        <div style={{ fontSize: "0.65rem", opacity: 0.6 }}>
          {hackProgress < 100
            ? `SECURE CHANNEL: ${hackProgress < 33 ? "LOCKED" : hackProgress < 66 ? "DECRYPTING" : "OPEN"}`
            : "SYSTEM READY"}
        </div>
      </div>
      <div className="hack-terminal-screen">
        <div className="matrix-console-grid">
          <div
            className={cn("hack-input-panel", isHackingComplete && "complete")}
          >
            <div className="hack-sequencer">
              <div className="hack-sequencer__header">
                <span className="hack-sequencer__spacer" aria-hidden="true">
                  {Math.round(hackProgress)}%
                </span>
                <span className="hack-sequencer__title">
                  {isHackingComplete ? "Access secured" : "Hack in progress"}
                </span>
                <span className="hack-sequencer__percentage">
                  {Math.round(hackProgress)}%
                </span>
              </div>
              <div className="hack-sequencer__bar">
                <div
                  className="hack-sequencer__fill"
                  style={{
                    width: `${hackProgress}%`,
                    backgroundColor:
                      hackProgress < 33
                        ? "#ff3333"
                        : hackProgress < 66
                          ? "#ffaa00"
                          : "var(--matrix-primary)",
                  }}
                />
              </div>
              <p className="hack-sequencer__feedback">{hackFeedback}</p>
            </div>
            {/* biome-ignore lint/a11y/useSemanticElements: viewport layout uses role=button */}
            <div
              className="hack-input-viewport"
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ")
                  handleViewportEngage();
              }}
              onMouseDown={handleViewportEngage}
              onTouchStart={handleViewportEngage}
            >
              <div className="hack-input-stream" aria-hidden="true">
                {consoleDisplay.split("\n").map((line, index) => {
                  let className = "hack-line";
                  if (line.includes("[ERR]") || line.includes("failed"))
                    className += " error";
                  else if (line.includes("[WARN]")) className += " warn";
                  else if (line.includes("[SUCCESS]") || line.includes("[OK]"))
                    className += " success";
                  else if (
                    line.startsWith("thumb@sys") ||
                    line.startsWith("root@")
                  )
                    className += " prompt";

                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: log lines are append-only
                    <div key={index} className={className}>
                      {line}
                    </div>
                  );
                })}
                {showConsoleCursor && <span className="hack-input-cursor" />}
              </div>
              {isHackingComplete && successTelemetry && (
                <output className="hack-input-success" aria-live="assertive">
                  <span className="hack-input-success__title">
                    ACCESS GRANTED
                  </span>
                  <span className="hack-input-success__meta">
                    Channel {successTelemetry.signalChannel} ·{" "}
                    {successTelemetry.runtimeDisplay}
                  </span>
                  <span className="hack-input-success__cta">
                    Press ENTER or ESC to exit
                  </span>
                </output>
              )}
            </div>
            <input
              type="text"
              ref={hackInputRef}
              onKeyDown={handleHackKeyDown}
              onChange={handleHackInputChange}
              className="hack-input-field"
              disabled={isHackingComplete}
              aria-label="Mash the keys to amplify the breach"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-describedby="hack-input-helper"
            />
            <div
              className="hack-input-helper"
              aria-hidden="true"
              id="hack-input-helper"
            >
              {isHackingComplete
                ? "Channel stabilized"
                : "Keep mashing to stabilize the signal"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
