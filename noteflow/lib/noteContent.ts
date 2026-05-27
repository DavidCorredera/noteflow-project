export const NOTE_DOCUMENT_VERSION = 1;
export const NOTE_INDEX_TOKEN = '[[INDICE]]';

export type NoteSketchPoint = {
  x: number;
  y: number;
};

export type NoteSketchStroke = {
  id: string;
  color: string;
  width: number;
  points: NoteSketchPoint[];
};

export type NoteSketch = {
  id: string;
  title: string;
  strokes: NoteSketchStroke[];
};

export type NoteImage = {
  id: string;
  uri: string;
  width: number;
  height: number;
};

export type NoteDocument = {
  version: number;
  body: string;
  sketches: NoteSketch[];
  images: NoteImage[];
};

type Heading = {
  level: 1 | 2 | 3;
  title: string;
  line: number;
};

const EMPTY_DOCUMENT: NoteDocument = {
  version: NOTE_DOCUMENT_VERSION,
  body: '',
  sketches: [],
  images: [],
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizePoint(point: unknown): NoteSketchPoint | null {
  if (!isObject(point) || typeof point.x !== 'number' || typeof point.y !== 'number') {
    return null;
  }

  return {
    x: Math.max(0, Math.min(1, point.x)),
    y: Math.max(0, Math.min(1, point.y)),
  };
}

function normalizeStroke(stroke: unknown): NoteSketchStroke | null {
  if (!isObject(stroke) || typeof stroke.id !== 'string') {
    return null;
  }

  const points = Array.isArray(stroke.points)
    ? stroke.points.map(normalizePoint).filter(Boolean) as NoteSketchPoint[]
    : [];

  return {
    id: stroke.id,
    color: typeof stroke.color === 'string' ? stroke.color : '#7c3aed',
    width: typeof stroke.width === 'number' ? stroke.width : 3,
    points,
  };
}

function normalizeImage(image: unknown): NoteImage | null {
  if (!isObject(image) || typeof image.id !== 'string' || typeof image.uri !== 'string') {
    return null;
  }
  return {
    id: image.id,
    uri: image.uri,
    width: typeof image.width === 'number' ? image.width : 0,
    height: typeof image.height === 'number' ? image.height : 0,
  };
}

function normalizeSketch(sketch: unknown): NoteSketch | null {
  if (!isObject(sketch) || typeof sketch.id !== 'string') {
    return null;
  }

  const strokes = Array.isArray(sketch.strokes)
    ? sketch.strokes.map(normalizeStroke).filter(Boolean) as NoteSketchStroke[]
    : [];

  return {
    id: sketch.id,
    title: typeof sketch.title === 'string' && sketch.title.trim()
      ? sketch.title.trim()
      : 'Lienzo',
    strokes,
  };
}

export function createNoteEntityId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyNoteDocument(): NoteDocument {
  return { ...EMPTY_DOCUMENT, sketches: [] };
}

export function parseNoteContent(content?: null | string): NoteDocument {
  if (!content) {
    return createEmptyNoteDocument();
  }

  try {
    const parsed = JSON.parse(content);
    if (!isObject(parsed) || typeof parsed.body !== 'string' || !Array.isArray(parsed.sketches)) {
      return {
        version: NOTE_DOCUMENT_VERSION,
        body: content,
        sketches: [],
        images: [],
      };
    }

    return {
      version: typeof parsed.version === 'number' ? parsed.version : NOTE_DOCUMENT_VERSION,
      body: parsed.body,
      sketches: parsed.sketches.map(normalizeSketch).filter(Boolean) as NoteSketch[],
      images: Array.isArray(parsed.images) ? parsed.images.map(normalizeImage).filter(Boolean) as NoteImage[] : [],
    };
  } catch {
    return {
      version: NOTE_DOCUMENT_VERSION,
      body: content,
      sketches: [],
      images: [],
    };
  }
}

export function serializeNoteContent(document: NoteDocument) {
  return JSON.stringify({
    version: NOTE_DOCUMENT_VERSION,
    body: document.body,
    sketches: document.sketches,
    images: document.images,
  });
}

export function extractHeadings(body: string): Heading[] {
  return body
    .split(/\r?\n/)
    .map((line, index) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (!match) return null;

      const title = match[2].trim();
      if (!title) return null;

      return {
        level: match[1].length as 1 | 2 | 3,
        title,
        line: index,
      };
    })
    .filter(Boolean) as Heading[];
}

export function stripMarkdownSyntax(body: string) {
  return body
    .replace(new RegExp(NOTE_INDEX_TOKEN.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'g'), '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*\[(?: |x|X)\]\s+/gm, '')
    .replace(/^\s*>\s+/gm, '')
    .replace(/^---$/gm, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getNotePlainTextPreview(content?: null | string) {
  const document = parseNoteContent(content);
  const plainText = stripMarkdownSyntax(document.body);

  if (plainText) {
    return plainText;
  }

  if (document.sketches.length > 0 && document.images.length > 0) {
    return `${document.sketches.length} lienzo${document.sketches.length === 1 ? '' : 's'} · ${document.images.length} imagen${document.images.length === 1 ? '' : 'es'}`;
  }

  if (document.sketches.length > 0) {
    return `${document.sketches.length} lienzo${document.sketches.length === 1 ? '' : 's'} adjunto${document.sketches.length === 1 ? '' : 's'}`;
  }

  if (document.images.length > 0) {
    return `${document.images.length} imagen${document.images.length === 1 ? '' : 'es'} adjunta${document.images.length === 1 ? '' : 's'}`;
  }

  return '';
}

export function countWords(body: string) {
  const clean = stripMarkdownSyntax(body);
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

export function countCharacters(body: string) {
  return body.replace(/\s+$/g, '').length;
}

export function buildIndexPreview(headings: Heading[]) {
  if (headings.length === 0) {
    return [];
  }

  return headings.map((heading) => ({
    ...heading,
    label: `${'  '.repeat(heading.level - 1)}${heading.title}`,
  }));
}
