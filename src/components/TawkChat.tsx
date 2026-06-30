'use client'

import Script from 'next/script'

const PROPERTY_ID = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || ''
const WIDGET_ID   = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID   || '1icu9f1lm'

export default function TawkChat() {
  if (!PROPERTY_ID) return null

  return (
    <Script
      id="tawk-to"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
          (function(){
            var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
            s1.async = true;
            s1.src = 'https://embed.tawk.to/${PROPERTY_ID}/${WIDGET_ID}';
            s1.charset = 'UTF-8';
            s1.setAttribute('crossorigin', '*');
            s0.parentNode.insertBefore(s1, s0);
          })();
        `,
      }}
    />
  )
}
