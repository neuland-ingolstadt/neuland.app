import React, { useEffect, useState } from 'react'

export default function TheMatrixAnimation () {
  const [canvasId, setCanvasId] = useState(null)

  useEffect(() => {
    const id = Math.random().toString(36).substr(2, 8)
    setCanvasId(id)

    let canvas = null
    let ctx = null
    let cols = null
    let ypos = null
    setInterval(() => {
      // the following code is mostly taken from
      // https://dev.to/gnsp/making-the-matrix-effect-in-javascript-din

      if (!canvas || !ctx) {
        canvas = document.getElementById(id)
        console.log('found canvas', canvas, 'with id', id)
        if (!canvas) {
          return
        }
        ctx = canvas.getContext('2d')

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        cols = Math.floor(canvas.width / 20) + 1
        ypos = Array(cols).fill(0)

        console.log(canvas, canvas.width, canvas.height)
      }

      // Draw a semitransparent black rectangle on top of previous drawing
      ctx.fillStyle = '#0001'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Set color to green and font to 15pt monospace in the drawing context
      ctx.fillStyle = '#0f0'
      ctx.font = '15pt monospace'

      // for each column put a random character at the end
      ypos.forEach((y, ind) => {
        // generate a random character
        const text = String.fromCharCode(Math.random() * 128)

        // x coordinate of the column, y coordinate is already given
        const x = ind * 20
        // render the character at (x, y)
        ctx.fillText(text, x, y)

        if (y > 100 + Math.random() * 10000) {
          // randomly reset the end of the column if it's at least 100px high
          ypos[ind] = 0
        }
        else {
          // otherwise just move the y coordinate for the column 20px down,
          ypos[ind] = y + 20
        }
      })
    }, 50)
  }, [])

  return (
    <canvas id={canvasId} />
  )
}
