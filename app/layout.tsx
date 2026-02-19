"use client";

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, user-scalable=no"
        />
        <meta
          name="theme-color"
          content="#f8fafc"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#0b1120"
          media="(prefers-color-scheme: dark)"
        />
        <meta
          name="description"
          content="TapHabla - Tap a situation, get the right Spanish phrases fast."
        />
        <title>TapHabla</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
