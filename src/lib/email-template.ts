const BRAND_PURPLE = "#6961ff";
const DARK_BG = "#1a1a2e";

export function buildNotificationHtml(
  title: string,
  message: string,
  link?: string,
  appUrl?: string,
): string {
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://fastlane-theta.vercel.app";
  const fullLink = link ? (link.startsWith("http") ? link : `${baseUrl}${link}`) : null;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:${DARK_BG};padding:24px 32px;">
              <span style="font-size:20px;font-weight:700;color:${BRAND_PURPLE};letter-spacing:-0.5px;">Fastlane</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#111827;">${escapeHtml(title)}</h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4b5563;">${escapeHtml(message)}</p>
              ${fullLink ? `
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:${BRAND_PURPLE};border-radius:8px;">
                    <a href="${escapeHtml(fullLink)}" target="_blank" style="display:inline-block;padding:10px 24px;font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;">
                      Voir dans Fastlane
                    </a>
                  </td>
                </tr>
              </table>` : ""}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                Cet email a ete envoye par Fastlane. Si vous ne souhaitez plus recevoir ces notifications, modifiez vos parametres dans la plateforme.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
