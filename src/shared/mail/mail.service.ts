import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { buildPasswordResetEmail } from './templates/password-reset.template';
import { buildEmailChangeEmail } from './templates/email-change.template';
import { buildOrganizationInviteEmail } from './templates/organization-invite.template';
import { buildAppointmentConfirmationEmail } from './templates/appointment-confirmation.template';

interface PasswordResetPayload {
  to: string;
  firstName: string;
  token: string;
  expiresInMinutes: number;
}

interface EmailChangePayload {
  to: string;
  firstName: string;
  token: string;
  newEmail: string;
  expiresInMinutes: number;
}

interface OrganizationInvitePayload {
  to: string;
  token: string;
  organizationName: string;
  invitedByName: string;
  roleLabel: string;
  expiresInHours: number;
}

interface AppointmentConfirmationPayload {
  to: string;
  clientFirstName: string;
  shopName: string;
  shopLogoUrl?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  services: { name: string; price: string }[];
  totalPrice: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate?: string;
  confirmUrl: string;
  trackUrl: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private resend!: Resend;
  private fromAddress!: string;
  private frontendUrl!: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'RESEND_API_KEY não configurada — MailService não pode iniciar.',
      );
    }

    this.resend = new Resend(apiKey);
    this.fromAddress = this.configService.get<string>(
      'MAIL_FROM',
      'NexoCar <suporte@nexocar.com.br>',
    );
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
  }

  async sendPasswordResetEmail(payload: PasswordResetPayload): Promise<void> {
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${encodeURIComponent(payload.token)}`;

    const { subject, html } = buildPasswordResetEmail({
      firstName: payload.firstName,
      resetUrl,
      expiresInMinutes: payload.expiresInMinutes,
    });

    await this.dispatch(payload.to, subject, html);
  }

  async sendEmailChangeConfirmation(payload: EmailChangePayload): Promise<void> {
    const confirmationUrl = `${this.frontendUrl}/auth/confirm-email?token=${encodeURIComponent(payload.token)}`;

    const { subject, html } = buildEmailChangeEmail({
      firstName: payload.firstName,
      confirmationUrl,
      newEmail: payload.newEmail,
      expiresInMinutes: payload.expiresInMinutes,
    });

    await this.dispatch(payload.to, subject, html);
  }

  async sendOrganizationInvite(payload: OrganizationInvitePayload): Promise<void> {
    const acceptUrl = `${this.frontendUrl}/invites/accept?token=${encodeURIComponent(payload.token)}`;

    const { subject, html } = buildOrganizationInviteEmail({
      acceptUrl,
      organizationName: payload.organizationName,
      invitedByName: payload.invitedByName,
      roleLabel: payload.roleLabel,
      expiresInHours: payload.expiresInHours,
    });

    await this.dispatch(payload.to, subject, html);
  }

  async sendAppointmentConfirmation(payload: AppointmentConfirmationPayload): Promise<void> {
    const { subject, html } = buildAppointmentConfirmationEmail(payload);
    await this.dispatch(payload.to, subject, html);
  }

  private async dispatch(to: string, subject: string, html: string): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Resend rejected email to ${to}: ${error.message}`, error.name);
        throw new InternalServerErrorException('Falha ao enviar e-mail.');
      }

      this.logger.log(`Email dispatched to ${to} — "${subject}"`);
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      this.logger.error(`Unexpected error sending email to ${to}`, err as Error);
      throw new InternalServerErrorException('Falha ao enviar e-mail.');
    }
  }
}
