export function extractSections(latex: string): { section: string; content: string }[] {
  const sections: { section: string; content: string }[] = [];
  const regex = /\\(?:section|section\*)\{([^}]+)\}([\s\S]*?)(?=\\(?:section|section\*)\{|\\end\{document\})/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(latex)) !== null) {
    sections.push({ section: match[1], content: match[2] });
  }
  return sections;
}

/**
 * Sanitizes user-provided LaTeX fragments to prevent injection into config.
 * Strips control sequences that could break the compile or format.
 */
export function sanitizeLatex(input: string): string {
  return input
    .replace(/\\(?:begin|end)\{[^}]+\}/g, "")
    .replace(/\\newcommand|\\renewcommand|\\def|\\edef/g, "")
    .trim();
}

/**
 * Replace a section's body in a LaTeX document.
 */
export function replaceSection(latex: string, sectionName: string, newContent: string): string {
  const escaped = sectionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(\\\\section\\*?\\{${escaped}\\})[\\s\\S]*?(?=\\\\section\\*?\\{|\\\\end\\{document\\})`
  );
  return latex.replace(pattern, `$1\n${newContent}\n`);
}