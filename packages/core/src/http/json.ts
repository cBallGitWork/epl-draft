import { HTTP_BODY_SAMPLE_CHARS } from "../config";

/** A body parsed as JSON, or the caller's error given what came instead: "200 text/html, not JSON…". */
export async function readJson(res: Response, notJson: (arrived: string) => Error): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const type = res.headers.get("content-type") ?? "no content-type";
    const sample = text.replace(/\s+/g, " ").trim().slice(0, HTTP_BODY_SAMPLE_CHARS);
    throw notJson(`${res.status} ${type}, not JSON: ${sample}`);
  }
}
