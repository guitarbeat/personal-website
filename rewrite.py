import re

with open("src/components/effects/Matrix/NuUhUhEasterEgg.tsx", "r") as f:
    content = f.read()

use_draggable = """
export const useDraggable = (initialZIndex = 9999) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(initialZIndex);
  const containerRef = useRef<HTMLButtonElement>(null);

  // * Generate random position for each instance
  useEffect(() => {
    const randomX = Math.random() * (window.innerWidth - 400) + 100;
    const randomY = Math.random() * (window.innerHeight - 300) + 100;
    setPosition({ x: randomX, y: randomY });
  }, []);

  // * Bring to front on click
  useEffect(() => {
    setZIndex((prev) => prev + 1);
  }, []);

  // * Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".nuuhuh-overlay__content")) {
      setIsDragging(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        // Bring to front
        setZIndex((prev) => prev + 1);
      }
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    },
    [dragOffset.x, dragOffset.y, isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, isDragging]);

  return {
    position,
    isDragging,
    zIndex,
    containerRef,
    handleMouseDown
  };
};
"""

use_audio_playback = """
export const useAudioPlayback = (audioRef: React.RefObject<HTMLAudioElement>) => {
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      return undefined;
    }

    const attemptPlayback = async () => {
      try {
        await audioElement.play();
      } catch (error) {
        console.warn("Audio playback failed", error);
      }
    };

    attemptPlayback();

    return () => {
      audioElement.pause();
      audioElement.currentTime = 0;
    };
  }, [audioRef]);
};
"""

new_component = """
export const NuUhUhEasterEgg = ({ onClose, id: _id }: NuUhUhEasterEggProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { position, isDragging, zIndex, containerRef, handleMouseDown } = useDraggable();

  useAudioPlayback(audioRef);

  return (
"""

pattern_to_replace = """export const NuUhUhEasterEgg = ({ onClose, id: _id }: NuUhUhEasterEggProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(9999);
  const containerRef = useRef<HTMLButtonElement>(null);

  // * Generate random position for each instance
  useEffect(() => {
    const randomX = Math.random() * (window.innerWidth - 400) + 100;
    const randomY = Math.random() * (window.innerHeight - 300) + 100;
    setPosition({ x: randomX, y: randomY });
  }, []);

  // * Bring to front on click
  useEffect(() => {
    setZIndex((prev) => prev + 1);
  }, []);

  // * Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".nuuhuh-overlay__content")) {
      setIsDragging(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        // Bring to front
        setZIndex((prev) => prev + 1);
      }
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    },
    [dragOffset.x, dragOffset.y, isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, isDragging]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      return undefined;
    }

    const attemptPlayback = async () => {
      try {
        await audioElement.play();
      } catch (error) {
        console.warn("Audio playback failed", error);
      }
    };

    attemptPlayback();

    return () => {
      audioElement.pause();
      audioElement.currentTime = 0;
    };
  }, []);

  return ("""


content = content.replace(pattern_to_replace, use_draggable + "\n" + use_audio_playback + "\n" + new_component)

with open("src/components/effects/Matrix/NuUhUhEasterEgg.tsx", "w") as f:
    f.write(content)
