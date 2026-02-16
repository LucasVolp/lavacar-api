import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import sharp from 'sharp';

export interface UploadOptions {
  file: Express.Multer.File;
  fileType: 'IMAGE' | 'DOCUMENT';
  context:
    | {
        type: 'ORGANIZATION';
        organizationId: string;
        category: 'logo';
      }
    | {
        type: 'SHOP';
        organizationId: string;
        shopId: string;
        category: 'logo' | 'banner' | 'gallery' | 'checklist';
        appointmentId?: string;
      }
    | {
        type: 'SERVICE';
        organizationId: string;
        shopId: string;
        serviceId: string;
        category: 'cover';
      }
    | {
        type: 'USER';
        userId: string;
        category: 'avatar' | 'evaluation';
        appointmentId?: string;
      };
}

@Injectable()
export class StorageService {
  private static readonly MAX_IMAGE_BYTES = 12 * 1024 * 1024;
  private static readonly ALLOWED_IMAGE_MIME = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ]);

  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;
  private readonly proxyBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('CLOUDFLARE_R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');

    const endpointFromEnv =
      this.configService.get<string>('CLOUDFLARE_R2_ENDPOINT') ||
      this.configService.get<string>('CLOUDFLARE_R2_API');
    const endpoint = endpointFromEnv || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');

    this.bucketName = this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME') ?? '';
    const publicUrlFromEnv = this.configService.get<string>('CLOUDFLARE_R2_PUBLIC_URL');
    const publicUrlFallback =
      accountId && this.bucketName
        ? `https://${this.bucketName}.${accountId}.r2.cloudflarestorage.com`
        : endpointFromEnv || '';
    this.publicUrl = (publicUrlFromEnv || publicUrlFallback || '').replace(/\/$/, '');
    this.proxyBaseUrl = (
      this.configService.get<string>('BACKEND_PUBLIC_URL') ||
      `http://localhost:${this.configService.get<string>('PORT') || '3000'}`
    ).replace(/\/$/, '');

    if (!publicUrlFromEnv) {
      this.logger.warn(
        'CLOUDFLARE_R2_PUBLIC_URL nao definida. Usando fallback automatico; para leitura publica confiavel, configure uma URL publica do bucket (r2.dev/custom domain).',
      );
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });

    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucketName || !this.publicUrl) {
      this.logger.warn(
        'Config R2 incompleta no bootstrap. Upload/Delete falhara ate configurar envs corretamente.',
      );
    }
  }

  async uploadFile(options: UploadOptions): Promise<string> {
    this.assertReady();

    const { file, fileType, context } = options;
    let buffer = file.buffer;
    let contentType = file.mimetype;
    let extension = extname(file.originalname || '').toLowerCase() || '.bin';

    if (fileType === 'IMAGE') {
      if (!StorageService.ALLOWED_IMAGE_MIME.has(file.mimetype.toLowerCase())) {
        throw new BadRequestException('Tipo de imagem nao permitido');
      }

      if (!file.size || file.size > StorageService.MAX_IMAGE_BYTES) {
        throw new BadRequestException('Imagem excede o limite de 12MB');
      }

      const resizeConfig = this.resolveImageResize(context);

      // Mitigacao de memoria: ainda usamos file.buffer. Para volume muito alto,
      // considerar pipeline por stream. Aqui aplicamos resize/compressao para
      // reduzir uso de RAM/transito e custo de storage.
      buffer = await sharp(file.buffer, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize({
          width: resizeConfig.width,
          height: resizeConfig.height,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      contentType = 'image/webp';
      extension = '.webp';
    }

    const key = this.buildKey(context, extension);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );

      if (this.hasUsablePublicUrl()) {
        return `${this.publicUrl}/${key}`;
      }

      // Fallback local/dev: leitura via proxy do backend quando nao houver dominio publico do bucket.
      return `${this.proxyBaseUrl}/storage/object?key=${encodeURIComponent(key)}`;
    } catch (error) {
      this.logger.error(`Falha no upload para R2 em ${key}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Erro ao enviar arquivo para o storage');
    }
  }

  async deleteFile(urlOrPath: string): Promise<void> {
    this.assertReady();

    const key = this.extractKey(urlOrPath);
    if (!key) {
      this.logger.warn(`Key vazia para exclusao: ${urlOrPath}`);
      return;
    }

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      this.logger.error(`Falha ao deletar arquivo no R2 em ${key}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Erro ao remover arquivo do storage');
    }
  }

  private assertReady() {
    if (!this.bucketName || !this.publicUrl) {
      throw new InternalServerErrorException(
        'Storage R2 nao configurado. Defina CLOUDFLARE_R2_BUCKET_NAME e CLOUDFLARE_R2_PUBLIC_URL',
      );
    }

  }

  async getObjectByKey(key: string): Promise<{ body: Buffer; contentType?: string }> {
    this.assertReady();

    try {
      const output = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      const byteArray = await output.Body?.transformToByteArray();
      if (!byteArray) {
        throw new InternalServerErrorException('Arquivo nao encontrado no storage');
      }

      return {
        body: Buffer.from(byteArray),
        contentType: output.ContentType,
      };
    } catch (error) {
      this.logger.error(`Falha ao ler arquivo no R2 em ${key}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Erro ao ler arquivo do storage');
    }
  }

  private buildKey(context: UploadOptions['context'], extension: string) {
    const id = randomUUID();

    if (context.type === 'ORGANIZATION') {
      return `organizations/${this.cleanPathPart(context.organizationId)}/logo/${id}${extension}`;
    }

    if (context.type === 'SHOP') {
      const base = `organizations/${this.cleanPathPart(context.organizationId)}/shops/${this.cleanPathPart(context.shopId)}`;

      if (context.category === 'checklist' && context.appointmentId) {
        return `${base}/checklists/${this.cleanPathPart(context.appointmentId)}/${id}${extension}`;
      }

      return `${base}/${this.cleanPathPart(context.category)}/${id}${extension}`;
    }

    if (context.type === 'SERVICE') {
      return `organizations/${this.cleanPathPart(context.organizationId)}/shops/${this.cleanPathPart(context.shopId)}/services/${this.cleanPathPart(context.serviceId)}/cover/${id}${extension}`;
    }

    if (context.category === 'evaluation') {
      const appointmentSegment = context.appointmentId
        ? `/${this.cleanPathPart(context.appointmentId)}`
        : '';
      return `users/${this.cleanPathPart(context.userId)}/evaluations${appointmentSegment}/${id}${extension}`;
    }

    return `users/${this.cleanPathPart(context.userId)}/avatar/${id}${extension}`;
  }

  private extractKey(urlOrPath: string): string {
    if (!urlOrPath) return '';

    if (!/^https?:\/\//i.test(urlOrPath)) {
      return urlOrPath.replace(/^\/+/, '');
    }

    try {
      const fileUrl = new URL(urlOrPath);
      const publicUrl = this.publicUrl ? new URL(this.publicUrl) : null;

      if (fileUrl.pathname === '/storage/object') {
        const keyFromQuery = fileUrl.searchParams.get('key');
        if (keyFromQuery) {
          return keyFromQuery.replace(/^\/+/, '');
        }
      }

      let pathname = fileUrl.pathname.replace(/^\/+/, '');

      if (publicUrl) {
        const publicPrefix = publicUrl.pathname.replace(/^\/+|\/+$/g, '');
        if (publicPrefix && pathname.startsWith(`${publicPrefix}/`)) {
          pathname = pathname.slice(publicPrefix.length + 1);
        }
      }

      return pathname;
    } catch {
      return urlOrPath.replace(/^\/+/, '');
    }
  }

  private cleanPathPart(value: string) {
    return String(value).trim().replace(/[^a-zA-Z0-9-_]/g, '');
  }

  private hasUsablePublicUrl() {
    return !!this.publicUrl && !/r2\.cloudflarestorage\.com/i.test(this.publicUrl);
  }

  private resolveImageResize(context: UploadOptions['context']) {
    if (context.type === 'ORGANIZATION') {
      return { width: 1400, height: 1400 };
    }

    if (context.type === 'USER') {
      if (context.category === 'evaluation') {
        return { width: 1920, height: 1080 };
      }
      return { width: 1200, height: 1200 };
    }

    if (context.type === 'SHOP') {
      if (context.category === 'banner') {
        return { width: 2400, height: 1200 };
      }

      if (context.category === 'logo') {
        return { width: 1400, height: 1400 };
      }

      return { width: 1920, height: 1080 };
    }

    return { width: 1920, height: 1080 };
  }
}
