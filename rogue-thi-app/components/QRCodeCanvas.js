import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

export default function QRCodeCanvas ({ className, width, height, value }) {
  const canvas = useRef(null)

  useEffect(() => {
    if (!canvas.current) {
      return
    }

    QRCode.toCanvas(canvas.current, value, error => {
      console.error(error)
    })
  }, [value])

  return (
    <canvas ref={canvas} className={className} width={width} height={height} />
  )
}
