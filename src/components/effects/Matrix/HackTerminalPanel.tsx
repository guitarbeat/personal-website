import { cn } from "@/utils/commonUtils";
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
  const phaseLabel =
    hackProgress < 33
      ? "PHASE 1 // BREACHING"
      : hackProgress < 66
        ? "PHASE 2 // DECRYPTING"
        : hackProgress < 100
          ? "PHASE 3 // OVERRIDING"
          : "ACCESS GRANTED";

  const channelLabel =
    hackProgress < 100
      ? hackProgress < 33
        ? "CHANNEL LOCKED"
        : hackProgress < 66
          ? "DECRYPTING"
          : "CHANNEL OPEN"
      : "SYSTEM READY";

  return (
    <div className={cn("hack-terminal", isHackingComplete && "complete")}>
      <header className="hack-terminal-status">
        <span className="hack-terminal-status__phase">{phaseLabel}</span>
        <span className="hack-terminal-status__channel">{channelLabel}</span>
      </header>

      <div className="hack-sequencer">
        <div className="hack-sequencer__header">
          <span className="hack-sequencer__title">
            {isHackingComplete ? "Access secured" : "Hack in progress"}
          </span>
          <span className="hack-sequencer__percentage">
            {Math.round(hackProgress)}%
          </span>
        </div>
        <div className="hack-sequencer__bar">
          <div
            className={cn(
              "hack-sequencer__fill",
              hackProgress < 33
                ? "is-critical"
                : hackProgress < 66
                  ? "is-amber"
                  : "is-phosphor",
            )}
            style={{ width: `${hackProgress}%` }}
          />
        </div>
        <p className="hack-sequencer__feedback">{hackFeedback}</p>
      </div>

      {/* biome-ignore lint/a11y/useSemanticElements: viewport layout uses role=button */}
      <div
        className={cn("hack-input__viewport", isHackingComplete && "complete")}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ")
            handleViewportEngage();
        }}
        onMouseDown={handleViewportEngage}
        onTouchStart={handleViewportEngage}
      >
        <div className="hack-input__stream" aria-hidden="true">
          {consoleDisplay.split("\n").map((line, index) => {
            let className = "hack-line";
            if (line.includes("[ERR]") || line.includes("failed"))
              className += " error";
            else if (line.includes("[WARN]")) className += " warn";
            else if (line.includes("[SUCCESS]") || line.includes("[OK]"))
              className += " success";
            else if (line.startsWith("thumb@sys") || line.startsWith("root@"))
              className += " prompt";

            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: log lines are append-only
              <div key={index} className={className}>
                {line}
              </div>
            );
          })}
          {showConsoleCursor && <span className="hack-input__cursor" />}
        </div>
        {isHackingComplete && successTelemetry && (
          <output className="hack-success" aria-live="assertive">
            <span className="hack-success__title">ACCESS GRANTED</span>
            <span className="hack-success__meta">
              Channel {successTelemetry.signalChannel} ·{" "}
              {successTelemetry.runtimeDisplay}
            </span>
            <span className="hack-success__cta">&gt; PRESS ENTER OR ESC</span>
          </output>
        )}
      </div>

      <input
        type="text"
        ref={hackInputRef}
        onKeyDown={handleHackKeyDown}
        onChange={handleHackInputChange}
        className="hack-input__field"
        disabled={isHackingComplete}
        aria-label="Mash the keys to amplify the breach"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-describedby="hack-input-helper"
      />
      <div
        className="hack-input__helper"
        aria-hidden="true"
        id="hack-input-helper"
      >
        {isHackingComplete
          ? "Channel stabilized"
          : "Keep mashing to stabilize the signal"}
      </div>
    </div>
  );
}
