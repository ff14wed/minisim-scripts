/* tslint:disable */
/* eslint-disable */
export function mvec2(x: number, y: number): MVec2;
/**
 * Generates points that are evenly spaced around a point at a given distance
 * Requires passing in the angles with which to surround the point.
 */
export function surround_point(point: MVec2, distance: number, angles: Float32Array): MVec2[];
/**
 * Generates n evenly spaced angles counter-clockwise from start_angle to end_angle
 *
 * Note that the result will not include the end angle. In order to generate
 * n angles that do include the end angle, call this function with (n-1) angles
 * and append the end angle manually.
 *
 * If the start angle is equal to the end angle, it is assumed the angles form
 * a full rotation.
 */
export function n_evenly_spaced_angles(n: number, start_angle: number, end_angle: number): Float32Array;
export enum Arena {
  TopPhase1 = 0,
  TopPhase2 = 1,
  TopPhase3 = 2,
  TopPhase4 = 3,
  TopPhase5 = 4,
  TopPhase6 = 5,
  M5Savage = 6,
}
export enum Motion {
  Linear = 0,
  EaseIn = 1,
  EaseOut = 2,
  EaseInOut = 3,
}
export enum Role {
  Tank1 = 0,
  Tank2 = 1,
  Healer1 = 2,
  Healer2 = 3,
  Melee1 = 4,
  Melee2 = 5,
  Ranged1 = 6,
  Ranged2 = 7,
}
/**
 * Command for adding a status effect to a role. Should not be constructed
 * directly.
 */
export class ApplyStatusEffectCommand {
  private constructor();
  free(): void;
  /**
   * Sets the additional stack count to apply with the status effect.
   *
   * For instance, if the effect is already present with 2 stacks, and this
   * command is given a stack count of 3, the resulting effect will have 5
   * stacks.
   */
  with_stack_count(stack_count: number): ApplyStatusEffectCommand;
  /**
   * Applies the status effect to the role. Awaiting this method will
   * wait until the effect is expired.
   */
  execute_and_await_expiration(): Promise<void>;
  /**
   * Applies the status effect to the role. Awaiting this method will
   * wait until the effect is applied.
   */
  execute(): Promise<void>;
}
/**
 * Public interface for commands that can be executed in an encounter. Should
 * not be constructed directly.
 */
export class EncounterCommands {
  private constructor();
  free(): void;
  /**
   * Returns whether or not the specified role has the given status effect.
   */
  has_status(role: Role, id: number): Promise<boolean>;
  /**
   * Sleeps until the specified time in simulation milliseconds.
   */
  sleep_until(t: number): Promise<void>;
  /**
   * Applies damage to the specified role. If the damage is greater than or
   * equal to 1.0, the role is considered dead and a FatalEvent is sent.
   */
  apply_damage(role: Role, damage: number): void;
  /**
   * Shows a message to the user.
   */
  show_message(message: string): void;
  /**
   * Chooses a random number between 0 and n-1
   */
  choose_random(n: number): number;
  /**
   * Sleeps for the specified duration in milliseconds.
   */
  sleep_duration(duration_ms: number): Promise<void>;
  /**
   * Returns a command for building a telegraph that will show the AoE shape
   * for a duration. Executing the command returns its entity ID once it is
   * spawned. Does nothing until `execute()` is called on it.
   */
  build_telegraph(shape: Shape): SpawnEntityCommand;
  /**
   * Ends the encounter.
   */
  finish_encounter(): void;
  /**
   * Returns when the entity with the specified ID expires.
   */
  entity_expiration(id: number): Promise<void>;
  /**
   * Returns a command for moving the specified entity to the target position
   * over the specified duration in milliseconds. Does nothing until
   * `execute()` is called on it.
   */
  build_auto_movement(target: number, destination: Transform2D, duration_ms: number): StartAutoMovementCommand;
  /**
   * Returns a command for applying a status effect to the specified role.
   * Executing the command returns a future that can be awaited for the
   * expiration of the effect. Does nothing until `execute()` is called.
   */
  build_status_effect(role: Role, id: number, duration_ms: number): ApplyStatusEffectCommand;
  /**
   * Returns a snapshot of the role and positions that are currently within
   * the shape of the entity with the specified ID.
   */
  role_positions_snapshot(id: number): Promise<RolePosition[]>;
  /**
   * Returns a command for building an AoE. Executing the command returns its
   * entity ID once it is spawned. Does nothing until `execute()` is called on
   * it.
   */
  build_aoe(shape: Shape): SpawnEntityCommand;
}
/**
 * A wasm-compatible 2D vector that can represent a position or a direction.
 */
export class MVec2 {
  private constructor();
  free(): void;
  /**
   * The x component of the vector
   */
  x(): number;
  /**
   * The y component of the vector
   */
  y(): number;
  /**
   * Helper to create a one vector
   */
  static one(): MVec2;
  /**
   * Helper to create a zero vector
   */
  static zero(): MVec2;
  /**
   * Helper to create the unit x vector
   */
  static unit_x(): MVec2;
  /**
   * Helper to create the unit y vector
   */
  static unit_y(): MVec2;
}
export class RolePosition {
  private constructor();
  free(): void;
  static new(role: Role, transform: Transform2D): RolePosition;
  role: Role;
  transform: Transform2D;
}
export class Shape {
  private constructor();
  free(): void;
  static ring_sector(inner_radius: number, outer_radius: number, angle: number): Shape;
  static cone(radius: number, angle: number): Shape;
  static ring(inner_radius: number, outer_radius: number): Shape;
  static circle(radius: number): Shape;
  static polygon(vertices: MVec2[]): Shape;
  static rectangle(width: number, height: number): Shape;
}
/**
 * Command for spawning an entity (enemy, aoe, telegraph, tower, etc.) in the
 * world. Should not be constructed directly.
 */
export class SpawnEntityCommand {
  private constructor();
  free(): void;
  /**
   * Sets the visible duration of the entity in milliseconds.
   */
  with_duration(duration_ms: number): SpawnEntityCommand;
  /**
   * Sets the initial transform (position and rotation) of the entity.
   */
  with_transform(transform: Transform2D): SpawnEntityCommand;
  /**
   * Spawns the entity in the world. Awaiting this method will
   * return its unique ID once spawned.
   */
  execute(): Promise<number>;
}
/**
 * Command for adding auto-movement to an entity. Should not be constructed
 * directly.
 */
export class StartAutoMovementCommand {
  private constructor();
  free(): void;
  /**
   * Sets the motion type for the move command.
   */
  with_motion(motion: Motion): StartAutoMovementCommand;
  /**
   * Starts the motion on the entity.
   */
  execute(): Promise<void>;
}
/**
 * A 2D transformation with a center and rotation
 * In the game coordinate system, North is the negative Y direction, and
 * West is the negative X direction.
 * Any rotation represents a rotation counterclockwise from North
 */
export class Transform2D {
  private constructor();
  free(): void;
  /**
   * Creates a new transform with the given rotation angle in radians
   */
  with_angle(angle: number): Transform2D;
  /**
   * Creates a new transform at the given position with no rotation
   */
  static new_from_pos(center: MVec2): Transform2D;
  /**
   * Returns a new transform with rotation so that the object faces the given
   * direction vector. If the direction is zero, the rotation is unchanged.
   */
  with_direction(dir: MVec2): Transform2D;
  /**
   * Creates a new transform at (0, 0) with no rotation
   */
  static new(): Transform2D;
  /**
   * Returns the position of the object as an MVec2
   */
  position(): MVec2;
  /**
   * Returns the rotation of the object in radians in the range [0, 2π)
   */
  rotation(): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_applystatuseffectcommand_free: (a: number, b: number) => void;
  readonly __wbg_encountercommands_free: (a: number, b: number) => void;
  readonly __wbg_get_roleposition_role: (a: number) => number;
  readonly __wbg_get_roleposition_transform: (a: number) => number;
  readonly __wbg_mvec2_free: (a: number, b: number) => void;
  readonly __wbg_roleposition_free: (a: number, b: number) => void;
  readonly __wbg_set_roleposition_role: (a: number, b: number) => void;
  readonly __wbg_set_roleposition_transform: (a: number, b: number) => void;
  readonly __wbg_shape_free: (a: number, b: number) => void;
  readonly __wbg_spawnentitycommand_free: (a: number, b: number) => void;
  readonly __wbg_startautomovementcommand_free: (a: number, b: number) => void;
  readonly __wbg_transform2d_free: (a: number, b: number) => void;
  readonly applystatuseffectcommand_execute: (a: number) => number;
  readonly applystatuseffectcommand_execute_and_await_expiration: (a: number) => number;
  readonly applystatuseffectcommand_with_stack_count: (a: number, b: number) => number;
  readonly encountercommands_apply_damage: (a: number, b: number, c: number) => void;
  readonly encountercommands_build_aoe: (a: number, b: number) => number;
  readonly encountercommands_build_auto_movement: (a: number, b: number, c: number, d: number) => number;
  readonly encountercommands_build_status_effect: (a: number, b: number, c: number, d: number) => number;
  readonly encountercommands_build_telegraph: (a: number, b: number) => number;
  readonly encountercommands_choose_random: (a: number, b: number) => number;
  readonly encountercommands_entity_expiration: (a: number, b: number) => number;
  readonly encountercommands_finish_encounter: (a: number) => void;
  readonly encountercommands_has_status: (a: number, b: number, c: number) => number;
  readonly encountercommands_role_positions_snapshot: (a: number, b: number) => number;
  readonly encountercommands_show_message: (a: number, b: number, c: number) => void;
  readonly encountercommands_sleep_duration: (a: number, b: number) => number;
  readonly encountercommands_sleep_until: (a: number, b: number) => number;
  readonly mvec2: (a: number, b: number) => number;
  readonly mvec2_one: () => number;
  readonly mvec2_unit_x: () => number;
  readonly mvec2_unit_y: () => number;
  readonly mvec2_x: (a: number) => number;
  readonly mvec2_y: (a: number) => number;
  readonly mvec2_zero: () => number;
  readonly n_evenly_spaced_angles: (a: number, b: number, c: number, d: number) => void;
  readonly roleposition_new: (a: number, b: number) => number;
  readonly shape_circle: (a: number) => number;
  readonly shape_cone: (a: number, b: number) => number;
  readonly shape_polygon: (a: number, b: number) => number;
  readonly shape_rectangle: (a: number, b: number) => number;
  readonly shape_ring: (a: number, b: number) => number;
  readonly shape_ring_sector: (a: number, b: number, c: number) => number;
  readonly spawnentitycommand_execute: (a: number) => number;
  readonly spawnentitycommand_with_duration: (a: number, b: number) => number;
  readonly spawnentitycommand_with_transform: (a: number, b: number) => number;
  readonly startautomovementcommand_execute: (a: number) => number;
  readonly startautomovementcommand_with_motion: (a: number, b: number) => number;
  readonly surround_point: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly transform2d_new: () => number;
  readonly transform2d_new_from_pos: (a: number) => number;
  readonly transform2d_position: (a: number) => number;
  readonly transform2d_rotation: (a: number) => number;
  readonly transform2d_with_angle: (a: number, b: number) => number;
  readonly transform2d_with_direction: (a: number, b: number) => number;
  readonly main: (a: number, b: number) => number;
  readonly __getrandom_custom: (a: number, b: number) => number;
  readonly allocate_vec_u8: (a: number) => number;
  readonly crate_version: () => number;
  readonly file_loaded: (a: number) => void;
  readonly focus: (a: number) => void;
  readonly frame: () => void;
  readonly key_down: (a: number, b: number, c: number) => void;
  readonly key_press: (a: number) => void;
  readonly key_up: (a: number, b: number) => void;
  readonly mouse_down: (a: number, b: number, c: number) => void;
  readonly mouse_move: (a: number, b: number) => void;
  readonly mouse_up: (a: number, b: number, c: number) => void;
  readonly mouse_wheel: (a: number, b: number) => void;
  readonly on_clipboard_paste: (a: number, b: number) => void;
  readonly on_file_dropped: (a: number, b: number, c: number, d: number) => void;
  readonly on_files_dropped_finish: () => void;
  readonly on_files_dropped_start: () => void;
  readonly raw_mouse_move: (a: number, b: number) => void;
  readonly resize: (a: number, b: number) => void;
  readonly touch: (a: number, b: number, c: number, d: number) => void;
  readonly quad_url_crate_version: () => number;
  readonly sapp_jsutils_crate_version: () => number;
  readonly __wbindgen_export_0: (a: number) => void;
  readonly __wbindgen_export_1: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_2: (a: number, b: number) => number;
  readonly __wbindgen_export_3: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_4: WebAssembly.Table;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export_5: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_6: (a: number, b: number, c: number, d: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
