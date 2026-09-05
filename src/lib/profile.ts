import { prisma } from "@/lib/db";
import { getConfig } from "@/lib/config";

/**
 * Resolve the user profile: DB settings override config YAML defaults.
 * This makes the "Save Profile" action in Settings actually take effect.
 */
export async function getUserProfile(): Promise<{
  name: string;
  email: string;
  phone: string;
  linkedin: string;
}> {
  const base = getConfig().user;

  const [name, email, phone, linkedin] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "user_name" } }),
    prisma.setting.findUnique({ where: { key: "user_email" } }),
    prisma.setting.findUnique({ where: { key: "user_phone" } }),
    prisma.setting.findUnique({ where: { key: "user_linkedin" } }),
  ]);

  return {
    name: name?.value || base.name || "",
    email: email?.value || base.email || "",
    phone: phone?.value || base.phone || "",
    linkedin: linkedin?.value || base.linkedin || "",
  };
}