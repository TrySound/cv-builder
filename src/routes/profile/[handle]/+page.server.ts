export const load = async ({ params, locals }) => {
  const { handle } = params;
  let profile;
  if (locals.agent && locals.did) {
    profile = await locals.agent.getProfile({
      actor: locals.did,
    });
  }
  return {
    profile: profile?.data.handle === handle ? profile.data : undefined,
  };
};
