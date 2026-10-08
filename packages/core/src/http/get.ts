import { notJson, statusError } from "./errors";
import { politeFetch } from "./fetch";
import { readJson } from "./json";

// A provider's GET read, or a ProviderError naming who was asked for what: never a default in place of an answer.

/** The body as JSON; a status that is not OK, or a body that is not JSON, throws. */
export async function fetchJson(url: string, provider: string, what: string): Promise<unknown> {
  return jsonOf(await politeFetch(url), provider, what);
}

/** As `fetchJson`, but a 404 is the provider saying there is no such thing: null. */
export async function fetchJsonOr404(url: string, provider: string, what: string): Promise<unknown> {
  const res = await politeFetch(url);
  return res.status === 404 ? null : jsonOf(res, provider, what);
}

/** The body as text; a status that is not OK throws. */
export async function fetchText(url: string, provider: string, what: string, init?: RequestInit): Promise<string> {
  const res = await politeFetch(url, init);
  if (!res.ok) throw statusError(provider, what, res.status);
  return res.text();
}

async function jsonOf(res: Response, provider: string, what: string): Promise<unknown> {
  if (!res.ok) throw statusError(provider, what, res.status);
  return readJson(res, notJson(provider, what));
}
