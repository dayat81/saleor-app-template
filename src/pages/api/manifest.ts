import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import { AppExtension, AppManifest } from "@saleor/app-sdk/types";

import packageJson from "@/package.json";

import { deliveryAssignedWebhook } from "./webhooks/delivery-assigned";
import { orderCreatedWebhook } from "./webhooks/order-created";
import { orderFilterShippingMethodsWebhook } from "./webhooks/order-filter-shipping-methods";
import { orderStatusUpdateWebhook } from "./webhooks/order-status-update";
import { restaurantOrderReceivedWebhook } from "./webhooks/restaurant-order-received";

/**
 * App SDK helps with the valid Saleor App Manifest creation. Read more:
 * https://github.com/saleor/saleor-app-sdk/blob/main/docs/api-handlers.md#manifest-handler-factory
 */
export default createManifestHandler({
  async manifestFactory({ appBaseUrl, request, schemaVersion }) {
    /**
     * Allow to overwrite default app base url, to enable Docker support.
     *
     * See docs: https://docs.saleor.io/docs/3.x/developer/extending/apps/local-app-development
     */
    const iframeBaseUrl = process.env.APP_IFRAME_BASE_URL ?? appBaseUrl;
    const apiBaseURL = process.env.APP_API_BASE_URL ?? appBaseUrl;

    const extensionsForSaleor3_22: AppExtension[] = [
        {
          url: apiBaseURL + "/api/restaurant-dashboard",
          permissions: ["MANAGE_ORDERS", "MANAGE_PRODUCTS"],
          mount: "NAVIGATION_CATALOG",
          label: "Restaurant Management",
          target: "APP_PAGE",
        },
        {
          url: iframeBaseUrl + "/order-tracking-widget",
          permissions: ["MANAGE_ORDERS"],
          mount: "ORDER_DETAILS_WIDGETS",
          label: "F&B Order Tracking",
          target: "WIDGET",
          options: {
            widgetTarget: {
              method: "GET",
            },
          },
        },
        {
          url: apiBaseURL + "/api/menu-management",
          permissions: ["MANAGE_PRODUCTS"],
          mount: "PRODUCT_OVERVIEW_CREATE",
          label: "Menu Item Creator",
          target: "WIDGET",
          options: {
            widgetTarget: {
              method: "POST",
            },
          },
        },
      ]

    const saleorMajor = schemaVersion && schemaVersion[0];
    const saleorMinor = schemaVersion && schemaVersion[1]

    const is3_22 = saleorMajor === 3 && saleorMinor === 22;

    const extensions = is3_22 ? extensionsForSaleor3_22 : [];

    const manifest: AppManifest = {
      name: "F&B Restaurant Management App",
      tokenTargetUrl: `${apiBaseURL}/api/register`,
      appUrl: iframeBaseUrl,
      /**
       * Set permissions for app if needed
       * https://docs.saleor.io/docs/3.x/developer/permissions
       */
      permissions: [
        /**
         * F&B App permissions for restaurant management
         */
        "MANAGE_ORDERS",      // Order management and tracking
        "MANAGE_PRODUCTS",    // Menu item management  
        "MANAGE_USERS",       // Customer management
        "MANAGE_CHANNELS",    // Restaurant channel management
        "MANAGE_SHIPPING",    // Delivery method management
      ],
      id: "saleor.app",
      version: packageJson.version,
      /**
       * Configure webhooks here. They will be created in Saleor during installation
       * Read more
       * https://docs.saleor.io/docs/3.x/developer/api-reference/webhooks/objects/webhook
       *
       * Easiest way to create webhook is to use app-sdk
       * https://github.com/saleor/saleor-app-sdk/blob/main/docs/saleor-webhook.md
       */
      webhooks: [
        orderCreatedWebhook.getWebhookManifest(apiBaseURL),
        orderFilterShippingMethodsWebhook.getWebhookManifest(apiBaseURL),
        restaurantOrderReceivedWebhook.getWebhookManifest(apiBaseURL),
        orderStatusUpdateWebhook.getWebhookManifest(apiBaseURL),
        deliveryAssignedWebhook.getWebhookManifest(apiBaseURL),
      ],
      /**
       * Optionally, extend Dashboard with custom UIs
       * https://docs.saleor.io/docs/3.x/developer/extending/apps/extending-dashboard-with-apps
       */
      extensions: extensions,
      author: "Saleor Commerce",
      brand: {
        logo: {
          default: `${apiBaseURL}/logo.png`,
        },
      },
    };

    return manifest;
  },
});
