const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const settings = require('../functions/backend/setting.js');

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${settings.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: settings.r2AccessKeyId,
        secretAccessKey: settings.r2SecretAccessKey
    }
});

async function setCors() {
    console.log("Configuring CORS policy on Cloudflare R2 bucket...");
    try {
        await s3Client.send(new PutBucketCorsCommand({
            Bucket: settings.r2BucketName,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["GET", "HEAD", "PUT", "POST", "DELETE"],
                        AllowedOrigins: ["*"],
                        ExposeHeaders: ["ETag"],
                        MaxAgeSeconds: 3600
                    }
                ]
            }
        }));
        console.log("✅ CORS successfully enabled on Cloudflare R2 bucket!");
    } catch (err) {
        console.log("ℹ️ CORS setting result:", err.message);
    }
    process.exit(0);
}

setCors();
