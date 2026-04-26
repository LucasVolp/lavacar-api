import { buildEmailLayout, buildPrimaryButton } from './layout.template';

interface AppointmentConfirmationTemplateInput {
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

function formatRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 0;color:#9CA3AF;font-size:14px;width:40%;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;color:#F9FAFB;font-size:14px;font-weight:600;vertical-align:top;">${value}</td>
    </tr>
  `;
}

export const buildAppointmentConfirmationEmail = ({
  clientFirstName,
  shopName,
  shopLogoUrl,
  scheduledDate,
  scheduledTime,
  duration,
  services,
  totalPrice,
  vehicleBrand,
  vehicleModel,
  vehiclePlate,
  confirmUrl,
  trackUrl,
}: AppointmentConfirmationTemplateInput) => {
  const subject = `Agendamento confirmado — ${shopName}`;

  const logoHtml = shopLogoUrl
    ? `<img src="${shopLogoUrl}" alt="${shopName}" width="48" height="48" style="border-radius:10px;object-fit:cover;display:block;margin:0 auto 12px auto;" />`
    : '';

  const serviceRows = services
    .map(
      (s) => `
      <tr>
        <td style="padding:6px 0;color:#D1D5DB;font-size:13px;">${s.name}</td>
        <td style="padding:6px 0;color:#F9FAFB;font-size:13px;font-weight:600;text-align:right;">${s.price}</td>
      </tr>
    `,
    )
    .join('');

  const body = `
    ${logoHtml}
    <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.01em;text-align:center;">
      Seu agendamento foi criado!
    </h1>
    <p style="margin:0 0 28px 0;color:#9CA3AF;font-size:14px;text-align:center;">
      Olá, <strong style="color:#FFFFFF;">${clientFirstName}</strong>! Seu agendamento em <strong style="color:#FFFFFF;">${shopName}</strong> está aguardando confirmação.
    </p>

    <!-- Details block -->
    <div style="background-color:#1F2937;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px 0;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;">
        Detalhes do agendamento
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tbody>
          ${formatRow('Data', scheduledDate)}
          ${formatRow('Horário', `${scheduledTime} (${duration})`)}
          ${formatRow('Veículo', `${vehicleBrand} ${vehicleModel}${vehiclePlate ? ` — ${vehiclePlate}` : ''}`)}
        </tbody>
      </table>
    </div>

    <!-- Services block -->
    <div style="background-color:#1F2937;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px 0;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;">
        Serviços
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tbody>
          ${serviceRows}
          <tr>
            <td colspan="2" style="padding-top:12px;border-top:1px solid #374151;"></td>
          </tr>
          <tr>
            <td style="color:#FFFFFF;font-size:15px;font-weight:700;">Total</td>
            <td style="color:#34D399;font-size:16px;font-weight:700;text-align:right;">${totalPrice}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Confirm CTA -->
    <p style="margin:0 0 8px 0;font-size:14px;color:#D1D5DB;text-align:center;">
      Clique no botão abaixo para <strong style="color:#FFFFFF;">confirmar seu agendamento</strong>:
    </p>
    ${buildPrimaryButton(confirmUrl, 'Confirmar Agendamento')}

    <!-- Track link -->
    <p style="margin:0 0 8px 0;font-size:13px;color:#9CA3AF;text-align:center;">
      Você também pode acompanhar o status do seu agendamento a qualquer momento:
    </p>
    <p style="margin:0 0 24px 0;text-align:center;">
      <a href="${trackUrl}" target="_blank" rel="noopener" style="color:#60A5FA;font-size:13px;text-decoration:underline;">
        Acompanhar agendamento
      </a>
    </p>

    <hr style="margin:24px 0;border:none;border-top:1px solid #1F2937;" />
    <p style="margin:0;font-size:12px;color:#6B7280;text-align:center;">
      Se você não realizou este agendamento, ignore este e-mail.
    </p>
  `;

  const html = buildEmailLayout({
    preheader: `Seu agendamento em ${shopName} está confirmado para ${scheduledDate} às ${scheduledTime}.`,
    title: subject,
    bodyHtml: body,
  });

  return { subject, html };
};
