import { client } from "./client";
import type { QueryParams } from "next-sanity";

/**
 * Wrapper around client.fetch with ISR revalidation defaults.
 * Uses tag-based revalidation — call revalidateTag() from the webhook.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  tags = [],
  revalidate = 60,
}: {
  query: string;
  params?: QueryParams;
  tags?: string[];
  revalidate?: number | false;
}) {
  return client.fetch<T>(query, params, {
    next: {
      revalidate,
      tags,
    },
  });
}
