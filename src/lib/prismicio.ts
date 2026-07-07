import * as prismic from "@prismicio/client";
import {
  enableAutoPreviews,
  type CreateClientConfig,
} from "@prismicio/svelte/kit";
import config from "../../slicemachine.config.json";

export const repositoryName =
  import.meta.env.VITE_PRISMIC_ENVIRONMENT || config.repositoryName;

/**
 * True when the starter has not yet been wired to a real Prismic repository.
 * Prerender entry points (sitemap, dynamic [uid]) short-circuit to empty
 * results in that case so `pnpm build` succeeds on an unconfigured clone.
 */
export const isPlaceholderRepo = repositoryName === "your-prismic-repo-name";

/** The homepage document's UID (single-page Blux migration). */
export const HOME_UID = "the-pointe";

const routes: prismic.ClientConfig["routes"] = [
  {
    type: "page",
    uid: HOME_UID,
    path: "/",
  },
  {
    type: "page",
    path: "/:uid",
  },
];

export const createClient = ({
  cookies,
  ...config
}: CreateClientConfig = {}) => {
  const client = prismic.createClient(repositoryName, {
    routes,
    ...config,
  });

  enableAutoPreviews({ client, cookies });

  return client;
};
