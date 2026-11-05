// Read-only production diagnosis for the upload failure and the tasking
// setting. Run under `vercel env run -e production --`. Prints only
// non-secret facts: presence booleans, public hostnames, CORS rules and the
// stored value of allowWebTasking. Writes nothing.
"use strict";
const path = require('path');
const backend = path.resolve(__dirname, '../../../../functions/backend');
process.env.NODE_ENV = 'production';
const admin = require(path.join(backend, 'util/firebaseAdmin'));
const { S3Client, GetBucketCorsCommand } = require(path.join(backend, '../../node_modules/@aws-sdk/client-s3'));

const host = (u) => { try { return new URL(u).host; } catch (_) { return u ? '(not a URL)' : ''; } };
(async () => {
  const out = { env: {}, settingsDoc: {}, r2Cors: null };
  for (const k of ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_R2_ACCESS_KEY', 'CLOUDFLARE_R2_SECRET_KEY', 'CLOUDFLARE_R2_BUCKET', 'CLOUDFLARE_R2_PUBLIC_DOMAIN', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_STREAM_CUSTOMER_CODE']) out.env[k] = Boolean(process.env[k]);
  out.env.bucketName = process.env.CLOUDFLARE_R2_BUCKET || '(default youpeak-videos)';

  const projectId = admin.app().options.projectId || process.env.FIREBASE_PROJECT_ID;
  out.firebaseProject = projectId;
  const snap = await admin.firestore().collection('settings').get();
  out.settingsDocs = snap.docs.map((d) => d.id);
  for (const d of snap.docs) {
    const s = d.data();
    out.settingsDoc[d.id] = {
      allowWebTasking: 'allowWebTasking' in s ? s.allowWebTasking : '(absent: code default applies)',
      r2PublicDomainHost: host(s.r2PublicDomain || s.r2CdnUrl || ''),
      r2KeysInDoc: Boolean(s.r2AccessKeyId || s.cloudflareR2AccessKey),
      blockTasksOnVpn: s.blockTasksOnVpn,
    };
  }
  const policy = await admin.firestore().collection('system_configs').doc('app_policy').get();
  out.appPolicy = policy.exists ? { allowWebTasking: policy.data().security?.allowWebTasking, publishedAt: policy.data().publishedAt } : null;

  const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || Object.values(snap.docs.map((d) => d.data())).map((s) => s.r2PublicDomain || s.r2CdnUrl).find(Boolean) || '';
  out.effectiveR2PublicDomainHost = host(publicDomain) || '(none: presigned uploads are refused with R2_DELIVERY_NOT_CONFIGURED)';

  const s0 = snap.docs[0] ? snap.docs[0].data() : {};
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || s0.r2AccountId || s0.cloudflareAccountId;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY || s0.r2AccessKeyId || s0.cloudflareR2AccessKey;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_KEY || s0.r2SecretAccessKey || s0.cloudflareR2SecretKey;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET || s0.r2BucketName || 'youpeak-videos';
  if (accountId && accessKeyId && secretAccessKey) {
    const s3 = new S3Client({ region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
    try {
      const cors = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
      out.r2Cors = (cors.CORSRules || []).map((r) => ({ origins: r.AllowedOrigins, methods: r.AllowedMethods, headers: r.AllowedHeaders, maxAge: r.MaxAgeSeconds }));
    } catch (e) {
      out.r2Cors = { error: e.name || 'error', status: e.$metadata?.httpStatusCode };
    }
  } else out.r2Cors = { error: 'R2 credentials not configured' };
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
})().catch((e) => { console.log('ERROR', (e && (e.code || e.name)) || 'unknown', String(e && e.message || '').replace(/[A-Za-z0-9+/=_-]{30,}/g, '<redacted>').slice(0, 200)); process.exit(1); });
