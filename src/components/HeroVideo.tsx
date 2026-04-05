'use client'

import { useEffect, useRef, useState } from 'react'

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Use Intersection Observer to only load video when visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.src = '/Gutted background.mp4'
          video.load()
          observer.disconnect()
        }
      },
      { threshold: 0 }
    )

    observer.observe(video)

    const handleCanPlay = () => {
      setLoaded(true)
      video.play().catch(() => {})
    }
    video.addEventListener('canplay', handleCanPlay)

    return () => {
      observer.disconnect()
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [])

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-0" />
    </>
  )
}
