import { useCallback, useEffect, useMemo, useReducer } from "react"

type Vec3 = [number, number, number]
type Vec4 = [number, number, number, number]
type OneChannelColorType = "GREY"
type ThreeChannelColorType =  'RGB' | 'HSV' | 'HSI' | "HSI'" | 'LAB'
type FourChannelColorType = 'CMYK'

export type ColorType = OneChannelColorType | ThreeChannelColorType | FourChannelColorType

// rgb: 0-255, a: 0-100
export type Color = [r: number, g: number, b: number, a: number]

function to(color: Color, colorType: OneChannelColorType): number;
function to(color: Color, colorType: ThreeChannelColorType): Vec3;
function to(color: Color, colorType: FourChannelColorType): Vec4;
function to(color: Color, type: ColorType) {
    if (type === 'GREY') {
        return 255
    }
    return [1,1,1]
}

function from(v: number, colorType: OneChannelColorType): Color;
function from(v: Vec3, colorType: ThreeChannelColorType): Color;
function from(v: Vec4, colorType: FourChannelColorType): Color;
function from(v: number | Vec3 | Vec4, colorType: ColorType): Color {
    return [1,1,1,1]
}

function uuid(): string {
    return ''
}

const keyListeners: Record<string, Record<string, (newValue: string) => void>> = {}
export function useLocalStorage(key: string): [value: string, setValue: (newValue: string) => void] { 
    // @ts-ignore
    const [, refresh] = useReducer(x => x + 1, 0) as [any, () => void]
    useEffect(() => {
        keyListeners[key] ??= {}
        const id = uuid()
        keyListeners[key][id] = refresh
        return () => {
            delete keyListeners[key][id]
        }
    }, [key])
    const setter = useCallback((newValue: string) => {
        localStorage.setItem(key, newValue)
        Object.values(keyListeners[key] ?? {}).forEach(x => x(newValue))
    }, [key])
    return [localStorage.getItem(key) ?? '', setter]
}

export function useCurrentColor(): [color: Color, setColor: (newColor: Color) => void] {
    const [currentColorStr, setCurrentColorStr] = useLocalStorage('CURRENT_COLOR')
    const currentColor = useMemo(() => {
        const DEFAULT_VALUE = [255, 255, 255, 100] 
        if (currentColorStr === '') {
            return DEFAULT_VALUE
        }
        try {
            const v = JSON.parse(currentColorStr)
            if (!Array.isArray(v) || v.length !== 4 || v.some(x => typeof x !== 'number')) {
                return DEFAULT_VALUE
            }
            return v as Color
        } catch(e) {
            setCurrentColorStr(JSON.stringify(DEFAULT_VALUE))
            return DEFAULT_VALUE
        }
    }, [currentColorStr])

    const setCurrentColor = useCallback((newColor: Color) => {
        setCurrentColorStr(JSON.stringify(newColor))
    }, [setCurrentColorStr])

    return [currentColor as Color, setCurrentColor]
}