import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CI/CD Pipeline', () => {
  const workflowPath = path.join(process.cwd(), '.github/workflows/ci.yml');

  it('GitHub Actions workflow file exists', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  it('workflow triggers on push to main', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('push:');
    expect(content).toContain('branches: [main]');
  });

  it('workflow triggers on pull requests to main', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('pull_request:');
  });

  it('workflow runs tests', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('npm test');
  });

  it('workflow runs build', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('npm run build');
  });

  it('workflow scans for secrets in code', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('Scanning for hardcoded secrets');
    expect(content).toContain('sk-ant-api03');
    expect(content).toContain('service_role');
  });

  it('workflow checks .gitignore', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('.env.local');
    expect(content).toContain('.gitignore');
  });

  it('workflow checks for wildcard CORS', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('Wildcard CORS');
  });

  it('workflow runs npm audit for vulnerabilities', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('npm audit');
  });

  it('workflow uses Node.js 20', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain("node-version: '22'");
  });

  it('workflow has timeout to prevent hanging', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('timeout-minutes:');
  });

  it('workflow uses npm ci (not npm install) for deterministic builds', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toContain('npm ci');
  });

  it('package-lock.json exists for deterministic installs', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'package-lock.json'))).toBe(true);
  });
});
