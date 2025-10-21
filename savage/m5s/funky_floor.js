/**
 * @format
 * @import * as api from "../../minisim.d.ts"
 */

const STATUS_DAMAGE_DOWN = 215520;
const STATUS_BURN_BABY_BURN = 214280;
const STATUS_IN_THE_SPOTLIGHT = 214284;

/**
 * Returns the name of the encounter.
 * @return {string}
 */
function encounter_name() {
  return "M5S Funky Floor";
}

/**
 * Returns the arena for the encounter.
 * @return {api.Arena}
 */
function arena() {
  return api.Arena.M5Savage;
}

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
  return [STATUS_DAMAGE_DOWN, STATUS_BURN_BABY_BURN, STATUS_IN_THE_SPOTLIGHT];
}

async function spawn_aoe(commands, shape, transform) {
  let id = await commands.build_aoe(shape).with_transform(transform).execute();
  let snapshot = await commands.role_positions_snapshot(id);
  for (let role_snapshot of snapshot) {
    commands
      .build_status_effect(role_snapshot.role, STATUS_UNKNOWN, 3000)
      .execute();
    commands
      .build_status_effect(role_snapshot.role, STATUS_DOOM, 3000)
      .execute();
  }
}

/**
 * Asynchronous function that runs the encounter. All interactions with the
 * world must be done via the provided commands object.
 * @param {api.EncounterCommands} commands
 */
async function run(commands) {
  await commands.sleep_until(2.0);
  initial_raidwide(commands);
  await commands.sleep_until(2.5);

  let entity_id = await commands
    .build_telegraph(api.Shape.circle(2.5))
    .with_duration(10000)
    .execute();
  commands
    .build_auto_movement(
      entity_id,
      api.Transform2D.new_from_pos(api.mvec2(0, 10)),
      5000
    )
    .execute();

  await commands.sleep_until(10.0);
  commands.finish_encounter();
}

globalThis.exports = {
  encounter_name,
  arena,
  role_positions,
  used_status_effect_ids,
  run,
};

/**
 * Spawns the intial raidwide that gives the burn debuff.
 * @param {api.EncounterCommands} commands
 */
async function initial_raidwide(commands) {
  let id = await commands.build_aoe(api.Shape.circle(60.0)).execute();
  let snapshot = await commands.role_positions_snapshot(id);
  for (let role_snapshot of snapshot) {
    let duration_ms = commands.choose_random(2) == 0 ? 24000 : 32000;
    await commands
      .build_status_effect(
        role_snapshot.role,
        STATUS_BURN_BABY_BURN,
        duration_ms
      )
      .execute();
  }
}
