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

function getPhaseLabel(hackProgress: number): string {
  if (hackProgress < 33) return "PHASE 1 // HACKING";
  if (hackProgress < 66) return "PHASE 2 // DECRYPTING";
  if (hackProgress < 100) return "PHASE 3 // ESCALATING";
  return "ACCESS GRANTED";
}

function getChannelLabel(hackProgress: number): string {
  if (hackProgress >= 100) return "SYSTEM READY";
  if (hackProgress < 33) return "CHANNEL LOCKED";
  if (hackProgress < 66) return "DECRYPTING";
  return "CHANNEL OPEN";
}

function getFillClassName(hackProgress: number): string {
  if (hackProgress < 33) return "is-critical";
  if (hackProgress < 66) return "is-amber";
  return "is-phosphor";
}

function getLineClassName(line: string): string {
  let className = "hack-line";
  if (line.includes("[ERR]") || line.includes("failed")) className += " error";
  else if (line.includes("[WARN]")) className += " warn";
  else if (line.includes("[SUCCESS]") || line.includes("[OK]"))
    className += " success";
  else if (line.startsWith("thumb@sys") || line.startsWith("root@"))
    className += " prompt";
  return className;
}

function HackTerminalStatus({
  phaseLabel,
  channelLabel,
}: {
  phaseLabel: string;
  channelLabel: string;
}) {
  return (
    <header className="hack-terminal-status">
      <span className="hack-terminal-status__phase">{phaseLabel}</span>
      <span className="hack-terminal-status__channel">{channelLabel}</span>
    </header>
  );
}

function HackSequencer({
  isHackComplete,
  hackProgress,
  hackFeedback,
  progressScale,
}: {
  isHackComplete: boolean;
  hackProgress: number;
  hackFeedback: string;
  progressScale: number;
}) {
  return (
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
          className={cn("hack-sequencer__fill", getFillClassName(hackProgress))}
          style={{ transform: `scaleX(${progressScale})` }}
        />
      </div>
      <p className="hack-sequencer__feedback">{hackFeedback}</p>
    </div>
  );
}

function HackViewport({
  isHackComplete,
  consoleDisplay,
  showConsoleCursor,
  completionTelemetry,
  handleViewportEngage,
}: {
  isHackComplete: boolean;
  consoleDisplay: string;
  showConsoleCursor: boolean;
  completionTelemetry: HackCompleteConsoleParams | null;
  handleViewportEngage: () => void;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: viewport layout uses role=button
    <div
      className={cn("hack-input__viewport", isHackComplete && "complete")}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") handleViewportEngage();
      }}
      onMouseDown={handleViewportEngage}
      onTouchStart={handleViewportEngage}
    >
      <div className="hack-input__stream" aria-hidden="true">
        {consoleDisplay.split("\n").map((line, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: log lines are append-only
          <div key={index} className={getLineClassName(line)}>
            {line}
          </div>
        ))}
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
  );
}

function HackInput({
  hackInputRef,
  handleHackKeyDown,
  handleHackInputChange,
  isHackComplete,
}: {
  hackInputRef: React.RefObject<HTMLInputElement | null>;
  handleHackKeyDown: (event: React.KeyboardEvent) => void;
  handleHackInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isHackComplete: boolean;
}) {
  return (
    <>
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
    </>
  );
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
  const phaseLabel = getPhaseLabel(hackProgress);
  const channelLabel = getChannelLabel(hackProgress);
  const progressScale = Math.min(1, Math.max(0, hackProgress / 100));

  return (
    <div className={cn("hack-terminal", isHackComplete && "complete")}>
      <HackTerminalStatus phaseLabel={phaseLabel} channelLabel={channelLabel} />
      <HackSequencer
        isHackComplete={isHackComplete}
        hackProgress={hackProgress}
        hackFeedback={hackFeedback}
        progressScale={progressScale}
      />
      <HackViewport
        isHackComplete={isHackComplete}
        consoleDisplay={consoleDisplay}
        showConsoleCursor={showConsoleCursor}
        completionTelemetry={completionTelemetry}
        handleViewportEngage={handleViewportEngage}
      />
      <HackInput
        hackInputRef={hackInputRef}
        handleHackKeyDown={handleHackKeyDown}
        handleHackInputChange={handleHackInputChange}
        isHackComplete={isHackComplete}
      />
    </div>
  );
}
