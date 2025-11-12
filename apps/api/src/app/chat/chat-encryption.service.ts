import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  CipherGCM,
  DecipherGCM,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // bytes

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

@Injectable()
export class ChatEncryptionService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const rawKey = this.configService.get<string>('CHAT_ENCRYPTION_KEY');
    if (!rawKey) {
      throw new InternalServerErrorException('CHAT_ENCRYPTION_KEY nao configurada.');
    }

    this.key = this.parseKey(rawKey);
  }

  encrypt(message: string): EncryptedPayload {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv) as CipherGCM;
    const encrypted = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  decrypt(payload: EncryptedPayload): string {
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    const decipher = createDecipheriv(ALGORITHM, this.key, iv) as DecipherGCM;
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  private parseKey(value: string): Buffer {
    const trimmed = value.trim();
    let key: Buffer;

    if (/^[0-9a-fA-F]+$/.test(trimmed)) {
      key = Buffer.from(trimmed, 'hex');
    } else {
      key = Buffer.from(trimmed, 'base64');
    }

    if (key.length !== 32) {
      throw new InternalServerErrorException(
        'CHAT_ENCRYPTION_KEY deve representar exatamente 32 bytes (256 bits).'
      );
    }

    return key;
  }
}
