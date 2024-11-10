/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect } from "react"

import vertexShaderStr from '@/assets/vertex.glsl?raw'
import createRegl from 'regl'

export type WebGLCanvasParam = {
  width: number,
  height: number,
  frag: string,
  vert?: string,
  scale?: number,
  uniformData?: Record<string, any>,
}

function WebGLCanvas({ width, height, frag, vert, scale = 2, uniformData = {} }: WebGLCanvasParam) {
  const canvasRef = useRef(null as unknown as HTMLCanvasElement)
  const regl = useRef<createRegl.Regl>()
  const redraw = useRef<(param: Record<string, any>) => void>(() => { })

  useEffect(() => {
    if (canvasRef.current == null) {
      return
    }
    regl.current = createRegl({ canvas: canvasRef.current })
  }, [])

  useEffect(() => {
    if (!regl.current) {
      return
    }

    const drawRect = regl.current({
      frag,
      vert: vert ?? vertexShaderStr,
      attributes: {
        position: [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ],
      },
      count: 6,
      // @ts-ignore
      uniforms: {...Object.fromEntries(Object.keys(uniformData).map(x => [`u_${x}`, regl.current.prop(x)])), u_resolution: regl.current.prop('resolution')},
    })

    redraw.current = ((p: Record<string, any>) => {
      regl.current?.clear({
        color: [0, 0, 0, 0],
        depth: 1,
      });
      drawRect({...p, resolution: [width * scale, height * scale]})
    })
  }, [frag, vert, Object.keys(uniformData).sort().join(), width, height])

  useEffect(() => {
    redraw.current(uniformData)
  }, [uniformData])

  return (
    <div style={{}}>
      <canvas width={width * scale} height={height * scale} style={{ display: 'block', width: `${width}px`, height: `${height}px` }} ref={canvasRef} />
    </div>
  )
}

export default WebGLCanvas