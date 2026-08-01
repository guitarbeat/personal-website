# Domain Glossary

Canonical terms for this project. Implementation details live in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [AGENTS.md](AGENTS.md).

## Architecture map

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for dev/build flows, app module boundaries, Notion request path, and Sass layering.

## Language

### Styling

**Design token bridge**:
Sass token maps compiled into runtime CSS custom properties (for example theme switching and semantic color variables).

**Enhanced tokens**:
Secondary Sass token maps consumed by `enhanced/*` style partials, distinct from core tokens under `sass/tokens/`. Runtime CSS custom properties for enhanced tokens are emitted through the design token bridge (see `docs/adr/0001-enhanced-css-variables-in-token-bridge.md`).

**In-place compression**:
Image optimization that overwrites JPEG/PNG source files under `src/assets/images/` with no separate output subfolder.

### Matrix overlay

**Shell**:
The full-screen overlay hosting the Hack: darkened backdrop and digital rain, sitting behind the Terminal.
_Avoid_: modal, backdrop, container

**Terminal**:
The simulated CRT at the centre of the Shell — bezel, curved glass, phosphor bloom, and the progress meter.
_Avoid_: panel, frame, screen, monitor

**Console**:
The scrolling scripted text inside the Terminal.
_Avoid_: stream, log, output, readout

**Hack**:
The keyboard-mashing minigame the Shell presents, and the act it depicts. Completing one triggers an Unlock.
_Avoid_: breach, override, intrusion

**Attempt**:
One playthrough of the Hack, beginning when the Shell opens and ending at completion or dismissal. Never persists; reopening the Shell discards it.
_Avoid_: session, run, playthrough

**Hack progress**:
The 0–100 measure of how close an Attempt is to completing, shown by the Terminal's meter. The only quantity the Hack tracks.
_Avoid_: signal strength, gain, uplink status — radio vocabulary in the Console is decorative and measures nothing

**Hack complete**:
The moment an Attempt reaches 100 and the Terminal shows ACCESS GRANTED. Distinct from the Unlock that follows it after a deliberate delay.
_Avoid_: success, access granted, access secured, finalize

**Unlock**:
The presentation state in which the site drops its blur and reveals its full styling. A themed reveal, never a security boundary — every gated thing ships to the client regardless of unlock state.
_Avoid_: authentication, auth, login, sign-in, access control, security

**Unlock window**:
The bounded period for which an Unlock persists before lapsing back to the blurred state.
_Avoid_: session, auth session, session duration
