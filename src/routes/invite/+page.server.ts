import { redirect } from "@sveltejs/kit";
import { getAccountData } from "$lib/account.remote";

export const load = async ({ url }) => {
  const account = await getAccountData();
  if (!account) {
    redirect(302, `/?redirect=${encodeURIComponent(url.pathname)}`);
  }

  return {};
};
