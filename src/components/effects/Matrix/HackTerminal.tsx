import { cn } from "@/utils/commonUtils";
import type { HackCompleteConsoleParams } from "./hackCopy";

interface HackTerminalProps {
  consoleDisplay: string;
  hackFeedback: string;
  hackInputRef: React.RefObject<HTMLInputElement | null>;
  hackProgress: number;
  handleHackInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleHackKeyDown: (event: React.KeyboardEvent) => void;
  handleViewportEngage: () => void;
  isHackComplete: boolean;
  showConsoleCursor: boolean;
  completionTelemetry: HackCompleteConsoleParams | null;
}

export function HackTerminal({
  consoleDisplay,
  hackFeedback,
  hackInputRef,
  hackProgress,
  handleHackInputChange,
  handleHackKeyDown,
  handleViewportEngage,
  isHackComplete,
  showConsoleCursor,
  completionTelemetry,
}: HackTerminalProps) {
  const phaseLabel =
    hackProgress < 33
      ? "PHASE 1 // HACKING"
      : hackProgress < 66
        ? "PHASE 2 // DECRYPTING"
        : hackProgress < 100
          ? "PHASE 3 // ESCALATING"
          : "ACCESS GRANTED";

  const progressScale = Math.min(1, Math.max(0, hackProgress / 100));

  const channelLabel =
    hackProgress < 100
      ? hackProgress < 33
        ? "CHANNEL LOCKED"
        : hackProgress < 66
          ? "DECRYPTING"
          : "CHANNEL OPEN"
      : "SYSTEM READY";

  return (
    <div className={cn("hack-terminal", isHackComplete && "complete")}>
      <header className="hack-terminal-status">
        <span className="hack-terminal-status__phase">{phaseLabel}</span>
        <span className="hack-terminal-status__channel">{channelLabel}</span>
      </header>

      <div className="hack-sequencer">
        <div className="hack-sequencer__header">
          <span className="hack-sequencer__title">
            {isHackComplete ? "Hack complete" : "Hack in progress"}
          </span>
          <span className="hack-sequencer__percentage">
            {Math.round(hackProgress)}%
          </span>
        </div>
        <div
          className="hack-sequencer__bar"
          role="progressbar"
          aria-valuenow={Math.round(hackProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="hack-sequencer__surge"
            style={{ transform: `scaleX(${progressScale})` }}
          />
          <div
            className={cn(
              "hack-sequencer__fill",
              hackProgress < 33
                ? "is-critical"
                : hackProgress < 66
                  ? "is-amber"
                  : "is-phosphor",
            )}
            style={{ transform: `scaleX(${progressScale})` }}
          />
        </div>
        <p className="hack-sequencer__feedback">{hackFeedback}</p>
      </div>

      {/* biome-ignore lint/a11y/useSemanticElements: viewport layout uses role=button */}
      <div
        className={cn("hack-input__viewport", isHackComplete && "complete")}
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
        {isHackComplete && completionTelemetry && (
          <output className="hack-success" aria-live="assertive">
            <span className="hack-success__title">ACCESS GRANTED</span>
            <span className="hack-success__meta">
              Channel {completionTelemetry.signalChannel} ·{" "}
              {completionTelemetry.runtimeDisplay}
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
        disabled={isHackComplete}
        aria-label="Mash the keys to advance the hack"
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
        {isHackComplete
          ? "Channel stabilized"
          : "Keep mashing to stabilize the signal"}
      </div>
    </div>
  );
}
