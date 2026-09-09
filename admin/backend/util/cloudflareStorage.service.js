const axios = require("axios");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");

/**
 * Cloudflare Stream & R2 Media Management Service
 */
class CloudflareStorageService {
  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || global.settingJSON?.r2AccountId || global.settingJSON?.cloudflareAccountId || "";
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN || global.settingJSON?.cloudflareApiToken || "";
    this.r2AccessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY || global.settingJSON?.r2AccessKeyId || global.settingJSON?.cloudflareR2AccessKey || "";
    this.r2SecretKey = process.env.CLOUDFLARE_R2_SECRET_KEY || global.settingJSON?.r2SecretAccessKey || global.settingJSON?.cloudflareR2SecretKey || "";
    this.r2BucketName = process.env.CLOUDFLARE_R2_BUCKET || global.settingJSON?.r2BucketName || global.settingJSON?.cloudflareR2Bucket || "youpeak-videos";
    this.r2PublicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || global.settingJSON?.r2PublicDomain || global.settingJSON?.r2CdnUrl || global.settingJSON?.cloudflareR2PublicDomain || "";
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
      return {
        uploadURL: result.uploadURL,
        uid: result.uid,
        streamPlaybackUrl: `https://videodelivery.net/${result.uid}/manifest/video.m3u8`,
        thumbnailUrl: `https://videodelivery.net/${result.uid}/thumbnails/thumbnail.jpg`,
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
      if (!this.r2AccessKey || !this.r2SecretKey || !this.accountId) {
        console.log("ℹ️ Cloudflare R2 credentials not configured, skipping R2 upload.");
        return null;
      }

      const r2Client = new S3Client({
        region: "auto",
        endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.r2AccessKey,
          secretAccessKey: this.r2SecretKey,
        },
      });

      const fileBuffer = fs.readFileSync(filePath);
      const command = new PutObjectCommand({
        Bucket: this.r2BucketName,
        Key: destinationKey,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await r2Client.send(command);

      const publicUrl = this.r2PublicDomain
        ? `${this.r2PublicDomain}/${destinationKey}`
        : `https://${this.r2BucketName}.${this.accountId}.r2.cloudflarestorage.com/${destinationKey}`;

      console.log("✅ Video file successfully uploaded to Cloudflare R2:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("❌ Cloudflare R2 upload error:", error.message);
      return null;
    }
  }
}

module.exports = new CloudflareStorageService();
