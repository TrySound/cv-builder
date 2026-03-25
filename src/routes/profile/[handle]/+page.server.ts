export const load = async ({ params: _params, locals }) => {
  // @todo params.handle
  return {
    handle: locals.handle,
  };
};
