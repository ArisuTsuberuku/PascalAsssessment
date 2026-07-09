const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ projectId: 'pascalassessmentsys' }); 
const bucketName = 'pascalassessmentsys.firebasestorage.app';

async function configureBucketCors() {
  try {
    await storage.bucket(bucketName).setCorsConfiguration(require('./cors.json'));
    console.log(`Successfully set CORS for bucket: ${bucketName}`);
  } catch (error) {
    console.error('Error setting CORS:', error.message || error);
    console.log('Fallback: Please run this manually: gsutil cors set cors.json gs://pascalassessmentsys.firebasestorage.app');
  }
}
configureBucketCors();
