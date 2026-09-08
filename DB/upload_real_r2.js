const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const settings = require('../functions/backend/setting.js');

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${settings.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: settings.r2AccessKeyId,
        secretAccessKey: settings.r2SecretAccessKey
    }
});

async function uploadRealMediaToR2() {
    console.log("Downloading real sample MP4 video from MDN Web Docs...");
    
    // Download valid MP4 video from MDN official test asset
    const videoSampleUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
    const videoResponse = await axios.get(videoSampleUrl, { 
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const realVideoBuffer = Buffer.from(videoResponse.data);
    console.log(`Downloaded real MP4 sample video (${realVideoBuffer.length} bytes).`);

    // Valid Base64 JPEG Image buffer (Red/Blue gradient test thumbnail)
    const imageSampleUrl = "https://picsum.photos/400/300";
    let realImageBuffer;
    try {
        const imageResponse = await axios.get(imageSampleUrl, { 
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        realImageBuffer = Buffer.from(imageResponse.data);
        console.log(`Downloaded real JPG sample thumbnail (${realImageBuffer.length} bytes).`);
    } catch (e) {
        // Fallback minimal JPEG
        realImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        console.log("Used fallback valid image buffer.");
    }

    const dbPath = path.join(__dirname, 'videos.json');
    let videos = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    for (const video of videos) {
        const videoId = String(video._id?.$oid || video._id || video.id);
        
        console.log(`\nProcessing: ${video.title} (${videoId})`);

        // Upload Video (.mp4)
        const videoKey = `videos/${videoId}.mp4`;
        console.log(`Uploading real MP4 to Cloudflare R2 -> ${settings.r2BucketName}/${videoKey}`);
        await s3Client.send(new PutObjectCommand({
            Bucket: settings.r2BucketName,
            Key: videoKey,
            Body: realVideoBuffer,
            ContentType: 'video/mp4'
        }));
        console.log(`✅ Real MP4 upload successful: ${settings.r2PublicDomain}/${videoKey}`);

        // Upload Thumbnail (.jpg)
        const thumbKey = `thumbnails/${videoId}.jpg`;
        console.log(`Uploading real JPG to Cloudflare R2 -> ${settings.r2BucketName}/${thumbKey}`);
        await s3Client.send(new PutObjectCommand({
            Bucket: settings.r2BucketName,
            Key: thumbKey,
            Body: realImageBuffer,
            ContentType: 'image/jpeg'
        }));
        console.log(`✅ Real Thumbnail upload successful: ${settings.r2PublicDomain}/${thumbKey}`);
    }

    console.log("\nAll real playable MP4 videos & thumbnails successfully uploaded to Cloudflare R2!");
    process.exit(0);
}

uploadRealMediaToR2().catch(err => {
    console.error("Upload error:", err.message || err);
    process.exit(1);
});
