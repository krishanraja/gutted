import { ImageResponse } from 'next/og'

// Branded OG card so fleet-posted and shared links unfurl cleanly instead of
// showing a bare URL. On-skin: pure-black canvas, the teal-to-green brand
// gradient on the wordmark, Inter-ish system weight.
export const alt = 'gutted. - Know your gut.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: '#000000',
          padding: '96px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            backgroundImage: 'linear-gradient(90deg, #00B4B4, #3FBE6F)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          gutted.
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 52, fontWeight: 600, color: '#ffffff' }}>
          Know your gut.
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 20,
            fontSize: 32,
            color: 'rgba(255,255,255,0.55)',
            maxWidth: 920,
            lineHeight: 1.3,
          }}
        >
          Voice-log your symptoms, read your gut tests, and get a meal plan built from your own data.
        </div>
      </div>
    ),
    { ...size },
  )
}
