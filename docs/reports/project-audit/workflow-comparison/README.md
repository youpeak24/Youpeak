# Workflow comparison supporting files

Start with `../workflow-current-project-comparison.md`.

- `line-ledger.csv`: one row for every one of the 1,734 input lines. Original text is preserved. Comparison references point to grouped interpretations in the main report. Formatting, separators and copied table fragments are not independent test cases.
- `source-manifest.json`: SHA-256 hashes of 58 targeted evidence files. Review consisted of whole-file reads, excerpts and searches as applicable; this is not a claim that every line of every source file was audited.
- `coverage.json`: input path/hash, input and ledger line counts, date and verification limits.
- `build-ledger.ps1`: reproducible ledger/manifest generation. It reads the workflow and source; writes only the supporting report files. It does not run application tests or access production.

The comparison describes local working files on 9 October 2026. Production configuration, deployments, payment-provider accounts, worker hosting and real mobile/browser flows were not verified by this review.
