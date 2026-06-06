"use server";

import { getParentAccessRecordsAction } from "@/actions/parent-access/get-parent-access-records-action";

export async function getParentAccessOverviewAction(input?: unknown) {
  const data = await getParentAccessRecordsAction(input);

  return data.overview;
}
