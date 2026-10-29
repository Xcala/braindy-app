const fs = require('fs'), B = 'C:/Users/Mark/braindy-app/web/public/brand/';
const uri = (f, t) => `data:${t};base64,` + fs.readFileSync(B + f).toString('base64');
let h = fs.readFileSync(__dirname + '/estudio.src.html', 'utf8');
const map = { __RES__: uri('brains/researcher.png', 'image/png'), __MKT__: uri('brains/marketer.png', 'image/png'), __CRE__: uri('brains/creator.png', 'image/png'), __BUI__: uri('brains/builder.png', 'image/png'), __NICO__: uri('proposal/nicolas.jpg', 'image/jpeg'), __FOUR__: uri('brains/four-brains.jpg', 'image/jpeg'), __LOGO__: fs.readFileSync(B + 'braindy-logo.svg', 'utf8').trim() };
for (const k in map) h = h.split(k).join(map[k]);
fs.writeFileSync(require('os').tmpdir() + '/el-estudio.html', h);
console.log('bytes', h.length);
