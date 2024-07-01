import { useCallback, useEffect, useRef, useState } from 'react'
import reactLogo from '@/assets/react.svg'
import viteLogo from '@/vite.svg'
import '@/App.css'
import { Color, useCurrentColor } from '@/color'

function App() {
  const [currentColor, setCurrentColor] = useCurrentColor()

  const [selectPos, setSelectPos] = useState([0, 0] as [number, number])

  const [hue, setHue] = useState(0)
  useEffect(() => {
    const i = setInterval(() => {
      // setHue(h => (h + 1) % 360)
    }, 1000 / 60)
    return () => {
      clearInterval(i)
    }
  }, [])

  const canvasRepaint = useCallback((ctx: CanvasRenderingContext2D) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const imageData = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let saturation = x / width;
        let value = 1 - (y / height);
        let { r, g, b } = hsvToRgb(hue / 360, saturation, value);

        let index = (y * width + x) * 4;
        imageData.data[index] = r;
        imageData.data[index + 1] = g;
        imageData.data[index + 2] = b;
        imageData.data[index + 3] = 255; // alpha channel
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [hue])

  return (
    <>
      <div>
        currentColor: rgb({currentColor[0]}, {currentColor[1]}, {currentColor[2]})<br />
        hue: {hue} <br />
        select: ({selectPos[0]}, {selectPos[1]})
      </div>
      <div style={{display: 'flex'}}>
        <SelectableCanvas width={400} height={400} repaint={canvasRepaint} selectPos={selectPos} selectPosChanged={setSelectPos} />
        <SelectableCanvas width={400} height={400} repaint={canvasRepaint} selectPos={selectPos} selectPosChanged={setSelectPos} />
        <SelectableCanvas width={400} height={400} repaint={canvasRepaint} selectPos={selectPos} selectPosChanged={setSelectPos} />
      </div>
    </>
  )
}


type SelectableCanvasParam = {
  width: number,
  height: number,
  repaintTrigger?: any,
  repaint: (ctx: CanvasRenderingContext2D) => void,
  selectPos: [number, number],
  selectPosChanged: (newPos: [number, number]) => void
}

/**
 * 一个支持选择特定位置的拾色器，作为拾色器的底层实现，在width，height，repaintTrigger，repaint变化时重绘；
 * selectPos变化时重绘选择位置（svg的一个圆）
 * 
 * TODO 拾色器和调节条考虑都用它来实现；需要提供限制选择位置的参数以适应调节条的需求（默认用clamp）
 * 
 * TODO 需要配置标识选择位置的圆的大小，样式等
 * 
 * TODO 如果性能太差，就改这里的实现为CSS或SVG或webGL
 */
function SelectableCanvas({ width, height, repaint, repaintTrigger, selectPos, selectPosChanged }: SelectableCanvasParam) {
  const canvas = useRef<HTMLCanvasElement>(null as unknown as HTMLCanvasElement)
  const [selectorCircleColor, setSelectorCircleColor] = useState('black')
  useEffect(() => {
    const ctx = canvas.current.getContext('2d')
    if (!ctx) return
    let picking = false
    function startPicking(event: MouseEvent) {
      picking = true;
      pickColor(event);
    }

    function stopPicking() {
      picking = false;
    }

    function pickColor(event: MouseEvent) {
      if (!picking) { return }

      const rect = canvas.current.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, canvas.current.width);
      const y = clamp(event.clientY - rect.top, 0, canvas.current.height);
      selectPosChanged([x, y])
    }

    canvas.current.addEventListener('mousedown', startPicking);
    document.addEventListener('mousemove', pickColor);
    document.addEventListener('mouseup', stopPicking);
    // canvas.current.addEventListener('mouseleave', stopPicking);

    return () => {
      canvas.current.removeEventListener('mousedown', startPicking);
      document.removeEventListener('mousemove', pickColor);
      document.removeEventListener('mouseup', stopPicking);
      // canvas.current.removeEventListener('mouseleave', stopPicking);
    }
  }, [])

  useEffect(() => {
    const ctx = canvas.current.getContext('2d')
    if (!ctx) return
    const data = ctx.getImageData(selectPos[0], selectPos[1], 1, 1)!.data
    const lumi = luminance(data[0], data[1], data[2])
    if (lumi > 128) {
      setSelectorCircleColor('white')
    } else {
      setSelectorCircleColor('black')
    }
  }, [repaint, repaintTrigger, selectPos])

  useEffect(() => {
    const ctx = canvas.current.getContext('2d')
    if (!ctx) return
    repaint(ctx)

  }, [width, height, repaintTrigger, repaint])

  return (
    <div style={{ position: 'relative', overflow: 'hidden', width, height, cursor: 'crosshair'}}>
      <div style={{  pointerEvents: 'none', width: '14px', height: '14px', borderRadius: '100%', border: `2px solid ${selectorCircleColor}`, position: 'absolute', top: selectPos[1], left: selectPos[0], transform: 'translate(-50%, -50%)' }}></div>
      <canvas width={width} height={height} ref={canvas}></canvas>
    </div>
  )
}


function clamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max)
}

/**
 * 将HSV（均为0-1的标准化值）转换为RGB（0-255）
 * @param h 
 * @param s 
 * @param v 
 * @returns 
 */
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  let r, g, b;

  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
    default: throw 'Impossible'
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * 计算RGB值的亮度（根据Rec.709标准）
 * @param r 红色通道的值（0-255）
 * @param g 绿色通道的值（0-255）
 * @param b 蓝色通道的值（0-255）
 * @returns 亮度值（0-255）
 */
function luminance(r: number, g: number, b: number): number {
  // 校验输入值是否在0-255之间
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new Error('RGB值必须在0到255之间');
  }

  // 计算亮度
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return Math.round(luminance);
}

export default App
