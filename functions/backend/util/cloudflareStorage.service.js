const axios = require("axios");
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs");

/**
 * Cloudflare Stream & R2 Media Management Service
 */
class CloudflareStorageService {
  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || global.settingJSON?.r2AccountId || global.settingJSON?.cloudflareAccountId || "da97865a5caa8f2b10c795c92912615e";
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN || global.settingJSON?.cloudflareApiToken || "";
    this.r2AccessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY || global.settingJSON?.r2AccessKeyId || global.settingJSON?.cloudflareR2AccessKey || "cdb9bca482d4459a3d9a99533d71939b";
    this.r2SecretKey = process.env.CLOUDFLARE_R2_SECRET_KEY || global.settingJSON?.r2SecretAccessKey || global.settingJSON?.cloudflareR2SecretKey || "9d2946e08c57db8ed33ef5d29044d066c73274b103d26d3ae43e7ba2a12582df";
    this.r2BucketName = process.env.CLOUDFLARE_R2_BUCKET || global.settingJSON?.r2BucketName || global.settingJSON?.cloudflareR2Bucket || "youpeak-videos";
    this.r2PublicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || global.settingJSON?.r2PublicDomain || global.settingJSON?.r2CdnUrl || global.settingJSON?.cloudflareR2PublicDomain || "";
  }

  getS3Client() {
    const accountId = this.accountId || "da97865a5caa8f2b10c795c92912615e";
    const accessKeyId = this.r2AccessKey || "cdb9bca482d4459a3d9a99533d71939b";
    const secretAccessKey = this.r2SecretKey || "9d2946e08c57db8ed33ef5d29044d066c73274b103d26d3ae43e7ba2a12582df";

    return new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
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
      const r2Client = this.getS3Client();
      const fileBuffer = fs.readFileSync(filePath);
      const command = new PutObjectCommand({
        Bucket: this.r2BucketName,
        Key: destinationKey,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await r2Client.send(command);

      // Generate accessible presigned URL
      const presignedUrl = await this.getPresignedUrl(destinationKey);
      const publicUrl = presignedUrl || `${this.r2PublicDomain || "https://youpeak-videos.da97865a5caa8f2b10c795c92912615e.r2.cloudflarestorage.com"}/${destinationKey}`;

      console.log("✅ Video file successfully uploaded to Cloudflare R2:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("❌ Cloudflare R2 upload error:", error.message);
      return null;
    }
  }
}

module.exports = new CloudflareStorageService();
