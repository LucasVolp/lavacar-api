import { buildEmailLayout, buildPrimaryButton } from './layout.template';

interface EmailChangeTemplateInput {
  firstName: string;
  confirmationUrl: string;
  newEmail: string;
  expiresInMinutes: number;
}

export const buildEmailChangeEmail = ({
  firstName,
  confirmationUrl,
  newEmail,
  expiresInMinutes,
}: EmailChangeTemplateInput) => {
  const subject = 'Confirme seu novo e-mail — NexoCar';

  const body = `
    <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.01em;">
      Confirme seu novo e-mail
    </h1>
    <p style="margin:0 0 16px 0;color:#D1D5DB;">
      Olá, <strong style="color:#FFFFFF;">${firstName}</strong>. Recebemos uma solicitação para alterar o e-mail da sua conta NexoCar para:
    </p>
    <p style="margin:0 0 20px 0;padding:12px 16px;background-color:#0B1220;border:1px solid #1F2937;border-radius:10px;color:#FFFFFF;font-weight:600;font-size:14px;">
      ${newEmail}
    </p>
    <p style="margin:0;color:#D1D5DB;">
      Para concluir a alteração, confirme pelo botão abaixo. O link expira em <strong style="color:#FFFFFF;">${expiresInMinutes} minutos</strong>.
    </p>
    ${buildPrimaryButton(confirmationUrl, 'Confirmar novo e-mail')}
    <p style="margin:0 0 8px 0;font-size:13px;color:#9CA3AF;">
      Se o botão não funcionar, copie e cole este link no seu navegador:
    </p>
    <p style="margin:0;font-size:13px;word-break:break-all;color:#60A5FA;">
      ${confirmationUrl}
    </p>
    <hr style="margin:28px 0;border:none;border-top:1px solid #1F2937;" />
    <p style="margin:0;font-size:12px;color:#6B7280;">
      Se você não pediu esta alteração, ignore este e-mail e considere trocar sua senha imediatamente.
    </p>
  `;

  const html = buildEmailLayout({
    preheader: `Confirme a troca do seu e-mail para ${newEmail}.`,
    title: subject,
    bodyHtml: body,
  });

  return { subject, html };
};
