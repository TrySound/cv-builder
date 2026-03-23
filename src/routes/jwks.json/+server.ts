import { env } from "$env/dynamic/private";

export const GET = () => {
  const privateKey = JSON.parse(env.PRIVATE_KEY);

  // Strip the private key fields before serving
  const { d, ...publicKey } = privateKey;

  return Response.json({
    keys: [publicKey],
  });
};
