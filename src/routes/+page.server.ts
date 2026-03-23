export const load = async ({ locals }) => {
  let profile;
  if (locals.agent && locals.did) {
    profile = await locals.agent.getProfile({
      actor: locals.did,
    });
  }
  return { profile: profile?.data };
};
