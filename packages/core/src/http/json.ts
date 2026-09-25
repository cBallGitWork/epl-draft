import { HTTP_BODY_SAMPLE_CHARS } from "../config";
import { ProviderError } from "./errors";

/** A body parsed as JSON, or a NOT_JSON ProviderError quoting what arrived instead. */
export async function readJson(res: Response, provider: string, what: string): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const type = res.headers.get("content-type") ?? "no content-type";
    const sample = text.replace(/\s+/g, " ").trim().slice(0, HTTP_BODY_SAMPLE_CHARS);
    const arrived = `${res.status} ${type}, not JSON: ${sample}`;
    throw new ProviderError("NOT_JSON", `${provider} ${what} → ${arrived}`);
  }
}
