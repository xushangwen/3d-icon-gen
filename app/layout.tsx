import type { Metadata } from 'next';
import { IBM_Plex_Sans, Space_Grotesk } from 'next/font/google';
import 'remixicon/fonts/remixicon.css';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-sc',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: '3D Icon Generator',
  description: '输入关键词，生成风格一致的 3D 等轴测图标',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${ibmPlexSans.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="min-h-full bg-black text-white antialiased font-[var(--font-ibm-plex-sc)]">
        {children}
      </body>
    </html>
  );
}
