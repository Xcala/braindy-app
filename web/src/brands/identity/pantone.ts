// Nearest Pantone (Solid Coated) to a hex, by CIELAB distance, and CMYK from RGB: the same approximations brands.braindy showed.
// Library: the common Solid Coated swatches rescued from brands.braindy (name without the "PANTONE" prefix : hex).
const LIBRARY = [
  '100 C:f6eb61|101 C:f7ea48|102 C:fce300|103 C:c6aa00|104 C:a68d00|105 C:7d6b00|106 C:f9e547|107 C:fbe122',
  '108 C:fedd00|109 C:ffd100|110 C:d69d00|111 C:b58b00|112 C:997c00|113 C:f9e068|114 C:f9d648|115 C:f9d021',
  '116 C:ffcd00|117 C:c98f00|118 C:a17700|119 C:826600|120 C:f9d984|121 C:f9d168|122 C:fed141|123 C:ffc82e',
  '124 C:eaaa00|125 C:b78400|126 C:916b00|127 C:f3e08f|128 C:f3d56d|129 C:f3cc4d|130 C:f2a900|131 C:cc8a00',
  '132 C:a17200|133 C:7c5a00|134 C:f9d699|135 C:f9c97c|136 C:ffb549|137 C:ffa300|138 C:de7c00|139 C:ae6300',
  '140 C:7a4b00|141 C:f3cc84|142 C:f3b55a|143 C:f2a93b|144 C:ed8b00|145 C:bc6a00|146 C:965900|147 C:6b4f00',
  '148 C:f9d1b2|149 C:f9c199|150 C:ffb57c|151 C:ff8200|152 C:e37222|153 C:be5e00|154 C:7a3e00|155 C:f3d5b2',
  '156 C:f3c18f|157 C:f2a96b|158 C:e87722|159 C:cb6015|160 C:9e4a00|161 C:633200|162 C:f9c1b2|163 C:f9a98e',
  '164 C:ff8f6d|165 C:ff671f|166 C:e35205|167 C:be4d00|168 C:5b2b00|169 C:f3a99e|170 C:f28b7c|171 C:ff7c63',
  '172 C:fa4616|173 C:d04400|174 C:913a00|175 C:4a2300|176 C:f9b2b7|177 C:f98e99|178 C:ff585d|179 C:e4002b',
  '180 C:c83333|181 C:8e2b2b|182 C:f3b2bc|183 C:f28ea3|184 C:f15a7c|185 C:e4002b|186 C:c8102e|187 C:a6192e',
  '188 C:76232f|189 C:f9b2cc|190 C:f98eb2|191 C:ef3340|192 C:e40046|193 C:bf0d3e|194 C:9b2743|195 C:782b3a',
  '196 C:f3b2c6|197 C:f28eac|198 C:f15a84|199 C:d50032|200 C:ba0c2f|201 C:9d2235|202 C:862633|203 C:f9b2d1',
  '204 C:f98eb7|205 C:f15a99|206 C:d50057|207 C:a41c3d|208 C:861f41|209 C:6f263d|210 C:f3b2d1|211 C:f28eb7',
  '212 C:f15a99|213 C:e31c79|214 C:ce1126|215 C:a21942|216 C:862643|217 C:f9b2da|218 C:f98ec4|219 C:da1884',
  '220 C:b4005e|221 C:9b2743|222 C:6f263d|223 C:f3b2da|224 C:f28ec4|225 C:df1995|226 C:d7006d|227 C:ab0051',
  '228 C:8a1538|229 C:6f263d|230 C:f9b2e1|231 C:f98ed6|232 C:f15abf|233 C:c6007e|234 C:a2195b|235 C:86264f',
  '236 C:f3b2e1|237 C:f28ed6|238 C:f15abf|239 C:e03e96|240 C:b4008a|241 C:9b2743|242 C:6f263d|243 C:f9b2e8',
  '244 C:f98ee1|245 C:f15ad1|246 C:c600a9|247 C:ab008c|248 C:8a157c|249 C:6f263d|250 C:f3b2e8|251 C:f28ee1',
  '252 C:f15ad1|253 C:b4009e|254 C:9b278a|255 C:6f265b|256 C:f9b2f3|257 C:f98ef3|258 C:8e24aa|259 C:6a1b9a',
  '260 C:4a148c|261 C:311b92|262 C:1a237e|263 C:f3b2f3|264 C:f28ef3|265 C:8e24aa|266 C:6a1b9a|267 C:4a148c',
  '268 C:311b92|269 C:1a237e|270 C:f3b2f3|271 C:f28ef3|272 C:8e24aa|273 C:6a1b9a|274 C:4a148c|275 C:311b92',
  '276 C:1a237e|277 C:f3b2f3|278 C:f28ef3|279 C:8e24aa|280 C:012169|281 C:00205b|282 C:041e42|283 C:92c1e9',
  '284 C:6ca0dc|285 C:0072ce|286 C:0033a0|287 C:003087|288 C:002d72|289 C:0c2340|290 C:b9d9eb|291 C:9bcbeb',
  '292 C:69b3e7|293 C:0061ab|294 C:002f6c|295 C:002855|296 C:041e42|297 C:71c5e8|298 C:41b6e6|299 C:00a3e0',
  '300 C:005eb8|301 C:004b87|302 C:003b5c|303 C:002a3a|304 C:96dce0|305 C:59cbe8|306 C:00b5e2|307 C:0067a0',
  '308 C:005172|309 C:003844|310 C:69d2e7|311 C:05c3de|312 C:00a9ce|313 C:0092bc|314 C:007a99|315 C:006272',
  '316 C:004851|317 C:b2e5e5|318 C:8fe0e0|319 C:26d2d2|320 C:009ca6|321 C:008b91|322 C:007377|323 C:005f61',
  '324 C:a8e0d6|325 C:78d6c7|326 C:00b2a9|327 C:008675|328 C:006f62|329 C:00594c|330 C:004238|331 C:b2e5d6',
  '332 C:96e5c7|333 C:26d2b2|334 C:009b77|335 C:007a53|336 C:006747|337 C:a8e0c7|338 C:78d6b2|339 C:00b289',
  '340 C:00966c|341 C:007a5e|342 C:00674b|343 C:004b3a|344 C:96e5b2|345 C:78e5a8|346 C:26d289|347 C:009a44',
  '348 C:00843d|349 C:046a38|350 C:2c5234|351 C:b2e5b2|352 C:96e596|353 C:26d278|354 C:00b140|355 C:009639',
  '356 C:007a33|357 C:215732|358 C:a8e0a8|359 C:78d678|360 C:6cc24a|361 C:43b02a|362 C:418f19|363 C:3d7d1e',
  '364 C:3a6d20|365 C:c7e596|366 C:b2e578|367 C:a4d65e|368 C:78be20|369 C:64a70b|370 C:548200|371 C:4a5d23',
  '372 C:d6e596|373 C:c7e578|374 C:b2e559|375 C:97d700|376 C:84bd00|377 C:729608|378 C:4b5320|379 C:e5e578',
  '380 C:d6e559|381 C:cedc00|382 C:c4d600|383 C:a2ad00|384 C:8c8d00|385 C:747400|Black C:2d2926|White C:ffffff',
  'Cool Gray 1 C:d9d9d6|Cool Gray 11 C:53565a',
].join('|').split('|').map((e) => { const [name, hex] = e.split(':'); return { name: `PANTONE ${name}`, lab: lab(hex) }; });

function lab(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(hex.replace('#', '').slice(i, i + 2), 16) / 255;
    return (v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92) * 100;
  });
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 95.047);
  const y = f((r * 0.2126 + g * 0.7152 + b * 0.0722) / 100);
  const z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 108.883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export function nearestPantone(hex: string): string {
  const t = lab(hex);
  let best = LIBRARY[0], min = Infinity;
  for (const p of LIBRARY) {
    const d = Math.hypot(t[0] - p.lab[0], t[1] - p.lab[1], t[2] - p.lab[2]);
    if (d < min) { min = d; best = p; }
  }
  return best.name;
}

export function cmyk([r, g, b]: readonly number[]): number[] {
  const k = 1 - Math.max(r, g, b) / 255;
  if (k >= 1) return [0, 0, 0, 100];
  return [r, g, b].map((v) => Math.round(((1 - v / 255 - k) / (1 - k)) * 100)).concat(Math.round(k * 100));
}
