import useLocalStorage from "@/useLocalStorage"
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react"
import {ColourObject, convert, type ColourModes} from 'chromatism'
type Vec3 = [number, number, number]
type Vec4 = [number, number, number, number]
type OneChannelColorType = "GREY"
type ThreeChannelColorType =  'RGB' | 'HSV' | 'HSI' | "HSI'" | 'LAB' | 'XYZ' 
type FourChannelColorType = 'CMYK'

export type ColorType = OneChannelColorType | ThreeChannelColorType | FourChannelColorType



// /**
//  * 归一（0=0,255=1）的RGBA值
//  */
// export type Color = [r: number, g: number, b: number, a: number]

// function to(color: Color, colorType: OneChannelColorType): number;
// function to(color: Color, colorType: ThreeChannelColorType): Vec3;
// function to(color: Color, colorType: FourChannelColorType): Vec4;
// function to(color: Color, type: ColorType) {
//     if (type === 'GREY') {
//         return 1
//     }
//     return [1,1,1]
// }

// function from(v: number, colorType: OneChannelColorType): Color;
// function from(v: Vec3, colorType: ThreeChannelColorType): Color;
// function from(v: Vec4, colorType: FourChannelColorType): Color;
// function from(v: number | Vec3 | Vec4, colorType: ColorType): Color {
//     return [1,1,1,1]
// }

// type Color = ({
//     type: 'GREY',
//     color: number,
// } | {
//     type: 'RGB' | 'HSV' | 'HSI' | "HSI'" | 'LAB'
// } | {

// }) & {
//     alpha?: number,
// }

// type CurrentColor = {
//     get<T extends ColorType>(colorType: T): 
// }


/**
 * 存储之类型；使用 HSV 色彩空间（H: 0-360, S: 0-100, V: 0-100，均为浮点数），
 * get 时转换到 RGB（0-255），再转换回 HSV 后再做转换（比如转换到RGB，哈哈），其中如果颜色为灰色，使用存储的 H，S
 * set 时检查如果是灰色就也保留HS
 * 
 * 这是为了在不考虑精度（即在这样一个拾色器的需求下）的情况下避免精度问题的处理方式w
 */
type StorageColor = ColourModes.HSV

type CurrentColor = {
    rgb: ColourModes.RGB,
    hsl: ColourModes.HSL,
    hsv: ColourModes.HSV,
    /**
     * @example {h: 360, s: 100.00, i: 100.00}
     */
    hsi: { h: number; s: number; i: number },
    /**
     * @example {l: 255}
     */
    grey: { l: number },
    cmyk: ColourModes.CMYK,
}

function getCurrentColor(storageColor: StorageColor): CurrentColor {
    const rgb = convert(storageColor).rgb
    if (storageColor.v === 0 || storageColor.v === 100 || storageColor.s === 0) {
        console.log('enter')
        if (storageColor.v === 100) {
            [rgb.r, rgb.g, rgb.b] = [255,255,255]
        }
        else {
            [rgb.r, rgb.g, rgb.b] = [0,0,0]
        }
    }
    console.log('rgb', rgb, storageColor)
    const {hsl, hsv, cmyk} = convert(rgb)
    const hsi = rgbToHSI(rgb)
    return {
        rgb, hsl, hsv, cmyk, hsi, grey: {l: hsi.i}
    }
}

function getNewStorageColor<T extends keyof CurrentColor>(type: T, value: CurrentColor[T], oldColor: StorageColor): StorageColor {
    let rgbColor: ColourModes.RGB
    if (type === 'hsi') {
        rgbColor = hsiToRGB(value as CurrentColor['hsi'])
    } else if (type === 'grey') {
        const l = (value as CurrentColor['grey']).l
        rgbColor = {r: l, g: l, b: l}
    } else {
        rgbColor = convert(value as (ColourModes.Any)).rgb
        
    }
    const hsv = convert(rgbColor).hsv
    if (rgbColor.r === rgbColor.g && rgbColor.g === rgbColor.b) {
        hsv.h = oldColor.h
        hsv.s = oldColor.s
    }



    if (Object.values(hsv).some(x => x == null || x == undefined || isNaN(x))) {
        console.log('getNewStorageColor', rgbColor, type, value, oldColor, hsv)
        throw new Error('Illegal!')
    }
    return hsv
}

const DEFAULT_COLOR = () => ({h: 0, s: 0, v: 0})

export function useCurrentColor(): [color: CurrentColor, setColor: <T extends keyof CurrentColor>(type: T, value: CurrentColor[T]) => void] {
    const [currentColorStr, setCurrentColorStr] = useLocalStorage('CURRENT_COLOR')

    const storageColor = useRef(DEFAULT_COLOR())
    useEffect(() => {
        if (currentColorStr === '') {
            storageColor.current = DEFAULT_COLOR()
        }
        try {
            const v = JSON.parse(currentColorStr)
            if (typeof v !== 'object' || Object.values(v).some(x => x == null || x == undefined || typeof x !== 'number')) {
                setCurrentColorStr(JSON.stringify(DEFAULT_COLOR()))
                storageColor.current = DEFAULT_COLOR()
            }
            storageColor.current = v as StorageColor
        } catch(e) {
            setCurrentColorStr(JSON.stringify(DEFAULT_COLOR()))
            storageColor.current = DEFAULT_COLOR()
        }
    }, [currentColorStr, setCurrentColorStr])

    const currentColor = getCurrentColor(storageColor.current)

    const setCurrentColor: <T extends keyof CurrentColor>(type: T, value: CurrentColor[T]) => void = useCallback((type, value) => {
        const newStorageColor = getNewStorageColor(type, value, storageColor.current)
        console.log('setMe', newStorageColor)
        setCurrentColorStr(JSON.stringify(newStorageColor))
    }, [setCurrentColorStr])

    return [currentColor, setCurrentColor]
}

function rgbToHSI(rgb: { r: number; g: number; b: number }): { h: number; s: number; i: number } {
    const { r, g, b } = rgb;
    
    // Normalize RGB values to range [0, 1]
    const rN = r / 255;
    const gN = g / 255;
    const bN = b / 255;

    // Calculate intensity I' (ITU-R BT.709)
    const i = 0.2126 * rN + 0.7152 * gN + 0.0722 * bN;

    // Calculate hue H
    let h;
    if (r === g && g === b) {
        h = 0;  // undefined, achromatic case
    } else {
        const num = 0.5 * ((rN - gN) + (rN - bN));
        const denom = Math.sqrt((rN - gN) ** 2 + (rN - bN) * (gN - bN));
        let theta = Math.acos(num / denom);

        if (bN > gN) {
            theta = (2 * Math.PI) - theta;
        }

        h = theta * (180 / Math.PI);
    }

    // Calculate saturation S
    let s;
    if (i === 0) {
        s = 0;
    } else {
        s = 1 - (Math.min(rN, gN, bN) / i);
    }

    return { h, s: s * 100, i: i * 100 };
}

function hsiToRGB(hsi: { h: number; s: number; i: number }): { r: number; g: number; b: number } {
    const { h, s, i } = hsi;
    
    // H 色相 (0-360)，S 饱和度 (0-1)，I' 亮度 (0-1)
    const hue = h / 360; // 转换为 [0, 1] 范围的色相值
    const saturation = s;
    const intensity = i;

    let r, g, b;

    if (s === 0) {
        // 如果饱和度为 0，则为灰色
        r = g = b = intensity * 255;
    } else {
        const hueCategory = Math.floor(hue * 6);
        const f = hue * 6 - hueCategory;
        const p = intensity * (1 - saturation);
        const q = intensity * (1 - f * saturation);
        const t = intensity * (1 - (1 - f) * saturation);

        switch (hueCategory) {
            case 0:
                r = intensity * 255;
                g = t * 255;
                b = p * 255;
                break;
            case 1:
                r = q * 255;
                g = intensity * 255;
                b = p * 255;
                break;
            case 2:
                r = p * 255;
                g = intensity * 255;
                b = t * 255;
                break;
            case 3:
                r = p * 255;
                g = q * 255;
                b = intensity * 255;
                break;
            case 4:
                r = t * 255;
                g = p * 255;
                b = intensity * 255;
                break;
            case 5:
                r = intensity * 255;
                g = p * 255;
                b = q * 255;
                break;
            default:
                break;
        }
    }

    return { r: Math.round(r!), g: Math.round(g!), b: Math.round(b!) };
}

