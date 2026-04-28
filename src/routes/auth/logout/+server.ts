import { redirect } from "@sveltejs/kit";

export const POST = async ({ request, cookies }) => {
  const formData = await request.formData();
  const redirectUrl = formData.get("redirect") as string | null;

  cookies.delete("session", { path: "/" });
  redirect(302, redirectUrl || "/");
};
