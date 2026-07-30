export const PROGRESS_DECAY_INTERVAL = 140;
export const PROGRESS_DECAY_BASE = 0.5; // Increased from 0.18
export const PROGRESS_DECAY_RAMP = [
  { threshold: 2600, value: 1.2 }, // Increased from 0.92
  { threshold: 1900, value: 0.9 }, // Increased from 0.64
  { threshold: 1300, value: 0.65 }, // Increased from 0.4
  { threshold: 900, value: 0.45 }, // Increased from 0.26
];
export const MIN_IDLE_BEFORE_DECAY = 300; // Reduced from 480
export const KEY_VARIETY_WINDOW = 12;
export const REPETITION_DECAY_RESET_MS = 650;

export const INITIAL_FEEDBACK = "Initialize uplink by mashing the keys.";

export const DEFAULT_CONSOLE_PROMPT = [
  "boot> establishing uplink...",
  "boot> calibrating quantum handshake...",
  "",
].join("\n");

export const SUCCESS_FEEDBACK_MESSAGE =
  "Access granted! Breach stabilized. Awaiting extraction command.";

export interface SuccessConsoleParams {
  matrixCoordinate: string;
  runtimeDisplay: string;
  timecodeDisplay: string;
  signalGain: number;
  signalChannel: string;
}

export const buildSuccessConsoleReadout = ({
  matrixCoordinate,
  runtimeDisplay,
  timecodeDisplay,
  signalGain,
  signalChannel,
}: SuccessConsoleParams) =>
  [
    "uplink> AUTH HANDSHAKE COMPLETE",
    `uplink> channel:${signalChannel} :: gain:${signalGain}dB`,
    `uplink> coordinate locked @ ${matrixCoordinate}`,
    `uplink> runtime ${runtimeDisplay} | timestamp ${timecodeDisplay}Z`,
    "uplink> proceed to next phase...",
    "",
  ].join("\n");

// * --------------------------------------------------------------------------------
// * Audio Helpers
// * --------------------------------------------------------------------------------

export const HACKER_TYPER_CORPUS = [
  "root@matrix:~$ ./initiate_breach.sh",
  "[INFO] Initializing quantum handshake protocol...",
  "[OK] Connection established to matrix-core",
  "",
  "root@matrix:~$ protocol uplink::handshake(){",
  "  const session = quantum.session();",
  "  session.align({ axis: 'theta', variance: 0.016 });",
  "  if (!session.locked()) {",
  "    session.inject('entropy:sync');",
  "  }",
  "  bridge.route('matrix-core').prime();",
  "  const cipher = session.cipher.swap('xor:phase');",
  "  return cipher.vectorize();",
  "}",
  "[SUCCESS] Handshake protocol compiled",
  "",
  "root@matrix:~$ const uplink = protocol.uplink::handshake();",
  "[INFO] Establishing uplink connection...",
  "uplink.emit('pulse', { gain: 0.87 });",
  "[WARN] Firewall detected at layer 3, initiating bypass...",
  "uplink.relay('ghost-net', packet => {",
  "  packet.tune({ drift: 'subspace' });",
  "  packet.write('ACCESS_CHANNEL++');",
  "  return packet.trace();",
  "});",
  "[OK] Bypass successful, firewall disabled",
  "",
  "root@matrix:~$ for (let shard = 0; shard < 64; shard += 1) {",
  "  uplink.overclock(shard, flux => flux.fold());",
  "}",
  "[INFO] Overclocking shards... [████████████████] 100%",
  "[SUCCESS] All 64 shards synchronized",
  "",
  "root@matrix:~$ const watchdog = matrix.daemon('sentinel');",
  "[INFO] Spawning watchdog daemon...",
  "watchdog.listen(({ vector, checksum }) => {",
  "  if (!matrix.verify(checksum)) {",
  "    return watchdog.raise('spoof-detected');",
  "  }",
  "  return vector.stabilize();",
  "});",
  "[OK] Watchdog daemon active (PID: 7331)",
  "",
  "root@matrix:~$ uplink.merge(watchdog).commit();",
  "[INFO] Merging uplink with watchdog...",
  "[SUCCESS] Merge complete, committing changes",
  "root@matrix:~$ matrix.core.flush();",
  "[OK] Core buffer flushed",
  "[SYSTEM] Breach protocol complete",
  "",
].join("\n");

export const MAX_DISPLAY_LENGTH = 1400;
