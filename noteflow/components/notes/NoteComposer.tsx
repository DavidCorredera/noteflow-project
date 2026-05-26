import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../../constants/theme';
import {
  NOTE_INDEX_TOKEN,
  NoteSketch,
  buildIndexPreview,
  countCharacters,
  countWords,
  createNoteEntityId,
  extractHeadings,
} from '../../lib/noteContent';
import NoteMarkdown from './NoteMarkdown';
import SketchCanvas from './SketchCanvas';

type SelectionRange = {
  start: number;
  end: number;
};

interface Props {
  body: string;
  colors: AppColors;
  onBodyChange: (body: string) => void;
  onSketchesChange: (sketches: NoteSketch[]) => void;
  placeholder?: string;
  sketches: NoteSketch[];
}

const BRUSH_COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9'];
const BRUSH_SIZES = [2.5, 4, 6];

type ToolAction = {
  label: string;
  onPress: () => void;
};

function replaceRange(text: string, selection: SelectionRange, replacement: string) {
  return `${text.slice(0, selection.start)}${replacement}${text.slice(selection.end)}`;
}

export default function NoteComposer({
  body,
  colors,
  onBodyChange,
  onSketchesChange,
  placeholder = 'Empieza a escribir...',
  sketches,
}: Props) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [brushColor, setBrushColor] = useState(BRUSH_COLORS[0]);
  const [brushWidth, setBrushWidth] = useState(BRUSH_SIZES[1]);
  const inputRef = useRef<TextInput>(null);
  const selectionRef = useRef<SelectionRange>({ start: 0, end: 0 });

  const headings = useMemo(() => buildIndexPreview(extractHeadings(body)), [body]);
  const words = useMemo(() => countWords(body), [body]);
  const characters = useMemo(() => countCharacters(body), [body]);

  const syncSelection = (selection: SelectionRange) => {
    selectionRef.current = selection;
    requestAnimationFrame(() => {
      inputRef.current?.setNativeProps({ selection });
      inputRef.current?.focus();
    });
  };

  const applyBodyChange = (nextBody: string, nextSelection?: SelectionRange) => {
    onBodyChange(nextBody);
    if (nextSelection) {
      syncSelection(nextSelection);
    }
  };

  const getSelection = () => {
    const maxLength = body.length;
    return {
      start: Math.max(0, Math.min(maxLength, selectionRef.current.start)),
      end: Math.max(0, Math.min(maxLength, selectionRef.current.end)),
    };
  };

  const wrapSelection = (prefix: string, suffix = prefix, placeholderText = 'texto') => {
    const selection = getSelection();
    const hasSelection = selection.end > selection.start;
    const selectedText = body.slice(selection.start, selection.end);
    const innerText = hasSelection ? selectedText : placeholderText;
    const replacement = `${prefix}${innerText}${suffix}`;
    const nextBody = replaceRange(body, selection, replacement);
    const innerStart = selection.start + prefix.length;
    const innerEnd = innerStart + innerText.length;

    applyBodyChange(nextBody, { start: innerStart, end: innerEnd });
  };

  const prefixSelectedLines = (prefixFactory: string | ((index: number) => string)) => {
    const selection = getSelection();
    const blockStart = body.lastIndexOf('\n', Math.max(0, selection.start - 1)) + 1;
    const nextBreak = body.indexOf('\n', selection.end);
    const blockEnd = nextBreak === -1 ? body.length : nextBreak;
    const block = body.slice(blockStart, blockEnd);
    const lines = block.split('\n');
    const prefixed = lines
      .map((line, index) => {
        const prefix = typeof prefixFactory === 'function' ? prefixFactory(index) : prefixFactory;
        return `${prefix}${line}`;
      })
      .join('\n');
    const nextBody = `${body.slice(0, blockStart)}${prefixed}${body.slice(blockEnd)}`;

    applyBodyChange(nextBody, {
      start: blockStart,
      end: blockStart + prefixed.length,
    });
  };

  const insertStandaloneBlock = (block: string) => {
    const selection = getSelection();
    const before = body.slice(0, selection.start);
    const after = body.slice(selection.end);
    const leading = before.length > 0 && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    const trailing = after.length > 0 && !after.startsWith('\n\n') ? (after.startsWith('\n') ? '\n' : '\n\n') : '';
    const replacement = `${leading}${block}${trailing}`;
    const nextBody = replaceRange(body, selection, replacement);
    const cursor = selection.start + replacement.length;

    applyBodyChange(nextBody, { start: cursor, end: cursor });
  };

  const insertTemplate = () => {
    insertStandaloneBlock('# Resumen\n\n## Ideas clave\n\n- \n\n## Siguientes pasos\n\n- \n');
  };

  const addSketch = () => {
    onSketchesChange([
      ...sketches,
      {
        id: createNoteEntityId('sketch'),
        title: `Lienzo ${sketches.length + 1}`,
        strokes: [],
      },
    ]);
  };

  const updateSketch = (sketchId: string, updater: (current: NoteSketch) => NoteSketch) => {
    onSketchesChange(sketches.map((sketch) => (sketch.id === sketchId ? updater(sketch) : sketch)));
  };

  const removeSketch = (sketchId: string) => {
    onSketchesChange(sketches.filter((sketch) => sketch.id !== sketchId));
  };

  const toolActions: ToolAction[] = [
    { label: 'B', onPress: () => wrapSelection('**') },
    { label: 'I', onPress: () => wrapSelection('*') },
    { label: 'S', onPress: () => wrapSelection('~~') },
    { label: 'H1', onPress: () => prefixSelectedLines('# ') },
    { label: 'H2', onPress: () => prefixSelectedLines('## ') },
    { label: '\u2022', onPress: () => prefixSelectedLines('- ') },
    { label: '1.', onPress: () => prefixSelectedLines((index) => `${index + 1}. `) },
    { label: '[ ]', onPress: () => prefixSelectedLines('[ ] ') },
    { label: '>', onPress: () => prefixSelectedLines('> ') },
    { label: '</>', onPress: () => insertStandaloneBlock('```\nCodigo\n```') },
    { label: 'TOC', onPress: () => insertStandaloneBlock(NOTE_INDEX_TOKEN) },
    { label: '---', onPress: () => insertStandaloneBlock('---') },
    { label: 'Tpl', onPress: insertTemplate },
    { label: '+Lienzo', onPress: addSketch },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.segmented, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setMode('edit')}
          style={[styles.segmentButton, mode === 'edit' ? { backgroundColor: colors.primary } : null]}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, { color: mode === 'edit' ? '#FFFFFF' : colors.textSecondary }]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('preview')}
          style={[styles.segmentButton, mode === 'preview' ? { backgroundColor: colors.primary } : null]}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, { color: mode === 'preview' ? '#FFFFFF' : colors.textSecondary }]}>Vista</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statPill, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{words} palabras</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{characters} caracteres</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{headings.length} secciones</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{sketches.length} lienzos</Text>
        </View>
      </View>

      {mode === 'edit' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarScroll}>
            {toolActions.map((tool) => (
              <TouchableOpacity
                key={tool.label}
                onPress={tool.onPress}
                style={[styles.toolButton, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
                activeOpacity={0.82}
              >
                <Text style={[styles.toolText, { color: colors.text }]}>{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {headings.length > 0 ? (
            <View style={[styles.outlineCard, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <Text style={[styles.outlineTitle, { color: colors.text }]}>Indice rapido</Text>
              {headings.map((heading) => (
                <Text key={`${heading.line}-${heading.title}`} style={[styles.outlineItem, { color: colors.textSecondary }]}>
                  {heading.label}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={[styles.editorShell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              ref={inputRef}
              multiline
              scrollEnabled={false}
              style={[styles.editorInput, { color: colors.text }]}
              value={body}
              onChangeText={onBodyChange}
              onSelectionChange={(event) => {
                selectionRef.current = event.nativeEvent.selection;
              }}
              placeholder={placeholder}
              placeholderTextColor={colors.textTertiary}
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.sketchTools, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
            <View style={styles.sketchToolsHeader}>
              <Text style={[styles.sketchToolsTitle, { color: colors.text }]}>Lienzos</Text>
              <TouchableOpacity onPress={addSketch} style={[styles.inlineAddButton, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
                <Text style={styles.inlineAddButtonText}>Nuevo</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.toolCaption, { color: colors.textTertiary }]}>Color</Text>
            <View style={styles.colorRow}>
              {BRUSH_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setBrushColor(color)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color, borderColor: brushColor === color ? colors.text : 'transparent' },
                  ]}
                  activeOpacity={0.85}
                />
              ))}
            </View>

            <Text style={[styles.toolCaption, { color: colors.textTertiary }]}>Trazo</Text>
            <View style={styles.widthRow}>
              {BRUSH_SIZES.map((width, index) => (
                <TouchableOpacity
                  key={width}
                  onPress={() => setBrushWidth(width)}
                  style={[
                    styles.widthChip,
                    {
                      backgroundColor: brushWidth === width ? colors.primary : colors.surface,
                      borderColor: brushWidth === width ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.widthChipText, { color: brushWidth === width ? '#FFFFFF' : colors.textSecondary }]}>
                    {index === 0 ? 'Fino' : index === 1 ? 'Medio' : 'Grueso'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {sketches.map((sketch, index) => (
            <View key={sketch.id} style={[styles.sketchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sketchCardHeader}>
                <Text style={[styles.sketchCardTitle, { color: colors.text }]}>{sketch.title || `Lienzo ${index + 1}`}</Text>
                <View style={styles.sketchActions}>
                  <TouchableOpacity
                    onPress={() => updateSketch(sketch.id, (current) => ({ ...current, strokes: current.strokes.slice(0, -1) }))}
                    style={[styles.secondaryChip, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.secondaryChipText, { color: colors.textSecondary }]}>Deshacer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateSketch(sketch.id, (current) => ({ ...current, strokes: [] }))}
                    style={[styles.secondaryChip, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.secondaryChipText, { color: colors.textSecondary }]}>Limpiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeSketch(sketch.id)}
                    style={[styles.secondaryChip, { borderColor: colors.error + '40', backgroundColor: colors.deleteBg }]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.secondaryChipText, { color: colors.error }]}>Quitar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <SketchCanvas
                colors={colors}
                sketch={sketch}
                strokeColor={brushColor}
                strokeWidth={brushWidth}
                onChange={(nextSketch) => updateSketch(sketch.id, () => nextSketch)}
              />
            </View>
          ))}
        </>
      ) : (
        <View style={[styles.previewShell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <NoteMarkdown body={body} colors={colors} sketches={sketches} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 18 },
  segmented: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toolbarScroll: {
    gap: 10,
    paddingRight: 8,
  },
  toolButton: {
    borderWidth: 1,
    borderRadius: 14,
    minWidth: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolText: {
    fontSize: 13,
    fontWeight: '700',
  },
  outlineCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  outlineTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  outlineItem: {
    fontSize: 14,
    lineHeight: 22,
  },
  editorShell: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  editorInput: {
    minHeight: 360,
    fontSize: 16,
    lineHeight: 28,
    paddingVertical: 0,
  },
  previewShell: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  sketchTools: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  sketchToolsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sketchToolsTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inlineAddButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  inlineAddButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toolCaption: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  widthRow: {
    flexDirection: 'row',
    gap: 8,
  },
  widthChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  widthChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sketchCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 14,
  },
  sketchCardHeader: {
    gap: 10,
  },
  sketchCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sketchActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  secondaryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  secondaryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
