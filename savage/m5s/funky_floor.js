/**
 * @format
 * @import * as api from "../../minisim.d.ts"
 */

const STATUS_BURN_BABY_BURN = 214280;
const STATUS_IN_THE_SPOTLIGHT = 214284;
const STATUS_MAGIC_VULNERABILITY_UP = 215057;
const STATUS_DAMAGE_DOWN = 215520;

// =============================================================================
// Public exports
// =============================================================================

/**
 * The name of the encounter.
 * @type {string}
 */
const ENCOUNTER_NAME = "M5S Funky Floor";

/**
 * The arena for the encounter.
 * @type {api.Arena}
 */
const ARENA = api.Arena.M5Savage;

/**
 * Returns a list of (Role, Initial Position) pairs for the encounter.
 * @returns {api.RolePosition[]}
 */
function role_positions() {
  return [api.RolePosition.new(api.Role.Tank1, api.Transform2D.new())];
}

/**
 * Returns a list of used status effect IDs for the encounter. These IDs are
 * not the actual status IDs from the Status CSV in the game files, but
 * rather the IDs of the icons used for the statuses.
 * @returns {number[]}
 */
function used_status_effect_ids() {
  return [
    STATUS_BURN_BABY_BURN,
    STATUS_IN_THE_SPOTLIGHT,
    STATUS_MAGIC_VULNERABILITY_UP,
    STATUS_DAMAGE_DOWN,
  ];
}

/**
 * Asynchronous function that runs the encounter. All interactions with the
 * world must be done via the provided commands object.
 * @param {api.EncounterCommands} commands
 */
async function run(commands) {
  commands.cast("Disco Infernal", 2000);
  await commands.sleep_duration(2000);
  disco_infernal(commands);

  // Spawn spotlights at the end of the disco infernal animation
  await commands.sleep_duration(1800);
  execute_spotlights(commands);

  // Start the Funky Floor timeline
  alternate_floor_aoes(commands);

  // End the encounter at 50 seconds
  await commands.sleep_until(50000);
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
 * Spawns an AoE that players should avoid.
 * @param {api.EncounterCommands} commands
 * @param {api.Shape} shape
 * @param {api.Transform2D} transform
 */
async function spawn_aoe(commands, shape, transform) {
  let snapshot = await commands.role_positions_snapshot(shape, transform);
  await commands.sleep_duration(500);
  await commands.aoe(shape).with_transform(transform).spawn();
  for (let role_snapshot of snapshot) {
    await magic_damage(commands, role_snapshot);
    commands.status_effect(STATUS_DAMAGE_DOWN, 30000).apply(role_snapshot.role);
  }
}

/**
 * Applies magic vulnerability and damage to the specified role.
 * @param {api.EncounterCommands} commands
 * @param {api.RolePosition} role_snapshot
 */

async function magic_damage(commands, role_snapshot) {
  let is_fatal = await commands.has_status(
    role_snapshot.role,
    STATUS_MAGIC_VULNERABILITY_UP
  );
  let damage = is_fatal ? 1.0 : 0.3;
  commands.apply_damage(role_snapshot.role, damage);
  await commands
    .status_effect(STATUS_MAGIC_VULNERABILITY_UP, 2000)
    .apply(role_snapshot.role);
}

/**
 * Kills the specified role if the provided expiration is allowed to go
 * to completion.
 * @param {api.EncounterCommands} commands
 * @param {api.Role} role
 * @param {Promise} expiration
 */
async function die_on_expiration(commands, role, expiration) {
  await expiration;
  commands.apply_damage(role, 1.0);
}

/**
 * Spawns the intial raidwide that gives the burn debuff.
 * @param {api.EncounterCommands} commands
 */
async function disco_infernal(commands) {
  let snapshot = await commands.role_positions_snapshot(
    api.Shape.circle(60.0),
    api.Transform2D.new()
  );
  await commands.sleep_duration(500);
  await commands.aoe(api.Shape.circle(60.0)).with_duration(1800).spawn();
  for (let role_snapshot of snapshot) {
    let duration_ms = commands.choose_random(2) == 0 ? 23500 : 31500;
    let status_expiration = commands
      .status_effect(STATUS_BURN_BABY_BURN, duration_ms)
      .apply_and_await_expiration(role_snapshot.role);
    die_on_expiration(commands, role_snapshot.role, status_expiration);
  }
}

/**
 * Handles all spotlights used in the encounter.
 * @param {api.EncounterCommands} commands
 */
async function execute_spotlights(commands) {
  inside_spotlight(commands, -2.5, -7.5, -2.5, 7.5);
  inside_spotlight(commands, 2.5, 7.5, 2.5, -7.5);
  inside_spotlight(commands, 7.5, -2.5, -7.5, -2.5);
  inside_spotlight(commands, -7.5, 2.5, 7.5, 2.5);
}

/**
 * Spawns the spotlight AoE, moves the entity over the course of the entire
 * encounter, and spawns AoEs where the spotlight stops.
 * @param {api.EncounterCommands} commands
 * @param {number} a_x
 * @param {number} a_y
 * @param {number} b_x
 * @param {number} b_y
 */
async function inside_spotlight(commands, a_x, a_y, b_x, b_y) {
  let tfa = api.Transform2D.new_from_pos(api.mvec2(a_x, a_y));
  let tfb = api.Transform2D.new_from_pos(api.mvec2(b_x, b_y));
  let dests = [tfb, tfa, tfb, tfa];

  let entity_id = await commands
    .telegraph(api.Shape.circle(2.5))
    .with_transform(tfa)
    .with_duration(34467)
    .with_color(0xffffff, 0.3)
    .with_pulse(false)
    .spawn();
  // Initial wait duration
  await commands.sleep_duration(1533);
  for (let dest of dests) {
    commands.auto_movement(dest, 4000).apply(entity_id);
    await commands.sleep_duration(4000);
    commands.change_color(entity_id, 0xffffff, 0.8);
    await commands.sleep_duration(4000);
    commands.change_color(entity_id, 0xffffff, 0.3);
  }
}

/** Spawns all of the floor AoEs in an alternating pattern.
 * @param {api.EncounterCommands} commands
 * @param {number} start_time in milliseconds
 */
async function alternate_floor_aoes(commands) {
  var shifted = false;
  for (let i = 0; i < 10; i++) {
    let telegraph_duration = i == 0 ? 3000 : 2000;
    spawn_floor_aoes(commands, shifted, telegraph_duration);
    shifted = !shifted;
    await commands.sleep_duration(telegraph_duration + 2000);
  }
}

/**
 * Spawns a single telegraph and after a duration the floor AoE at the specified
 * coordinates.
 * @param {api.EncounterCommands} commands
 * @param {number} x
 * @param {number} y
 * @param {number} duration - Telegraph duration in milliseconds
 */
async function spawn_floor_aoe(commands, x, y, duration) {
  let shape = api.Shape.rectangle(5.0, 5.0);
  let transform = api.Transform2D.new_from_pos(api.mvec2(x, y)).with_angle(
    Math.PI / 2
  );
  await commands
    .telegraph(shape)
    .with_transform(transform)
    .with_duration(duration)
    .spawn();
  await commands.sleep_duration(duration + 200);
  await spawn_aoe(commands, shape, transform);
}

/**
 * Spawns the telegraphs and AoEs for the Funky Floor AoEs.
 * @param {api.EncounterCommands} commands
 * @param {boolean} shifted - Whether to shift the pattern or not
 * @param {boolean} duration - Telegraph duration in milliseconds
 */
function spawn_floor_aoes(commands, shifted, duration) {
  // Spawns squares that are 5 yalms wide in alternating fashion starting from
  // (-20, -20) to (20, 20)
  // The initial square is (-15, -17.5) because it is rotated sideways so that
  // the base is in the middle of the right edge of the square.
  let shape = api.Shape.rectangle(5.0, 5.0);
  var row_shifted = shifted;
  for (let y = -17.5; y < 20; y += 5) {
    row_shifted = !row_shifted;
    var spawn_here = row_shifted;
    for (let x = -15; x <= 20; x += 5) {
      // Flip the spawn_here flag, and skip if it was false.
      spawn_here = !spawn_here;
      if (spawn_here) {
        continue;
      }
      spawn_floor_aoe(commands, x, y, duration);
    }
  }
}
