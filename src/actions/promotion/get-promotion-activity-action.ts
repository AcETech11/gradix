"use server";

import { getPromotionOverviewAction } from "@/actions/promotion/get-promotion-overview-action";

export async function getPromotionActivityAction(input?: unknown) {
  const data = await getPromotionOverviewAction(input);

  return data.recentActivity;
}
