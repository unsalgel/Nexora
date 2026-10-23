import { execFileSync } from 'node:child_process';

// Read only: inspect port bindings, never recreate containers or alter volumes.
const targets = new Set(['nexora-db', 'nexora-redis', 'nexora-pgadmin']);
const running = execFileSync('docker', ['ps', '--format', '{{.Names}}'], { encoding: 'utf8' }).trim().split(/\r?\n/);
let unsafe = false;
let inspected = 0;
for (const name of running.filter(name => targets.has(name))) {
  const ports = JSON.parse(execFileSync('docker', ['inspect', '--format', '{{json .NetworkSettings.Ports}}', name], { encoding: 'utf8' }));
  inspected++;
  for (const [port, bindings] of Object.entries(ports ?? {})) {
    for (const binding of bindings ?? []) {
      const local = binding.HostIp === '127.0.0.1' || binding.HostIp === '::1';
      if (!local) unsafe = true;
      console.log(`${local ? 'OK' : 'UYARI'} ${name}: ${binding.HostIp || '*'}:${binding.HostPort} -> ${port}`);
    }
  }
}
if (!inspected) console.log('Denetlenecek çalışan Nexora geliştirme konteyneri bulunamadı.');
if (unsafe) {
  console.error('Yerel ağ bağlaması bulundu. docs/reviews/review-duzeltmeleri-2026-10-23.md içindeki ortam notunu okuyun.');
  process.exitCode = 1;
}
