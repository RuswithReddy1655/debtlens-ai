import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { ComplexityMetrics } from './interfaces';

export interface DiscoveredSourceFile {
  relativePath: string;
  absolutePath: string;
  language: string;
  sizeBytes: number;
  linesOfCode: number;
  blankLines: number;
  commentLines: number;
  codeLines: number;
  functionCount: number;
  classCount: number;
  importCount: number;
  exportCount: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  nestingDepthMax: number;
  analysisStatus: 'SUPPORTED' | 'PARTIAL' | 'UNSUPPORTED';
}

export class RealSourceCodeAnalyzer {
  private static readonly IGNORED_DIRECTORIES = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    'vendor',
    'target',
    'bin',
    'obj',
    '.cache',
    'tmp',
    'out',
    '.turbo',
  ]);

  private static readonly BINARY_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp',
    '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
    '.exe', '.dll', '.so', '.dylib', '.bin',
    '.woff', '.woff2', '.ttf', '.eot',
    '.mp4', '.mp3', '.wav', '.mov',
    '.lock', '-lock.json', '.min.js', '.min.css',
  ]);

  private static readonly LANGUAGE_MAP: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (React)',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (React)',
    '.mjs': 'JavaScript',
    '.cjs': 'JavaScript',
    '.py': 'Python',
    '.java': 'Java',
    '.go': 'Go',
    '.cs': 'C#',
    '.cpp': 'C++',
    '.c': 'C',
    '.h': 'C/C++ Header',
    '.hpp': 'C++ Header',
    '.php': 'PHP',
    '.rb': 'Ruby',
    '.rs': 'Rust',
    '.kt': 'Kotlin',
    '.swift': 'Swift',
  };

  /**
   * Recursively discovers all valid source files in a repository workspace.
   */
  static discoverFiles(
    workspacePath: string,
    maxFiles: number = 5000,
    maxFileSizeBytes: number = 2 * 1024 * 1024
  ): string[] {
    const results: string[] = [];

    const walk = (currentDir: string) => {
      if (results.length >= maxFiles) return;

      let entries: fs.Dirent[] = [];
      try {
        entries = fs.readdirSync(currentDir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (results.length >= maxFiles) break;

        const fullPath = path.join(currentDir, entry.name);
        const relPath = path.relative(workspacePath, fullPath).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          if (!this.IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.')) {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (!this.BINARY_EXTENSIONS.has(ext) && !entry.name.endsWith('.min.js')) {
            try {
              const stat = fs.statSync(fullPath);
              if (stat.size <= maxFileSizeBytes && stat.size > 0) {
                results.push(relPath);
              }
            } catch {
              // Ignore unreadable files
            }
          }
        }
      }
    };

    walk(workspacePath);
    return results;
  }

  /**
   * Discovers and performs AST/complexity analysis across all source files in workspace.
   */
  static discoverAndAnalyzeFiles(
    workspacePath: string,
    maxFiles?: number,
    maxFileSizeBytes?: number
  ): DiscoveredSourceFile[] {
    const relPaths = this.discoverFiles(workspacePath, maxFiles, maxFileSizeBytes);
    return relPaths.map((rel) => this.analyzeFile(workspacePath, rel));
  }

  /**
   * Analyzes an individual source code file for volume, AST symbols, and complexity.
   */
  static analyzeFile(workspacePath: string, relativePath: string): DiscoveredSourceFile {
    const fullPath = path.join(workspacePath, relativePath);
    const ext = path.extname(relativePath).toLowerCase();
    const language = this.LANGUAGE_MAP[ext] || 'Other';
    const stat = fs.statSync(fullPath);

    let content = '';
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch {
      content = '';
    }

    // 1. Line Counting
    const rawLines = content.split('\n');
    const totalLines = rawLines.length;
    let blankLines = 0;
    let commentLines = 0;
    let inBlockComment = false;

    for (const line of rawLines) {
      const trimmed = line.trim();
      if (!trimmed) {
        blankLines++;
        continue;
      }

      if (inBlockComment) {
        commentLines++;
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
        continue;
      }

      if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
        commentLines++;
        continue;
      }

      if (trimmed.startsWith('/*')) {
        commentLines++;
        if (!trimmed.includes('*/')) {
          inBlockComment = true;
        }
        continue;
      }
    }

    const codeLines = Math.max(0, totalLines - blankLines - commentLines);

    // 2. AST Parsing for JS/TS
    if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs') {
      const astResult = this.parseTypeScriptAst(content, relativePath);
      return {
        relativePath,
        absolutePath: fullPath,
        language,
        sizeBytes: stat.size,
        linesOfCode: totalLines,
        blankLines,
        commentLines,
        codeLines,
        functionCount: astResult.functionCount,
        classCount: astResult.classCount,
        importCount: astResult.importCount,
        exportCount: astResult.exportCount,
        cyclomaticComplexity: astResult.cyclomaticComplexity,
        cognitiveComplexity: astResult.cognitiveComplexity,
        nestingDepthMax: astResult.nestingDepthMax,
        analysisStatus: 'SUPPORTED',
      };
    }

    // 3. Structural Regex Parsing for other languages (Python, Java, Go, etc.)
    if (language !== 'Other') {
      const structural = this.parseStructuralFallback(content, ext);
      return {
        relativePath,
        absolutePath: fullPath,
        language,
        sizeBytes: stat.size,
        linesOfCode: totalLines,
        blankLines,
        commentLines,
        codeLines,
        functionCount: structural.functionCount,
        classCount: structural.classCount,
        importCount: structural.importCount,
        exportCount: structural.exportCount,
        cyclomaticComplexity: structural.cyclomaticComplexity,
        cognitiveComplexity: structural.cognitiveComplexity,
        nestingDepthMax: structural.nestingDepthMax,
        analysisStatus: 'PARTIAL',
      };
    }

    // 4. Unsupported file type
    return {
      relativePath,
      absolutePath: fullPath,
      language,
      sizeBytes: stat.size,
      linesOfCode: totalLines,
      blankLines,
      commentLines,
      codeLines,
      functionCount: 0,
      classCount: 0,
      importCount: 0,
      exportCount: 0,
      cyclomaticComplexity: 1,
      cognitiveComplexity: 1,
      nestingDepthMax: 1,
      analysisStatus: 'UNSUPPORTED',
    };
  }

  /**
   * Real AST analysis using the TypeScript Compiler API.
   */
  private static parseTypeScriptAst(content: string, fileName: string) {
    const isJsx = fileName.endsWith('.tsx') || fileName.endsWith('.jsx');
    const sourceFile = ts.createSourceFile(
      fileName,
      content,
      ts.ScriptTarget.Latest,
      true,
      isJsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    let functionCount = 0;
    let classCount = 0;
    let importCount = 0;
    let exportCount = 0;
    let cyclomaticComplexity = 1; // Base complexity
    let cognitiveComplexity = 0;
    let nestingDepthMax = 0;

    const visit = (node: ts.Node, depth: number) => {
      nestingDepthMax = Math.max(nestingDepthMax, depth);

      // Functions & Methods
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node)
      ) {
        functionCount++;
      }

      // Classes
      if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
        classCount++;
      }

      // Imports & Exports
      if (ts.isImportDeclaration(node)) {
        importCount++;
      }
      if (ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
        exportCount++;
      }

      // Branching / Cyclomatic Decision Points
      let isBranch = false;
      if (
        ts.isIfStatement(node) ||
        ts.isForStatement(node) ||
        ts.isForInStatement(node) ||
        ts.isForOfStatement(node) ||
        ts.isWhileStatement(node) ||
        ts.isDoStatement(node) ||
        ts.isCaseClause(node) ||
        ts.isCatchClause(node) ||
        ts.isConditionalExpression(node)
      ) {
        isBranch = true;
        cyclomaticComplexity++;
        cognitiveComplexity += 1 + depth;
      }

      if (ts.isBinaryExpression(node)) {
        const op = node.operatorToken.kind;
        if (
          op === ts.SyntaxKind.AmpersandAmpersandToken ||
          op === ts.SyntaxKind.BarBarToken ||
          op === ts.SyntaxKind.QuestionQuestionToken
        ) {
          cyclomaticComplexity++;
          cognitiveComplexity += 1;
        }
      }

      const nextDepth = isBranch ? depth + 1 : depth;
      ts.forEachChild(node, (child) => visit(child, nextDepth));
    };

    visit(sourceFile, 0);

    return {
      functionCount,
      classCount,
      importCount,
      exportCount,
      cyclomaticComplexity,
      cognitiveComplexity,
      nestingDepthMax,
    };
  }

  /**
   * Structural lexical parser for non-JS/TS languages (Python, Java, Go, etc.)
   */
  private static parseStructuralFallback(content: string, ext: string) {
    let functionCount = 0;
    let classCount = 0;
    let importCount = 0;
    let exportCount = 0;
    let cyclomaticComplexity = 1;
    let nestingDepthMax = 0;

    const lines = content.split('\n');

    const fnPattern =
      ext === '.py'
        ? /^\s*def\s+[a-zA-Z0-9_]+/
        : ext === '.go'
        ? /^\s*func\s+[a-zA-Z0-9_*(]/
        : /\b(function|void|int|string|bool|async\s+function|public\s+[a-zA-Z0-9_<>]+)\s+[a-zA-Z0-9_]+\s*\(/;

    const classPattern =
      ext === '.py'
        ? /^\s*class\s+[a-zA-Z0-9_]+/
        : /\b(class|struct|interface|type\s+[a-zA-Z0-9_]+\s+struct)\b/;

    const branchPattern =
      /\b(if|elif|else if|for|while|case|catch|except|switch)\b|[?][^:]+[:]/;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

      // Approximate nesting depth by indentation
      const leadingSpaces = line.search(/\S/);
      if (leadingSpaces > 0) {
        const depth = Math.min(8, Math.floor(leadingSpaces / (ext === '.py' ? 4 : 2)));
        nestingDepthMax = Math.max(nestingDepthMax, depth);
      }

      if (fnPattern.test(line)) functionCount++;
      if (classPattern.test(line)) classCount++;
      if (/^\s*(import|from|package|using|#include)\b/.test(line)) importCount++;
      if (/\b(export|public)\b/.test(line)) exportCount++;
      if (branchPattern.test(line)) cyclomaticComplexity++;
    }

    return {
      functionCount,
      classCount,
      importCount,
      exportCount,
      cyclomaticComplexity,
      cognitiveComplexity: Math.round(cyclomaticComplexity * 1.2),
      nestingDepthMax,
    };
  }
}
