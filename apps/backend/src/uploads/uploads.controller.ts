import {
  Controller, Post, Get, Patch, Param, UploadedFile, UseInterceptors, Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentRoomGateway } from '../incident-room/incident-room.gateway';

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
]);

@Controller('incidents/:id/uploads')
export class UploadsController {
  constructor(
    private prisma: PrismaService,
    private gateway: IncidentRoomGateway,
  ) {}

  @Get()
  async list(@Param('id') incidentId: string) {
    return this.prisma.incidentUpload.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', 'uploads'),
        filename: (_req, _file, cb) => cb(null, `${randomUUID()}${extname(_file.originalname)}`),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('File type not allowed'), false);
      },
    }),
  )
  async upload(
    @Param('id') incidentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('uploadedBy') uploadedBy: string,
    @Body('caption') caption?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const upload = await this.prisma.incidentUpload.create({
      data: {
        incidentId,
        uploadedBy,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        caption,
      },
    });

    // Notify room participants
    this.gateway.server?.to(`incident:${incidentId}`).emit('new-upload', upload);
    return upload;
  }

  @Patch(':uploadId/location')
  async setLocation(
    @Param('id') incidentId: string,
    @Param('uploadId') uploadId: string,
    @Body() body: { latitude: number; longitude: number },
  ) {
    const upload = await this.prisma.incidentUpload.update({
      where: { id: uploadId },
      data: { latitude: body.latitude, longitude: body.longitude },
    });
    this.gateway.server?.to(`incident:${incidentId}`).emit('upload-location-updated', upload);
    return upload;
  }
}
