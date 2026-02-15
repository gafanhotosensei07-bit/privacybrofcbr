// Meta Pixel helper — fires standard & custom events
// fbq is loaded globally via index.html

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

const fbq = (...args: any[]) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(...args);
  }
};

/** Standard events */
export const trackPageView = () => fbq("track", "PageView");

export const trackViewContent = (params: {
  content_name: string;
  content_category?: string;
  content_type?: string;
  value?: number;
  currency?: string;
}) => fbq("track", "ViewContent", params);

export const trackInitiateCheckout = (params: {
  content_name: string;
  value: number;
  currency?: string;
  num_items?: number;
}) =>
  fbq("track", "InitiateCheckout", {
    ...params,
    currency: params.currency || "BRL",
  });

export const trackPurchase = (params: {
  content_name: string;
  value: number;
  currency?: string;
}) =>
  fbq("track", "Purchase", {
    ...params,
    currency: params.currency || "BRL",
  });

export const trackLead = (params?: { content_name?: string; value?: number }) =>
  fbq("track", "Lead", { ...params, currency: "BRL" });

/** Custom events */
export const trackCustom = (event: string, params?: Record<string, any>) =>
  fbq("trackCustom", event, params);
