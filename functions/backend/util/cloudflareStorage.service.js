const axios = require("axios");
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs");

/**
 * Cloudflare Stream & R2 Media Management Service
 */
class CloudflareStorageService {
  // Credentials are resolved lazily, per call, in this order:
  //   1. environment variables (preferred for production)
  //   2. the admin-managed Firestore `settings` doc (global.settingJSON)
  // No credentials are hard-coded in source.
  _cfg() {
    const s = global.settingJSON || {};
    return {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID || s.r2AccountId || s.cloudflareAccountId || "",
      apiToken: process.env.CLOUDFLARE_API_TOKEN || s.cloudflareApiToken || "",
      r2AccessKey: process.env.CLOUDFLARE_R2_ACCESS_KEY || s.r2AccessKeyId || s.cloudflareR2AccessKey || "",
      r2SecretKey: process.env.CLOUDFLARE_R2_SECRET_KEY || s.r2SecretAccessKey || s.cloudflareR2SecretKey || "",
      r2BucketName: process.env.CLOUDFLARE_R2_BUCKET || s.r2BucketName || s.cloudflareR2Bucket || "youpeak-videos",
      r2PublicDomain: process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || s.r2PublicDomain || s.r2CdnUrl || "",
      streamCustomerCode: process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE || s.cloudflareStreamCustomerCode || "",
    };
  }

  get accountId() { return this._cfg().accountId; }
  get apiToken() { return this._cfg().apiToken; }
  get r2BucketName() { return this._cfg().r2BucketName; }
  get r2PublicDomain() { return this._cfg().r2PublicDomain; }
  get streamCustomerCode() { return this._cfg().streamCustomerCode; }

  isConfigured() {
    const c = this._cfg();
    return Boolean(c.accountId && c.r2AccessKey && c.r2SecretKey);
  }

  getS3Client() {
    const c = this._cfg();
    if (!c.accountId || !c.r2AccessKey || !c.r2SecretKey) {
      throw new Error(
        "Cloudflare R2 is not configured. Set CLOUDFLARE_ACCOUNT_ID / " +
        "CLOUDFLARE_R2_ACCESS_KEY / CLOUDFLARE_R2_SECRET_KEY (env), or the " +
        "r2AccountId / r2AccessKeyId / r2SecretAccessKey fields in admin settings."
      );
    }
    return new S3Client({
      region: "auto",
      endpoint: `https://${c.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: c.r2AccessKey,
        secretAccessKey: c.r2SecretKey,
      },
    });
  }

  /**
   * Generate presigned GET URL for an R2 object
   */
  async getPresignedUrl(destinationKey, expiresInSeconds = 604800) { // 7 days default
    try {
      const client = this.getS3Client();
      const command = new GetObjectCommand({
        Bucket: this.r2BucketName,
        Key: destinationKey,
      });
      return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    } catch (err) {
      console.error("❌ Error generating R2 presigned URL:", err.message);
      return null;
    }
  }

  /**
   * Create direct video upload URL for Cloudflare Stream
   */
  async createStreamDirectUpload(maxDurationSeconds = 3600) {
    try {
      if (!this.accountId || !this.apiToken) {
        console.log("ℹ️ Cloudflare Stream credentials not set, returning local mock upload URL.");
        return {
          uploadURL: "",
          uid: `cf_mock_${Date.now()}`,
          streamPlaybackUrl: "",
        };
      }

      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/direct_upload`,
        { maxDurationSeconds },
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = response.data.result;
      const code = this.streamCustomerCode;
      const base = code
        ? `https://customer-${code}.cloudflarestream.com/${result.uid}`
        : `https://videodelivery.net/${result.uid}`;
      return {
        uploadURL: result.uploadURL,
        uid: result.uid,
        streamPlaybackUrl: `${base}/manifest/video.m3u8`,
        thumbnailUrl: `${base}/thumbnails/thumbnail.jpg`,
      };
    } catch (error) {
      console.error("❌ Cloudflare Stream upload error:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload video file directly to Cloudflare R2 storage
   */
  async uploadToCloudflareR2(filePath, destinationKey, mimeType = "video/mp4") {
    try {
      const r2Client = this.getS3Client();
      const fileBuffer = fs.readFileSync(filePath);
      const command = new PutObjectCommand({
        Bucket: this.r2BucketName,
        Key: destinationKey,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await r2Client.send(command);

      // Prefer a stable public/CDN URL when a domain is configured; otherwise
      // fall back to a time-limited presigned URL.
      const domain = this.r2PublicDomain;
      const publicUrl = domain
        ? `${domain.replace(/\/$/, "")}/${destinationKey}`
        : (await this.getPresignedUrl(destinationKey));

      console.log("✅ Video file successfully uploaded to Cloudflare R2:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("❌ Cloudflare R2 upload error:", error.message);
      return null;
    }
  }
}

module.exports = new CloudflareStorageService();
