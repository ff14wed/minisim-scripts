/**
 * @format
 * @import * as api from "../../minisim.d.ts"
 */

// --- TIMING CONSTANTS (Milliseconds) ---
const STEP_INTERVAL = 1500;
const BOSS_CONAL_DELAY = 4900; // 294 frames between Orbital Omen end and Fire and Fury start
const SNAPSHOT_DELAY = 5600; // Adjusted for precision

// Durations
const TELEGRAPH_DURATION = 7300; // From appearance to expiration
const EXPLOSION_VISUAL_DELAY = 667; // Delay from snapshot to visual start (cast end)
const EXPLOSION_VISUAL_DURATION = 1000; // Duration of the visual explosion AoE (approx 60 frames)

// =============================================================================
// Public exports
// =============================================================================

/**
 * The name of the encounter.
 * @type {string}
 */
const ENCOUNTER_NAME = "M11S Orbital Omen";

/**
 * The arena for the encounter.
 * @type {api.Arena}
 */
const ARENA = api.Arena.M11SavageA;

/**
 * Returns a list of (Role, Initial Position) pairs for the encounter.
 * @returns {api.RolePosition[]}
 */
function role_positions() {
  return [
    api.RolePosition.new(
      api.Role.Tank1,
      api.Transform2D.new_from_pos(api.mvec2(0, 5))
    ),
  ];
}

/**
 * Returns a list of used status effect IDs for the encounter.
 * @returns {number[]}
 */
function used_status_effect_ids() {
  return [];
}

/**
 * Asynchronous function that runs the encounter.
 * @param {api.EncounterCommands} commands
 */
async function run(commands) {
  // Spawn the boss at the center
  await commands
    .enemy_sprite(1.5)
    .with_transform(api.Transform2D.new())
    .spawn();
  await commands
    .targeting_ring(5.0)
    .with_transform(api.Transform2D.new())
    .spawn();

  // Shuffle positions for columns (X) and rows (Y).
  // The second set (index 1) is guaranteed to be an intersection of two inner lines.
  const xPositions = generateSetPositions(commands);
  const yPositions = generateSetPositions(commands);

  // Orbital Omen cast (2 seconds)
  await commands.cast("Orbital Omen", 2000);
  await commands.sleep_duration(2000);

  // Start boss conals chain in parallel
  fireAndFuryConals(commands);

  // Initial delay before first set of telegraphs appears
  await commands.sleep_duration(3333);

  for (let i = 0; i < 4; i++) {
    // Show telegraph lines
    spawnLineSet(commands, xPositions[i], yPositions[i]);

    // Resolve explosion snapshots
    executeStepResolution(commands, xPositions[i], yPositions[i]);

    if (i < 3) {
      await commands.sleep_duration(STEP_INTERVAL);
    }
  }

  await commands.sleep_until(21000);
  commands.finish_encounter();
}

// Export the public interface for this encounter script.
globalThis.exports = {
  ENCOUNTER_NAME,
  ARENA,
  role_positions,
  used_status_effect_ids,
  run,
};

// =============================================================================
// Private functions
// =============================================================================

/**
 * Manages the resolution phase of a single set (snapshot -> explosion visuals).
 * @param {api.EncounterCommands} commands
 * @param {number} x
 * @param {number} y
 */
async function executeStepResolution(commands, x, y) {
  // Wait until it's time for the snapshot (relative to appearance)
  await commands.sleep_duration(SNAPSHOT_DELAY);
  executeExplosionSnapshot(commands, x, y);
}

/**
 * Spawns the thin white telegraph lines.
 * @param {api.EncounterCommands} commands
 * @param {number} x
 * @param {number} y
 */
async function spawnLineSet(commands, x, y) {
  // Vertical line: Start at north edge (x, -20) and point south (PI)
  const vLine = commands
    .telegraph(api.Shape.rectangle(0.2, 40))
    .with_transform(
      api.Transform2D.new_from_pos(api.mvec2(x, -20)).with_angle(Math.PI)
    )
    .with_color(0xffffff, 0.4)
    .with_duration(TELEGRAPH_DURATION)
    .spawn();

  // Horizontal line: Start at east edge (20, y) and point west (PI/2)
  const hLine = commands
    .telegraph(api.Shape.rectangle(0.2, 40))
    .with_transform(
      api.Transform2D.new_from_pos(api.mvec2(20, y)).with_angle(Math.PI / 2)
    )
    .with_color(0xffffff, 0.4)
    .with_duration(TELEGRAPH_DURATION)
    .spawn();

  await Promise.all([vLine, hLine]);
}

/**
 * Executes the mechanics snapshot and schedules the visual explosion.
 * @param {api.EncounterCommands} commands
 * @param {number} x
 * @param {number} y
 */
async function executeExplosionSnapshot(commands, x, y) {
  const shape = api.Shape.rectangle(10, 40);
  const vTransform = api.Transform2D.new_from_pos(api.mvec2(x, -20)).with_angle(
    Math.PI
  );
  const hTransform = api.Transform2D.new_from_pos(api.mvec2(20, y)).with_angle(
    Math.PI / 2
  );

  // 1. Snapshot damage immediately
  const vSnapshot = await commands.role_positions_snapshot(shape, vTransform);
  const hSnapshot = await commands.role_positions_snapshot(shape, hTransform);

  const hitRoles = new Set();
  vSnapshot.forEach((s) => hitRoles.add(s.role));
  hSnapshot.forEach((s) => hitRoles.add(s.role));
  hitRoles.forEach((role) => commands.apply_damage(role, 1.0));

  // 2. Schedule the visual explosion after the delay
  await commands.sleep_duration(EXPLOSION_VISUAL_DELAY);
  const vAoE = commands
    .aoe(shape)
    .with_transform(vTransform)
    .with_color(0xff8400, 0.6)
    .with_duration(EXPLOSION_VISUAL_DURATION)
    .spawn();
  const hAoE = commands
    .aoe(shape)
    .with_transform(hTransform)
    .with_color(0xff8400, 0.6)
    .with_duration(EXPLOSION_VISUAL_DURATION)
    .spawn();

  await Promise.all([vAoE, hAoE]);
}

/**
 * Executes the boss conal snapshot after a certain delay and schedules the
 * visual.
 * @param {api.EncounterCommands} commands
 */
async function fireAndFuryConals(commands) {
  // 1. Wait until Fire and Fury cast start
  await commands.sleep_duration(BOSS_CONAL_DELAY);
  commands.cast("Fire and Fury", 4700);

  // 2. Wait until snapshot time (synchronous with first set snapshot)
  // Total time to snapshot from cast start: 4033ms (8933 total - 4900 delay)
  await commands.sleep_duration(4033);

  const sweep = Math.PI / 2; // 90 degrees
  const shape = api.Shape.cone(40, sweep);
  const frontTransform = api.Transform2D.new().with_angle(0); // Facing North
  const backTransform = api.Transform2D.new().with_angle(Math.PI); // Facing South

  // 3. Snapshot damage
  const frontSnapshot = await commands.role_positions_snapshot(
    shape,
    frontTransform
  );
  const backSnapshot = await commands.role_positions_snapshot(
    shape,
    backTransform
  );

  const hitRoles = new Set();
  frontSnapshot.forEach((s) => hitRoles.add(s.role));
  backSnapshot.forEach((s) => hitRoles.add(s.role));
  hitRoles.forEach((role) => commands.apply_damage(role, 1.0));

  // 4. Wait for cast to finish
  await commands.sleep_duration(EXPLOSION_VISUAL_DELAY);

  // 5. Spawn visual AoEs immediately after cast end
  const frontAoE = commands
    .aoe(shape)
    .with_transform(frontTransform)
    .with_color(0xff8400, 0.6)
    .with_duration(EXPLOSION_VISUAL_DURATION)
    .spawn();
  const backAoE = commands
    .aoe(shape)
    .with_transform(backTransform)
    .with_color(0xff8400, 0.6)
    .with_duration(EXPLOSION_VISUAL_DURATION)
    .spawn();

  await Promise.all([frontAoE, backAoE]);
}

/**
 * Generates a shuffled list of positions where the second element is guaranteed
 * to be an inner line (-5 or 5).
 * @param {api.EncounterCommands} commands
 * @returns {number[]}
 */
function generateSetPositions(commands) {
  const inners = [-5, 5];
  const outers = [-15, 15];
  const secondValIdx = commands.choose_random(2);
  const secondVal = inners[secondValIdx];
  const remaining = shuffle([inners[1 - secondValIdx], ...outers], commands);
  return [remaining[0], secondVal, remaining[1], remaining[2]];
}

/**
 * Standard Durstenfeld shuffle using the local random source.
 * @param {number[]} array
 * @param {api.EncounterCommands} commands
 * @returns {number[]}
 */
function shuffle(array, commands) {
  let result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = commands.choose_random(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
