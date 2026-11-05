/**
 * Ad Credits Idempotent Migration Dry-Run Script.
 *
 * Scans existing Firestore / DB data:
 *   - users.adCreditsBalance and users.adCreditsGranted
 *   - adCreditLedger (historical grants from Starter Passes)
 *   - digitalPartnerProfiles.adCreditsBalance
 *
 * Rules strictly enforced:
 *   - 100% DRY RUN: Does NOT mutate production database.
 *   - Traceable provenance: Identifies exact source (Starter Pass vs Partner License).
 *   - No duplicated grants: Checks existing adCreditLots.
 *   - No invented historical dates or retroactive expiry: Plan credits are non-expiring (expiresAt: null).
 *   - Emits structured report to docs/reports/project-audit/ad-credits/migration-dryrun-report.json and .md
 */
"use strict";

const fs = require("fs");
const path = require("path");

// Allow safe execution from root or functions/backend
const backendDir = path.resolve(__dirname, "../functions/backend");
process.chdir(backendDir);

const db = require(path.join(backendDir, "util/connection"));
const adCreditWallet = require(path.join(backendDir, "util/adCreditWallet.service"));

async function runDryRunMigration({ customDb = null, fixtures = null, skipFileWrite = false } = {}) {
  console.log("==================================================================");
  console.log("       YOUPEAK AD CREDITS IDEMPOTENT MIGRATION (DRY RUN)          ");
  console.log("==================================================================");
  console.log("Mode: READ-ONLY AUDIT & DRY RUN (No writes will be committed)\n");

  const database = customDb || db;

  const report = {
    executedAt: new Date().toISOString(),
    isDryRun: true,
    summary: {
      usersWithAdCredits: 0,
      totalTaskerCredits: 0,
      partnersWithAdCredits: 0,
      totalPartnerCredits: 0,
      overlapAccountsDetected: 0,
      proposedLotsCount: 0,
      proposedCreditsTotal: 0,
    },
    findings: [],
    proposedLots: [],
    overlapAnalysis: [],
  };

  try {
    // 1. Scan users collection
    console.log("1. Scanning users with ad credits...");
    const users = fixtures?.users || (await database.find("users", {}));
    const usersWithCredits = users.filter((u) => Number(u.adCreditsBalance || 0) > 0 || Number(u.adCreditsGranted || 0) > 0);
    report.summary.usersWithAdCredits = usersWithCredits.length;

    // 2. Scan digitalPartnerProfiles collection
    console.log("2. Scanning digitalPartnerProfiles with ad credits...");
    const partnerProfiles = fixtures?.digitalPartnerProfiles || (await database.find("digitalPartnerProfiles", {}));
    const partnersWithCredits = partnerProfiles.filter((p) => Number(p.adCreditsBalance || 0) > 0 || Number(p.adCreditsGranted || 0) > 0);
    report.summary.partnersWithAdCredits = partnersWithCredits.length;

    // 3. Scan existing adCreditLedger
    console.log("3. Scanning existing adCreditLedger entries...");
    const existingLedger = fixtures?.adCreditLedger || (await database.find("adCreditLedger", {}));

    // 4. Scan existing adCreditLots (to verify idempotency)
    console.log("4. Scanning existing adCreditLots...");
    const existingLots = fixtures?.adCreditLots || (await database.find("adCreditLots", {}));

    console.log(`Found:
  - ${usersWithCredits.length} user(s) with adCreditsBalance > 0
  - ${partnersWithCredits.length} partner profile(s) with adCreditsBalance > 0
  - ${existingLedger.length} existing adCreditLedger entries
  - ${existingLots.length} existing adCreditLots\n`);

    // 5. Analyze user accounts (Tasker Starter Pass provenance)
    for (const u of usersWithCredits) {
      const uid = String(u._id || u.id);
      const balance = adCreditWallet.toDecimal2(u.adCreditsBalance || 0);
      report.summary.totalTaskerCredits = adCreditWallet.toDecimal2(report.summary.totalTaskerCredits + balance);

      // Check for overlap with partner profile
      const partnerDoc = partnersWithCredits.find((p) => String(p.userId || p._id || p.id) === uid);
      const hasOverlap = !!partnerDoc;
      if (hasOverlap) {
        report.summary.overlapAccountsDetected++;
        report.overlapAnalysis.push({
          userId: uid,
          userAdCreditsBalance: balance,
          partnerAdCreditsBalance: adCreditWallet.toDecimal2(partnerDoc.adCreditsBalance || 0),
          finding: "User has both personal tasker adCreditsBalance and digitalPartnerProfile adCreditsBalance. They are distinct accounts and must not be blindly merged into one bucket.",
        });
      }

      // Check if lot already exists
      const alreadyHasLot = existingLots.some((l) => String(l.userId) === uid && l.source === "STARTER_PASS");
      if (alreadyHasLot) {
        report.findings.push({
          userId: uid,
          balance,
          action: "SKIPPED_ALREADY_MIGRATED",
          reason: "User already has active/exhausted STARTER_PASS lot in adCreditLots.",
        });
      } else {
        const proposedLot = {
          userId: uid,
          source: "STARTER_PASS",
          type: "PLAN",
          amount: balance,
          remaining: balance,
          expiresAt: null, // Non-expiring per approved decision
          provenance: {
            membershipTierId: u.membershipTierId || null,
            originalAdCreditsGranted: u.adCreditsGranted || balance,
          },
        };
        report.proposedLots.push(proposedLot);
        report.summary.proposedLotsCount++;
        report.summary.proposedCreditsTotal = adCreditWallet.toDecimal2(report.summary.proposedCreditsTotal + balance);
      }
    }

    // 6. Analyze digital partner profiles
    for (const p of partnersWithCredits) {
      const uid = String(p.userId || p._id || p.id);
      const pBalance = adCreditWallet.toDecimal2(p.adCreditsBalance || 0);
      report.summary.totalPartnerCredits = adCreditWallet.toDecimal2(report.summary.totalPartnerCredits + pBalance);

      const alreadyHasPartnerLot = existingLots.some((l) => String(l.userId) === uid && l.source === "PARTNER_LICENSE");
      if (!alreadyHasPartnerLot && pBalance > 0) {
        report.proposedLots.push({
          userId: uid,
          source: "PARTNER_LICENSE",
          type: "PLAN",
          amount: pBalance,
          remaining: pBalance,
          expiresAt: null, // Non-expiring per approved decision
          provenance: {
            digitalPartnerProfileId: String(p._id || p.id),
            agencyId: p.agencyId || null,
          },
        });
        report.summary.proposedLotsCount++;
        report.summary.proposedCreditsTotal = adCreditWallet.toDecimal2(report.summary.proposedCreditsTotal + pBalance);
      }
    }

    // 7. Output reports
    if (!skipFileWrite) {
      const reportDir = path.resolve(__dirname, "../docs/docs/reports/project-audit/ad-credits");
      fs.mkdirSync(reportDir, { recursive: true });

      const jsonPath = path.join(reportDir, "migration-dryrun-report.json");
      fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

      const mdContent = `# YouPeak Ad Credits — Idempotent Migration Dry-Run Report

**Execution Time**: ${report.executedAt}  
**Status**: READ-ONLY SIMULATION (Dry Run) — No database records mutated.  

---

## 1. Executive Summary

| Metric | Value |
|---|---|
| **Users with Ad Credits (\`users.adCreditsBalance\`)** | ${report.summary.usersWithAdCredits} |
| **Total Tasker Ad Credits** | ${report.summary.totalTaskerCredits.toFixed(2)} |
| **Partners with Ad Credits (\`digitalPartnerProfiles\`)** | ${report.summary.partnersWithAdCredits} |
| **Total Partner Ad Credits** | ${report.summary.totalPartnerCredits.toFixed(2)} |
| **Overlap Accounts Detected** | ${report.summary.overlapAccountsDetected} |
| **Proposed Opening Lots** | ${report.summary.proposedLotsCount} |
| **Total Credits to Migrate** | ${report.summary.proposedCreditsTotal.toFixed(2)} |

---

## 2. Balance Overlap & Provenance Findings

${
  report.overlapAnalysis.length === 0
    ? "No colliding accounts detected between Tasker user balances and Digital Partner profiles."
    : report.overlapAnalysis
        .map(
          (o) =>
            `- **User \`${o.userId}\`**: User Balance = ${o.userAdCreditsBalance.toFixed(2)} | Partner Balance = ${o.partnerAdCreditsBalance.toFixed(2)}\n  *Analysis*: ${o.finding}`
        )
        .join("\n\n")
}

---

## 3. Migration Plan & Safety Guarantees

1. **Zero Double-Counting**:
   - Tasker pass credits are isolated with \`source: "STARTER_PASS"\`.
   - Partner license credits are isolated with \`source: "PARTNER_LICENSE"\`.
2. **Permanent Plan Validity**:
   - Per approved requirements, all legacy Starter Pass and Partner License credits are assigned \`type: "PLAN"\` and \`expiresAt: null\` (non-expiring).
   - No retroactive expiry dates are invented.
3. **Traceability**:
   - Opening ledger entries will explicitly link back to original tier or partner profile records.
4. **Production Readiness**:
   - This migration script is purely a dry-run validator. No live database writes are performed during this task.
`;

      const mdPath = path.join(reportDir, "migration-dryrun-report.md");
      fs.writeFileSync(mdPath, mdContent, "utf8");

      console.log(`Dry-run report generated successfully:
  - JSON: ${jsonPath}
  - Markdown: ${mdPath}\n`);
    }

    return report;
  } catch (error) {
    console.error("Migration dry run error:", error);
    throw error;
  }
}

if (require.main === module) {
  runDryRunMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runDryRunMigration };
