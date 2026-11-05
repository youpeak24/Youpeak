/**
 * Free, $0-cost VPN/proxy heuristic — no API key, no signup, no external
 * calls (so no rate limits and no third-party ToS to worry about on a
 * commercial product). Flags an IP as "likely VPN/proxy/hosting" if it falls
 * inside a known datacenter/cloud-provider CIDR range — the same trick real
 * anti-fraud vendors use as one signal among several, since genuine
 * residential/mobile users are essentially never on these ranges, while a
 * meaningful share of VPN/proxy services rent server capacity from exactly
 * these providers.
 *
 * Honest limitation: this is NOT exhaustive. Dedicated VPN providers that
 * run their own IP pools (not on major clouds), or VPNs on small/regional
 * hosts, will slip through. A paid IP-intelligence API (IPQualityScore,
 * IPHub, MaxMind, etc.) would catch more — swap this module for one later
 * if that's ever set up; nothing else in the codebase needs to change,
 * this file's isLikelyVpnOrProxy() is the only integration point.
 */
"use strict";

// A representative (not exhaustive) set of major cloud/hosting CIDR blocks
// commonly rented by VPN/proxy services. IPv4 only — IPv6 proxy traffic is
// not checked by this heuristic.
const DATACENTER_RANGES = [
  // AWS (a sample of well-known EC2 blocks)
  "3.0.0.0/9", "13.32.0.0/15", "13.52.0.0/14", "15.160.0.0/13", "18.130.0.0/16",
  "34.192.0.0/10", "35.152.0.0/13", "52.0.0.0/8", "54.64.0.0/11", "99.77.128.0/17",
  // Google Cloud
  "34.64.0.0/10", "35.184.0.0/13", "35.192.0.0/12", "104.154.0.0/15",
  // Microsoft Azure
  "13.64.0.0/11", "20.0.0.0/8", "40.64.0.0/10", "52.224.0.0/11",
  // Oracle Cloud
  "129.146.0.0/16", "132.145.0.0/16", "140.238.0.0/15",
  // DigitalOcean
  "104.131.0.0/16", "138.68.0.0/16", "142.93.0.0/16", "159.65.0.0/16", "165.227.0.0/16",
  // Linode
  "45.33.0.0/16", "45.56.64.0/18", "172.104.0.0/15", "173.255.192.0/18",
  // Hetzner
  "5.9.0.0/16", "78.46.0.0/15", "88.99.0.0/16", "168.119.0.0/16", "116.202.0.0/16",
  // OVH
  "51.68.0.0/14", "54.36.0.0/14", "141.94.0.0/16", "145.239.0.0/16",
  // Common commercial VPN/proxy-hosting ranges
  "185.220.100.0/22", // Tor exit-node-heavy block, well documented
];

function ipToInt(ip) {
  const parts = String(ip).split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function inCidr(ipInt, cidr) {
  const [rangeIp, bitsStr] = cidr.split("/");
  const rangeInt = ipToInt(rangeIp);
  const bits = Number(bitsStr);
  if (rangeInt === null || !Number.isFinite(bits)) return false;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

// Strips an IPv4-mapped-IPv6 prefix ("::ffff:1.2.3.4") some proxies/load
// balancers add, so the plain-IPv4 CIDR checks above still match.
function normalizeIp(ip) {
  const s = String(ip || "").trim();
  const m = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  return m ? m[1] : s;
}

function isLikelyVpnOrProxy(ip) {
  const normalized = normalizeIp(ip);
  const ipInt = ipToInt(normalized);
  if (ipInt === null) return false; // not a plain IPv4 address (e.g. IPv6, empty) — not checked
  return DATACENTER_RANGES.some((range) => inCidr(ipInt, range));
}

module.exports = { isLikelyVpnOrProxy };
