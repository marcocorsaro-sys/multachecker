import { client, isSanityConfigured } from "./client";
import type { QueryParams } from "next-sanity";

/**
 * Wrapper around client.fetch with ISR revalidation defaults.
 * Returns the fallback value when Sanity is not configured.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sanityFetch<T = any>({
  query,
  params = {},
  tags = [],
  revalidate = 60,
  fallback,
}: {
  query: string;
  params?: QueryParams;
  tags?: string[];
  revalidate?: number | false;
  fallback?: T;
}): Promise<T> {
  if (!isSanityConfigured) {
    return fallback as T;
  }

  return client.fetch<T>(query, params, {
    next: {
      revalidate,
      tags,
    },
  });
}
