import { client, isSanityConfigured } from "./client";
import type { QueryParams } from "next-sanity";

/**
 * Wrapper around client.fetch with ISR revalidation defaults.
 *
 * Resilience: returns the fallback value when Sanity is not configured
 * OR when the fetch fails for any reason (network, auth, missing
 * dataset). This keeps the build green even when Sanity isn't yet
 * provisioned — pages will refetch on the next ISR cycle.
 */
export async function sanityFetch<T = unknown>({
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

  try {
    return await client.fetch<T>(query, params, {
      next: {
        revalidate,
        tags,
      },
    });
  } catch (err) {
    console.warn(
      `[sanityFetch] query failed, returning fallback: ${(err as Error).message}`
    );
    return fallback as T;
  }
}
