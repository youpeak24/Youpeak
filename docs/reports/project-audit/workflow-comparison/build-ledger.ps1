$ErrorActionPreference = 'Stop'
$workflowPath = 'E:\Legendary One\youpeak\documents\new\work flow.txt'
$repoRoot = 'E:\Legendary One\youpeak\source'
$outputDir = Join-Path $repoRoot 'reports\project-audit\workflow-comparison'
$workflowLines = Get-Content -LiteralPath $workflowPath
# Range labels provide traceability to grouped interpretations, not independent test results.
$sections = @(
    @(1, 50, 'A', 'Digital Partner TRS', 'DP-01 to DP-09'),
    @(52, 89, 'A', 'Digital Partner TRS restatement', 'DP-01 to DP-09; duplicate of lines 1-50'),
    @(92, 95, 'B', 'Legacy VIP fragment', 'OLD-VIP'),
    @(100, 129, 'B', 'District franchise transcript', 'DIST-01 to DIST-04'),
    @(135, 280, 'C', 'Original August Tasker terms', 'T-01 to T-12; old caps conflict with V9'),
    @(285, 334, 'D', 'Promotion rate card', 'PROMO-01 to PROMO-06'),
    @(337, 493, 'C', 'Tasker terms V2', 'T-01 to T-12; old caps and payout conflict with V9'),
    @(497, 554, 'E', 'Creator VIP V6', 'VIP-01 to VIP-05'),
    @(560, 761, 'C', 'Tasker terms V9', 'T-01 to T-12; tier comparison table'),
    @(765, 892, 'F', 'Vibe Media website copy', 'VIBE-01 to VIBE-05'),
    @(899, 955, 'G', 'Peak Partner payout policy', 'REF-01 to REF-07'),
    @(960, 986, 'H', 'Web and mobile integration', 'ACCESS-01 to ACCESS-04'),
    @(991, 1063, 'I', 'Reward payout and anti-fraud brief', 'SEC-01 to SEC-10'),
    @(1068, 1145, 'J', 'Content moderation', 'MOD-01 to MOD-06'),
    @(1151, 1222, 'K', 'Copyright and duplicate detection', 'COPY-01 to COPY-05'),
    @(1228, 1294, 'L', 'HLS and media architecture', 'MEDIA-01 to MEDIA-06'),
    @(1299, 1352, 'H', 'Final domain and app blueprint', 'ACCESS-01 to ACCESS-04'),
    @(1356, 1512, 'C', 'Repeated Tasker terms V2', 'T-01 to T-12; repeated earlier V2'),
    @(1518, 1568, 'M', 'Peak Boost UI V1', 'BOOST-01 to BOOST-08'),
    @(1572, 1650, 'M', 'Peak Boost feature V4', 'BOOST-01 to BOOST-08'),
    @(1655, 1725, 'N', 'UI UX v3', 'UI-01 to UI-07')
)
$rows = for ($i = 0; $i -lt $workflowLines.Count; $i++) {
    $lineNumber = $i + 1
    $originalText = $workflowLines[$i]
    $trimmed = $originalText.Trim()
    $section = $null
    foreach ($range in $sections) { if ($lineNumber -ge $range[0] -and $lineNumber -le $range[1]) { $section = $range; break } }
    $kind = 'Requirement, descriptive copy, code sample or table fragment; interpret with surrounding lines'
    $note = 'Read; grouped static comparison in report. Not an independently passed runtime test.'
    if ($trimmed -eq '') { $kind = 'Blank separator'; $note = 'No functional requirement.' }
    elseif ($trimmed -match '^[•◦●\s]+$' -or $trimmed -match '^\d+\.$' -or $trimmed -match '^=+$') { $kind = 'Formatting or list marker'; $note = 'No independent functional requirement.' }
    elseif ($trimmed -match 'Page \d+ of \d+|^Page \d|Prepared for|Confidential & Proprietary') { $kind = 'Document footer or provenance'; $note = 'Metadata, not an extra functional requirement.' }
    elseif ($trimmed -match '^[│┌┴┐└┬─▼\s]+$') { $kind = 'Diagram connector'; $note = 'Part of surrounding architecture diagram.' }
    if (-not $section -and $trimmed -ne '') { throw "Unmapped nonblank workflow line $lineNumber" }
    [pscustomobject]@{
        Line = $lineNumber
        OriginalText = $originalText
        Classification = $kind
        Section = if ($section) { $section[3] } else { 'Separator' }
        ReportSection = if ($section) { $section[2] } else { '' }
        ComparisonRefs = if ($section) { $section[4] } else { '' }
        ReviewNote = $note
    }
}
$rows | Export-Csv -LiteralPath (Join-Path $outputDir 'line-ledger.csv') -Encoding utf8 -NoTypeInformation
$sourcePaths = @(
    'functions/backend/types/tiers.js',
    'functions/backend/setting.js',
    'functions/backend/util/rewardEngine.js',
    'functions/backend/util/watchLedger.service.js',
    'functions/backend/util/referral.service.js',
    'functions/backend/util/partnerNetwork.service.js',
    'functions/backend/util/digitalPartner.service.js',
    'functions/backend/util/payoutHold.js',
    'functions/backend/util/payment.service.js',
    'functions/backend/util/platformConfig.js',
    'functions/backend/util/systemConfig.service.js',
    'functions/backend/util/revenueSplit.service.js',
    'functions/backend/util/accessGate.js',
    'functions/backend/util/creatorPass.js',
    'functions/backend/util/taskSecurity.service.js',
    'functions/backend/util/vpnDetection.service.js',
    'functions/backend/util/moderation.service.js',
    'functions/backend/util/copyright.service.js',
    'functions/backend/util/cloudflareStorage.service.js',
    'functions/backend/util/videoPipeline.service.js',
    'functions/backend/controllers/cron.controller.js',
    'functions/backend/controllers/client/payment.controller.js',
    'functions/backend/controllers/client/tasker.controller.js',
    'functions/backend/controllers/client/payout.controller.js',
    'functions/backend/controllers/client/withDrawalRequest.controller.js',
    'functions/backend/controllers/client/partner.controller.js',
    'functions/backend/controllers/client/localBusinessAd.controller.js',
    'functions/backend/controllers/client/videoPromotion.controller.js',
    'functions/backend/controllers/client/creatorTier.controller.js',
    'functions/backend/controllers/client/user.controller.js',
    'functions/backend/controllers/client/userFirestore.controller.js',
    'functions/backend/controllers/client/watchSession.controller.js',
    'functions/backend/controllers/client/video.controller.js',
    'functions/backend/controllers/client/file.controller.js',
    'functions/backend/controllers/client/grievance.controller.js',
    'functions/backend/controllers/admin/contentModeration.controller.js',
    'functions/backend/controllers/admin/copyrightModeration.controller.js',
    'functions/backend/controllers/admin/videoPromotion.controller.js',
    'functions/backend/controllers/admin/franchisePortal.controller.js',
    'functions/backend/middleware/appUser.middleware.js',
    'functions/backend/middleware/bindAppUser.middleware.js',
    'functions/backend/routes/client/user.route.js',
    'functions/backend/routes/client/partner.route.js',
    'functions/backend/routes/client/videoPromotion.route.js',
    'functions/backend/routes/client/localBusinessAd.route.js',
    'worker/fingerprintWorker.js',
    'worker/README.md',
    'youpeak/lib/core/membership/membership_portal.dart',
    'youpeak/lib/core/theme/app_color.dart',
    'youpeak/lib/core/deep_link/services/deep_link_services.dart',
    'youpeak/lib/core/file_upload/direct_upload_video_api.dart',
    'youpeak/lib/features/tasker/presentation/tasker_dashboard_view.dart',
    'youpeak/lib/features/tasker/presentation/tasker_dashboard_provider.dart',
    'youpeak/lib/features/video_promotion/view/promote_video_view.dart',
    'youpeak/lib/features/peak_boost/presentation/peak_boost_bottom_sheet.dart',
    'youpeak/lib/features/peak_boost/data/peak_boost_repository.dart',
    'youpeak/lib/features/home/view/nav_home_page.dart',
    'youpeak/lib/features/home/widget/premium_videos_shelf.dart'
)
$manifest = foreach ($relativePath in $sourcePaths) {
    $absolutePath = Join-Path $repoRoot $relativePath
    [pscustomobject]@{ Path = $relativePath; Sha256 = (Get-FileHash -LiteralPath $absolutePath -Algorithm SHA256).Hash; Review = 'Targeted source evidence: whole file, excerpt or search match as applicable; not whole-project line audit' }
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $outputDir 'source-manifest.json') -Encoding utf8
$metadata = [ordered]@{
    Date = '2026-10-09'
    WorkflowPath = $workflowPath
    WorkflowSha256 = (Get-FileHash -LiteralPath $workflowPath -Algorithm SHA256).Hash
    WorkflowLines = $workflowLines.Count
    LedgerRows = @($rows).Count
    EvidenceFiles = @($manifest).Count
    RuntimeTests = 'Not run for this static comparison'
    ProductionSettings = 'Not read or changed in this comparison'
}
$metadata | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $outputDir 'coverage.json') -Encoding utf8
if (@($rows).Count -ne 1734) { throw 'Unexpected workflow line count; update report before delivery.' }
$metadata | ConvertTo-Json
