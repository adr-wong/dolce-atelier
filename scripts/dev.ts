#!/usr/bin/env bun

import { spawn } from 'bun';

const backend = spawn({
  cmd: ['bun', 'run', 'src/server.ts'],
  cwd: 'backend',
  stdout: 'inherit',
  stderr: 'inherit',
});

const frontend = spawn({
  cmd: ['npm', 'run', 'dev'],
  cwd: 'frontend',
  stdout: 'inherit',
  stderr: 'inherit',
});

console.log('🚀 Iniciando ambos servidores...');
console.log('   Backend: http://localhost:3001');
console.log('   Frontend: http://localhost:3000');

process.on('exit', () => {
  backend.kill();
  frontend.kill();
});