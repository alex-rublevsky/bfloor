import { run } from "@/lib/s3";

export const POST = async () => {
  //working test that returns list of bucket items
  const result = await run();

  return Response.json(result);
};
