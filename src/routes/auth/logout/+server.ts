import { redirect } from "@sveltejs/kit";

export const POST = async ({ cookies }) => {
  cookies.delete("session_did", { path: "/" });
  redirect(302, "/");
};
