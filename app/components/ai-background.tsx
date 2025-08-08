"use client"

import { useEffect, useRef, useState } from "react"

export default function AIBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleVideoLoad = () => {
      setIsVideoLoaded(true)
      video.play().catch(console.error)
    }

    const handleVideoError = () => {
      console.warn('Video failed to load, falling back to gradient background')
      setIsVideoLoaded(false)
    }

    video.addEventListener('loadeddata', handleVideoLoad)
    video.addEventListener('error', handleVideoError)

    return () => {
      video.removeEventListener('loadeddata', handleVideoLoad)
      video.removeEventListener('error', handleVideoError)
    }
  }, [])

  return (
    <>
      <video
        ref={videoRef}
        className={`fixed inset-0 z-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isVideoLoaded ? 'opacity-30' : 'opacity-0'
        }`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source 
          src="https://videos.pexels.com/video-files/2611250/2611250-uhd_2560_1440_30fps.mp4" 
          type="video/mp4" 
        />
      </video>
      
      {/* Fallback gradient background */}
      <div 
        className={`fixed inset-0 z-0 transition-opacity duration-1000 ${
          isVideoLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background: 'linear-gradient(135deg, #020617 0%, #0F172A 50%, #1E293B 100%)'
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="fixed inset-0 z-0 bg-slate-950/60" />
    </>
  )
}
