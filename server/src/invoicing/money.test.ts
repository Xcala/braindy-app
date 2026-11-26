import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, allocate, cop, monthLabel, nitCheckDigit, nitValid, pesosInWords, planOf, splitAmount } from './money.js';

test('amount in words (Colombia, M/CTE.)', () => {
  assert.equal(pesosInWords(1_083_333), 'UN MILLÓN OCHENTA Y TRES MIL TRESCIENTOS TREINTA Y TRES PESOS M/CTE.');
  assert.equal(pesosInWords(1_083_335), 'UN MILLÓN OCHENTA Y TRES MIL TRESCIENTOS TREINTA Y CINCO PESOS M/CTE.');
  assert.equal(pesosInWords(928_571), 'NOVECIENTOS VEINTIOCHO MIL QUINIENTOS SETENTA Y UN PESOS M/CTE.');
  assert.equal(pesosInWords(1_000_000), 'UN MILLÓN DE PESOS M/CTE.');
  assert.equal(pesosInWords(21_000_000), 'VEINTIÚN MILLONES DE PESOS M/CTE.');
  assert.equal(pesosInWords(3_250_000), 'TRES MILLONES DOSCIENTOS CINCUENTA MIL PESOS M/CTE.');
});

test('split: remainder in the last cuenta', () => {
  assert.deepEqual(splitAmount(6_500_000, 6), [1_083_333, 1_083_333, 1_083_333, 1_083_333, 1_083_333, 1_083_335]);
  assert.deepEqual(splitAmount(6_500_000, 7), [928_571, 928_571, 928_571, 928_571, 928_571, 928_571, 928_574]);
  assert.equal(splitAmount(6_500_000, 6).reduce((a, b) => a + b), 6_500_000);
  assert.throws(() => splitAmount(100, 0));
});

test('months and labels', () => {
  assert.equal(addMonths('2026-09', 5), '2027-02');
  assert.equal(addMonths('2026-12', 1), '2027-01');
  assert.equal(monthLabel('2026-11'), 'noviembre de 2026');
  assert.equal(cop(1_083_333), '$1.083.333');
});

test('Blacky plan: Sept–Nov issued today, Dec–Feb scheduled on their day', () => {
  const rows = planOf({ totalAmount: 6_500_000, installments: 6, startMonth: '2026-09', issueDay: 5, numberingPrefix: 'BM-06' }, '2026-11-25');
  assert.deepEqual(rows.map((r) => r.number), ['BM-06-01', 'BM-06-02', 'BM-06-03', 'BM-06-04', 'BM-06-05', 'BM-06-06']);
  assert.deepEqual(rows.map((r) => r.issueNow), [true, true, true, false, false, false]);
  assert.deepEqual(rows.map((r) => r.scheduledDate), ['2026-11-25', '2026-11-25', '2026-11-25', '2026-12-05', '2027-01-05', '2027-02-05']);
  assert.equal(rows[5].billingMonth, '2027-02');
});

test('allocation: the 3.250.000 advance pays three cuentas and part of the fourth', () => {
  const open = [1, 2, 3, 4, 5, 6].map((i) => ({ id: `c${i}`, owed: i === 6 ? 1_083_335 : 1_083_333 }));
  const a = allocate(open, 3_250_000);
  assert.deepEqual(a.map((x) => [x.id, x.applied, x.settles]), [['c1', 1_083_333, true], ['c2', 1_083_333, true], ['c3', 1_083_333, true], ['c4', 1, false]]);
});

test('NIT check digit (DIAN)', () => {
  assert.equal(nitCheckDigit('902038455'), 4);
  assert.equal(nitValid('902038455-4'), true);
  assert.equal(nitValid('902.038.455-5'), false);
  assert.equal(nitValid('902038455'), null);
});
