"use client";

import Script from "next/script";

export default function CalendarEmbed() {
  return (
    <>
      <iframe
        src="https://api.leadconnectorhq.com/widget/booking/F28UtidAQzcdYXYIm7wb"
        style={{ width: "100%", border: "none", overflow: "hidden", minHeight: "700px" }}
        scrolling="no"
        id="F28UtidAQzcdYXYIm7wb_1770709219272"
        title="Book a Strategy Call with Karbon Agency"
      />
      <Script
        src="https://link.msgsndr.com/js/form_embed.js"
        strategy="afterInteractive"
      />
    </>
  );
}
