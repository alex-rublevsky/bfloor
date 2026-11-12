import {
  S3_URL,
  S3_REGION,
  S3_ACCESS_KEY,
  S3_SECRET_ACCESS_KEY,
} from "astro:env/server";
import { S3Client } from "@aws-sdk/client-s3";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

let client: S3Client | undefined;

export function getStorageClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: S3_REGION,
      endpoint: S3_URL,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
      },
    });
  }

  return client;
}

const clientx = getStorageClient();

//working test that returns list of bucket items
export async function run() {
  const input = {
    Bucket: "bfloor",
    MaxKeys: 2,
  };
  const command = new ListObjectsV2Command(input);

  const response = await clientx.send(command);
  return response.Contents;
}
