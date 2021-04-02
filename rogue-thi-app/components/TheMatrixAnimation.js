import React, { useEffect, useState } from 'react'

export default function TheMatrixAnimation () {
  const [canvasId, setCanvasId] = useState(null)

  function getRandomChar () {
    return String.fromCharCode(Math.floor(Math.random() * (126 - 33) + 33))
  }
  function matrixAnimationFrame (canvas, ctx, ypos) {
    // Draw a semitransparent black rectangle on top of previous drawing
    ctx.fillStyle = '#0001'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Set color to green and font to 15pt monospace in the drawing context
    ctx.fillStyle = '#0f0'
    ctx.font = '15pt monospace'

    // for each column put a random character at the end
    ypos.forEach((y, ind) => {
      // x coordinate of the column, y coordinate is already given
      const x = ind * 20
      // render the character at (x, y)
      ctx.fillText(getRandomChar(), x, y)

      if (y > 100 + Math.random() * 10000) {
        // randomly reset the end of the column if it's at least 100px high
        ypos[ind] = 0
      } else {
        // otherwise just move the y coordinate for the column 20px down,
        ypos[ind] = y + 20
      }
    })
  }

  useEffect(() => {
    const id = Math.random().toString(36).substr(2, 8)
    setCanvasId(id)

    let canvas = null
    let ctx = null
    let ypos = null
    setInterval(() => {
      // the following code is mostly taken from
      // https://dev.to/gnsp/making-the-matrix-effect-in-javascript-din

      if (!canvas) {
        canvas = document.getElementById(id)
        if (!canvas) {
          return
        }

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        ctx = canvas.getContext('2d')
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const cols = Math.floor(canvas.width / 20) + 1
        ypos = Array(cols).fill(0)

        ctx.font = '15pt monospace'
        ypos.forEach((y, i) => {
          const x = i * 20
          const startY = Math.floor(Math.random() * (canvas.height - 16 * 20))
          for (let j = 1; j < 16; j++) {
            ctx.fillStyle = `rgb(0, ${j * 16}, 0)`
            ctx.fillText(getRandomChar(), x, startY + j * 20)
          }

          ypos[i] = startY + 16 * 20
        })
      }

      matrixAnimationFrame(canvas, ctx, ypos)
    }, 50)
  }, [])

  return (
    <canvas id={canvasId} />
  )
}
