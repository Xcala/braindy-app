# Dusk variant of the studio master (same geometry as P0): darker room, warm lamps, blue-hour view, stronger holograms.
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
src=Image.open('up4x_final3.jpg').convert('RGB'); W,H=src.size
a=np.asarray(src).astype(np.float32)/255
lum=(a*np.array([0.299,0.587,0.114],np.float32)).sum(-1,keepdims=True)
sat=(a.max(-1,keepdims=True)-a.min(-1,keepdims=True))
# room: exposure down, warmer, shadows a bit deeper
room=np.clip(a*0.62*np.array([1.07,0.97,0.86],np.float32),0,1)**1.08
# practical lights and holograms keep their brightness and bloom (bright warm or very saturated pixels)
glow_src=np.clip((lum-0.72)/0.2,0,1)*0.9+np.clip((sat-0.45)/0.3,0,1)*np.clip((lum-0.35)/0.3,0,1)
keep=np.clip(glow_src,0,1)
room=room*(1-keep*0.75)+a*(keep*0.75)
bl=Image.fromarray((np.clip(a*keep,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(28))
room=np.clip(room+np.asarray(bl).astype(np.float32)/255*0.35,0,1)
# window: the real photo in its own blue-hour colour, with a warm last-light band at the horizon
plate=Image.open('../stock/gg_full.jpg').convert('RGB')
WX0,WY0,WX1,WY1=782,198,3528,1337
s=(WX1-WX0)/plate.size[0]; pw=WX1-WX0; ph=int(plate.size[1]*s)
pl=plate.resize((pw,ph),Image.LANCZOS); top=int(420*s)
v=np.asarray(pl.crop((0,top,pw,top+WY1-WY0))).astype(np.float32)/255
v=np.clip(v*1.12+0.02,0,1)
yy=np.linspace(0,1,v.shape[0],dtype=np.float32)[:,None,None]
band=np.exp(-((yy-0.68)/0.12)**2)*np.array([0.22,0.08,0.06],np.float32)
v=np.clip(v+band,0,1)
vimg=Image.fromarray((v*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3.2))
full=np.zeros((H,W,3),np.float32); full[WY0:WY1,WX0:WX1]=np.asarray(vimg).astype(np.float32)/255
S='../stock/'
L=lambda f: np.asarray(Image.open(S+f).convert('L'))>127
fg=L('f_blue.png')|L('f_yellow.png')|L('f_plant.png')|L('f_holo.png')
m=np.zeros((H,W),bool); m[WY0:WY1,WX0:WX1]=True; m&=~fg; m[1080:,3320:]=False
mk=np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)[...,None]/255
out=room*(1-mk)+full*mk
g=np.random.default_rng(5).normal(0,0.012,(H,W,1)).astype(np.float32)
out=np.clip(out+g,0,1)
o=(out*255).astype(np.uint8)
# keep Nico's screen black
quad=[(2984,1518),(3851,1467),(3871,2018),(3007,2125)]
q=Image.new('L',(W,H),0); ImageDraw.Draw(q).polygon(quad,fill=255); qm=np.asarray(q)>0
o[qm]=np.asarray(src)[qm]
Image.fromarray(o).save('up4x_dusk.jpg',quality=93)
Image.fromarray(o).resize((1376,768),Image.LANCZOS).save('dusk_s.jpg',quality=85)
print('ok')
