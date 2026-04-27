#!/usr/bin/env bun

import { spawn } from 'bun';

console.log('🚀 Iniciando servidores...');

const backend = spawn({
  cmd: ['bun', 'run', 'src/server.ts'],
  cwd: 'backend',
  stdout: 'inherit',
  stderr: 'inherit',
});

// ⏳ Espera antes de levantar frontend
setTimeout(() => {
  const frontend = spawn({
    cmd: ['npm', 'run', 'dev'],
    cwd: 'frontend',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  process.on('exit', () => {
    backend.kill();
    frontend.kill();
  });
}, 4000);