const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const settings = require('../functions/backend/setting.js');

async function uploadVideosToR2() {
    console.log("Starting upload of Videos and Shorts to Cloudflare R2...");
    
    const r2Client = new S3Client({
        region: "auto",
        endpoint: settings.r2Endpoint,
        credentials: {
            accessKeyId: settings.r2AccessKeyId,
            secretAccessKey: settings.r2SecretAccessKey,
        },
    });

    const dbDir = __dirname;
    const filePath = path.join(dbDir, 'videos.json');
    const videos = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Create dummy buffers
    const dummyVideoBuffer = Buffer.alloc(1024 * 1024 * 2); // 2MB
    const dummyThumbBuffer = Buffer.alloc(1024 * 100); // 100KB

    for (const video of videos) {
        if (!video.videoUrl) continue;
        
        console.log(`\nProcessing: ${video.title} (${video._id})`);
        
        try {
            const ext = '.mp4';
            const fileName = `${video._id}${ext}`;
            const key = `videos/${fileName}`;
            
            console.log(`Uploading to Cloudflare R2 -> ${settings.r2BucketName}/${key}`);
            
            const command = new PutObjectCommand({
                Bucket: settings.r2BucketName,
                Key: key,
                Body: dummyVideoBuffer,
                ContentType: "video/mp4",
            });
            
            await r2Client.send(command);
            console.log(`✅ Upload successful: ${settings.r2PublicDomain}/${key}`);
            
            const thumbKey = `thumbnails/${video._id}.jpg`;
            const thumbCommand = new PutObjectCommand({
                Bucket: settings.r2BucketName,
                Key: thumbKey,
                Body: dummyThumbBuffer,
                ContentType: "image/jpeg",
            });
            await r2Client.send(thumbCommand);
            console.log(`✅ Thumbnail upload successful: ${settings.r2PublicDomain}/${thumbKey}`);

        } catch (error) {
            console.error(`❌ Failed to process ${video._id}:`, error.message);
        }
    }
    
    console.log("\nAll video & short files have been processed and uploaded to Cloudflare R2.");
    process.exit(0);
}

uploadVideosToR2().catch(console.error);
