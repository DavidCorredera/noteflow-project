import React, { useMemo, useRef, useState } from 'react';
import { Alert, Animated, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppColors } from '../../constants/theme';
import { useLocaleStore } from '../../store/localeStore';
import { t } from '../../i18n';
import ImageViewer from '../ImageViewer';
import { uploadImage } from '../../lib/upload';
import {
  NOTE_INDEX_TOKEN,
  NoteImage,
  NoteSketch,
  NoteSketchStroke,
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
  onImagesChange?: (images: NoteImage[]) => void;
  onDrawStart?: () => void;
  onDrawEnd?: () => void;
  placeholder?: string;
  sketches: NoteSketch[];
  images?: NoteImage[];
}

const BRUSH_COLORS = ['#000000', '#ffffff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#6b7280'];
const BRUSH_SIZES = [2.5, 4, 6];
const TOOLBAR_HEIGHT = 40;

type ToolState = {
  color: string;
  width: number;
  eraserWidth: number;
};

const DEFAULT_TOOL: ToolState = { color: BRUSH_COLORS[0], width: BRUSH_SIZES[1], eraserWidth: BRUSH_SIZES[1] };

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type ToolItem = {
  icon?: IoniconName;
  label?: string;
  onPress: () => void;
};

type ToolGroup = ToolItem[];

function replaceRange(text: string, selection: SelectionRange, replacement: string) {
  return `${text.slice(0, selection.start)}${replacement}${text.slice(selection.end)}`;
}

export default function NoteComposer({
  body,
  colors,
  onBodyChange,
  onSketchesChange,
  onImagesChange,
  onDrawStart,
  onDrawEnd,
  placeholder,
  sketches,
  images = [],
}: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [sketchTools, setSketchTools] = useState<Record<string, ToolState>>({});
  const [activeToolTab, setActiveToolTab] = useState<Record<string, 'color' | 'width' | 'eraser' | null>>({});
  const [panelHeights, setPanelHeights] = useState<Record<string, number>>({});
  const [editingSketchTitle, setEditingSketchTitle] = useState<string | null>(null);
  const panelAnimsRef = useRef<Record<string, Animated.Value>>({});
  const titleInputRefs = useRef<Record<string, TextInput>>({});
  const redoStacks = useRef<Record<string, NoteSketchStroke[]>>({});
  const inputRef = useRef<TextInput>(null);
  const selectionRef = useRef<SelectionRange>({ start: 0, end: 0 });

  const headings = useMemo(() => buildIndexPreview(extractHeadings(body)), [body]);
  const words = useMemo(() => countWords(body), [body]);
  const characters = useMemo(() => countCharacters(body), [body]);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const actualPlaceholder = placeholder || t(locale, 'notas.placeholder');

  const syncSelection = (selection: SelectionRange) => {
    selectionRef.current = selection;
    requestAnimationFrame(() => {
      inputRef.current?.setNativeProps({ selection });
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
        title: '',
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

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t(locale, 'notas.permissionTitle'), t(locale, 'notas.permissionMsg'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.4,
    });
    if (result.canceled || result.assets.length === 0) return;
    await handleImageResult(result.assets[0]);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t(locale, 'notas.permissionTitle'), t(locale, 'notas.permissionMsg'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.4,
    });
    if (result.canceled || result.assets.length === 0) return;
    await handleImageResult(result.assets[0]);
  };

  const handleImageResult = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploadingImage(true);
      const publicUrl = await uploadImage(asset.uri);
      const img: NoteImage = {
        id: createNoteEntityId('img'),
        uri: publicUrl,
        width: asset.width || 0,
        height: asset.height || 0,
      };
      onImagesChange?.([...images, img]);
    } catch {
      Alert.alert(t(locale, 'common.error'), t(locale, 'notas.imageError'));
    } finally {
      setUploadingImage(false);
    }
  };

  const showImagePicker = () => {
    Alert.alert('Añadir imagen', 'Elige una opción', [
      { text: 'Galería', onPress: pickImage },
      { text: 'Cámara', onPress: takePhoto },
      { text: t(locale, 'common.cancel'), style: 'cancel' },
    ]);
  };

  const removeImage = (imageId: string) => {
    onImagesChange?.(images.filter((img) => img.id !== imageId));
  };

  const toolGroups: ToolGroup[] = [
    [
      { label: 'B', onPress: () => wrapSelection('**') },
      { label: 'I', onPress: () => wrapSelection('*') },
      { label: 'S', onPress: () => wrapSelection('~~') },
    ],
    [
      { label: 'H1', onPress: () => prefixSelectedLines('# ') },
      { label: 'H2', onPress: () => prefixSelectedLines('## ') },
    ],
    [
      { icon: 'list-outline', onPress: () => prefixSelectedLines('- ') },
      { label: '1.', onPress: () => prefixSelectedLines((index) => `${index + 1}. `) },
      { icon: 'checkbox-outline', onPress: () => prefixSelectedLines('[ ] ') },
    ],
    [
      { icon: 'chatbubble-ellipses-outline', onPress: () => prefixSelectedLines('> ') },
      { icon: 'code-outline', onPress: () => insertStandaloneBlock('```\nCodigo\n```') },
    ],
    [
      { icon: 'list-outline', onPress: () => insertStandaloneBlock(NOTE_INDEX_TOKEN) },
      { icon: 'remove-outline', onPress: () => insertStandaloneBlock('---') },
      { icon: 'document-text-outline', onPress: insertTemplate },
    ],
    [
      { icon: 'image-outline', label: '+', onPress: showImagePicker },
      { icon: 'color-palette-outline', label: '+', onPress: addSketch },
    ],
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.segmented, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setMode('preview')}
          style={[styles.segmentButton, mode === 'preview' ? { backgroundColor: colors.primary } : null]}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, { color: mode === 'preview' ? '#FFFFFF' : colors.textSecondary }]}>{t(locale, 'composer.view')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('edit')}
          style={[styles.segmentButton, mode === 'edit' ? { backgroundColor: colors.primary } : null]}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, { color: mode === 'edit' ? '#FFFFFF' : colors.textSecondary }]}>{t(locale, 'composer.edit')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{characters}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t(locale, 'notas.characters')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{words}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t(locale, 'notas.words')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{headings.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t(locale, 'notas.sections')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{sketches.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t(locale, 'notas.sketches')}</Text>
          </View>
        </View>
      </View>

      {mode === 'edit' ? (
        <>
          <View style={styles.toolbarWrap}>
            {toolGroups.map((group, gi) => (
              <React.Fragment key={gi}>
                {gi > 0 ? <View style={[styles.toolbarSep, { backgroundColor: colors.border }]} /> : null}
                <View style={styles.toolbarGroup}>
                  {group.map((tool, ti) => (
                    <TouchableOpacity
                      key={ti}
                      onPress={tool.onPress}
                      style={[styles.toolWrapBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
                      activeOpacity={0.82}
                    >
                      {tool.icon ? (
                        <View style={styles.toolWrapIconRow}>
                          <Ionicons name={tool.icon} size={15} color={colors.text} />
                          {tool.label ? <Text style={[styles.toolWrapLabel, { color: colors.textSecondary }]}>{tool.label}</Text> : null}
                        </View>
                      ) : (
                        <Text style={[styles.toolWrapLabel, { color: colors.text }]}>{tool.label}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </React.Fragment>
            ))}
          </View>

          {headings.length > 0 ? (
            <View style={[styles.outlineCard, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <Text style={[styles.outlineTitle, { color: colors.text }]}>{t(locale, 'notas.outlineTitle')}</Text>
              {headings.map((heading) => (
                <Text key={`${heading.line}-${heading.title}`} style={[styles.outlineItem, { color: colors.textSecondary }]}>
                  {heading.label}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={[styles.editorShell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput autoCapitalize="none"
              ref={inputRef}
              multiline
              scrollEnabled={true}
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              style={[styles.editorInput, { color: colors.text }]}
              value={body}
              onChangeText={onBodyChange}
              onSelectionChange={(event) => {
                selectionRef.current = event.nativeEvent.selection;
              }}
              placeholder={actualPlaceholder}
              placeholderTextColor={colors.textTertiary}
              textAlignVertical="top"
            />
          </View>

          {images.length > 0 ? (
            <View style={styles.imageSection}>
              <Text style={[styles.imageSectionTitle, { color: colors.text }]}>{t(locale, 'notas.imagesTitle')}</Text>
              <View style={{ gap: 10 }}>
                {images.map((img) => (
                  <View key={img.id} style={[styles.imageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TouchableOpacity onPress={() => setViewerUri(img.uri)} activeOpacity={0.85}>
                      <Image
                        source={{ uri: img.uri }}
                        style={{ width: '100%', height: 200, borderRadius: 12 }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeImage(img.id)}
                      style={styles.imageDeleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {sketches.map((sketch, index) => {
            const tool = sketchTools[sketch.id] ?? DEFAULT_TOOL;
            const tab = activeToolTab[sketch.id] ?? null;
            const eraser = tab === 'eraser';
            const panelAnim = panelAnimsRef.current[sketch.id] ?? (panelAnimsRef.current[sketch.id] = new Animated.Value(0));
            const panelHeight = panelHeights[sketch.id] ?? 0;

            const setTool = (partial: Partial<ToolState>) => {
              setSketchTools((prev) => ({ ...prev, [sketch.id]: { ...tool, ...partial } }));
            };

            const toggleTab = (next: 'color' | 'width' | 'eraser') => {
              const opening = tab !== next;
              Animated.timing(panelAnim, {
                toValue: opening ? 1 : 0,
                duration: 180,
                useNativeDriver: true,
              }).start();
              setActiveToolTab((prev) => ({ ...prev, [sketch.id]: opening ? next : null }));
            };

            const handleUndo = () => {
              if (sketch.strokes.length === 0) return;
              const removed = sketch.strokes[sketch.strokes.length - 1];
              redoStacks.current[sketch.id] = [...(redoStacks.current[sketch.id] || []), removed];
              updateSketch(sketch.id, (c) => ({ ...c, strokes: c.strokes.slice(0, -1) }));
            };

            const handleRedo = () => {
              const stack = redoStacks.current[sketch.id] || [];
              if (stack.length === 0) return;
              const restored = stack[stack.length - 1];
              redoStacks.current[sketch.id] = stack.slice(0, -1);
              updateSketch(sketch.id, (c) => ({ ...c, strokes: [...c.strokes, restored] }));
            };

            const canUndo = sketch.strokes.length > 0;
            const canRedo = (redoStacks.current[sketch.id] || []).length > 0;

            const openActions = () =>
              Alert.alert(sketch.title || `${t(locale, 'composer.sketch')} ${index + 1}`, undefined, [
                {
                  text: t(locale, 'sketch.editName'),
                  onPress: () => {
                    setEditingSketchTitle(sketch.id);
                    setTimeout(() => titleInputRefs.current[sketch.id]?.focus(), 100);
                  },
                },
                {
                  text: t(locale, 'sketch.share'),
                  onPress: () => {},
                },
                { text: t(locale, 'sketch.delete'), style: 'destructive', onPress: () => removeSketch(sketch.id) },
                { text: t(locale, 'sketch.cancel'), style: 'cancel' },
              ]);

            return (
              <View key={sketch.id} style={[styles.sketchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sketchCardTop}>
                    <TextInput autoCapitalize="none" autoCorrect={false}
                      ref={(el) => {
                      if (el) titleInputRefs.current[sketch.id] = el;
                      }}
                    style={[styles.sketchCardTitle, { color: colors.text }]}
                    value={sketch.title || `${t(locale, 'composer.sketch')} ${index + 1}`}
                    onChangeText={(newTitle) => updateSketch(sketch.id, (current) => ({ ...current, title: newTitle }))}
                    onFocus={() => setEditingSketchTitle(sketch.id)}
                    onBlur={() => setEditingSketchTitle(null)}
                    placeholder={t(locale, 'composer.sketchName')}
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TouchableOpacity onPress={handleUndo} disabled={!canUndo} style={[styles.headerBtn, !canUndo && { opacity: 0.3 }]} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Ionicons name="arrow-undo" size={17} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleRedo} disabled={!canRedo} style={[styles.headerBtn, !canRedo && { opacity: 0.3 }]} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Ionicons name="arrow-redo" size={17} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={openActions} style={styles.sketchMenuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={[styles.sketchMenuDots, { color: colors.textTertiary }]}>{'\u22EE'}</Text>
                  </TouchableOpacity>
                </View>

                <SketchCanvas
                  colors={colors}
                  sketch={sketch}
                  strokeColor={tool.color}
                  strokeWidth={eraser ? tool.eraserWidth : tool.width}
                  eraser={eraser}
                  onDrawStart={onDrawStart}
                  onDrawEnd={onDrawEnd}
                  onChange={(nextSketch) => {
                    redoStacks.current[sketch.id] = [];
                    updateSketch(sketch.id, () => nextSketch);
                  }}
                />

                <View style={styles.toolbarWrapper}>
                  {/* Overlay panel */}
                  <Animated.View
                    style={[
                      styles.toolOverlay,
                      {
                        opacity: panelAnim,
                        transform: [
                          {
                            translateY: panelAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [panelHeight || 100, 0],
                            }),
                          },
                        ],
                        pointerEvents: tab ? 'auto' : 'none',
                        bottom: TOOLBAR_HEIGHT,
                      },
                    ]}
                    onLayout={(e) => {
                      const h = e.nativeEvent.layout.height;
                      if ((panelHeights[sketch.id] ?? 0) !== h) {
                        setPanelHeights((prev) => ({ ...prev, [sketch.id]: h }));
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.toolPanel,
                        { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                      ]}
                    >
                      {tab === 'color' ? (
                        <View style={styles.colorRow}>
                          {BRUSH_COLORS.map((color) => (
                            <TouchableOpacity
                              key={color}
                              onPress={() => setTool({ color })}
                              style={[styles.colorDot, { backgroundColor: color, borderColor: tool.color === color ? colors.text : 'transparent' }]}
                              activeOpacity={0.85}
                            />
                          ))}
                        </View>
                      ) : tab === 'width' ? (
                        <View style={styles.widthRow}>
                          {BRUSH_SIZES.map((width, i) => {
                            const dotSize = [10, 18, 26][i];
                            return (
                              <TouchableOpacity
                                key={width}
                                onPress={() => setTool({ width })}
                                style={styles.widthDotBtn}
                                activeOpacity={0.85}
                              >
                                <View
                                  style={[
                                    styles.widthDot,
                                    {
                                      width: dotSize,
                                      height: dotSize,
                                      borderRadius: dotSize / 2,
                                      backgroundColor: tool.width === width ? colors.primary : colors.textTertiary + '60',
                                    },
                                  ]}
                                />
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                          {BRUSH_SIZES.map((width, i) => {
                            const dotSize = [10, 18, 26][i];
                            return (
                              <TouchableOpacity
                                key={width}
                                onPress={() => setTool({ eraserWidth: width })}
                                style={styles.widthDotBtn}
                                activeOpacity={0.85}
                              >
                                <View
                                  style={[
                                    styles.widthDot,
                                    {
                                      width: dotSize,
                                      height: dotSize,
                                      borderRadius: dotSize / 2,
                                      backgroundColor: tool.eraserWidth === width ? colors.warning : colors.textTertiary + '60',
                                    },
                                  ]}
                                />
                              </TouchableOpacity>
                            );
                          })}
                          <View style={{ width: 1, height: 20, backgroundColor: colors.border }} />
                          <TouchableOpacity
                            onPress={() => updateSketch(sketch.id, (c) => ({ ...c, strokes: [] }))}
                            style={{ paddingHorizontal: 4 }}
                            activeOpacity={0.7}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.error }}>{t(locale, 'sketch.clear')}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </Animated.View>

                  {/* Toolbar */}
                  <View style={[styles.toolbar, { borderTopColor: colors.border }]}>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly' }}>
                      <TouchableOpacity
                        onPress={() => toggleTab('color')}
                        style={[styles.toolbarBtn, tab === 'color' && { backgroundColor: colors.primaryLight + '30' }]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.toolbarBtnText, { color: tab === 'color' ? colors.primary : colors.textSecondary }]}>{t(locale, 'sketch.color')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => toggleTab('width')}
                        style={[styles.toolbarBtn, tab === 'width' && { backgroundColor: colors.primaryLight + '30' }]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.toolbarBtnText, { color: tab === 'width' ? colors.primary : colors.textSecondary }]}>{t(locale, 'sketch.stroke')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => toggleTab('eraser')}
                        style={[styles.toolbarBtn, eraser && { backgroundColor: colors.warning + '25' }]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.toolbarBtnText, { color: eraser ? colors.warning : colors.textSecondary }]}>{t(locale, 'sketch.eraser')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      ) : (
        <View style={[styles.previewShell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <NoteMarkdown body={body} colors={colors} sketches={sketches} images={images} />
        </View>
      )}
      {viewerUri && (
        <ImageViewer visible={!!viewerUri} uri={viewerUri} onClose={() => setViewerUri(null)} />
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
  statsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  toolbarWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  toolbarGroup: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  toolWrapBtn: {
    borderWidth: 1,
    borderRadius: 10,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolWrapIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  toolWrapLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: -1,
  },
  toolbarSep: {
    width: 1,
    height: 22,
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
    minHeight: 200,
    maxHeight: 500,
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
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  widthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  widthDotBtn: {
    padding: 6,
  },
  widthDot: {
    borderWidth: 0,
  },
  sketchCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  sketchCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sketchCardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  sketchMenuBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sketchMenuDots: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarWrapper: {
    position: 'relative',
  },
  toolOverlay: {
    position: 'absolute',
    left: -16,
    right: -16,
    paddingHorizontal: 16,
    paddingBottom: 4,
    zIndex: 10,
  },
  toolPanel: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TOOLBAR_HEIGHT,
    borderTopWidth: 1,
    gap: 2,
  },
  toolbarBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  imageSection: {
    gap: 14,
  },
  imageSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  imageCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  imageDeleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
});
