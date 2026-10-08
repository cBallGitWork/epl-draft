// A page holding changes the user has not saved marks the document, and the pull to refresh holds off while it does.

const KEY = "unsaved";

/** Mark or clear the document as holding unsaved changes. */
export function holdReloads(held: boolean): void {
  if (held) document.documentElement.dataset[KEY] = "";
  else delete document.documentElement.dataset[KEY];
}

/** Whether a reload now would throw away unsaved changes. */
export function reloadsHeld(): boolean {
  return document.documentElement.dataset[KEY] !== undefined;
}
