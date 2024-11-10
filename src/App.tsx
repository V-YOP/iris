import { useEffect, useMemo, useReducer, useRef, useState } from 'react'

import '@/App.css'
import { ColourModes, convert } from 'chromatism'
import { HSVPicker } from '@/HSVPicker'
import { hsvToRgb, luminance, rgbToHsv } from '@/util'

function App() {
  const [hsv, setHsv] = useState({ h: 0.2, s: 0.8, v: 0.2 })
  const [randColor, newRandColor] = useReducer(() => [Math.random(), Math.random(), Math.random()], [Math.random(), Math.random(), Math.random()])
  
  const randColorCss = useMemo(() => {
    const [r, g, b] = randColor.map(x => Math.round(x * 255))
    return convert({r,g,b}).cssrgb
  }, [randColor])

  return (
    <>
      <div style={{maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto'}}>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div style={{flexBasis: '33$'}}>
            
          <HSVPicker localHue={false} hsv={hsv} size={400} onChange={useMemo(() => (x) => setHsv(hsv => ({...hsv, ...x})), [])} />
          </div>
          <div style={{flexShrink: '1', flexBasis: '33%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{ width: '100px', height: '100px', backgroundColor: convert({ h: hsv.h * 360, s: hsv.s * 100, v: hsv.v * 100 }).cssrgb }}></div>
            <div>RGB: ({hsvToRgb(hsv.h, hsv.s, hsv.v).map(x => Math.round(x * 255)).join(', ')})</div>
            <div>Y: {luminance(...hsvToRgb(hsv.h, hsv.s, hsv.v)).toFixed(2)}</div>  
          </div>
          <div style={{background: randColorCss, flexBasis: "33%"}}></div>
        </div>
      </div>

      {/* <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', }}>
          <label>H</label>
          <input type='range' min={0} max={0.9999} step={0.0001} value={hsv.h} onChange={e => setHsv(hsv => ({ ...hsv, h: +e.target.value }))}></input>
        </div>
        <div style={{ display: 'flex', }}>
          <label>S</label>
          <input type='range' min={0} max={0.9999} step={0.0001} value={hsv.s} onChange={e => setHsv(hsv => ({ ...hsv, s: +e.target.value }))}></input>
        </div>
        <div style={{ display: 'flex', }}>
          <label>V</label>
          <input type='range' min={0} max={0.9999} step={0.0001} value={hsv.v} onChange={e => setHsv(hsv => ({ ...hsv, v: +e.target.value }))}></input>
        </div>
      </div> */}
    </>
  )
}


export default App
