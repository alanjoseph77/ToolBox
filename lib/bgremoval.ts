/* eslint-disable @typescript-eslint/no-explicit-any */
// The imgly model/runtime can't be bundled by webpack, so it is loaded from a CDN at runtime.
// The model (~40 MB) is downloaded once and then cached by the browser.
const IMGLY_URL = "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm";

/** Returns a transparent-background PNG of the subject. */
export async function removeBg(file: Blob): Promise<Blob> {
  const { removeBackground } = await import(/* webpackIgnore: true */ IMGLY_URL);
  return removeBackground(file);
}
