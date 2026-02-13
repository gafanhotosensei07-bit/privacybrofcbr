import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const getUtmParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_content: params.get("utm_content") || "",
    utm_term: params.get("utm_term") || "",
  };
};

export const usePageView = (pageType: string, pageSlug: string) => {
  useEffect(() => {
    const track = async () => {
      try {
        const utm = getUtmParams();
        await supabase.from("page_views").insert({
          page_type: pageType,
          page_slug: pageSlug,
          referrer: document.referrer || "",
          ...utm,
        });
      } catch (e) {
        // silent fail
      }
    };
    if (pageType && pageSlug) track();
  }, [pageType, pageSlug]);
};
