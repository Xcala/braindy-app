# Photographic finish for the studio master: lower HDR clarity and saturation, camera-like highlight roll-off,
# and halo-free depth of field from a depth map (Magnific Depth Anything 3). Input: master with real window view.
# Photographic finish pass: tame the HDR/render look and add real lens depth of field.
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
src=Image.open('up4x_window.jpg').convert('RGB'); W,H=src.size
img=np.asarray(src).astype(np.float32)/255
# 1) less local contrast (the HDR "clarity"), keep global shape
base=np.asarray(src.filter(ImageFilter.GaussianBlur(40))).astype(np.float32)/255
img=base+(img-base)*0.76
# 2) calmer saturation
lum=(img*np.array([0.299,0.587,0.114],np.float32)).sum(-1,keepdims=True)
img=lum+(img-lum)*0.88
# 3) highlight roll-off and a touch of deeper shadows (real camera tone curve)
knee=0.78
img=np.where(img>knee,knee+(img-knee)*0.62,img)
img=np.clip(img,0,1)
img=img**1.07
img=np.clip((img-0.5)*1.06+0.5,0,1)
img8=Image.fromarray((np.clip(img,0,1)*255).astype(np.uint8))
# 4) depth of field: focus from Nico to the far Brains; the far wall/window and the near floor go soft
d=np.asarray(Image.open('depth.png').resize((W,H),Image.BILINEAR)).astype(np.float32)
d=(d-d.min())/(d.max()-d.min())
far=np.clip((d-0.48)/0.45,0,1)                       # 0 in focus .. 1 at window/wall
yy=np.linspace(0,1,H,dtype=np.float32)[:,None]
near_floor=np.clip((yy-0.80)/0.12,0,1)*np.clip((d-0.20)/0.08,0,1)*np.clip((0.62-d)/0.1,0,1)
coc=np.maximum(far*1.0,near_floor*0.55)              # 0..1
radii=[0,2,4,6,8]
# normalized blur: only background pixels feed the blur, so subjects never bleed into it (no halos)
bgw=np.clip((coc-0.05)/0.25,0,1).astype(np.float32)
wimg=Image.fromarray((bgw*255).astype(np.uint8))
arr=np.asarray(img8).astype(np.float32)
layers=[arr]
for r in radii[1:]:
    num=np.stack([np.asarray(Image.fromarray(np.clip(arr[...,c]*bgw,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) for c in range(3)],-1)
    den=np.asarray(wimg.filter(ImageFilter.GaussianBlur(r))).astype(np.float32)[...,None]/255
    bl=np.where(den>0.02,num/np.maximum(den,1e-3),arr)
    layers.append(bl)
t=coc*(len(radii)-1); i0=np.floor(t).astype(int); fr=(t-i0)[...,None]; i1=np.minimum(i0+1,len(radii)-1)
stack=np.stack(layers,0)
out=np.take_along_axis(stack,i0[None,...,None].repeat(3,-1),0)[0]*(1-fr)+np.take_along_axis(stack,i1[None,...,None].repeat(3,-1),0)[0]*fr
del stack,layers
# 5) fine grain so blurred and sharp areas share the same texture
g=np.random.default_rng(7).normal(0,3.2,(H,W,1)).astype(np.float32)
out=np.clip(out+g,0,255)
o=Image.fromarray(out.astype(np.uint8))
# keep Nico's screen pure black (it receives the live overlay)
quad=[(2984,1518),(3851,1467),(3871,2018),(3007,2125)]
m=Image.new('L',(W,H),0); ImageDraw.Draw(m).polygon(quad,fill=255)
orig_screen_mask=np.asarray(m)>0
blk=np.asarray(src).astype(np.uint8)          # screen area from the clean black version (shoulder keyed already)
oa=np.asarray(o).copy(); oa[orig_screen_mask]=blk[orig_screen_mask]
Image.fromarray(oa).save('up4x_final.jpg',quality=93)
print('ok')
