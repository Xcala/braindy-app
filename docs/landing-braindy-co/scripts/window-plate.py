# Replace the generated window view with a real Golden Gate photo (graded to golden hour) behind the glass.
# Inputs: the 4K master with black screen, the stock photo and SAM masks of the foreground (Brains, plant, holograms) exported from Magnific.
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
base=Image.open('../gen/up4x_black.jpg').convert('RGB'); W,H=base.size
plate=Image.open('gg_full.jpg').convert('RGB')
WX0,WY0,WX1,WY1=782,198,3528,1337
s=(WX1-WX0)/plate.size[0]
pw,ph=WX1-WX0,int(plate.size[1]*s)
pl=plate.resize((pw,ph),Image.LANCZOS)
top=420*s                       # plate y=214 lands at the window top
crop=pl.crop((0,int(top),pw,int(top)+(WY1-WY0)))
a=np.asarray(crop).astype(float)/255
# grade: blue hour -> warm golden hour, lifted and hazy like a real interior shot
lum=a.mean(-1,keepdims=True)
a=a*0.55+lum*0.45                                  # desaturate a bit
a=np.clip((a-0.02)*1.35+0.08,0,1)                  # lift exposure
warm=np.array([1.10,0.98,0.84]); a=np.clip(a*warm,0,1)
yy=np.linspace(0,1,a.shape[0])[:,None,None]
haze=np.array([0.96,0.86,0.78])                    # warm atmospheric haze, stronger near the horizon
hz=0.30+0.20*np.exp(-((yy-0.72)/0.18)**2)
a=a*(1-hz)+haze*hz
img=Image.fromarray((a*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.6))
g=np.random.default_rng(3).normal(0,4.5,(img.size[1],img.size[0],1))
img=Image.fromarray(np.clip(np.asarray(img).astype(float)+g,0,255).astype('uint8'))
full=Image.new('RGB',(W,H)); full.paste(img,(WX0,WY0))
L=lambda f: np.asarray(Image.open(f).convert('L'))>127
fg=L('f_blue.png')|L('f_yellow.png')|L('f_plant.png')|L('f_holo.png')
m=np.zeros((H,W),bool); m[WY0:WY1,WX0:WX1]=True
m&=~fg
m[1080:,3320:]=False                               # violet hologram corner
mk=Image.fromarray((m*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.5))
out=Image.composite(full,base,mk)
out.save('../gen/up4x_window.jpg',quality=93)
out.resize((1376,768),Image.LANCZOS).save('win_preview.jpg',quality=85)
out.crop((700,150,3600,1400)).resize((1450,625),Image.LANCZOS).save('win_crop.jpg',quality=85)
print('ok')
