const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config();

const region = process.env.AWS_REGION || "ap-southeast-1";
const bucketName =
  process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET || "services";

const accessKeyId =
  process.env.AWS_ACCESS_KEY_ID ||
  process.env.AWS_KEY ||
  process.env.SUPABASE_S3_ACCESS_KEY;
const secretAccessKey =
  process.env.AWS_SECRET_ACCESS_KEY ||
  process.env.AWS_SECRET ||
  process.env.SUPABASE_S3_SECRET_KEY;

let s3Client = null;

function getS3Client() {
  if (s3Client) return s3Client;

  if (!accessKeyId || !secretAccessKey) {
    const error = new Error(
      "AWS S3 belum dikonfigurasi. Harap isi AWS_ACCESS_KEY_ID dan AWS_SECRET_ACCESS_KEY di backend/.env."
    );
    error.status = 503;
    throw error;
  }

  const clientConfig = {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };

  // Support custom endpoint (e.g. Supabase S3, MinIO, Cloudflare R2)
  if (process.env.AWS_ENDPOINT) {
    clientConfig.endpoint = process.env.AWS_ENDPOINT;
    clientConfig.forcePathStyle = true;
  } else if (process.env.SUPABASE_URL && process.env.USE_SUPABASE_S3 === "true") {
    try {
      const projectRef = new URL(process.env.SUPABASE_URL).hostname.split(".")[0];
      clientConfig.endpoint = `https://${projectRef}.storage.supabase.co/v1/s3`;
      clientConfig.forcePathStyle = true;
    } catch {
      // fallback to standard S3
    }
  }

  s3Client = new S3Client(clientConfig);
  return s3Client;
}

/**
 * Upload a binary buffer to S3 and return its public URL
 */
async function uploadToS3(buffer, key, contentType) {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  // Return public URL
  if (process.env.AWS_PUBLIC_URL) {
    const baseUrl = process.env.AWS_PUBLIC_URL.replace(/\/$/, "");
    return `${baseUrl}/${key}`;
  }

  if (process.env.AWS_ENDPOINT) {
    const endpoint = process.env.AWS_ENDPOINT.replace(/\/$/, "");
    return `${endpoint}/${bucketName}/${key}`;
  }

  if (process.env.SUPABASE_URL && process.env.USE_SUPABASE_S3 === "true") {
    return `${process.env.SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${bucketName}/${key}`;
  }

  // Standard AWS S3 public URL format
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Process base64 image data from request and upload to AWS S3
 */
async function uploadServiceImage(imageData) {
  if (!imageData) return null;

  const match = imageData.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) {
    const error = new Error("Foto harus berupa JPG, PNG, atau WEBP.");
    error.status = 400;
    throw error;
  }

  const [, contentType, encodedImage] = match;
  const extension = contentType.split("/")[1].replace("jpeg", "jpg");
  const filePath = `services/${crypto.randomUUID()}.${extension}`;
  const fileBuffer = Buffer.from(encodedImage, "base64");

  return await uploadToS3(fileBuffer, filePath, contentType);
}

module.exports = {
  getS3Client,
  uploadToS3,
  uploadServiceImage,
};
