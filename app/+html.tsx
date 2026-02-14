import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        <link rel="manifest" href="/manifest.json" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TwoLips" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="icon" href="/icon.png" />

        <meta name="theme-color" content="#FFD1DC" />

        <ScrollViewStyleReset />

        <style
          dangerouslySetInnerHTML={{
            __html: `
          html, body, #root {
            height: 100%;
            overflow: hidden;
            -webkit-overflow-scrolling: none;
            overscroll-behavior: none;
            touch-action: pan-x pan-y;
          }
        `,
          }}
        />
      </head>
      <body style={{ overflow: "hidden", height: "100%" }}>{children}</body>
    </html>
  );
}
