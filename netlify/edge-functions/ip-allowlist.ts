// Công tắc chặn IP, chỉnh trên Netlify > Site configuration > Environment variables:
//   IP_BLOCK    = on  -> chỉ IP trong ALLOWED_IPS mở được tool
//                 off (hoặc không có biến) -> ai cũng mở được
//   ALLOWED_IPS = "ip1,ip2" (cách nhau bằng dấu phẩy). Không có biến thì dùng DEFAULT_IPS.
// Đổi biến xong vào Deploys > Trigger deploy > Deploy site để áp dụng.
import type { Config, Context } from "https://edge.netlify.com";

const DEFAULT_IPS = ["171.227.71.1"]; // Wifi công ty (Viettel)

function blockingOn(): boolean {
  return (Netlify.env.get("IP_BLOCK") || "").trim().toLowerCase() === "on";
}

function allowedIps(): string[] {
  const fromEnv = Netlify.env.get("ALLOWED_IPS");
  const list = fromEnv ? fromEnv.split(",") : DEFAULT_IPS;
  return list.map((s) => s.trim()).filter(Boolean);
}

const BLOCKED_PAGE = (ip: string) => `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Không có quyền truy cập</title>
<style>
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f6f6f7;color:#222;padding:16px;box-sizing:border-box}
.c{max-width:380px;background:#fff;border:1px solid #e5e5e8;border-radius:12px;padding:24px}
h1{font-size:20px;margin:0 0 8px}p{margin:0 0 8px;line-height:1.5}small{color:#777}
@media (prefers-color-scheme:dark){body{background:#111;color:#eee}.c{background:#1c1c1f;border-color:#333}small{color:#999}}
</style></head><body><div class="c">
<h1>Chỉ dùng được trong mạng công ty</h1>
<p>Hãy kết nối wifi công ty rồi tải lại trang.</p>
<small>IP của bạn: ${ip.replace(/[^0-9a-fA-F:.]/g, "")}</small>
</div></body></html>`;

export default async (_req: Request, context: Context) => {
  if (!blockingOn()) return context.next();
  const ip = context.ip || "";
  if (allowedIps().includes(ip)) return context.next();
  return new Response(BLOCKED_PAGE(ip), {
    status: 403,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};

export const config: Config = { path: "/*" };
