/**
 * Vultr Object Storage Integration
 * 
 * This module provides S3-compatible object storage functionality
 * using Vultr's Object Storage service for storing room images,
 * generated designs, and 3D model assets.
 * 
 * Vultr Object Storage is S3-compatible, so we use the AWS SDK.
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Vultr Object Storage configuration
const VULTR_OBJECT_STORAGE_CONFIG = {
  hostname: process.env.VULTR_OBJECT_STORAGE_HOSTNAME || '',
  accessKey: process.env.VULTR_OBJECT_STORAGE_ACCESS_KEY || '',
  secretKey: process.env.VULTR_OBJECT_STORAGE_SECRET_KEY || '',
  bucket: process.env.VULTR_OBJECT_STORAGE_BUCKET || 'spaceidentity',
  region: process.env.VULTR_OBJECT_STORAGE_REGION || 'ewr1', // New Jersey by default
};

// Initialize S3 client for Vultr Object Storage
let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (!VULTR_OBJECT_STORAGE_CONFIG.hostname || !VULTR_OBJECT_STORAGE_CONFIG.accessKey) {
    console.warn('Vultr Object Storage not configured. Using local storage.');
    return null;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: `https://${VULTR_OBJECT_STORAGE_CONFIG.hostname}`,
      region: VULTR_OBJECT_STORAGE_CONFIG.region,
      credentials: {
        accessKeyId: VULTR_OBJECT_STORAGE_CONFIG.accessKey,
        secretAccessKey: VULTR_OBJECT_STORAGE_CONFIG.secretKey,
      },
      forcePathStyle: true, // Required for Vultr Object Storage
    });
  }

  return s3Client;
}

/**
 * Check if Vultr Object Storage is configured and available
 */
export function isVultrStorageEnabled(): boolean {
  return !!(
    VULTR_OBJECT_STORAGE_CONFIG.hostname &&
    VULTR_OBJECT_STORAGE_CONFIG.accessKey &&
    VULTR_OBJECT_STORAGE_CONFIG.secretKey
  );
}

/**
 * Upload a file to Vultr Object Storage
 * 
 * @param key - The object key (path) in the bucket
 * @param data - The file data as Buffer or string
 * @param contentType - MIME type of the file
 * @returns The public URL of the uploaded file
 */
export async function uploadToVultr(
  key: string,
  data: Buffer | string,
  contentType: string
): Promise<string | null> {
  const client = getS3Client();
  if (!client) return null;

  try {
    const command = new PutObjectCommand({
      Bucket: VULTR_OBJECT_STORAGE_CONFIG.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
      ACL: 'public-read', // Make publicly accessible
    });

    await client.send(command);

    // Return the public URL
    return `https://${VULTR_OBJECT_STORAGE_CONFIG.hostname}/${VULTR_OBJECT_STORAGE_CONFIG.bucket}/${key}`;
  } catch (error) {
    console.error('Error uploading to Vultr Object Storage:', error);
    return null;
  }
}

/**
 * Upload a room image to Vultr Object Storage
 * 
 * @param imageBase64 - Base64 encoded image data
 * @param roomId - Unique identifier for the room
 * @param imageType - Type of image (original, segmented, design)
 * @returns The public URL of the uploaded image
 */
export async function uploadRoomImage(
  imageBase64: string,
  roomId: string,
  imageType: 'original' | 'segmented' | 'design' = 'original'
): Promise<string | null> {
  // Extract the actual base64 data (remove data URL prefix if present)
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // Determine content type from base64 header or default to jpeg
  let contentType = 'image/jpeg';
  if (imageBase64.startsWith('data:image/png')) {
    contentType = 'image/png';
  } else if (imageBase64.startsWith('data:image/webp')) {
    contentType = 'image/webp';
  }

  const extension = contentType.split('/')[1];
  const key = `rooms/${roomId}/${imageType}-${Date.now()}.${extension}`;

  return uploadToVultr(key, buffer, contentType);
}

/**
 * Upload a design result JSON to Vultr Object Storage
 * 
 * @param designData - The design result object
 * @param designId - Unique identifier for the design
 * @returns The public URL of the uploaded JSON
 */
export async function uploadDesignResult(
  designData: object,
  designId: string
): Promise<string | null> {
  const key = `designs/${designId}/result.json`;
  const data = JSON.stringify(designData, null, 2);

  return uploadToVultr(key, data, 'application/json');
}

/**
 * Get a signed URL for temporary access to a private object
 * 
 * @param key - The object key in the bucket
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL for temporary access
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const client = getS3Client();
  if (!client) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: VULTR_OBJECT_STORAGE_CONFIG.bucket,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

/**
 * Delete an object from Vultr Object Storage
 * 
 * @param key - The object key to delete
 * @returns True if deletion was successful
 */
export async function deleteFromVultr(key: string): Promise<boolean> {
  const client = getS3Client();
  if (!client) return false;

  try {
    const command = new DeleteObjectCommand({
      Bucket: VULTR_OBJECT_STORAGE_CONFIG.bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting from Vultr Object Storage:', error);
    return false;
  }
}

/**
 * Get the public URL for an object in Vultr Object Storage
 * 
 * @param key - The object key
 * @returns The public URL
 */
export function getPublicUrl(key: string): string {
  return `https://${VULTR_OBJECT_STORAGE_CONFIG.hostname}/${VULTR_OBJECT_STORAGE_CONFIG.bucket}/${key}`;
}
