import WebGLCanvas from "@/WebGLCanvas";
import { ColourModes } from "chromatism";
import { useRef, useEffect } from "react";
import hsvPickerShaderStr from '@/assets/hsvPicker.glsl?raw'

type HSVPickerParam = {
    hsv: ColourModes.HSV,
    localHue: boolean,
    size: number,
    onChange(hsv: Partial<ColourModes.HSV>): void,
}

export const HSVPicker = ({ size, onChange, hsv, localHue }: HSVPickerParam) => {
    // 该WIDTH是色环内环的半径，总是和矩形拾色器相切，色环外环半径总是为 sqrt(2) / 2
    // 即是说，RECT_WIDTH < sqrt(2) / 2
    const RECT_WIDTH = 0.6;
    const ref = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)

    useEffect(() => {
        function getPickerTopLeft(): [number, number] {
            const rect = ref.current.getBoundingClientRect()
            return [rect.x, rect.y]
        }
        function go() {
            return hsvFns(getPickerTopLeft(), size, RECT_WIDTH)
        }
        let pickingH = false
        let pickingSV = false
        function startPickingH(event: MouseEvent) {
            pickingH = false
            if (go().canStartPickingH([event.clientX, event.clientY])) {
                pickingH = true
                onPickingH(event)
            }
        }
        function startPickingSV(event: MouseEvent) {
            pickingSV = false
            if (go().canStartPickingSV([event.clientX, event.clientY])) {
                pickingSV = true
                onPickingSV(event)
            }
        }
        function stopPicking() {
            pickingH = false
            pickingSV = false
        }
        function onPickingH(event: MouseEvent) {
            if (!pickingH) {
                return
            }
            const h = go().getH([event.clientX, event.clientY])
            onChange({ h })
        }
        function onPickingSV(event: MouseEvent) {
            if (!pickingSV) {
                return
            }
            const [s, v] = go().getSV([event.clientX, event.clientY])
            onChange({ s, v })
        }
        const div = ref.current
        div.addEventListener('mousedown', startPickingH);
        div.addEventListener('mousedown', startPickingSV);
        document.addEventListener('mousemove', onPickingH);
        document.addEventListener('mousemove', onPickingSV);
        document.addEventListener('mouseup', stopPicking);
        // canvas.current.addEventListener('mouseleave', stopPicking);

        return () => {
            div.removeEventListener('mousedown', startPickingH);
            div.removeEventListener('mousedown', startPickingSV);
            document.removeEventListener('mousemove', onPickingH);
            document.removeEventListener('mousemove', onPickingSV);
            document.removeEventListener('mouseup', stopPicking);
            // canvas.current.removeEventListener('mouseleave', stopPicking);
        }

    }, [onChange, size])
    return (
        <div style={{ width: 'fit-content', height: 'fit-content' }} ref={ref}>
            <WebGLCanvas width={size} height={size} uniformData={{
                rect_width: RECT_WIDTH,
                local_hue: localHue,
                hsv: [hsv.h, hsv.s, hsv.v].map(regulizeFloat)
            }} frag={hsvPickerShaderStr} />
        </div>
    )
}

function hsvFns(topLeftPos: [number, number], size: number, rectWidth: number) {
    function getHAngle(center: [number, number], p: [number, number]): number {
        // 以 o 为原点，先把 p 沿 y 轴做轴对称再计算  
        const xDist = p[0] - center[0]
        const yDist = p[1] - center[1]
        const newP = [p[0] - 2 * xDist, p[1] - 2 * yDist]
        const vec = [newP[0] - center[0], newP[1] - center[1]]
        const res = Math.atan2(vec[1], vec[0]) / Math.PI
        if (res >= 0) {
            return res / 2
        }
        return 1 - Math.abs(res / 2)
    }
    function getHSVCenter(topLeftPos: [number, number], size: number): [number, number] {
        return topLeftPos.map(x => Math.round(x + size / 2)) as [number, number]
    }
    function clamp(x: number, min: number, max: number) {
        if (x < min) {
            return min
        }
        if (x > max) {
            return max
        }
        return x
    }
    const center = getHSVCenter(topLeftPos, size)
    // 真正的矩形半对角线长度
    const realRectWidth = Math.round(size * Math.sqrt(2) * rectWidth / 2);
    const centerVertexDiff = Math.round(realRectWidth / Math.sqrt(2))
    const rectTopLeft = [center[0] - centerVertexDiff, center[1] - centerVertexDiff]
    const rectBottomRight = [center[0] + centerVertexDiff, center[1] + centerVertexDiff]

    return {
        getH(p: [number, number]): number {
            return getHAngle(center, p)
        },
        getSV(p: [number, number]): [number, number] {
            p = [...p]
            p[0] = clamp(p[0], rectTopLeft[0], rectBottomRight[0])
            p[1] = clamp(p[1], rectTopLeft[1], rectBottomRight[1])
            const s = (p[0] - rectTopLeft[0]) / (centerVertexDiff * 2)
            const v = (rectBottomRight[1] - p[1]) / (centerVertexDiff * 2)
            return [s, v]
        },
        canStartPickingH(p: [number, number]): boolean {
            const dist = Math.sqrt(Math.pow(p[0] - center[0], 2) + Math.pow(p[1] - center[1], 2))
            return dist >= realRectWidth && dist <= size / 2
        },
        canStartPickingSV(p: [number, number]): boolean {
            return p[0] >= rectTopLeft[0] && p[0] <= rectBottomRight[0] && p[1] >= rectTopLeft[1] && p[1] <= rectBottomRight[1]
        }
    }
}

function regulizeFloat(num: number): number {
    return (Math.trunc(num * 1000)) / 1000
}