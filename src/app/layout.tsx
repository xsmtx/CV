import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/source-sans-3";
import "@/styles/globals.css";
import "@/styles/responsive.css";
import "@/styles/themes.css";
import "@/styles/cosmos.css";
import "@/styles/reading-panels.css";
import { profile } from "@/data/profile";
import { themeBootstrap } from "@/lib/theme";
import { ThemeColor } from "@/components/ui/theme-toggle";

export const metadata: Metadata = {
  metadataBase: new URL(profile.website),
  title: {
    default: "Samet Kabakci — System Engineer",
    template: "%s | Samet Kabakci",
  },
  description:
    "Explore the infrastructure universe of Samet Kabakci. Linux systems, cloud infrastructure, automation and engineering leadership, based in İzmir, Türkiye.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Samet Kabakci — System Engineer",
    description: profile.introduction,
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Samet Kabakci",
    images: [
      {
        url: "/assets/social-preview.png",
        width: 1200,
        height: 630,
        alt: "Samet Kabakci — System Engineer. An artificial celestial body with orbital infrastructure paths.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Samet Kabakci — System Engineer",
    description: profile.introduction,
    images: ["/assets/social-preview.png"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <ThemeColor />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
