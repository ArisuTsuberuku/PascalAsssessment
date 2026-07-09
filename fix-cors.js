const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

async function configureBucketCors() {
  try {
    const corsConfiguration = JSON.parse(fs.readFileSync('./cors.json', 'utf8'));

    // Try explicit project ID
    const storage = new Storage({
      projectId: 'pascalassessment',
    });

    const bucketsToTry = [
      'pascalassessment.firebasestorage.app',
      'pascalassessment.appspot.com'
    ];

    for (const bucketName of bucketsToTry) {
      try {
        console.log(`\nĐang thử đặt CORS cho bucket: ${bucketName}...`);
        await storage.bucket(bucketName).setCorsConfiguration(corsConfiguration);
        console.log(`>>> THÀNH CÔNG! Đã cập nhật CORS cho bucket: ${bucketName}`);
        return;
      } catch (err) {
        console.log(`   [Không thành công với ${bucketName}]: ${err.message}`);
      }
    }

    console.error('\n>>> LƯU Ý: Nếu chạy trên máy local bị lỗi xác thực/không tìm thấy bucket, cách nhanh nhất 100% thành công là chạy lệnh gcloud trên Google Cloud Shell (trình duyệt).');
  } catch (error) {
    console.error('ERROR updating CORS:', error.message);
  }
}

configureBucketCors();
