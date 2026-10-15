type BrowserTranslator = {
  translate: (text: string) => Promise<string>;
  destroy?: () => void;
};

type BrowserTranslatorApi = {
  availability: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
  create: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<BrowserTranslator>;
};

const textOriginals = new Map<Text, string>();
const attributeOriginals = new Map<Element, Map<string, string>>();
let activeTranslator: BrowserTranslator | undefined;
let observer: MutationObserver | undefined;
let translateTimer: number | undefined;

function translatorApi(): BrowserTranslatorApi | undefined {
  return (globalThis as typeof globalThis & { Translator?: BrowserTranslatorApi }).Translator;
}

export function browserSpanishAvailable(): boolean {
  return Boolean(translatorApi());
}

function excluded(element: Element | null): boolean {
  return Boolean(element?.closest('script, style, code, pre, textarea, [translate="no"], .notranslate, [data-no-translate]'));
}

function textNodes(root: Node): Text[] {
  const documentRoot = root instanceof Document ? root.body : root;
  if (!documentRoot) return [];
  const walker = document.createTreeWalker(documentRoot, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.nodeValue?.trim();
      return text && !excluded(node.parentElement) && !textOriginals.has(node as Text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  return nodes;
}

async function translateTextNodes(nodes: Text[], translator: BrowserTranslator, onProgress?: (done: number, total: number) => void) {
  let done = 0;
  for (let index = 0; index < nodes.length; index += 6) {
    const group = nodes.slice(index, index + 6);
    await Promise.all(group.map(async (node) => {
      const original = node.nodeValue ?? '';
      const core = original.trim();
      textOriginals.set(node, original);
      try {
        const translated = await translator.translate(core);
        if (node.isConnected) node.nodeValue = original.replace(core, translated);
      } catch {
        textOriginals.delete(node);
      }
      done += 1;
      onProgress?.(done, nodes.length);
    }));
  }
}

async function translateAttributes(root: ParentNode, translator: BrowserTranslator) {
  const attributes = ['placeholder', 'title', 'aria-label'] as const;
  const elements = Array.from(root.querySelectorAll<HTMLElement>(attributes.map((name) => `[${name}]`).join(','))).filter((element) => !excluded(element));
  for (const element of elements) {
    for (const name of attributes) {
      const original = element.getAttribute(name);
      if (!original || attributeOriginals.get(element)?.has(name)) continue;
      try {
        const translated = await translator.translate(original);
        const record = attributeOriginals.get(element) ?? new Map<string, string>();
        record.set(name, original);
        attributeOriginals.set(element, record);
        element.setAttribute(name, translated);
      } catch {
        // Keep the original attribute when the browser reaches a translation limit.
      }
    }
  }
}

async function translateRoot(root: ParentNode, onProgress?: (done: number, total: number) => void) {
  if (!activeTranslator) return;
  const nodes = textNodes(root as Node);
  await translateTextNodes(nodes, activeTranslator, onProgress);
  await translateAttributes(root, activeTranslator);
}

export async function translateDocumentToSpanish(onProgress?: (done: number, total: number) => void): Promise<boolean> {
  const api = translatorApi();
  if (!api) return false;
  const availability = await api.availability({ sourceLanguage: 'en', targetLanguage: 'es' });
  if (availability === 'unavailable') return false;
  activeTranslator ??= await api.create({ sourceLanguage: 'en', targetLanguage: 'es' });
  await translateRoot(document, onProgress);
  document.documentElement.lang = 'es';
  document.documentElement.setAttribute('data-language', 'es');
  observer?.disconnect();
  observer = new MutationObserver((mutations) => {
    window.clearTimeout(translateTimer);
    translateTimer = window.setTimeout(() => {
      const roots = mutations.flatMap((mutation) => Array.from(mutation.addedNodes)).filter((node): node is ParentNode => node.nodeType === Node.ELEMENT_NODE);
      for (const root of roots) void translateRoot(root);
    }, 80);
  });
  const app = document.getElementById('root');
  if (app) observer.observe(app, { childList: true, subtree: true });
  return true;
}

export function restoreDocumentEnglish() {
  observer?.disconnect();
  observer = undefined;
  window.clearTimeout(translateTimer);
  for (const [node, original] of textOriginals) if (node.isConnected) node.nodeValue = original;
  for (const [element, attributes] of attributeOriginals) {
    if (!element.isConnected) continue;
    for (const [name, original] of attributes) element.setAttribute(name, original);
  }
  textOriginals.clear();
  attributeOriginals.clear();
  activeTranslator?.destroy?.();
  activeTranslator = undefined;
  document.documentElement.lang = 'en';
  document.documentElement.removeAttribute('data-language');
}

export function spanishReadingCopyUrl(): string {
  return `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(window.location.href)}`;
}
