import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

const logoUrl = "https://res.cloudinary.com/dfv1e9p8p/image/upload/v1779982502/sosanhxe/logos/sosanhxe-logo.jpg";
const ogImageUrl =
  "https://res.cloudinary.com/dfv1e9p8p/image/upload/f_auto,q_auto,c_fill,g_auto,w_1200,h_630/v1779982502/sosanhxe/logos/sosanhxe-logo.jpg";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sosanhcar.com";
const siteName = "So Sánh Xe";
const siteDescription =
  "So sánh xe ô tô tại Việt Nam theo giá bán, động cơ, kích thước, tiêu hao nhiên liệu, tiện nghi, an toàn, bình chọn và bình luận.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: "So Sánh Xe - So sánh ô tô chi tiết tại Việt Nam",
    template: "%s | So Sánh Xe"
  },
  description: siteDescription,
  icons: {
    icon: "/icon.svg"
  },
  openGraph: {
    type: "website",
    siteName,
    title: "So Sánh Xe - So sánh ô tô chi tiết tại Việt Nam",
    description: siteDescription,
    url: "/",
    locale: "vi_VN",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "So Sánh Xe"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "So Sánh Xe - So sánh ô tô chi tiết tại Việt Nam",
    description: siteDescription,
    images: [ogImageUrl]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-TK00NKEML0"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-TK00NKEML0');
        `}
      </Script>
      <body className="min-h-screen antialiased">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center" aria-label="So Sanh Xe home">
              <Image
                src={logoUrl}
                alt="So Sanh Xe"
                width={150}
                height={56}
                priority
                className="h-9 w-auto rounded-md object-contain sm:h-11"
              />
              <span className="sr-only">So Sánh Xe</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium text-muted">
              <Link href="/cars" className="hover:text-ink">
                Cars
              </Link>
              <Link href="/compare" className="hover:text-ink">
                Compare
              </Link>
              <Link href="/chuyen-cua-xe" className="hover:text-ink">
                Chuyện của xe
              </Link>
              <Link href="/about" className="hover:text-ink">
                About
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t border-line bg-white">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-muted sm:grid-cols-3">
            <div>
              <h2 className="font-bold text-ink">So sánh xe</h2>
              <div className="mt-3 space-y-2">
                <Link href="/compare" className="block hover:text-ink">
                  Compare Cars
                </Link>
                <Link href="/cars" className="block hover:text-ink">
                  Car Database
                </Link>
              </div>
            </div>
            <div>
              <h2 className="font-bold text-ink">Cộng đồng</h2>
              <div className="mt-3 space-y-2">
                <Link href="/chuyen-cua-xe" className="block hover:text-ink">
                  Chuyện của xe
                </Link>
                <Link href="/contact" className="block hover:text-ink">
                  Contact Us
                </Link>
                <Link href="/faq" className="block hover:text-ink">
                  FAQ
                </Link>
              </div>
            </div>
            <div>
              <h2 className="font-bold text-ink">So Sánh Xe</h2>
              <div className="mt-3 space-y-2">
                <Link href="/about" className="block hover:text-ink">
                  About
                </Link>
                <Link href="/privacy-policy" className="block hover:text-ink">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-4 pb-6 text-sm text-muted">So Sánh Xe © 2026</div>
        </footer>
      </body>
    </html>
  );
}
