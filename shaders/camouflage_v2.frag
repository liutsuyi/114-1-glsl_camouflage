#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_tex0;

// Cellular noise function (已包含)
vec3 permute(vec3 x) { return mod((34.0*x+1.0)*x,289.0); }
#define K 0.142857142857
#define Ko 0.428571428571
vec2 cellularID(vec2 P) {
    float jit=1.0, distFormula=0.0;
    vec2 Pi = mod(floor(P),289.0), Pf=fract(P);
    vec3 oi=vec3(-1.0,0.0,1.0), of=vec3(-0.5,0.5,1.5), px=permute(Pi.x+oi),p,ox,oy,dx,dy;
    
    float f1=1e9; vec2 ci=Pi;
    for(int ix=-1; ix<=1; ix++){
        for(int iy=-1; iy<=1; iy++){
            p=permute(px + Pi.y + float(iy));
            ox=fract(p*K)-Ko; oy=mod(floor(p*K),7.0)*K-Ko;
            dx=Pf.x+float(ix)+jit*ox; dy=Pf.y+float(iy)+jit*oy;
            float d=dx.x*dx.x+dy.x*dy.x;
            if(d<f1){ f1=d; ci=Pi+vec2(ix,iy); }
        }
    }
    return mod(ci,289.0);
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    // 依滑鼠垂直位置調整整體迷彩密度
    float base = mix(20.0, 200.0, u_mouse.y / u_resolution.y);

    // 設定三種不同尺度
    float scales[3];
    scales[0] = base * 0.5;   // 小斑紋
    scales[1] = base * 1.0;   // 中斑紋
    scales[2] = base * 2.0;   // 大斑紋

    vec3 result = vec3(0.0);
    float totalWeight = 0.0;

    for(int i=0; i<3; i++){
        float s = scales[i];
        vec2 uv = cellularID(st * s) / s;     // Worley segmentation
        vec3 c = texture2D(u_tex0, uv).rgb;   // 取樣原圖中的顏色區塊

        float w = 1.0 / (float(i) + 1.0);     // 權重: 大斑重、小斑輕
        result += c * w;
        totalWeight += w;
    }

    result /= totalWeight; // normalize
    gl_FragColor = vec4(result, 1.0);
}