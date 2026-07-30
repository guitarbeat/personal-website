# Matrix Component

Matrix-style authentication easter egg with visual effects and session gating. Implementation lives under [`src/components/effects/Matrix/`](../src/components/effects/Matrix/).

## Architecture

- **`Matrix.tsx`** — shell, rain canvas, unlock flow
- **`AuthContext.tsx`** — session state and persistence
- **`constants.ts`** — colors, timing, performance thresholds
- **Hooks** — `useMatrixRain`, `useHackInteraction`, `useHackProgressDecay`, etc.
- **Styles** — scoped partials under `_matrix-*.scss`

## Activation

Click the theme toggle **5 times within 2 seconds**. Session stays unlocked for **24 hours** (session storage).

## Keyboard shortcuts

| Key | Action |
| --- | ------ |
| `ESC` | Exit Matrix |
| `ENTER` | Exit once the channel stabilizes |

## Usage

```tsx
import Matrix from "@/components/effects/Matrix/Matrix";
import { AuthProvider } from "@/components/effects/Matrix/AuthContext";

function App() {
  const [showMatrix, setShowMatrix] = useState(false);

  return (
    <AuthProvider>
      <Matrix isVisible={showMatrix} onSuccess={() => setShowMatrix(false)} />
    </AuthProvider>
  );
}
```

```tsx
import { useAuth } from "@/components/effects/Matrix/AuthContext";

function MyComponent() {
  const { isUnlocked, logout } = useAuth();
  // ...
}
```

## Configuration

All tunables are in `constants.ts` (`MATRIX_COLORS`, `ANIMATION_TIMING`, `PERFORMANCE`). No password env var is required.

## Accessibility and performance

- ARIA labels, keyboard navigation, reduced-motion support
- Frame-limited rain rendering (~60 FPS target)
- Event listener and animation cleanup on unmount

## Browser requirements

Modern evergreen browsers with Canvas, session storage, and ES modules support.
