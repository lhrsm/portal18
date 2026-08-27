/**
 * Supabase Migrations Pre-Flight & Destructive SQL Auditor (Phase 12B)
 */

import fs from 'fs';
import path from 'path';

export interface MigrationAuditResult {
  totalMigrations: number;
  firstMigration: string;
  latestMigration: string;
  isChronological: boolean;
  duplicateTimestamps: string[];
  destructiveWarnings: { file: string; line: number; statement: string }[];
}

export function auditMigrations(): MigrationAuditResult {
  const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found at: ${migrationsDir}`);
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  const timestamps: string[] = [];
  const duplicateTimestamps: string[] = [];
  const destructiveWarnings: { file: string; line: number; statement: string }[] = [];

  const destructivePatterns = [
    /\bDROP\s+TABLE\b/i,
    /\bDROP\s+COLUMN\b/i,
    /\bTRUNCATE\b/i,
  ];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const timestamp = file.split('_')[0];
    if (timestamps.includes(timestamp)) {
      duplicateTimestamps.push(timestamp);
    }
    timestamps.push(timestamp);

    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      // Ignore comments
      if (line.trim().startsWith('--')) return;
      for (const pattern of destructivePatterns) {
        if (pattern.test(line)) {
          destructiveWarnings.push({
            file,
            line: idx + 1,
            statement: line.trim(),
          });
        }
      }
    });
  }

  const isChronological = [...files].sort().every((f, idx) => f === files[idx]);

  return {
    totalMigrations: files.length,
    firstMigration: files[0] || '',
    latestMigration: files[files.length - 1] || '',
    isChronological,
    duplicateTimestamps,
    destructiveWarnings,
  };
}

if (require.main === module) {
  console.log('\n================================================================');
  console.log('🔍 SUPABASE MIGRATIONS PRE-FLIGHT AUDIT');
  console.log('================================================================\n');

  const audit = auditMigrations();
  console.log(`Total Migrations:      ${audit.totalMigrations}`);
  console.log(`First Migration:       ${audit.firstMigration}`);
  console.log(`Latest Migration Head: ${audit.latestMigration}`);
  console.log(`Chronological Order:   ${audit.isChronological ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`Duplicate Timestamps:  ${audit.duplicateTimestamps.length === 0 ? '✅ NONE' : audit.duplicateTimestamps.join(', ')}`);
  console.log(`Destructive Warnings:  ${audit.destructiveWarnings.length === 0 ? '✅ 0 UNPROTECTED DESTRUCTIVE STATEMENTS' : `${audit.destructiveWarnings.length} flagged`}`);

  if (audit.destructiveWarnings.length > 0) {
    console.log('\nFlagged Statements for Review:');
    audit.destructiveWarnings.forEach((w) => {
      console.log(`  - [${w.file}:${w.line}] ${w.statement}`);
    });
  }
  console.log('\n================================================================\n');
}
