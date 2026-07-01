import { useState, useEffect } from "react";
import { getPresignedUrls } from "@/api/filesApi";

//* Matches references to our own uploaded files: the backend upload proxy path
//* or a direct S3 URL. External links (e.g. YouTube) are left untouched.
const UPLOADED_FILE_PATTERN = /(\/upload\/|\.amazonaws\.com\/)/i;

//* Rewrites <img>/<a>/<video>/<source> references inside a rich-text HTML string
//* to short-lived presigned URLs so embedded private files render correctly.
//* Returns the original HTML until the presigned URLs resolve.
export const useSecureHtml = (html) => {
  const [secureHtml, setSecureHtml] = useState(html);

  useEffect(() => {
    if (!html || typeof window === "undefined") {
      setSecureHtml(html);
      return;
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    const elements = Array.from(
      doc.querySelectorAll("img[src], a[href], video[src], source[src]")
    );

    const getRef = (el) => el.getAttribute("src") || el.getAttribute("href");
    const refs = elements
      .map(getRef)
      .filter((url) => url && UPLOADED_FILE_PATTERN.test(url));

    if (refs.length === 0) {
      setSecureHtml(html);
      return;
    }

    let cancelled = false;
    getPresignedUrls(refs)
      .then((map) => {
        if (cancelled) return;
        elements.forEach((el) => {
          const attr = el.hasAttribute("src") ? "src" : "href";
          const val = el.getAttribute(attr);
          if (val && map[val]) el.setAttribute(attr, map[val]);
        });
        setSecureHtml(doc.body.innerHTML);
      })
      .catch(() => {
        if (!cancelled) setSecureHtml(html);
      });

    return () => {
      cancelled = true;
    };
  }, [html]);

  return secureHtml;
};
