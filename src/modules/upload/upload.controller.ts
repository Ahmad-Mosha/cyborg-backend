import { 
  Controller, 
  Post, 
  Delete, 
  Param, 
  UseInterceptors, 
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { FILE_CONSTANTS } from '../../shared/constants/file.constants';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
        new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FILE_CONSTANTS.MAX_FILE_SIZE })
      ]
    })
  )
    file: Express.Multer.File
  ) {
    return this.uploadService.uploadFile(file);
  }

  @Delete(':key')
  async deleteFile(@Param('key') key: string) {
    await this.uploadService.deleteFile(key);
    return { message: 'File deleted successfully' };
  }

  /**
   * To Do ->   @Get('signed-url/:key')
   * @param key @param key
   * @returns getSignedUrl
   */


  /**
   *  To Do ->   @Get('info/:key')
   * @param key @param key
   * @returns getFileInfo
   */
  
}