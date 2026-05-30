import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/components/AuthProvider'
import { ToastProvider } from '@/components/ToastProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AttributionCapture } from '@/components/AttributionCapture'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.gutted.app'),
  title: 'gutted. - Know your gut.',
  description: 'Voice-log your symptoms. Upload your tests. Get a meal plan that actually fits your gut.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'gutted. - Know your gut.',
    description: 'Voice-log your symptoms, upload your gut tests, and get a meal plan built from your own data.',
    type: 'website',
    siteName: 'gutted.',
    url: 'https://www.gutted.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'gutted. - Know your gut.',
    description: 'Voice-log your symptoms, upload your gut tests, and get a meal plan built from your own data.',
  },
  alternates: {
    canonical: '/',
  },
}

// Structured data so search engines and fleet-posted links surface gutted. as a
// product with offers and an FAQ. Rendered server-side, so it is in the initial
// HTML. Health-safe by policy: describes capability and is explicit that gutted
// is non-medical and non-diagnostic.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'gutted.',
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web, iOS, Android (PWA)',
      url: 'https://www.gutted.app',
      description:
        'AI gut-health companion: voice-log symptoms, upload gut tests for plain-English interpretation, and get meal plans and an AI coach grounded in your own data. Non-medical and non-diagnostic.',
      offers: [
        { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
        { '@type': 'Offer', name: 'Core', price: '14', priceCurrency: 'USD' },
        { '@type': 'Offer', name: 'Pro', price: '29', priceCurrency: 'USD' },
      ],
    },
    {
      '@type': 'Organization',
      name: 'gutted.',
      url: 'https://www.gutted.app',
      logo: 'https://www.gutted.app/icon.png',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is gutted. a medical service?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. gutted. is a non-medical, non-diagnostic tracking and insight tool. It does not diagnose, treat, or cure, and it does not replace a doctor.',
          },
        },
        {
          '@type': 'Question',
          name: 'What does gutted. do?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You voice-log symptoms, upload gut tests for plain-English interpretation, and get meal plans and an AI coach grounded in your own logs and biomarkers.',
          },
        },
        {
          '@type': 'Question',
          name: 'How much does gutted. cost?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'There is a free tier, Core at 14 dollars per month, and Pro at 29 dollars per month.',
          },
        },
      ],
    },
  ],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-black">
      <body className="bg-black text-white md:min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AttributionCapture />
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
      </body>
    </html>
  )
}
