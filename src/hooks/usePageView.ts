import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePageView = (pageType: string, pageSlug: string) => {
  useEffect(() => {
    const track = async () => {
      try {
        await supabase.from("page_views").insert({
          page_type: pageType,
          page_slug: pageSlug,
          referrer: document.referrer || "",
        });
      } catch (e) {
        // silent fail
      }
    };
    if (pageType && pageSlug) track();
  }, [pageType, pageSlug]);
};
