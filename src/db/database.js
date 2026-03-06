import Dexie from 'dexie';

export const db = new Dexie('SprayTraceDB');

db.version(1).stores({
  programs: 'id, name, modelNumber, projectNumber, kFactor, updatedAt',
  testLayouts: 'id, programId, name, standard',
  testConditions: 'id, testLayoutId, label',
  iterations: 'id, testLayoutId, sequenceLabel, date, createdAt',
  distributionResults: 'id, iterationId, testConditionId',
});

// --- Programs ---
export async function createProgram(program) {
  const now = new Date().toISOString();
  const record = { ...program, createdAt: now, updatedAt: now };
  await db.programs.put(record);
  return record;
}

export async function updateProgram(id, updates) {
  await db.programs.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteProgram(id) {
  const layouts = await db.testLayouts.where('programId').equals(id).toArray();
  for (const layout of layouts) {
    await deleteTestLayout(layout.id);
  }
  await db.programs.delete(id);
}

export async function getAllPrograms() {
  return db.programs.orderBy('updatedAt').reverse().toArray();
}

export async function getProgram(id) {
  return db.programs.get(id);
}

// --- Test Layouts ---
export async function createTestLayout(layout) {
  const now = new Date().toISOString();
  const record = { ...layout, createdAt: now };
  await db.testLayouts.put(record);
  return record;
}

export async function getTestLayoutsForProgram(programId) {
  return db.testLayouts.where('programId').equals(programId).toArray();
}

export async function getTestLayout(id) {
  return db.testLayouts.get(id);
}

export async function updateTestLayout(id, updates) {
  await db.testLayouts.update(id, updates);
}

export async function deleteTestLayout(id) {
  const conditions = await db.testConditions.where('testLayoutId').equals(id).toArray();
  const iterations = await db.iterations.where('testLayoutId').equals(id).toArray();
  for (const iter of iterations) {
    await db.distributionResults.where('iterationId').equals(iter.id).delete();
  }
  await db.iterations.where('testLayoutId').equals(id).delete();
  await db.testConditions.where('testLayoutId').equals(id).delete();
  await db.testLayouts.delete(id);
}

// --- Test Conditions ---
export async function createTestCondition(condition) {
  await db.testConditions.put(condition);
  return condition;
}

export async function getTestConditionsForLayout(testLayoutId) {
  return db.testConditions.where('testLayoutId').equals(testLayoutId).toArray();
}

export async function updateTestCondition(id, updates) {
  await db.testConditions.update(id, updates);
}

// --- Iterations ---
export async function createIteration(iteration) {
  const now = new Date().toISOString();
  const record = { ...iteration, createdAt: now };
  await db.iterations.put(record);
  // Touch parent program updatedAt
  const layout = await db.testLayouts.get(iteration.testLayoutId);
  if (layout) {
    await db.programs.update(layout.programId, { updatedAt: now });
  }
  return record;
}

export async function getIterationsForLayout(testLayoutId) {
  return db.iterations.where('testLayoutId').equals(testLayoutId).toArray();
}

export async function getIteration(id) {
  return db.iterations.get(id);
}

export async function updateIteration(id, updates) {
  await db.iterations.update(id, updates);
}

export async function deleteIteration(id) {
  await db.distributionResults.where('iterationId').equals(id).delete();
  await db.iterations.delete(id);
}

// --- Distribution Results ---
export async function createDistributionResult(result) {
  await db.distributionResults.put(result);
  return result;
}

export async function getResultsForIteration(iterationId) {
  return db.distributionResults.where('iterationId').equals(iterationId).toArray();
}

export async function getResultForCondition(iterationId, testConditionId) {
  return db.distributionResults
    .where('iterationId').equals(iterationId)
    .filter(r => r.testConditionId === testConditionId)
    .first();
}

export async function updateDistributionResult(id, updates) {
  await db.distributionResults.update(id, updates);
}

// --- Bulk export/import ---
export async function exportAllData() {
  const [programs, testLayouts, testConditions, iterations, distributionResults] = await Promise.all([
    db.programs.toArray(),
    db.testLayouts.toArray(),
    db.testConditions.toArray(),
    db.iterations.toArray(),
    db.distributionResults.toArray(),
  ]);
  return { version: 1, exportedAt: new Date().toISOString(), programs, testLayouts, testConditions, iterations, distributionResults };
}

export async function importData(data, mode = 'merge') {
  if (mode === 'overwrite') {
    await Promise.all([
      db.programs.clear(),
      db.testLayouts.clear(),
      db.testConditions.clear(),
      db.iterations.clear(),
      db.distributionResults.clear(),
    ]);
  }
  await db.transaction('rw', db.programs, db.testLayouts, db.testConditions, db.iterations, db.distributionResults, async () => {
    if (data.programs) await db.programs.bulkPut(data.programs);
    if (data.testLayouts) await db.testLayouts.bulkPut(data.testLayouts);
    if (data.testConditions) await db.testConditions.bulkPut(data.testConditions);
    if (data.iterations) await db.iterations.bulkPut(data.iterations);
    if (data.distributionResults) await db.distributionResults.bulkPut(data.distributionResults);
  });
}

export async function clearAllData() {
  await Promise.all([
    db.programs.clear(),
    db.testLayouts.clear(),
    db.testConditions.clear(),
    db.iterations.clear(),
    db.distributionResults.clear(),
  ]);
}
