# Prototype: zoom from the studio master shot into Nico's screen (P0 -> P2). The screen shows a glowing tunnel in the Brain colors.
# Usage: python3 zoom-to-screen.py master.jpg out_dir [frames] [font.woff]
# The screen quad was measured on the 1376 px master and is scaled to the input size; the web version does the same with a CSS/WebGL homography.
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src=Image.open(sys.argv[1]).convert('RGB'); out_dir=sys.argv[2]
FONT=sys.argv[4] if len(sys.argv)>4 else 'red-hat-display-latin-900-normal.woff'  # Red Hat Display 900 (@fontsource/red-hat-display)
OW,OH=(1920,1080) if src.size[0]>3000 else (1280,720)
SW,SH=src.size
quad=np.array([(747,379.5),(962,368),(967,503),(752,530)],float)*(src.size[0]/1376)   # screen glass TL TR BR BL (measured on the 1376 px master)
sx,sy=OW/SW,OH/SH
start=quad*[sx,sy]                         # where the screen sits when we see the whole frame
w=OW*0.90; h=w*9/16
end=np.array([((OW-w)/2,(OH-h)/2),((OW+w)/2,(OH-h)/2),((OW+w)/2,(OH+h)/2),((OW-w)/2,(OH+h)/2)])
def H(src_pts,dst_pts):  # coeffs mapping dst->src for PIL
    A=[];B=[]
    for (x,y),(u,v) in zip(dst_pts,src_pts):
        A+= [[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]]; B+=[u,v]
    return np.linalg.solve(np.array(A),np.array(B)).tolist()

COLS=[(245,179,1),(139,92,246),(6,182,212),(42,127,255)]
def tunnel(LW,LH,t):
    base=Image.new('RGB',(LW,LH),(4,5,10))
    lines=Image.new('RGB',(LW,LH),(0,0,0)); d=ImageDraw.Draw(lines)
    n=9; phase=(t*1.6)%1.0
    for j in range(n):
        f=((j+phase)/n)           # 0 = center, 1 = edge
        sc=0.06+0.94*f**1.6
        w,h=LW*sc*0.96,LH*sc*0.96
        x0,y0=(LW-w)/2,(LH-h)/2
        c=COLS[j%4]; a=0.35+0.65*f
        col=tuple(int(v*a) for v in c)
        d.rounded_rectangle((x0,y0,x0+w,y0+h),radius=max(6,int(28*sc)),outline=col,width=max(2,int(6*sc)))
    glow=lines.filter(ImageFilter.GaussianBlur(14))
    core=Image.new('RGB',(LW,LH),(0,0,0)); ImageDraw.Draw(core).ellipse((LW*0.35,LH*0.3,LW*0.65,LH*0.7),fill=(40,90,220))
    core=core.filter(ImageFilter.GaussianBlur(90))
    from PIL import ImageChops
    out=ImageChops.add(base,core); out=ImageChops.add(out,glow); out=ImageChops.add(out,glow); out=ImageChops.add(out,lines)
    return out.convert('RGBA')
ease=lambda t: t*t*(3-2*t)
font=ImageFont.truetype(FONT,200)
N=int(sys.argv[3]) if len(sys.argv)>3 else 90
for i in range(N):
    t=i/(N-1); e=ease(t)
    # zoom grows geometrically so it feels like a dolly, corners interpolate toward a straight rectangle
    k=e
    tq=start*(1-k)+end*k
    frame=src.transform((OW,OH),Image.PERSPECTIVE,H(quad,tq),Image.BICUBIC)
    # depth of field: everything outside the screen softens as we get close
    blur=frame.filter(ImageFilter.GaussianBlur(6*e))
    m=Image.new('L',(OW,OH),0); ImageDraw.Draw(m).polygon([tuple(p) for p in tq],fill=255)
    m=m.filter(ImageFilter.GaussianBlur(2))
    frame=Image.composite(frame,blur,m)
    # screen content: a live tunnel of glowing frames (the same tunnel the 3D world starts with)
    LW,LH=1600,900
    layer=tunnel(LW,LH,t)
    txt=min(1,max(0,(t-0.78)/0.15))
    if txt>0:
        d=ImageDraw.Draw(layer); s="Step inside."
        bb=d.textbbox((0,0),s,font=font)
        d.text(((LW-(bb[2]-bb[0]))/2-bb[0],(LH-(bb[3]-bb[1]))/2-bb[1]-10),s,font=font,fill=(255,255,255,int(255*txt)))
    warped=layer.transform((OW,OH),Image.PERSPECTIVE,H([(0,0),(LW,0),(LW,LH),(0,LH)],tq),Image.BICUBIC)
    mm=Image.new('L',(OW,OH),0); ImageDraw.Draw(mm).polygon([tuple(p) for p in tq],fill=255)
    frame=Image.composite(warped.convert('RGB'),frame,mm)
    frame.save(f'{out_dir}/f_{i:03d}.jpg',quality=88)
print('ok')
