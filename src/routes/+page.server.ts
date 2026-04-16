export const load = async ({ locals }) => {
  return {
    handle: locals.handle,
    role: locals.role,
  };
};
