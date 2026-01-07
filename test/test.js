/**
 * @format
 * @import * as api from "../minisim.d.ts"
 */

const STATUS_DOOM = 215020;
const STATUS_UNKNOWN = 215503;

/**
 * The name of the encounter.
 * @type {string}
 */
const ENCOUNTER_NAME = "JS Encounter";

/**
 * The arena for the encounter.
 * @type {api.Arena}
 */
const ARENA = api.Arena.TopPhase2;

const zip = (a, b) => a.map((k, i) => [k, b[i]]);

/**
 * Returns a list of (Role, Initial Position) pairs for the encounter.
 * @returns {api.RolePosition[]}
 */
function role_positions() {
  let angles = api.n_evenly_spaced_angles(8, 0.0, 0.0);
  let spots = api.surround_point(api.MVec2.zero(), 5.0, angles);
  let roles = [
    api.Role.Tank1,
    api.Role.Ranged1,
    api.Role.Healer1,
    api.Role.Melee1,
    api.Role.Tank2,
    api.Role.Melee2,
    api.Role.Healer2,
    api.Role.Ranged2,
  ];
  return zip(roles, spots).map(([role, spot]) => {
    return api.RolePosition.new(role, api.Transform2D.new_from_pos(spot));
  });
}

/**
 * Returns a list of used status effect IDs for the encounter. These IDs are
 * not the actual status IDs from the Status CSV in the game files, but
 * rather the IDs of the icons used for the statuses.
 * @returns {number[]}
 */
function used_status_effect_ids() {
  return [STATUS_DOOM, STATUS_UNKNOWN];
}

async function spawn_aoe(commands, shape, transform) {
  let snapshot = await commands.role_positions_snapshot(shape, transform);
  await commands.sleep_duration(500);
  await commands.aoe(shape).with_transform(transform).spawn();
  for (let role_snapshot of snapshot) {
    commands.status_effect(STATUS_UNKNOWN, 3000).apply(role_snapshot.role);
    commands.status_effect(STATUS_DOOM, 3000).apply(role_snapshot.role);
  }
}

/**
 * Asynchronous function that runs the encounter. All interactions with the
 * world must be done via the provided commands object.
 * @param {api.EncounterCommands} commands
 */
async function run(commands) {
  commands.enemy_sprite(1.0).spawn();
  commands.targeting_ring(10.0).spawn();

  let aoes = [
    {
      shape: api.Shape.cone(5.0, Math.PI / 2),
      transform: api.Transform2D.new_from_pos(api.MVec2.one()).with_angle(
        Math.PI / 2
      ),
    },
    {
      shape: api.Shape.circle(5.0),
      transform: api.Transform2D.new_from_pos(api.mvec2(-5, -5)),
    },
    {
      shape: api.Shape.ring(20.0, 30.0),
      transform: api.Transform2D.new(),
    },
    {
      shape: api.Shape.ring_sector(15.0, 20.0, Math.PI / 2),
      transform: api.Transform2D.new_from_pos(api.MVec2.zero()).with_angle(
        Math.PI / 2
      ),
    },
    {
      shape: api.Shape.rectangle(5.0, 10.0),
      transform: api.Transform2D.new(),
    },
    {
      shape: api.Shape.polygon([
        api.mvec2(1.0, -5.0),
        api.mvec2(0.0, 4.0),
        api.mvec2(-1.0, -5.0),
        api.mvec2(0.0, -2.0),
      ]),
      transform: api.Transform2D.new(),
    },
  ];
  showInfo("Sleeping until t=1 second...");
  await commands.sleep_until(1000);
  let cast_time = 2000;
  commands.cast("Kitchen Sink", cast_time);

  for (let aoe of aoes) {
    commands
      .telegraph(aoe.shape)
      .with_duration(2000)
      .with_transform(aoe.transform)
      .spawn();
  }
  await commands.sleep_duration(cast_time);

  for (let aoe of aoes) {
    spawn_aoe(commands, aoe.shape, aoe.transform);
  }

  await commands.sleep_until(7000);
  await commands.finish_encounter();
}

globalThis.exports = {
  ENCOUNTER_NAME,
  ARENA,
  role_positions,
  used_status_effect_ids,
  run,
};
