/**
 * @format
 * @import * as api from "../../minisim.d.ts"
 */

const STATUS_BURN_BABY_BURN = 214280;
const STATUS_IN_THE_SPOTLIGHT = 214284;
const STATUS_MAGIC_VULNERABILITY_UP = 215057;
const STATUS_DAMAGE_DOWN = 215520;
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
  return [
    STATUS_BURN_BABY_BURN,
    STATUS_IN_THE_SPOTLIGHT,
    STATUS_MAGIC_VULNERABILITY_UP,
    STATUS_DAMAGE_DOWN,
  ];
}

/**
 * Spawns an AoE that players should avoid.
 * @param {api.EncounterCommands} commands
 * @param {api.Shape} shape
 * @param {api.Transform2D} transform
 */
async function spawn_aoe(commands, shape, transform) {
  let id = await commands.build_aoe(shape).with_transform(transform).execute();
  let snapshot = await commands.role_positions_snapshot(id);
  for (let role_snapshot of snapshot) {
    await magic_damage(commands, role_snapshot);
    commands
      .build_status_effect(role_snapshot.role, STATUS_DAMAGE_DOWN, 30000)
      .execute();
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
    .build_status_effect(
      role_snapshot.role,
      STATUS_MAGIC_VULNERABILITY_UP,
      2000
    )
    .execute();
}

/**
 * Timeline:
 * 1:16.5 - Disco Infernal Cast - 3.70 s
 * time between cast-end and aoe is roughly 0.7s
 * disco infernal aoe is roughly 1.5s
 * 1:21.7 - Funky Floor Cast - 2.00s
 * 1:25.7 - Funky Floor Cast
 * 1:29.8 - Funky Floor Cast
 * 1:29.9 - Inside Out Cast - 4.70s
 * 1:32.3 - Other half of Inside Out
 * 1:33.8 - Funky Floor Cast
 * 1:37.8 - Funky Floor Cast
 * 1:41.9 - Funky Floor Cast
 * 1:46.0 - Funky Floor Cast
 * 1:50.0 - Funky Floor Cast
 * 1:54.1 - Funky Floor Cast
 * 1:58.2 - Funky Floor Cast
 *
 * 20 frame delay between telegraph and aoe
 * 0.333s
 * 48 frames for aoe duration
 * 0.8s aoe duration
 * roughly 1s delay before next
 */

/**
 * Asynchronous function that runs the encounter. All interactions with the
 * world must be done via the provided commands object.
 * @param {api.EncounterCommands} commands
 */
async function run(commands) {
  await commands.sleep_until(2000);
  initial_raidwide(commands);
  await commands.sleep_until(2500);

  spawn_disco_circles(commands);
  alternate_floor_aoes(commands, 2500);

  await commands.sleep_until(60000);
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
async function initial_raidwide(commands) {
  let id = await commands
    .build_aoe(api.Shape.circle(60.0))
    .with_duration(1500)
    .execute();
  let snapshot = await commands.role_positions_snapshot(id);
  for (let role_snapshot of snapshot) {
    let duration_ms = commands.choose_random(2) == 0 ? 23500 : 31500;
    let status_expiration = commands
      .build_status_effect(
        role_snapshot.role,
        STATUS_BURN_BABY_BURN,
        duration_ms
      )
      .execute_and_await_expiration();
    die_on_expiration(commands, role_snapshot.role, status_expiration);
  }
}

/**
 * Spawns all disco circles used in the encounter.
 * @param {api.EncounterCommands} commands
 */
async function spawn_disco_circles(commands) {
  inside_disco_circle(commands, -2.5, -7.5, -2.5, 7.5);
  inside_disco_circle(commands, 2.5, 7.5, 2.5, -7.5);
  inside_disco_circle(commands, 7.5, -2.5, -7.5, -2.5);
  inside_disco_circle(commands, -7.5, 2.5, 7.5, 2.5);
}

/**
 * Spawns the disco circle AoE, given point A and point B for where the disco
 * circle will travel
 * @param {api.EncounterCommands} commands
 * @param {number} a_x
 * @param {number} a_y
 * @param {number} b_x
 * @param {number} b_y
 */
async function inside_disco_circle(commands, a_x, a_y, b_x, b_y) {
  let tfa = api.Transform2D.new_from_pos(api.mvec2(a_x, a_y));
  let tfb = api.Transform2D.new_from_pos(api.mvec2(b_x, b_y));
  let dests = [tfb, tfa, tfb, tfa, tfb, tfa, tfb, tfa, tfb, tfa];

  let entity_id = await commands
    .build_telegraph(api.Shape.circle(2.5))
    .with_transform(tfa)
    .with_duration(40000)
    .execute();
  for (let dest of dests) {
    await commands.sleep_duration(2700);
    commands.build_auto_movement(entity_id, dest, 4000).execute();
    await commands.sleep_duration(4000);
    await commands
      .build_aoe(api.Shape.circle(2.5))
      .with_transform(dest)
      .execute();
    await commands.sleep_duration(1300);
  }
}

/** Spawns all of the floor AoEs in an alternating pattern.
 * @param {api.EncounterCommands} commands
 * @param {number} start_time in milliseconds
 */
async function alternate_floor_aoes(commands, start_time) {
  var shifted = false;
  for (let i = 0; i < 10; i++) {
    await commands.sleep_until(start_time + i * 4000);
    spawn_floor_aoes(commands, shifted);
    shifted = !shifted;
  }
}

/**
 * Spawns a single telegraph and after a duration the floor AoE at the specified
 * coordinates.
 * @param {api.EncounterCommands} commands
 * @param {number} x
 * @param {number} y
 */
async function spawn_floor_aoe(commands, x, y) {
  let shape = api.Shape.rectangle(5.0, 5.0);
  let transform = api.Transform2D.new_from_pos(api.mvec2(x, y)).with_angle(
    Math.PI / 2
  );
  await commands
    .build_telegraph(shape)
    .with_transform(transform)
    .with_duration(2000)
    .execute();
  await commands.sleep_duration(2700);
  await spawn_aoe(commands, shape, transform);
}

/**
 * Spawns the telegraphs and AoEs for the Funky Floor AoEs.
 * @param {api.EncounterCommands} commands
 * @param {boolean} shifted
 */
function spawn_floor_aoes(commands, shifted) {
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
      spawn_floor_aoe(commands, x, y);
    }
  }
}
