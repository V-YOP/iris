/**
 * 将标准化的 HSV（均为0-1的标准化值）转换为标准化的rgb值
 * @param h 
 * @param s 
 * @param v 
 * @returns 
 */
export function hsvToRgb(h: number, s: number, v: number): [r: number, g: number, b: number] {
    let r, g, b;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
        default: throw 'Impossible'
    }

    return [r, g, b];
}

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s = max;
    const v = max;

    const d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
            default: throw 'Impossible'
        }
        h /= 6;
    }

    return [h, s, v];
}

/**
 * 计算RGB值的亮度（根据Rec.709标准）
 * @param r 红色通道的值（0-1）
 * @param g 绿色通道的值（0-1）
 * @param b 蓝色通道的值（0-1）
 * @returns 亮度值（0-1）
 */
export function luminance(r: number, g: number, b: number): number {
    // 校验输入值是否在0-255之间
    if (r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) {
        throw new Error('RGB值必须在0到1之间');
    }

    // 计算亮度
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance;
}

/**
 * 计算两个RGB颜色的欧氏距离
 * @param rgbA 第一个颜色 (R, G, B)
 * @param rgbB 第二个颜色 (R, G, B)
 * @returns 颜色距离
 */
export function colorDistance(rgbA: [number, number, number], rgbB: [number, number, number]): number {
    const [r1, g1, b1] = rgbA;
    const [r2, g2, b2] = rgbB;

    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;

    return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * 根据颜色距离打分
 * @param distance 颜色距离
 * @param d_max 距离阈值（小于这个距离的颜色人眼无法分辨）
 * @returns 分数（距离越小分数越高，最大为100）
 */
export function colorScore(distance: number, d_max: number = 50): number {
    const maxDistance = Math.sqrt(3 * 255 * 255); // 最大颜色距离
    const normalizedDistance = Math.min(distance / maxDistance, 1); // 归一化距离

    return Math.max(100 * (1 - normalizedDistance), 0); // 距离越大分数越低，满分为100
}
