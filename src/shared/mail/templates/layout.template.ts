interface LayoutOptions {
  preheader: string;
  title: string;
  bodyHtml: string;
}

export const buildEmailLayout = ({ preheader, title, bodyHtml }: LayoutOptions): string => `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0B1220;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E6EAF2;">
    <span style="display:none!important;visibility:hidden;mso-hide:all;opacity:0;max-height:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0B1220;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#111827;border:1px solid #1F2937;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #1F2937;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="left" style="font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#FFFFFF;">
                      NexoCar
                    </td>
                    <td align="right" style="font-size:12px;color:#6B7280;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">
                      Gestão de Estéticas
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 32px 32px;line-height:1.75;font-size:15px;color:#E6EAF2;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;border-top:1px solid #1F2937;font-size:12px;color:#6B7280;line-height:1.7;">
                Este e-mail foi enviado por <strong style="color:#9CA3AF;">NexoCar</strong>. Se você não reconhece esta solicitação, ignore esta mensagem — nenhuma ação será tomada sem o link deste e-mail.
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:12px;color:#4B5563;">© ${new Date().getFullYear()} NexoCar — suporte@nexocar.com.br</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const buildPrimaryButton = (href: string, label: string): string => `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0;">
  <tr>
    <td align="center" style="border-radius:12px;background-color:#2563EB;">
      <a href="${href}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-weight:700;font-size:15px;text-decoration:none;border-radius:12px;letter-spacing:0.01em;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
