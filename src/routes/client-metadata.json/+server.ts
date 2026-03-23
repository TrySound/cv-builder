import { getClientMetadata } from "$lib/auth.js";

export const GET = () => {
  return Response.json(getClientMetadata());
};
