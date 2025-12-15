import { TitleBar, NavMenu } from "@shopify/app-bridge-react";
import type { HeadersFunction, LoaderFunctionArgs, LinksFunction } from "react-router";
import { Outlet, useLoaderData, useRouteError, Link as ReactRouterLink } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import enTranslations from "@shopify/polaris/locales/en.json";
import { authenticate } from "../shopify.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles, precedence: "high" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

function Link({ children, url = "", external, ref, ...rest }: any) {
  // eslint-disable-next-line react/jsx-no-target-blank
  if (external || url.startsWith("http")) {
    return (
      <a href={url} ref={ref} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <ReactRouterLink to={url} ref={ref} {...rest}>
      {children}
    </ReactRouterLink>
  );
}

export default function AppLayout() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <ShopifyAppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider i18n={enTranslations} linkComponent={Link}>
        <NavMenu>
          <a href="/app" rel="home">Home</a>
          <a href="/app/all-jobs">All Jobs</a>
          <a href="/app/settings">Settings</a>
          <a href="/app/plans">Plans</a>
        </NavMenu>
        <Outlet />
      </PolarisAppProvider>
    </ShopifyAppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};