/**
 * Mirrors IAO email/invoice Handlebars partials:
 * - IAO-LMS-backend/src/modules/email/templates/partials/header.hbs
 * - IAO-LMS-backend/src/modules/email/templates/partials/footer.hbs
 *
 * Brand assets live in lms-frontend/public/images so invoice preview/PDF
 * are same-origin (avoids CORS when html2canvas captures the document).
 */

export function getInvoiceBrandAssets() {
  return {
    logoUrl: "/images/iao-logo.png",
    globeUrl: "/images/Globe.png",
    phoneUrl: "/images/Vector.png",
    emailUrl: "/images/Email.png",
    pinUrl: "/images/Pin.png",
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
    <div className="bg-white px-7 pt-7 pb-4 border border-[#e2e8f0] border-b-0 print:border-0">
      <img src={logoUrl} alt="IAO Logo" width={64} style={{ display: "block" }} />
      <div style={{ height: 14 }} />
      <p
        className="m-0 font-semibold text-black leading-snug"
        style={{ fontSize: 14, fontWeight: 600 }}
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
    <div
      data-invoice-footer="true"
      className="bg-white px-5 pb-6 pt-3"
      style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
    >
      <div className="rounded-xl px-3.5 py-4" style={{ background: "#D5E6EF" }}>
        <div className="flex gap-3 items-start">
          <div className="shrink-0" style={{ width: 48, paddingRight: 10 }}>
            <img
              src={logoUrl}
              alt="IAO"
              width={44}
              height={44}
              style={{ display: "block" }}
            />
          </div>
          <div
            className="shrink-0"
            style={{ width: 1, alignSelf: "stretch", background: "#b6c2cf", minHeight: 96 }}
          />
          <div className="min-w-0 pl-2.5">
            <p
              className="m-0 mb-2.5 text-[11px] font-bold uppercase text-black leading-snug"
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
