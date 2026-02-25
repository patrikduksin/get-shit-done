/**
 * GSD Tools Tests - Verify
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

// ─── helpers ──────────────────────────────────────────────────────────────────

// Build a minimal valid PLAN.md content with all required frontmatter fields
function validPlanContent({ wave = 1, dependsOn = '[]', autonomous = 'true', extraTasks = '' } = {}) {
  return [
    '---',
    'phase: 01-test',
    'plan: 01',
    'type: execute',
    `wave: ${wave}`,
    `depends_on: ${dependsOn}`,
    'files_modified: [some/file.ts]',
    `autonomous: ${autonomous}`,
    'must_haves:',
    '  truths:',
    '    - "something is true"',
    '---',
    '',
    '<tasks>',
    '',
    '<task type="auto">',
    '  <name>Task 1: Do something</name>',
    '  <files>some/file.ts</files>',
    '  <action>Do the thing</action>',
    '  <verify><automated>echo ok</automated></verify>',
    '  <done>Thing is done</done>',
    '</task>',
    extraTasks,
    '',
    '</tasks>',
  ].join('\n');
}

describe('validate consistency command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('passes for consistent project', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n### Phase 1: A\n### Phase 2: B\n### Phase 3: C\n`
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02-b'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-c'), { recursive: true });

    const result = runGsdTools('validate consistency', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.passed, true, 'should pass');
    assert.strictEqual(output.warning_count, 0, 'no warnings');
  });

  test('warns about phase on disk but not in roadmap', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n### Phase 1: A\n`
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '02-orphan'), { recursive: true });

    const result = runGsdTools('validate consistency', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.warning_count > 0, 'should have warnings');
    assert.ok(
      output.warnings.some(w => w.includes('disk but not in ROADMAP')),
      'should warn about orphan directory'
    );
  });

  test('warns about gaps in phase numbering', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n### Phase 1: A\n### Phase 3: C\n`
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-c'), { recursive: true });

    const result = runGsdTools('validate consistency', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(
      output.warnings.some(w => w.includes('Gap in phase numbering')),
      'should warn about gap'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// verify plan-structure command
// ─────────────────────────────────────────────────────────────────────────────

describe('verify plan-structure command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-test'), { recursive: true });
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('reports missing required frontmatter fields', () => {
    const planPath = path.join(tmpDir, '.planning', 'phases', '01-test', '01-01-PLAN.md');
    fs.writeFileSync(planPath, '# No frontmatter here\n\nJust a plan without YAML.\n');

    const result = runGsdTools('verify plan-structure .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.valid, false, 'should be invalid');
    assert.ok(
      output.errors.some(e => e.includes('Missing required frontmatter field')),
      `Expected "Missing required frontmatter field" in errors: ${JSON.stringify(output.errors)}`
    );
  });

  test('validates complete plan with all required fields and tasks', () => {
    const planPath = path.join(tmpDir, '.planning', 'phases', '01-test', '01-01-PLAN.md');
    fs.writeFileSync(planPath, validPlanContent());

    const result = runGsdTools('verify plan-structure .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.valid, true, `should be valid, errors: ${JSON.stringify(output.errors)}`);
    assert.deepStrictEqual(output.errors, [], 'should have no errors');
    assert.strictEqual(output.task_count, 1, 'should have 1 task');
  });

  test('reports task missing name element', () => {
    const content = [
      '---',
      'phase: 01-test',
      'plan: 01',
      'type: execute',
      'wave: 1',
      'depends_on: []',
      'files_modified: [some/file.ts]',
      'autonomous: true',
      'must_haves:',
      '  truths:',
      '    - "something"',
      '---',
      '',
      '<tasks>',
      '<task type="auto">',
      '  <action>Do it</action>',
      '  <verify><automated>echo ok</automated></verify>',
      '  <done>Done</done>',
      '</task>',
      '</tasks>',
    ].join('\n');

    const planPath = path.join(tmpDir, '.planning', 'phases', '01-test', '01-01-PLAN.md');
    fs.writeFileSync(planPath, content);

    const result = runGsdTools('verify plan-structure .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(
      output.errors.some(e => e.includes('Task missing <name>')),
      `Expected "Task missing <name>" in errors: ${JSON.stringify(output.errors)}`
    );
  });

  test('reports task missing action element', () => {
    const content = [
      '---',
      'phase: 01-test',
      'plan: 01',
      'type: execute',
      'wave: 1',
      'depends_on: []',
      'files_modified: [some/file.ts]',
      'autonomous: true',
      'must_haves:',
      '  truths:',
      '    - "something"',
      '---',
      '',
      '<tasks>',
      '<task type="auto">',
      '  <name>Task 1: No action</name>',
      '  <verify><automated>echo ok</automated></verify>',
      '  <done>Done</done>',
      '</task>',
      '</tasks>',
    ].join('\n');

    const planPath = path.join(tmpDir, '.planning', 'phases', '01-test', '01-01-PLAN.md');
    fs.writeFileSync(planPath, content);

    const result = runGsdTools('verify plan-structure .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(
      output.errors.some(e => e.includes('missing <action>')),
      `Expected "missing <action>" in errors: ${JSON.stringify(output.errors)}`
    );
  });

  test('warns about wave > 1 with empty depends_on', () => {
    const planPath = path.join(tmpDir, '.planning', 'phases', '01-test', '01-01-PLAN.md');
    fs.writeFileSync(planPath, validPlanContent({ wave: 2, dependsOn: '[]' }));

    const result = runGsdTools('verify plan-structure .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(
      output.warnings.some(w => w.includes('Wave > 1 but depends_on is empty')),
      `Expected "Wave > 1 but depends_on is empty" in warnings: ${JSON.stringify(output.warnings)}`
    );
  });

  test('errors when checkpoint task but autonomous is true', () => {
    const content = [
      '---',
      'phase: 01-test',
      'plan: 01',
      'type: execute',
      'wave: 1',
      'depends_on: []',
      'files_modified: [some/file.ts]',
      'autonomous: true',
      'must_haves:',
      '  truths:',
      '    - "something"',
      '---',
      '',
      '<tasks>',
      '<task type="auto">',
      '  <name>Task 1: Normal</name>',
      '  <files>some/file.ts</files>',
      '  <action>Do it</action>',
      '  <verify><automated>echo ok</automated></verify>',
      '  <done>Done</done>',
      '</task>',
      '<task type="checkpoint:human-verify">',
      '  <name>Task 2: Verify UI</name>',
      '  <files>some/file.ts</files>',
      '  <action>Check the UI</action>',
      '  <verify><human>Visit the app</human></verify>',
      '  <done>UI verified</done>',
      '</task>',
      '</tasks>',
    ].join('\n');

    const planPath = path.join(tmpDir, '.planning', 'phases', '01-test', '01-01-PLAN.md');
    fs.writeFileSync(planPath, content);

    const result = runGsdTools('verify plan-structure .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(
      output.errors.some(e => e.includes('checkpoint tasks but autonomous is not false')),
      `Expected checkpoint/autonomous error in errors: ${JSON.stringify(output.errors)}`
    );
  });

  test('returns error for nonexistent file', () => {
    const result = runGsdTools('verify plan-structure .planning/phases/01-test/nonexistent.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.error, `Expected error field in output: ${JSON.stringify(output)}`);
    assert.ok(
      output.error.includes('File not found'),
      `Expected "File not found" in error: ${output.error}`
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// verify phase-completeness command
// ─────────────────────────────────────────────────────────────────────────────

describe('verify phase-completeness command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    // Create ROADMAP.md referencing phase 01 so findPhaseInternal can locate it
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 1: Test\n**Goal**: Test phase\n'
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-test'), { recursive: true });
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('reports complete phase with matching plans and summaries', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), '# Plan\n');
    fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), '# Summary\n');

    const result = runGsdTools('verify phase-completeness 01', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.complete, true, `should be complete, errors: ${JSON.stringify(output.errors)}`);
    assert.strictEqual(output.plan_count, 1, 'should have 1 plan');
    assert.strictEqual(output.summary_count, 1, 'should have 1 summary');
    assert.deepStrictEqual(output.incomplete_plans, [], 'should have no incomplete plans');
  });

  test('reports incomplete phase with plan missing summary', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), '# Plan\n');

    const result = runGsdTools('verify phase-completeness 01', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.complete, false, 'should be incomplete');
    assert.ok(
      output.incomplete_plans.some(id => id.includes('01-01')),
      `Expected "01-01" in incomplete_plans: ${JSON.stringify(output.incomplete_plans)}`
    );
    assert.ok(
      output.errors.some(e => e.includes('Plans without summaries')),
      `Expected "Plans without summaries" in errors: ${JSON.stringify(output.errors)}`
    );
  });

  test('warns about orphan summaries', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), '# Summary\n');

    const result = runGsdTools('verify phase-completeness 01', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(
      output.warnings.some(w => w.includes('Summaries without plans')),
      `Expected "Summaries without plans" in warnings: ${JSON.stringify(output.warnings)}`
    );
  });

  test('returns error for nonexistent phase', () => {
    const result = runGsdTools('verify phase-completeness 99', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.error, `Expected error field in output: ${JSON.stringify(output)}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// progress command
// ─────────────────────────────────────────────────────────────────────────────

