// Here We Go's banned vocabulary: the parts of a real transfer a draft trade does not have, which a transfer insider's
// voice reaches for first.

/** A draft trade has no money, no medical, no paperwork and nobody's representatives. */
export const TRADE_INVENTED: readonly string[] = [
  "fee", "fees", "£", "€", "$", "million", "undisclosed", "add-ons", "medical", "medicals", "contract", "contracts",
  "personal terms", "paperwork", "documents", "release clause", "loan", "agent", "agents", "bid", "bids", "offer",
];

/** The desk prints the sign-off under the item; written into it, it would print twice. */
export const TRADE_SIGN_OFF: readonly string[] = ["here we go"];
