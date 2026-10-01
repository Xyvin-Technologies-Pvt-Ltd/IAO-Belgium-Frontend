/**
 * Mirrors IAO email/invoice Handlebars partials:
 * - IAO-LMS-backend/src/modules/email/templates/partials/header.hbs
 * - IAO-LMS-backend/src/modules/email/templates/partials/footer.hbs
 */

function getAppBaseUrl() {
  const api = import.meta.env.VITE_APP_API_URL || "";
  const base = String(api)
    .replace(/\/api\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return base || "http://localhost:3005";
}

export function getInvoiceBrandAssets() {
  const appUrl = getAppBaseUrl();
  return {
    appUrl,
    logoUrl: `${appUrl}/public/images/iao%201.png`,
    globeUrl: `${appUrl}/public/images/Globe.png`,
    phoneUrl: `${appUrl}/public/images/Vector.png`,
    emailUrl: `${appUrl}/public/images/Email.png`,
    pinUrl: `${appUrl}/public/images/Pin.png`,
  };
}

function ContactPill({ iconSrc, iconAlt, children, iconWidth = 13, iconHeight = 13 }) {
  return (
    <div
      className="inline-flex items-center rounded-full mb-2 last:mb-0"
      style={{ background: "#F4F7FB", padding: "4px 12px 4px 4px" }}
    >
      <span
        className="inline-flex items-center justify-center rounded-full bg-white shrink-0 overflow-hidden"
        style={{ width: 26, height: 26 }}
      >
        <img
          src={iconSrc}
          alt={iconAlt}
          width={iconWidth}
          height={iconHeight}
          style={{ display: "block", objectFit: "contain" }}
        />
      </span>
      <span
        className="pl-2 text-[10px] font-medium whitespace-nowrap"
        style={{ color: "#737F94" }}
      >
        {children}
      </span>
    </div>
  );
}

/** {{> header}} */
export function InvoicePrintHeader() {
  const { logoUrl } = getInvoiceBrandAssets();

  return (
    <div className="bg-white px-10 pt-10 pb-6 border border-[#e2e8f0] border-b-0 print:border-0">
      <img src={logoUrl} alt="IAO Logo" width={80} style={{ display: "block" }} />
      <div style={{ height: 20 }} />
      <p
        className="m-0 text-lg font-semibold text-black leading-snug"
        style={{ fontSize: 18, fontWeight: 600 }}
      >
        THE INTERNATIONAL ACADEMY OF OSTEOPATHY
      </p>
    </div>
  );
}

/** {{> footer}} */
export function InvoicePrintFooter() {
  const { logoUrl, globeUrl, phoneUrl, emailUrl, pinUrl } = getInvoiceBrandAssets();

  return (
    <div className="bg-white px-6 pb-9 pt-5 print:px-6">
      <div className="rounded-xl px-[18px] py-[22px]" style={{ background: "#D5E6EF" }}>
        <div className="flex gap-3.5 items-start">
          <div className="shrink-0" style={{ width: 60, paddingRight: 14 }}>
            <img
              src={logoUrl}
              alt="IAO"
              width={55}
              height={55}
              style={{ display: "block" }}
            />
          </div>
          <div className="w-px self-stretch shrink-0" style={{ background: "#b6c2cf" }} />
          <div className="min-w-0 pl-3.5">
            <p
              className="m-0 mb-3.5 text-[13px] font-bold uppercase text-black leading-snug"
              style={{ textTransform: "uppercase" }}
            >
              THE INTERNATIONAL ACADEMY OF OSTEOPATHY IAO VZW
            </p>
            <div className="flex flex-col items-start">
              <ContactPill iconSrc={globeUrl} iconAlt="Website">
                www.osteopathy.eu
              </ContactPill>
              <ContactPill iconSrc={phoneUrl} iconAlt="Phone">
                +32 9 233 04 03
              </ContactPill>
              <ContactPill iconSrc={emailUrl} iconAlt="Email" iconWidth={14} iconHeight={10}>
                info@osteopathy.eu
              </ContactPill>
              <ContactPill iconSrc={pinUrl} iconAlt="Address" iconWidth={10} iconHeight={13}>
                Bollebergen 2B, Bus 15, 9052 Ghent (Zwijnaarde)
              </ContactPill>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
