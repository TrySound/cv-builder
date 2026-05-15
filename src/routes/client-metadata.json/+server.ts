import { getClientMetadata } from "$lib/auth";

export const GET = () => {
  return Response.json(getClientMetadata());
};
