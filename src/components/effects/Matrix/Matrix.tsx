import { cn } from "@/utils/commonUtils";
import { HackTerminal } from "./HackTerminal";
import "./matrix.scss";
import { NuUhUhEasterEgg } from "./NuUhUhEasterEgg";
import { useMatrixSession } from "./useMatrixSession";

interface MatrixProps {
  isVisible: boolean;
  onDismiss?: () => void;
  onMatrixReady?: (callback: (() => void) | null) => void;
}

const Matrix = ({ isVisible, onDismiss, onMatrixReady }: MatrixProps) => {
  const {
    canvasRef,
    matrixRainIntensity,
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
    handleContainerClick,
    easterEggs,
    handleDismissEasterEgg,
  } = useMatrixSession({
    isVisible,
    onDismiss,
    onMatrixReady,
  });

  if (!isVisible) {
    return null;
  }

  return (
    <dialog
      open
      className={cn("matrix-container", isVisible && "visible")}
      onClick={handleContainerClick}
      onKeyDown={(event: React.KeyboardEvent) => {
        if (event.key === "Escape") {
          onDismiss?.();
        }
      }}
      aria-modal="true"
      aria-labelledby="matrix-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        border: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        className="matrix-canvas"
        role="img"
        aria-label="Matrix rain animation"
        style={
          {
            "--matrix-rain-intensity": matrixRainIntensity,
          } as React.CSSProperties
        }
      />
      <HackTerminal
        consoleDisplay={consoleDisplay}
        hackFeedback={hackFeedback}
        hackInputRef={hackInputRef}
        hackProgress={hackProgress}
        handleHackInputChange={handleHackInputChange}
        handleHackKeyDown={handleHackKeyDown}
        handleViewportEngage={handleViewportEngage}
        isHackComplete={isHackComplete}
        showConsoleCursor={showConsoleCursor}
        completionTelemetry={completionTelemetry}
      />
      <button
        type="button"
        className="matrix-close-btn"
        onClick={onDismiss}
        aria-label="Exit Matrix"
      >
        EXIT
      </button>
      {easterEggs.map((eggId) => (
        <NuUhUhEasterEgg
          key={eggId}
          id={eggId}
          onClose={() => handleDismissEasterEgg(eggId)}
        />
      ))}
    </dialog>
  );
};

export default Matrix;
