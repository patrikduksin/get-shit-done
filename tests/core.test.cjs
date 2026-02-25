/**
 * GSD Tools Tests - core.cjs
 *
 * Tests for the foundational module's exports including regressions
 * for known bugs (REG-01: loadConfig model_overrides, REG-02: getRoadmapPhaseInternal export).
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  loadConfig,
  resolveModelInternal,
  MODEL_PROFILES,
  escapeRegex,
  generateSlugInternal,
  normalizePhaseName,
  comparePhaseNum,
  safeReadFile,
  pathExistsInternal,
  getMilestoneInfo,
  getRoadmapPhaseInternal,
  searchPhaseInDir,
  findPhaseInternal,
} = require('../get-shit-done/bin/lib/core.cjs');

// ─── loadConfig ────────────────────────────────────────────────────────────────

describe('loadConfig', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-core-test-'));
    fs.mkdirSync(path.join(tmpDir, '.planning'), { recursive: true });
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeConfig(obj) {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'config.json'),
      JSON.stringify(obj, null, 2)
    );
  }

  test('returns defaults when config.json is missing', () => {
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.model_profile, 'balanced');
    assert.strictEqual(config.commit_docs, true);
    assert.strictEqual(config.research, true);
    assert.strictEqual(config.plan_checker, true);
    assert.strictEqual(config.brave_search, false);
    assert.strictEqual(config.parallelization, true);
  });

  test('reads model_profile from config.json', () => {
    writeConfig({ model_profile: 'quality' });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.model_profile, 'quality');
  });

  test('reads nested config keys', () => {
    writeConfig({ planning: { commit_docs: false } });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.commit_docs, false);
  });

  test('reads branching_strategy from git section', () => {
    writeConfig({ git: { branching_strategy: 'per-phase' } });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.branching_strategy, 'per-phase');
  });

  // Bug: loadConfig previously omitted model_overrides from return value
  test('returns model_overrides when present (REG-01)', () => {
    writeConfig({ model_overrides: { 'gsd-executor': 'opus' } });
    const config = loadConfig(tmpDir);
    assert.deepStrictEqual(config.model_overrides, { 'gsd-executor': 'opus' });
  });

  test('returns model_overrides as null when not in config', () => {
    writeConfig({ model_profile: 'balanced' });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.model_overrides, null);
  });

  test('returns defaults when config.json contains invalid JSON', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'config.json'),
      'not valid json {{{{'
    );
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.model_profile, 'balanced');
    assert.strictEqual(config.commit_docs, true);
  });

  test('handles parallelization as boolean', () => {
    writeConfig({ parallelization: false });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.parallelization, false);
  });

  test('handles parallelization as object with enabled field', () => {
    writeConfig({ parallelization: { enabled: false } });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.parallelization, false);
  });

  test('prefers top-level keys over nested keys', () => {
    writeConfig({ commit_docs: false, planning: { commit_docs: true } });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.commit_docs, false);
  });
});

// ─── resolveModelInternal ──────────────────────────────────────────────────────

describe('resolveModelInternal', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-core-test-'));
    fs.mkdirSync(path.join(tmpDir, '.planning'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeConfig(obj) {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'config.json'),
      JSON.stringify(obj, null, 2)
    );
  }

  describe('quality profile', () => {
    beforeEach(() => {
      writeConfig({ model_profile: 'quality' });
    });

    test('resolves gsd-planner correctly', () => {
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-planner'), 'inherit');
    });

    test('resolves gsd-executor correctly', () => {
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-executor'), 'inherit');
    });

    test('resolves gsd-phase-researcher correctly', () => {
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-phase-researcher'), 'inherit');
    });

    test('resolves gsd-codebase-mapper correctly', () => {
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-codebase-mapper'), 'sonnet');
    });
  });

  describe('balanced profile', () => {
    beforeEach(() => {
      writeConfig({ model_profile: 'balanced' });
    });

    test('resolves gsd-planner correctly', () => {
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-planner'), 'inherit');
    });

    test('resolves gsd-executor correctly', () => {
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-executor'), 'sonnet');
    });

    test('resolves gsd-phase-researcher correctly', () => {
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-phase-researcher'), 'sonnet');
    });

    test('resolves gsd-codebase-mapper correctly', () => {
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-codebase-mapper'), 'haiku');
    });
  });

  describe('budget profile', () => {
    beforeEach(() => {
      writeConfig({ model_profile: 'budget' });
    });

    test('resolves gsd-planner correctly', () => {
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-planner'), 'sonnet');
    });

    test('resolves gsd-executor correctly', () => {
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-executor'), 'sonnet');
    });

    test('resolves gsd-phase-researcher correctly', () => {
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-phase-researcher'), 'haiku');
    });

    test('resolves gsd-codebase-mapper correctly', () => {
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-codebase-mapper'), 'haiku');
    });
  });

  describe('override precedence', () => {
    test('per-agent override takes precedence over profile', () => {
      writeConfig({
        model_profile: 'balanced',
        model_overrides: { 'gsd-executor': 'haiku' },
      });
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-executor'), 'haiku');
    });

    test('opus override resolves to inherit', () => {
      writeConfig({
        model_overrides: { 'gsd-executor': 'opus' },
      });
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-executor'), 'inherit');
    });

    test('agents not in override fall back to profile', () => {
      writeConfig({
        model_profile: 'quality',
        model_overrides: { 'gsd-executor': 'haiku' },
      });
      // gsd-planner not overridden, should use quality profile -> opus -> inherit
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-planner'), 'inherit');
    });
  });

  describe('edge cases', () => {
    test('returns sonnet for unknown agent type', () => {
      writeConfig({ model_profile: 'balanced' });
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-nonexistent'), 'sonnet');
    });

    test('defaults to balanced profile when model_profile missing', () => {
      writeConfig({});
      // balanced profile, gsd-planner -> opus -> inherit
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-planner'), 'inherit');
    });
  });
});
