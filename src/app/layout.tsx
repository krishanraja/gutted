import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'gutted. - Know your gut',
  description: 'Voice-log your symptoms. Upload your tests. Get a meal plan that actually fits your gut.',
  manifest: '/manifest.json',
  icons: { icon: '/icon.png', apple: '/icon.png' },
  openGraph: {
    title: 'gutted.',
    description: 'Know your gut.',
    siteName: 'gutted.',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
