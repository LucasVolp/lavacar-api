import { buildEmailLayout, buildPrimaryButton } from './layout.template';

interface PasswordResetTemplateInput {
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export const buildPasswordResetEmail = ({
  firstName,
  resetUrl,
  expiresInMinutes,
}: PasswordResetTemplateInput) => {
  const subject = 'Redefinição de senha — NexoCar';

  const body = `
    <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.01em;">
      Redefinir sua senha
    </h1>
    <p style="margin:0 0 16px 0;color:#D1D5DB;">
      Olá, <strong style="color:#FFFFFF;">${firstName}</strong>. Recebemos uma solicitação para redefinir a senha da sua conta NexoCar.
    </p>
    <p style="margin:0 0 8px 0;color:#D1D5DB;">
      Clique no botão abaixo para criar uma nova senha. O link expira em <strong style="color:#FFFFFF;">${expiresInMinutes} minutos</strong>.
    </p>
    ${buildPrimaryButton(resetUrl, 'Redefinir senha')}
    <p style="margin:0 0 8px 0;font-size:13px;color:#9CA3AF;">
      Se o botão não funcionar, copie e cole este link no seu navegador:
    </p>
    <p style="margin:0;font-size:13px;word-break:break-all;color:#60A5FA;">
      ${resetUrl}
    </p>
    <hr style="margin:28px 0;border:none;border-top:1px solid #1F2937;" />
    <p style="margin:0;font-size:12px;color:#6B7280;">
      Se você não solicitou esta alteração, ignore este e-mail. Sua senha atual continuará válida.
    </p>
  `;

  const html = buildEmailLayout({
    preheader: 'Link para redefinir sua senha no NexoCar (expira em breve).',
    title: subject,
    bodyHtml: body,
  });

  return { subject, html };
};
