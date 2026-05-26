import { Fragment, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../constants/theme';
import { NOTE_INDEX_TOKEN, NoteSketch, buildIndexPreview, extractHeadings } from '../../lib/noteContent';
import SketchCanvas from './SketchCanvas';

interface Props {
  body: string;
  colors: AppColors;
  sketches?: NoteSketch[];
}

function renderInline(text: string, colors: AppColors) {
  const tokenRegex = /(\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|_[^_]+_|\*[^*]+\*)/g;
  const pieces = text.split(tokenRegex).filter(Boolean);

  return pieces.map((piece, index) => {
    let style = styles.paragraphText;
    let value = piece;

    if (piece.startsWith('**') && piece.endsWith('**')) {
      style = styles.boldText;
      value = piece.slice(2, -2);
    } else if (piece.startsWith('~~') && piece.endsWith('~~')) {
      style = styles.strikeText;
      value = piece.slice(2, -2);
    } else if (piece.startsWith('`') && piece.endsWith('`')) {
      style = styles.inlineCodeText;
      value = piece.slice(1, -1);
    } else if ((piece.startsWith('_') && piece.endsWith('_')) || (piece.startsWith('*') && piece.endsWith('*'))) {
      style = styles.italicText;
      value = piece.slice(1, -1);
    }

    return (
      <Text
        key={`${piece}-${index}`}
        style={[
          style,
          style === styles.inlineCodeText
            ? { color: colors.primary, backgroundColor: colors.borderLight }
            : { color: colors.text },
        ]}
      >
        {value}
      </Text>
    );
  });
}

function renderIndexBlock(body: string, colors: AppColors) {
  const headings = buildIndexPreview(extractHeadings(body));

  return (
    <View style={[styles.indexBlock, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
      <Text style={[styles.indexTitle, { color: colors.text }]}>Indice</Text>
      {headings.length > 0 ? (
        headings.map((heading) => (
          <Text key={`${heading.line}-${heading.title}`} style={[styles.indexItem, { color: colors.textSecondary }]}>
            {heading.label}
          </Text>
        ))
      ) : (
        <Text style={[styles.indexItem, { color: colors.textTertiary }]}>Anade encabezados H1, H2 o H3 para generar el indice.</Text>
      )}
    </View>
  );
}

export default function NoteMarkdown({ body, colors, sketches = [] }: Props) {
  const lines = body.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  const fencedLines: string[] = [];
  let inCodeBlock = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push(
          <View key={`code-${index}`} style={[styles.codeBlock, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
            <Text style={[styles.codeText, { color: colors.text }]}>{fencedLines.join('\n')}</Text>
          </View>
        );
        fencedLines.length = 0;
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      fencedLines.push(line);
      return;
    }

    if (!trimmed) {
      blocks.push(<View key={`space-${index}`} style={styles.spaceBlock} />);
      return;
    }

    if (trimmed === NOTE_INDEX_TOKEN) {
      blocks.push(<Fragment key={`index-${index}`}>{renderIndexBlock(body, colors)}</Fragment>);
      return;
    }

    if (trimmed === '---') {
      blocks.push(<View key={`divider-${index}`} style={[styles.blockDivider, { backgroundColor: colors.border }]} />);
      return;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      blocks.push(
        <Text
          key={`heading-${index}`}
          style={[
            level === 1 ? styles.headingOne : level === 2 ? styles.headingTwo : styles.headingThree,
            { color: colors.text },
          ]}
        >
          {headingText}
        </Text>
      );
      return;
    }

    const checkboxMatch = line.match(/^\[( |x|X)\]\s+(.+)$/);
    if (checkboxMatch) {
      const checked = checkboxMatch[1].toLowerCase() === 'x';
      blocks.push(
        <View key={`checkbox-${index}`} style={styles.rowBlock}>
          <Text style={[styles.checkboxIcon, { color: checked ? colors.success : colors.textTertiary }]}>
            {checked ? '[x]' : '[ ]'}
          </Text>
          <Text
            style={[
              styles.paragraph,
              { color: checked ? colors.textTertiary : colors.text },
              checked ? styles.struckParagraph : null,
            ]}
          >
            {renderInline(checkboxMatch[2], colors)}
          </Text>
        </View>
      );
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      blocks.push(
        <View key={`bullet-${index}`} style={styles.rowBlock}>
          <Text style={[styles.bulletIcon, { color: colors.primary }]}>{'\u2022'}</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>{renderInline(bulletMatch[1], colors)}</Text>
        </View>
      );
      return;
    }

    const numberMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberMatch) {
      blocks.push(
        <View key={`number-${index}`} style={styles.rowBlock}>
          <Text style={[styles.numberIcon, { color: colors.primary }]}>{numberMatch[1]}.</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>{renderInline(numberMatch[2], colors)}</Text>
        </View>
      );
      return;
    }

    const quoteMatch = line.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      blocks.push(
        <View key={`quote-${index}`} style={[styles.quoteBlock, { borderLeftColor: colors.primary, backgroundColor: colors.surfaceLight }]}>
          <Text style={[styles.quoteText, { color: colors.textSecondary }]}>{renderInline(quoteMatch[1], colors)}</Text>
        </View>
      );
      return;
    }

    blocks.push(
      <Text key={`paragraph-${index}`} style={[styles.paragraph, { color: colors.text }]}>
        {renderInline(line, colors)}
      </Text>
    );
  });

  if (inCodeBlock && fencedLines.length > 0) {
    blocks.push(
      <View key="code-trailing" style={[styles.codeBlock, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
        <Text style={[styles.codeText, { color: colors.text }]}>{fencedLines.join('\n')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {blocks.length > 0 ? blocks : <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No hay contenido todavia.</Text>}

      {sketches.length > 0 ? (
        <View style={styles.sketchSection}>
          <Text style={[styles.sketchTitle, { color: colors.text }]}>Lienzos</Text>
          {sketches.map((sketch) => (
            <View key={sketch.id} style={styles.sketchCard}>
              <Text style={[styles.sketchLabel, { color: colors.textSecondary }]}>{sketch.title}</Text>
              <SketchCanvas colors={colors} readOnly sketch={sketch} />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  headingOne: { fontSize: 28, fontWeight: '800', marginTop: 12, marginBottom: 4 },
  headingTwo: { fontSize: 22, fontWeight: '700', marginTop: 10, marginBottom: 4 },
  headingThree: { fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 2 },
  paragraph: { fontSize: 16, lineHeight: 28 },
  paragraphText: { fontSize: 16, lineHeight: 28 },
  boldText: { fontSize: 16, lineHeight: 28, fontWeight: '800' },
  italicText: { fontSize: 16, lineHeight: 28, fontStyle: 'italic' },
  strikeText: { fontSize: 16, lineHeight: 28, textDecorationLine: 'line-through' },
  inlineCodeText: { fontSize: 15, lineHeight: 26, fontWeight: '700' },
  rowBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletIcon: { fontSize: 18, marginTop: 4, fontWeight: '800' },
  numberIcon: { fontSize: 16, marginTop: 3, width: 26, fontWeight: '700' },
  checkboxIcon: { fontSize: 15, marginTop: 4, width: 30, fontWeight: '700' },
  struckParagraph: { textDecorationLine: 'line-through' },
  quoteBlock: { borderLeftWidth: 3, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14 },
  quoteText: { fontSize: 15, lineHeight: 26, fontStyle: 'italic' },
  codeBlock: { borderWidth: 1, borderRadius: 16, padding: 14 },
  codeText: { fontSize: 14, lineHeight: 22, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
  blockDivider: { height: 1, marginVertical: 6 },
  indexBlock: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  indexTitle: { fontSize: 15, fontWeight: '800' },
  indexItem: { fontSize: 14, lineHeight: 22 },
  spaceBlock: { height: 4 },
  emptyText: { fontSize: 15, lineHeight: 24 },
  sketchSection: { marginTop: 18, gap: 14 },
  sketchTitle: { fontSize: 17, fontWeight: '800' },
  sketchCard: { gap: 8 },
  sketchLabel: { fontSize: 13, fontWeight: '600' },
});
