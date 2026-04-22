'use client'

import { useEffect, useRef, useState } from 'react'

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onReady = () => {
      setLoaded(true)
      video.play().catch(() => {})
    }
    if (video.readyState >= 2) {
      queueMicrotask(onReady)
    } else {
      video.addEventListener('loadeddata', onReady, { once: true })
    }
    return () => video.removeEventListener('loadeddata', onReady)
  }, [])

  return (
    <>
      <video
        ref={videoRef}
        src="/gutted-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="absolute inset-0 bg-black/60 z-0" />
    </>
  )
}
