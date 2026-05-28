import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const logoUrl = "https://res.cloudinary.com/dfv1e9p8p/image/upload/v1779982502/sosanhxe/logos/sosanhxe-logo.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "So Sanh Xe - Detailed car comparison",
    template: "%s | So Sanh Xe"
  },
  description: "Compare car specifications, dimensions, engines, fuel consumption, prices, comfort features, safety systems, votes, and comments.",
  icons: {
    icon: "/icon.svg"
  },
  openGraph: {
    type: "website",
    siteName: "So Sanh Xe",
    locale: "vi_VN"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
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
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium text-muted">
              <Link href="/cars" className="hover:text-ink">
                Cars
              </Link>
              <Link href="/compare" className="hover:text-ink">
                Compare
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
