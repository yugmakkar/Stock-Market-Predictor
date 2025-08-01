"use client"

import { useEffect, useRef } from "react"

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Particle system
    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      color: string

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.size = Math.random() * 2 + 1
        this.opacity = Math.random() * 0.5 + 0.1
        this.color = Math.random() > 0.5 ? "#3B82F6" : "#8B5CF6"
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width
        if (this.x > canvas.width) this.x = 0
        if (this.y < 0) this.y = canvas.height
        if (this.y > canvas.height) this.y = 0

        // Pulse opacity
        this.opacity = 0.1 + Math.sin(Date.now() * 0.001 + this.x * 0.01) * 0.3
      }

      draw() {
        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    // Neural network lines
    class NeuralConnection {
      x1: number
      y1: number
      x2: number
      y2: number
      opacity: number
      progress: number

      constructor() {
        this.x1 = Math.random() * canvas.width
        this.y1 = Math.random() * canvas.height
        this.x2 = Math.random() * canvas.width
        this.y2 = Math.random() * canvas.height
        this.opacity = 0
        this.progress = 0
      }

      update() {
        this.progress += 0.01
        if (this.progress > 1) {
          this.progress = 0
          this.x1 = Math.random() * canvas.width
          this.y1 = Math.random() * canvas.height
          this.x2 = Math.random() * canvas.width
          this.y2 = Math.random() * canvas.height
        }

        this.opacity = Math.sin(this.progress * Math.PI) * 0.3
      }

      draw() {
        const currentX = this.x1 + (this.x2 - this.x1) * this.progress
        const currentY = this.y1 + (this.y2 - this.y1) * this.progress

        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.strokeStyle = "#10B981"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(this.x1, this.y1)
        ctx.lineTo(currentX, currentY)
        ctx.stroke()
        ctx.restore()
      }
    }

    // Create particles and connections
    const particles: Particle[] = []
    const connections: NeuralConnection[] = []

    for (let i = 0; i < 100; i++) {
      particles.push(new Particle())
    }

    for (let i = 0; i < 20; i++) {
      connections.push(new NeuralConnection())
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      // Clear canvas with gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, "#0F172A")
      gradient.addColorStop(0.5, "#1E293B")
      gradient.addColorStop(1, "#0F172A")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.save()
      ctx.globalAlpha = 0.1
      ctx.strokeStyle = "#3B82F6"
      ctx.lineWidth = 1

      const gridSize = 50
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

      // Update and draw neural connections
      connections.forEach((connection) => {
        connection.update()
        connection.draw()
      })

      // Update and draw particles
      particles.forEach((particle) => {
        particle.update()
        particle.draw()
      })

      // Draw connecting lines between nearby particles
      ctx.save()
      ctx.globalAlpha = 0.1
      ctx.strokeStyle = "#8B5CF6"
      ctx.lineWidth = 1

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
      ctx.restore()

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)" }}
    />
  )
}
