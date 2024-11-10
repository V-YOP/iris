precision mediump float;

#define PI 3.1415926
#define CIRCLE_EDGE 0.0025  

// 均为0-1的值
uniform float u_rect_width;
uniform vec3 u_hsv;
uniform bool u_local_hue;

varying vec2 v_uv;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}


float ring(vec2 st, vec2 p, float radius, float strokeWidth) {
    float dist = distance(st, p);
    return smoothstep(0.002, 0.0, abs(dist - radius) - strokeWidth / 2.0);
}

float distancePointToLine(vec2 st, vec2 p) {
    // 计算直线的方向向量
    vec2 lineDir = normalize(p);
    
    // 计算点到直线的向量
    vec2 pointToLine = st;
    
    // 计算点到直线的距离
    float distance = length(cross(vec3(pointToLine, 0.0), vec3(lineDir, 0.0)));
    
    return distance;
}


float linear(vec2 st, vec2 point, float strokeWidth) {
    // float dist = abs(st.x);
    // if (point.x != 0.0) {
    //     float k = point.y / point.x;
    //     dist = abs(st.y - k * st.x);
    // }
    float dist = distancePointToLine(st, point);
    if (sign(st.x) != sign(point.x) && sign(st.y) != sign(point.y)) {
        return 0.0;
    }
    return smoothstep(0.002, 0.0, dist - strokeWidth / 2.0);
}



void draw_hue_circle() {
    float innerRadius = u_rect_width * 0.5 * sqrt(2.0) + CIRCLE_EDGE;
    float outerRadius = 0.5 - CIRCLE_EDGE;
    vec2 st = v_uv - 0.5;
    float dist = distance(st, vec2(0.0));
    
    float realDist = smoothstep(CIRCLE_EDGE, 0.0, min(abs(dist - innerRadius), abs(dist - outerRadius)));

    if (dist > innerRadius && dist < outerRadius) {
        realDist = 1.0;
    }
    
    if (realDist <= 0.0) {
        return;
    }


    float hue = (atan(st.x, st.y) + 1.0 / 2.0 * PI) / PI / 2.0;

    vec3 hue_color;
    if (u_local_hue) {
        hue_color = vec3(hue, u_hsv.yz);
    } else {
        hue_color = vec3(hue, 1.0, 1.0);
    }
    gl_FragColor = mix(gl_FragColor, vec4(hsv2rgb(hue_color), 1.0), vec4(realDist));

    float select_hue = (0.5 - u_hsv.x) * 2.0 * PI;
    
    // TODO draw h selector
    gl_FragColor = mix(gl_FragColor, vec4(1.0), linear(st, vec2(cos(select_hue), sin(select_hue)), 0.01));
}

void draw_hsv_rectangle() {
    vec2 startPos = vec2(0.5 - u_rect_width / 2.0);
    vec2 endPos = vec2(1) - (0.5 - u_rect_width / 2.0);
    if (v_uv.x < startPos.x || v_uv.x > endPos.x || v_uv.y < startPos.y || v_uv.y > endPos.y) {
        return;
    }
    float s = (v_uv.x - startPos.x) / u_rect_width;
    float v = (v_uv.y - startPos.y) / u_rect_width;
    vec3 hsv = vec3(u_hsv.x, s, v);
    vec3 rgb = hsv2rgb(hsv);
    
    gl_FragColor = vec4(rgb, 1.0);

    // TODO draw sv selector
    vec2 selectorPos = (u_hsv.yz * u_rect_width + startPos);
    gl_FragColor = mix(gl_FragColor, vec4(1.0), ring(v_uv, selectorPos, 0.015, 0.0005));
}

void main() {
    // gl_FragColor = vec4(1,1,1, 1.0);
    draw_hsv_rectangle();
    draw_hue_circle();
    
// 
    // vec2 fragCoord = v_uv;
    // vec2 center = vec2(400.0, 300.0); // 圆心
    // float innerRadius = 50.0;         // 内半径
    // float thickness = 20.0;           // 厚度
    // vec4 ringColor = vec4(1.0, 0.0, 0.0, 1.0); // 圆环颜色
    // vec4 edgeColor = vec4(0.0, 0.0, 0.0, 1.0); // 边缘颜色

    // vec2 start = vec2(100.0, 100.0);  // 线段起点
    // vec2 end = vec2(300.0, 300.0);    // 线段终点
    // vec4 lineColor = vec4(0.0, 1.0, 0.0, 1.0); // 线段颜色

    // vec4 ring = drawRing(fragCoord, center, innerRadius, thickness, ringColor, edgeColor);
    // vec4 line = drawLine(fragCoord, start, end, thickness, lineColor);

    // gl_FragColor = mix(ring, line, line.a);

}