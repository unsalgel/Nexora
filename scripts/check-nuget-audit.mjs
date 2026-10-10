import { readFileSync } from 'node:fs';

const report = JSON.parse(readFileSync(process.argv[2] ?? 'nuget-audit.json', 'utf8').replace(/^\uFEFF/, ''));
if (report.version !== 1 || !Array.isArray(report.projects) || report.projects.length === 0) {
  throw new Error('NuGet audit çıktısı beklenen sürüm/proje yapısını taşımıyor.');
}
if (report.logs !== undefined && !Array.isArray(report.logs)) throw new Error('NuGet audit tanı listesi geçersiz.');
if ((report.logs ?? []).some(log => ['error', 'warning'].includes(String(log.level).toLowerCase()))) {
  throw new Error('NuGet audit hata/uyarıyla sonuçlandı; tarama başarılı kabul edilemez.');
}
const vulnerabilities = [];
for (const project of report.projects) {
  if (typeof project.path !== 'string' || (project.frameworks !== undefined && !Array.isArray(project.frameworks))) {
    throw new Error('NuGet audit proje çıktısı geçersiz.');
  }
  for (const framework of project.frameworks ?? []) {
    for (const key of ['topLevelPackages', 'transitivePackages']) {
      if (framework[key] !== undefined && !Array.isArray(framework[key])) throw new Error('NuGet paket listesi geçersiz.');
      for (const pkg of framework[key] ?? []) {
        for (const vulnerability of pkg.vulnerabilities ?? []) {
          vulnerabilities.push(`${pkg.id} ${pkg.resolvedVersion}: ${vulnerability.severity} ${vulnerability.advisoryurl}`);
        }
      }
    }
  }
}
if (vulnerabilities.length) throw new Error(`Zafiyetli NuGet paketleri:\n${vulnerabilities.join('\n')}`);
console.log(`${report.projects.length} proje için NuGet audit başarılı; bildirilen zafiyet yok.`);
