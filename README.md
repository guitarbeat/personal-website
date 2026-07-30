# Personal Website

This is a personal website designed to highlight my work and experience. The site currently focuses on four primary sections—Header, About, Projects, and Work—that present a concise overview of who I am, what I build, and how I work.

The website is built with React, Sass, and modern JavaScript. Its layout emphasizes clarity and polish so visitors can quickly explore the featured sections and learn more about my background.

## Features

- Responsive layout optimized for both mobile and desktop viewing
- Hero-style header with social links, a theme toggle, and quick navigation
- About section with a concise biography and supplemental media embeds
- Projects grid that spotlights selected work with dynamic tag styling
- Work timeline outlining professional experience and key achievements
- Back to top button and sticky navigation for smooth browsing

## How to Use

Visit the live site on any device to explore the content. The navigation bar and in-page anchor links let you jump directly to the Header, About, Projects, and Work sections. Use the theme toggle in the header to switch between light and dark modes, and the floating back-to-top button to quickly return to the top of the page.

## Future Plans

Upcoming improvements include expanding the showcased projects, refining the work timeline with additional context, and introducing new interactive elements that complement the existing sections.

## Documentation

Detailed technical documentation, design specifications, and migration plans are available in the [docs/](docs/) folder:

- [Changelog](CHANGELOG.md) – Release history (current: v0.1.1).
- [Notion Integration](docs/NOTION_INTEGRATION.md) – Comprehensive guide for the Google Sheets to Notion migration.
- [Code Audit Report](docs/CODE_AUDIT_REPORT.md) – Security and quality analysis of the codebase.
- [Development Notes](docs/DEVELOPMENT_NOTES.md) – Technical notes and refactoring opportunities.
- [Archive](docs/archive/) – Historical implementation debates and analyses.

## Development Notes

- Run `./scripts/setup.sh` after cloning to install dependencies.
- Run `pnpm run compress-images` to compress JPEG/PNG files in place under `src/assets/images/`.
- A pre-commit hook runs this command automatically.
- Consider using Git LFS for large image files.
- [Vercel Analytics](https://vercel.com/docs/analytics/quickstart) and [Speed Insights](https://vercel.com/docs/speed-insights/quickstart) are included in the app bundle and activate automatically on Vercel deployments (enable each in the project dashboard).

## Project Structure

### Directory Overview

| Directory                  | Description                          | Key files                                              |
| -------------------------- | ------------------------------------ | ------------------------------------------------------ |
| `/docs`                    | Technical documentation and archives | `NOTION_INTEGRATION.md`, `DEVELOPMENT_NOTES.md`        |
| `/src`                     | TypeScript/React application source  | `App.tsx`, `index.tsx`                                 |
| `/src/components/content`  | Page sections                        | `About/`, `Header/`, `NavBar/`, `Projects/`, `Work/`   |
| `/src/components/effects`  | Visual effects                       | `Matrix/`, `Moire/`, `Blur/`, `Loading/`               |
| `/src/server/notion`       | Notion content API modules           | `api.js`, `snapshot.js`, `validate.js`                 |
| `/src/hooks`               | Custom React hooks                   | `useMobileDetection.ts`, `useScrollUtils.ts`           |
| `/src/utils`               | Shared utilities                     | `commonUtils.ts`, `audioUtils.ts`, `colorUtils.ts`     |
| `/api`                     | Vercel serverless routes             | `content.js`, `health.js`                              |
| `/config`                  | Shared configuration                 | `notion.json`                                          |
| `/public`                  | Static assets served as-is           | `index.html`                                           |

### Build outputs

| Path       | Tool                          | Used for                |
| ---------- | ----------------------------- | ----------------------- |
| `build/`   | CRACO (`pnpm run build`)      | GitHub Pages deploy     |
| `dist/`    | Vite (`pnpm run build:dev`)   | CI and Lighthouse       |

See [AGENTS.md](AGENTS.md) for the full command reference.

## Analysis Tools

- **Motion blur**: Toggle via `.motion-blur-on` and `.motion-blur-off` utility classes in [`src/sass/base/_utilities.scss`](src/sass/base/_utilities.scss).

---

## Component Documentation

### Matrix Component

A sophisticated Matrix-style authentication system with enhanced visual effects and security features. This component has been refactored to eliminate inconsistencies and improve maintainability.

#### Recent Improvements

##### 🔧 **Code Quality Enhancements**

- **Consolidated Color System**: Single source of truth for all color definitions
- **Standardized Animations**: Consistent timing using CSS custom properties
- **Organized CSS**: Removed duplicate rules and improved structure
- **Consistent Z-Index Scale**: Proper layering system (1000s for overlays, 2000s for modals)
- **Extracted Constants**: All magic numbers moved to centralized constants file
- **Standardized Error Handling**: Consistent error patterns across all functions
- **Improved Cleanup**: Proper cleanup of all event listeners and animations
- **Aligned Performance Detection**: Consistent breakpoints between CSS and JavaScript

#### Matrix Features

##### 🎨 Visual Enhancements

- **Enhanced Matrix Rain Effect**: Improved character trails, better gradients, and smoother animations
- **Performance Optimized**: Frame rate limiting and efficient rendering
- **Accessibility**: ARIA labels, keyboard navigation, and high contrast support
- **Responsive Design**: Optimized for mobile and desktop devices

##### 🔐 Security Features

- **Session Management**: Secure session persistence with automatic expiration
- **Interactive Unlock Flow**: Authentication gated behind sustained input momentum
- **Progress Decay**: Idle sessions automatically roll back hack progress

##### ⌨️ User Experience

- **Keyboard Shortcuts**:
  - `ESC`: Exit Matrix
  - `ENTER`: Exit once the channel stabilizes
- **Visual Feedback**: Enhanced success animations
- **Logout Functionality**: Secure logout with session cleanup

##### 🎯 Easter Egg Activation

- **Theme Click Sequence**: Click the theme toggle 5 times within 2 seconds to activate
- **Session Persistence**: Stays unlocked for 24 hours

#### Configuration

##### Environment Variables

No authentication password environment variable is required for the Matrix console.

##### Constants File

All configuration is centralized in `constants.ts`:

```typescript
import { MATRIX_COLORS, ANIMATION_TIMING, PERFORMANCE } from "./constants";
```

##### Rate Limiting Settings

- **Max Attempts**: 5 attempts per window
- **Window Duration**: 15 minutes
- **Lockout Duration**: 30 minutes

##### Session Settings

- **Session Duration**: 24 hours
- **Storage**: Session storage (cleared on browser close)

#### Usage

##### Basic Implementation

```jsx
import Matrix from './components/effects/Matrix/Matrix';
import { AuthProvider } from './components/effects/Matrix/AuthContext';

function App() {
  const [showMatrix, setShowMatrix] = useState(false);
  
  return (
    <AuthProvider>
      <Matrix 
        isVisible={showMatrix} 
        onSuccess={() => setShowMatrix(false)} 
      />
    </AuthProvider>
  );
}
```

##### Authentication Hook

```jsx
import { useAuth } from './components/effects/Matrix/AuthContext';

function MyComponent() {
  const { isUnlocked, logout } = useAuth();

  return (
    <div>
      {isUnlocked ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <p>Authenticate through the Matrix console.</p>
      )}
    </div>
  );
}
```

#### Accessibility

- **Screen Reader Support**: Proper ARIA labels and roles
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast Mode**: Enhanced visibility for accessibility
- **Reduced Motion**: Respects user motion preferences

#### Performance

- **Optimized Rendering**: 60 FPS target with frame limiting
- **Memory Management**: Proper cleanup of event listeners and animations
- **Efficient Updates**: Minimal re-renders with useCallback optimization

#### Security Considerations

- **No Password Logging**: Passwords are never logged or stored in plain text
- **Session Security**: Secure session storage with automatic expiration
- **Rate Limiting**: Protection against brute force attacks
- **Input Sanitization**: Proper input validation and trimming

#### Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Canvas Support**: Required for Matrix rain effect
- **Session Storage**: Required for session management
- **ES6+ Features**: Required for React hooks and modern JavaScript
