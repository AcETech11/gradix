"use server";

import { updatePromotionStudentStatusAction } from "@/actions/promotion/promote-students-action";

export async function graduateStudentsAction(input: unknown) {
  return updatePromotionStudentStatusAction({
    ...(input && typeof input === "object" ? input : {}),
    status: "graduated",
  });
}
