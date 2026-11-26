import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSmallTalk } from './intent.js';

test('greetings and thanks are small talk', () => {
  for (const t of ['Hola', 'hola!! 👋', 'Buenos días Nico', 'muchas gracias', 'ok', 'Listo, gracias 🙌', 'Hola, ¿cómo estás?', 'Thanks!']) assert.ok(isSmallTalk(t), t);
});
test('anything that asks for work is not', () => {
  for (const t of ['Hola, necesito un post para el viernes', 'cambia el logo del sitio', 'gracias, ahora hazlo azul', 'Hola Nico, ¿cómo va el diseño?']) assert.ok(!isSmallTalk(t), t);
});
