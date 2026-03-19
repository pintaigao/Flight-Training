function walk(node: any, out: string[]) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, out);
    return;
  }
  if (typeof node !== 'object') return;

  if (node.type === 'text' && typeof node.text === 'string') {
    out.push(node.text);
    return;
  }

  if (Array.isArray(node.children)) walk(node.children, out);
}

export function lexicalToPlainText(serialized: string): string {
  if (!serialized) return '';
  try {
    const json = JSON.parse(serialized);
    const out: string[] = [];
    walk(json?.root, out);
    return out
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return '';
  }
}

export function emptyLexicalStateJson(): string {
  return JSON.stringify({
    root: {
      children: [
        {
          children: [],
          direction: null,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  });
}

