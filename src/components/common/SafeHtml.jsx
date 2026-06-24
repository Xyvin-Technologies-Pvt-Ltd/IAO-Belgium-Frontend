import DOMPurify from "dompurify";
import { createElement, useMemo } from "react";

/**
 * Renders trusted-looking-but-untrusted HTML safely.
 *
 * Notification / rich-text content is authored via the TipTap editor and stored
 * server-side, then rendered here. Without sanitization this is a stored-XSS
 * sink (see frontend audit §3.1). DOMPurify strips scripts, event handlers and
 * dangerous URL schemes while keeping normal formatting.
 *
 * Use this instead of `dangerouslySetInnerHTML` everywhere.
 */
const SafeHtml = ({ html, className, as = "div", ...rest }) => {
  const clean = useMemo(() => {
    if (!html || typeof html !== "string") return "";
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }, [html]);

  return createElement(as, {
    className,
    dangerouslySetInnerHTML: { __html: clean },
    ...rest,
  });
};

export default SafeHtml;
