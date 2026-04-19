import { prisma } from "../db.server";

export type SettingsInput = {
  badgeColor: string;
  textColor: string;
  borderRadius: number;
  fontSize: number;
  isEnabled: boolean;
  showEstimatedFallbacks: boolean;
};

const DEFAULT_SETTINGS: SettingsInput = {
  badgeColor: "#1E8E5A",
  textColor: "#FFFFFF",
  borderRadius: 12,
  fontSize: 14,
  isEnabled: true,
  showEstimatedFallbacks: true,
};

export async function getOrCreateShopByDomain(domain: string) {
  return prisma.shop.upsert({
    where: { domain },
    update: {},
    create: { domain },
  });
}

export async function getOrCreateSettingsByShopDomain(domain: string) {
  const shop = await getOrCreateShopByDomain(domain);

  const settings = await prisma.settings.upsert({
    where: { shopId: shop.id },
    update: {},
    create: {
      shopId: shop.id,
      ...DEFAULT_SETTINGS,
    },
  });

  return settings;
}

export async function saveSettingsByShopDomain(domain: string, input: SettingsInput) {
  const shop = await getOrCreateShopByDomain(domain);

  return prisma.settings.upsert({
    where: { shopId: shop.id },
    update: input,
    create: {
      shopId: shop.id,
      ...input,
    },
  });
}
