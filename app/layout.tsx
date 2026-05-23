import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "So Sánh Xe - So sánh ô tô chi tiết",
    template: "%s | So Sánh Xe"
  },
  description: "So sánh thông số ô tô, kích thước, động cơ, tiêu hao nhiên liệu, giá bán, tiện nghi, an toàn và bình chọn người dùng.",
  icons: {
    icon: "/icon.svg"
  },
  openGraph: {
    type: "website",
    siteName: "So Sánh Xe",
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
            <Link href="/" className="text-lg font-bold tracking-tight text-ink">
              So Sánh Xe
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium text-muted">
              <Link href="/cars" className="hover:text-ink">
                Danh sách xe
              </Link>
              <Link href="/compare" className="hover:text-ink">
                So sánh
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
