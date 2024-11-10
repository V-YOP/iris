import { ColourModes, convert } from 'chromatism'

class Color {
  /**
   * R 通道，0-255整数
   */
  private _r: number;
  /**
   * G 通道，0-255整数
   */
  private _g: number;
  /**
   * B 通道，0-255整数
   */
  private _b: number;
  /**
   * 色相，0-36000 整数，除以 100 得到实际值
   */
  private _h: number;
  /**
   * 饱和度，0-10000 整数，除以 100 得到实际值
   */
  private _s: number;
  public constructor(/**
        * R 通道，0-255整数
        */
    r: number,
    /**
     * G 通道，0-255整数
     */
    g: number,
    /**
     * B 通道，0-255整数
     */
    b: number,
    /**
     * 色相，0-36000 整数，除以 100 得到实际值
     */
    h: number,
    /**
     * 饱和度，0-10000 整数，除以 100 得到实际值
     */
    s: number) {
    this._r = r
    this._g = g
    this._b = b
    this._h = h
    this._s = s
  }
  public static new() {
    return new Color(0, 0, 0, 0, 0)
  }
  /**
   * R 通道，0-255 整数
   */
  get r(): number {
    return this._r
  }
  set r(newR: number) {
    if (newR < 0 || newR > 255) {
      throw new Error('!')
    }
    this._r = newR
  }

  /**
   * G 通道，0-255 整数
   */
  get g(): number {
    return this._g
  }
  set g(newG: number) {
    if (newG < 0 || newG > 255) {
      throw new Error('!')
    }
    this._g = newG
  }

  /**
   * B 通道，0-255 整数
   */
  get b(): number {
    return this._b
  }
  set b(newB: number) {
    if (newB < 0 || newB > 255) {
      throw new Error('!')
    }
    this._b = newB
  }

  /**
   * 
   */
  get h(): number {
    return this._h / 100
  }
  set h(newH: number) {
    if (newH < 0 || newH > 36000) {
      throw new Error('!')
    }
    this._h = Math.trunc(newH)
  }
}

Color.new()

// type Color = {
//     /**
//      * R 通道，0-255整数
//      */
//     r: number,
//     /**
//      * G 通道，0-255整数
//      */
//     g: number,
//     /**
//      * B 通道，0-255整数
//      */
//     b: number,
//     /**
//      * 色相，0-36000 整数，除以 100 得到实际值
//      */
//     h: number,
//     /**
//      * 饱和度，0-10000 整数，除以 100 得到实际值
//      */
//     s: number
// }

const DEFAULT_COLOR = { r: 0, g: 0, b: 0, h: 0, s: 0 } as Color

export function setRGB(rgb: ColourModes.RGB, oldColor: Color): Color {
  if (isNaN(rgb.r) || isNaN(rgb.g) || isNaN(rgb.b)) {
    throw new Error('!')
  }
  const hsv = convert(rgb).hsv
  if (isNaN(hsv.s)) {
    hsv.s = 0
  }
  const res = { ...oldColor, ...rgb }
  if (hsv.h !== 0) {
    res.h = Math.trunc(hsv.h * 100)
  }
  if (hsv.s !== 0) {
    res.s = Math.trunc(hsv.s * 100)
  }
  console.log(res)
  return res
}

export function toRGB({ r, g, b }: Color): ColourModes.RGB {
  return { r, g, b }
}

export function setHSV(hsv: ColourModes.HSV, oldColor: Color): Color {
  if (isNaN(hsv.h) || isNaN(hsv.s) || isNaN(hsv.v)) {
    throw new Error('!')
  }
  let rgb: ColourModes.RGB
  if (hsv.v <= 0) {
    rgb = { r: 0, g: 0, b: 0 }
  } else if (hsv.v >= 100) {
    rgb = { r: 255, g: 255, b: 255 }
  } else {
    rgb = convert(hsv).rgb
  }

  const res = { ...oldColor, ...rgb }
  if (hsv.h !== 0) {
    res.h = Math.trunc(hsv.h * 100)
  }
  if (hsv.s !== 0) {
    res.s = Math.trunc(hsv.s * 100)
  }
  console.log(res)
  return res
}
// export function toRGB()

// fromRGB({r: 1, g: 2, b: 1}, {r: 20, g: 20, b: 20, h: 10000, s: 10000})
// fromRGB({r: 0, g: 0, b: 0})
// fromRGB({r: 255, g: 255, b: 255})