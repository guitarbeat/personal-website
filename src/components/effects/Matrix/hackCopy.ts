/** Player-facing strings and scripted Console output for the Hack. */

export const INITIAL_FEEDBACK = "Initialize uplink by mashing the keys.";

export const DEFAULT_CONSOLE_PROMPT = [
  "boot> establishing uplink...",
  "boot> calibrating quantum handshake...",
  "",
].join("\n");

export const HACK_COMPLETE_FEEDBACK =
  "Access granted! Hack stabilized. Awaiting extraction command.";

export interface HackCompleteConsoleParams {
  matrixCoordinate: string;
  runtimeDisplay: string;
  timecodeDisplay: string;
  signalGain: number;
  signalChannel: string;
}

export const buildHackCompleteConsole = ({
  matrixCoordinate,
  runtimeDisplay,
  timecodeDisplay,
  signalGain,
  signalChannel,
}: HackCompleteConsoleParams) =>
  [
    "uplink> HANDSHAKE COMPLETE",
    `uplink> channel:${signalChannel} :: gain:${signalGain}dB`,
    `uplink> coordinate locked @ ${matrixCoordinate}`,
    `uplink> runtime ${runtimeDisplay} | timestamp ${timecodeDisplay}Z`,
    "uplink> proceed to next phase...",
    "",
  ].join("\n");

/** Fake terminal session replayed keystroke-by-keystroke as the player mashes. */
export const HACKER_TYPER_CORPUS = [
  "root@matrix:~$ ./initiate_hack.sh",
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
  "[SYSTEM] Hack protocol complete",
  "",
].join("\n");
