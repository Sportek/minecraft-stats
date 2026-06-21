// Most common two-level public suffixes: keep the last three labels
// (e.g. play.example.co.uk -> example.co.uk) instead of the last two.
const MULTIPART_TLDS = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "gov.uk",
  "co.nz",
  "com.au",
  "net.au",
  "org.au",
  "com.br",
  "com.mx",
  "co.za",
  "co.jp",
  "ne.jp",
  "com.tr",
]);

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * Infers a server's likely website from its address.
 * `play.hypixel.net` -> `hypixel.net`. Returns `null` when we can't be sure
 * (IP address, localhost, hostname without a valid TLD): when in doubt, show nothing.
 */
export function deriveServerWebsite(address: string | null | undefined): string | null {
  if (!address) return null;

  const host = address
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .split("/")[0]
    .split(":")[0];

  if (!host || host === "localhost" || IPV4.test(host) || host.includes(":")) return null;

  const labels = host.split(".").filter(Boolean);
  if (labels.length < 2) return null;

  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,}$/.test(tld)) return null;

  const lastTwo = labels.slice(-2).join(".");
  const isMultipart = MULTIPART_TLDS.has(lastTwo) && labels.length >= 3;
  return isMultipart ? labels.slice(-3).join(".") : lastTwo;
}
