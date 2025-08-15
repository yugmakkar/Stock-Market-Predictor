"use client"

import Spline from '@splinetool/react-spline'

export default function AIBackground() {
  return (
    <div className="fixed inset-0 z-0">
      <Spline 
        scene="https://prod.spline.design/2B41JDlPmNKNpNtkjwzxrYs6/scene.splinecode"
        className="w-full h-full"
      />
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-slate-950/40" />
    </div>
  )
}