# CLAUDE.md · El Estudio (San Francisco office), standalone

This folder is only the Braindy studio in San Francisco, split out of the Braindy app so Nicolas can keep editing it on its own. No React, no Firebase, no build: plain HTML, CSS and JS.

## Files
- `index.html`: the page.
- `estudio.css`: the styles (the `.sd-*` part is a copy of `web/src/studio/studio.css` in the app).
- `estudio.js`: seats, zoom into each seat, close-up videos, live SF and Bogotá clocks. `SEATS` holds where each person sits in a 2000 × 1116 frame (same as `web/src/studio/geometry.ts`).
- `datos.js`: demo content (what each Brain and NicoMarca are doing, their queue, language es/en). Edit this to change texts.
- `media/`: `studio.jpg` (the photo), `loop.mp4` (10 s scene loop), `cu-*.mp4` (8 s close-up per seat).
- `server.cjs`: preview with `node server.cjs` → http://localhost:5190 (port 5173 belongs to another project).

## Who is in the studio
NicoMarca (Nicolas, seen from behind, front-right, white screen) and his 4 Brains: Researcher #F5B301, Marketer #8B5CF6, Creator #06B6D4, Builder #2A7FFF (at the head). Line: "Made by NickMark. Powered by his Brains." Nicolas is always the author; the Brains work with him.

## Rules
- Nicolas must look like himself in any new image (use his real photos as reference). He prefers not to show his face.
- No Apple products anywhere: he uses PC and Samsung.
- Brand typeface Red Hat Display (300/900, no italics). Brand names stay off the client view.
- Generated media (Higgsfield, Nano Banana, Kling): keep the camera locked and start frame = end frame so loops are seamless. If you replace `studio.jpg`, re-measure `SEATS` and the clock boxes in `index.html`.
- Heavy uploads or renders only at night unless Nicolas asks.

## Taking changes back to the app
The live studio in the app is `web/src/studio/` (React) with media in `web/public/studio/`. This folder never touches the app or its database. When Nicolas approves a change here, port it from a braindy-app session: copy new media to `web/public/studio/`, mirror `SEATS` in `geometry.ts` and the CSS in `studio.css`.
