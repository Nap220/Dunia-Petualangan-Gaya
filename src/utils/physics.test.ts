import test from 'node:test';
import assert from 'node:assert/strict';
import {
  updateGravityApple,
  calculateMuscleOutcome,
  SURFACES,
  calculateFrictionStep,
  isFerromagnetic,
  calculateMagnetPoleForce,
  calculateObjectAttraction,
  calculateSpringEnergy,
  calculateSpringJumpHeight,
} from './physics';

test('Gravity: apple falls downward when gravity is ON and lands at groundY', () => {
  const initialApple = {
    id: 'apple-1',
    x: 100,
    y: 50,
    vy: 0,
    isLanded: false,
    branchOrigin: 50,
  };

  const step1 = updateGravityApple(initialApple, true, 400, 0.1);
  assert.ok(step1.y > 50, 'Apple Y should increase downwards');
  assert.ok(step1.vy > 0, 'Apple downward velocity should be positive');
  assert.equal(step1.isLanded, false);

  // Large time step to reach ground
  const landed = updateGravityApple(step1, true, 400, 2.0);
  assert.equal(landed.y, 400, 'Apple must clamp cleanly to ground');
  assert.equal(landed.vy, 0, 'Velocity resets upon landing');
  assert.equal(landed.isLanded, true);
});

test('Gravity: apple floats upward when gravity is OFF', () => {
  const initialApple = {
    id: 'apple-2',
    x: 100,
    y: 200,
    vy: 0,
    isLanded: false,
    branchOrigin: 200,
  };

  const floatStep = updateGravityApple(initialApple, false, 400, 0.5);
  assert.ok(floatStep.y < 200, 'Apple Y should decrease (float upwards)');
  assert.ok(floatStep.vy < 0, 'Float velocity is negative (upward)');
});

test('Muscle force: 4 scenarios produce exact pedagogical requirements', () => {
  const anakPeti = calculateMuscleOutcome('anak', 'peti');
  assert.equal(anakPeti.canMove, true, 'Child can push wooden box');
  assert.equal(anakPeti.pushForceN, 120);
  assert.equal(anakPeti.objectWeightN, 80);
  assert.ok(anakPeti.distancePx > 0);

  const anakKulkas = calculateMuscleOutcome('anak', 'kulkas');
  assert.equal(anakKulkas.canMove, false, 'Child cannot push heavy fridge');
  assert.equal(anakKulkas.distancePx, 0);

  const dewasaPeti = calculateMuscleOutcome('dewasa', 'peti');
  assert.equal(dewasaPeti.canMove, true, 'Adult pushes wooden box');
  assert.ok(dewasaPeti.distancePx > anakPeti.distancePx, 'Adult pushes box further than child');

  const dewasaKulkas = calculateMuscleOutcome('dewasa', 'kulkas');
  assert.equal(dewasaKulkas.canMove, true, 'Adult can move the fridge');
  assert.ok(dewasaKulkas.distancePx > 0);
  assert.ok(dewasaKulkas.distancePx < dewasaPeti.distancePx, 'Fridge moves less than box');
});

test('Friction: Surface friction coefficients and distances follow physical logic', () => {
  assert.ok(SURFACES.licin.frictionCoef < SURFACES.biasa.frictionCoef);
  assert.ok(SURFACES.biasa.frictionCoef < SURFACES.berbatuan.frictionCoef);
  assert.ok(SURFACES.licin.maxDistanceCm > SURFACES.biasa.maxDistanceCm);
  assert.ok(SURFACES.biasa.maxDistanceCm > SURFACES.berbatuan.maxDistanceCm);

  const step = calculateFrictionStep(0, 100, 50, 0.5);
  assert.equal(step.newPos, 25);
  assert.equal(step.isFinished, false);

  const endStep = calculateFrictionStep(90, 100, 50, 0.5);
  assert.equal(endStep.newPos, 100);
  assert.equal(endStep.isFinished, true);
});

test('Magnet: Ferromagnetic vs non-magnetic materials', () => {
  assert.equal(isFerromagnetic('paku'), true);
  assert.equal(isFerromagnetic('baut'), true);
  assert.equal(isFerromagnetic('kayuRanting'), false);
  assert.equal(isFerromagnetic('koinPerak'), false);
});

test('Magnet: Pole repulsion vs attraction', () => {
  const mNorth1 = { id: 'm1', type: 'magnet_utara' as const, pole: 'U' as const, x: 100, y: 100 };
  const mNorth2 = { id: 'm2', type: 'magnet_utara' as const, pole: 'U' as const, x: 180, y: 100 };
  const mSouthFar = { id: 'm3', type: 'magnet_selatan' as const, pole: 'S' as const, x: 180, y: 100 };
  const mSouthTouching = { id: 'm4', type: 'magnet_selatan' as const, pole: 'S' as const, x: 140, y: 100 };

  // U + U should repel (force pushes away, fx < 0 on m1)
  const repel = calculateMagnetPoleForce(mNorth1, mNorth2, 200);
  assert.ok(repel.fx < 0, 'Like poles repel away');
  assert.equal(repel.isContact, false);

  // U + S far should attract together
  const attract = calculateMagnetPoleForce(mNorth1, mSouthFar, 200);
  assert.ok(attract.fx > 0, 'Opposite poles attract together');
  assert.equal(attract.isContact, false);

  // U + S touching should latch stably without jitter (fx = 0, isContact = true)
  const contact = calculateMagnetPoleForce(mNorth1, mSouthTouching, 200);
  assert.equal(contact.isContact, true);
  assert.equal(contact.fx, 0);
  assert.equal(contact.fy, 0);
});

test('Magnet: Objects attraction', () => {
  const mNorth = { id: 'm1', type: 'magnet_utara' as const, pole: 'U' as const, x: 100, y: 100 };
  const paku = { id: 'o1', name: 'paku' as const, isMagnetic: true, x: 130, y: 100 };
  const kayu = { id: 'o2', name: 'kayuRanting' as const, isMagnetic: false, x: 130, y: 100 };

  const pakuAttract = calculateObjectAttraction(paku, [mNorth], 200);
  assert.ok(pakuAttract.dist < 200);
  assert.equal(pakuAttract.nearestMagnetId, 'm1');
  assert.ok(pakuAttract.fx < 0, 'Paku pulled towards magnet (negative dx direction)');

  const kayuAttract = calculateObjectAttraction(kayu, [mNorth], 200);
  assert.equal(kayuAttract.fx, 0);
  assert.equal(kayuAttract.nearestMagnetId, null);
});

test('Spring: Energy and jump height increase with compression depth', () => {
  const energyLow = calculateSpringEnergy(0.2);
  const energyMid = calculateSpringEnergy(0.5);
  const energyHigh = calculateSpringEnergy(1.0);

  assert.ok(energyLow < energyMid);
  assert.ok(energyMid < energyHigh);

  const jumpLow = calculateSpringJumpHeight(0.2);
  const jumpMid = calculateSpringJumpHeight(0.6);
  const jumpMax = calculateSpringJumpHeight(1.0);

  assert.ok(jumpLow < jumpMid);
  assert.ok(jumpMid < jumpMax);
  assert.ok(jumpLow > 0);
});
