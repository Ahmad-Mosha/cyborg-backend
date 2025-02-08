import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand,  } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { FILE_CONSTANTS } from '../../shared/constants/file.constants';

@Injectable()
export class UploadService {
  getFileInfo(key: string) {
    throw new Error('Method not implemented.');
  }
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      maxAttempts: 3, 
    });
    this.bucket = process.env.AWS_BUCKET_NAME;
  }

  private validateFileType(mimetype: string): boolean {
    return mimetype in FILE_CONSTANTS.SUPPORTED_MIMES;
  }

  private validateFileSize(size: number): boolean {
    return size <= FILE_CONSTANTS.MAX_FILE_SIZE;
  }

  private generateFileName(mimetype: string): string {
    const extension = FILE_CONSTANTS.SUPPORTED_MIMES[mimetype];
    return `${uuidv4()}.${extension}`;
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      if (!this.validateFileType(file.mimetype)) {
        throw new BadRequestException('Unsupported file type');
      }

      if (!this.validateFileSize(file.size)) {
        throw new BadRequestException('File size exceeds limit');
      }

      const filename = this.generateFileName(file.mimetype);
      const key = `uploads/${filename}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
       // ACL: 'public-read',
        Metadata: {
          originalname: file.originalname,
          size: file.size.toString(),
        },
      });

      await this.s3Client.send(command);

      const fileUrl = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      return {
        url: fileUrl,
        key: key,
        filename: filename,
        size: file.size,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }
  }

  /**
   * To DO -> getSignedUrl
   * @param key 
   * @param expiresIn 
   * @returns 
   */

  /**
   * To DO -> getFileInfo
   * @param key 
   * @param expiresIn 
   * @returns 
   */

  
} 