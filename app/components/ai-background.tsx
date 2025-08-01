"use client"

import { useEffect, useRef } from "react"

export default function AIBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Subtle particle system
    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.vx = (Math.random() - 0.5) * 0.2
        this.vy = (Math.random() - 0.5) * 0.2
        this.size = Math.random() * 1 + 0.5
        this.opacity = Math.random() * 0.2 + 0.05
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0) this.x = canvas.width
        if (this.x > canvas.width) this.x = 0
        if (this.y < 0) this.y = canvas.height
        if (this.y > canvas.height) this.y = 0
      }

      draw() {
        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.fillStyle = "#3B82F6"
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    const particles: Particle[] = []
    for (let i = 0; i < 30; i++) {
      particles.push(new Particle())
    }

    const animate = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, "#020617")
      gradient.addColorStop(0.5, "#0F172A")
      gradient.addColorStop(1, "#1E293B")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Very subtle grid
      ctx.save()
      ctx.globalAlpha = 0.02
      ctx.strokeStyle = "#3B82F6"
      ctx.lineWidth = 1

      const gridSize = 100
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
      ctx.restore()

      particles.forEach((particle) => {
        particle.update()
        particle.draw()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />
}
