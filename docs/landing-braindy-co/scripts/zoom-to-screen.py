# Prototype: zoom from the studio master shot into Nico's screen (P0 -> P2).
# Usage: python3 zoom-to-screen.py master.png out_dir [frames] [font.woff]
# The screen quad (4 corners in the source image) is hand-measured; the web version does the same with a CSS/WebGL homography.
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src=Image.open(sys.argv[1]).convert('RGB'); out_dir=sys.argv[2]
FONT=sys.argv[4] if len(sys.argv)>4 else 'red-hat-display-latin-900-normal.woff'  # Red Hat Display 900 (@fontsource/red-hat-display)
OW,OH=1280,720
SW,SH=src.size
quad=np.array([(747,379.5),(962,368),(967,503),(752,530)],float)   # screen glass TL TR BR BL in source
sx,sy=OW/SW,OH/SH
start=quad*[sx,sy]                         # where the screen sits when we see the whole frame
w=OW*0.90; h=w*9/16
end=np.array([((OW-w)/2,(OH-h)/2),((OW+w)/2,(OH-h)/2),((OW+w)/2,(OH+h)/2),((OW-w)/2,(OH+h)/2)])
def H(src_pts,dst_pts):  # coeffs mapping dst->src for PIL
    A=[];B=[]
    for (x,y),(u,v) in zip(dst_pts,src_pts):
        A+= [[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]]; B+=[u,v]
    return np.linalg.solve(np.array(A),np.array(B)).tolist()
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
    # screen content: fade to black, then the line appears (in a flat layer warped to the quad)
    fade=min(1,max(0,(t-0.45)/0.25)); txt=min(1,max(0,(t-0.74)/0.16))
    if fade>0:
        LW,LH=1600,900
        layer=Image.new('RGBA',(LW,LH),(5,6,10,int(255*fade)))
        if txt>0:
            d=ImageDraw.Draw(layer); s="Step inside."
            bb=d.textbbox((0,0),s,font=font)
            d.text(((LW-(bb[2]-bb[0]))/2-bb[0],(LH-(bb[3]-bb[1]))/2-bb[1]-10),s,font=font,fill=(255,255,255,int(255*txt)))
        warped=layer.transform((OW,OH),Image.PERSPECTIVE,H([(0,0),(LW,0),(LW,LH),(0,LH)],tq),Image.BICUBIC)
        frame=Image.alpha_composite(frame.convert('RGBA'),warped).convert('RGB')
    frame.save(f'{out_dir}/f_{i:03d}.jpg',quality=88)
print('ok')
