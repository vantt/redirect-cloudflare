/// <reference types="node" />
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import path from 'path';

console.log('Current working directory:', process.cwd());

describe.skip('Cloudflare Workers Project Setup', () => {
  it('should create the src directory', () => {
    expect(existsSync(path.resolve(__dirname, '..', 'src'))).toBe(true);
  });

  it('should create the wrangler.jsonc file', () => {
    expect(existsSync(path.resolve(__dirname, '..', 'wrangler.jsonc'))).toBe(true);
  });

  it('should create the package.json file', () => {
    expect(existsSync(path.resolve(__dirname, '..', 'package.json'))).toBe(true);
  });
});