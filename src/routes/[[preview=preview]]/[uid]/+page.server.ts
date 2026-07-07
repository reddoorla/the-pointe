import { asText } from "@prismicio/client";
import { error, redirect } from "@sveltejs/kit";

import { createClient, HOME_UID, isPlaceholderRepo } from "$lib/prismicio";

export async function load({ params, fetch, cookies }) {
  if (params.uid === HOME_UID) redirect(308, "/");

  const client = createClient({ fetch, cookies });

  try {
    const page = await client.getByUID("page", params.uid);

    return {
      page,
      title: asText(page.data.title),
      meta_description: page.data.meta_description,
      meta_title: page.data.meta_title,
      meta_image: page.data.meta_image?.url,
      meta_image_alt: page.data.meta_image?.alt ?? undefined,
    };
  } catch {
    error(404, { message: "Page not found" });
  }
}

export async function entries() {
  if (isPlaceholderRepo) return [];

  const client = createClient();

  const pages = await client.getAllByType("page");

  // The home document is rendered by the root route — exclude the duplicate.
  return pages
    .filter((page) => page.uid !== HOME_UID)
    .map((page) => ({ uid: page.uid }));
}
