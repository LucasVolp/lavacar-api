import { buildEmailLayout, buildPrimaryButton } from './layout.template';

interface OrganizationInviteTemplateInput {
  organizationName: string;
  invitedByName: string;
  roleLabel: string;
  acceptUrl: string;
  expiresInHours: number;
}

export const buildOrganizationInviteEmail = ({
  organizationName,
  invitedByName,
  roleLabel,
  acceptUrl,
  expiresInHours,
}: OrganizationInviteTemplateInput) => {
  const subject = `${organizationName} convidou você para o NexoCar`;

  const body = `
    <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.01em;">
      Você foi convidado para uma equipe
    </h1>
    <p style="margin:0 0 16px 0;color:#D1D5DB;">
      <strong style="color:#FFFFFF;">${invitedByName}</strong> convidou você para fazer parte da equipe de <strong style="color:#FFFFFF;">${organizationName}</strong> no NexoCar, com a função de <strong style="color:#FFFFFF;">${roleLabel}</strong>.
    </p>
    <p style="margin:0;color:#D1D5DB;">
      Aceite o convite e complete seu cadastro pelo botão abaixo. O convite expira em <strong style="color:#FFFFFF;">${expiresInHours} horas</strong>.
    </p>
    ${buildPrimaryButton(acceptUrl, 'Aceitar convite')}
    <p style="margin:0 0 8px 0;font-size:13px;color:#9CA3AF;">
      Se o botão não funcionar, copie e cole este link no seu navegador:
    </p>
    <p style="margin:0;font-size:13px;word-break:break-all;color:#60A5FA;">
      ${acceptUrl}
    </p>
    <hr style="margin:28px 0;border:none;border-top:1px solid #1F2937;" />
    <p style="margin:0;font-size:12px;color:#6B7280;">
      Se você não esperava este convite, pode ignorar esta mensagem com segurança.
    </p>
  `;

  const html = buildEmailLayout({
    preheader: `${invitedByName} convidou você para ${organizationName} no NexoCar.`,
    title: subject,
    bodyHtml: body,
  });

  return { subject, html };
};
