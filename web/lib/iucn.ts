export type IucnCode = "CR" | "EN" | "VU" | "NT" | "LC" | "DD" | "NE";

/** NE and DD mean "we don't know", so they get the neutral "unknown" look, never the green "low risk" one. */
export function isIucnAssessed(code: IucnCode): boolean {
  return code !== "NE" && code !== "DD";
}
