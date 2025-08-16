"use client"

import Spline from '@splinetool/react-spline'
import { useState } from 'react'

export default function AIBackground() {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-slate-950/40" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-0">
      <Spline 
        scene="https://prod.spline.design/6Wq1Q7YGyM-iab9s/scene.splinecode"
        className="w-full h-full"
        onError={() => setHasError(true)}
      />
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-slate-950/40" />
    </div>
  )
}