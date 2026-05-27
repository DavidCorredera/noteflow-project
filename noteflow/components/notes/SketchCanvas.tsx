import { useMemo, useRef, useState } from 'react';
import { Keyboard, PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppColors } from '../../constants/theme';
import { NoteSketch, NoteSketchPoint, NoteSketchStroke, createNoteEntityId } from '../../lib/noteContent';

interface Props {
  colors: AppColors;
  readOnly?: boolean;
  sketch: NoteSketch;
  strokeColor?: string;
  strokeWidth?: number;
  eraser?: boolean;
  onDrawStart?: () => void;
  onDrawEnd?: () => void;
  onChange?: (nextSketch: NoteSketch) => void;
}

const CANVAS_HEIGHT = 300;

function buildPath(points: NoteSketchPoint[], width: number, height: number) {
  return points
    .map((point, index) => {
      const x = point.x * width;
      const y = point.y * height;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function renderSinglePoint(point: NoteSketchPoint, width: number, height: number) {
  return {
    cx: point.x * width,
    cy: point.y * height,
  };
}

export default function SketchCanvas({
  colors,
  readOnly = false,
  sketch,
  strokeColor = colors.primary,
  strokeWidth = 3,
  eraser = false,
  onDrawStart,
  onDrawEnd,
  onChange,
}: Props) {
  const [canvasWidth, setCanvasWidth] = useState(1);
  const [draftPoints, setDraftPoints] = useState<NoteSketchPoint[]>([]);
  const lastPointRef = useRef<NoteSketchPoint | null>(null);

  const effectiveWidth = eraser ? Math.max(strokeWidth * 1.5, 10) : strokeWidth;
  const effectiveColor = eraser ? colors.surface : strokeColor;

  const commitStroke = () => {
    onDrawEnd?.();
    if (readOnly || draftPoints.length === 0 || !onChange) {
      setDraftPoints([]);
      return;
    }

    const nextStroke: NoteSketchStroke = {
      id: createNoteEntityId('stroke'),
      color: effectiveColor,
      width: effectiveWidth,
      points: draftPoints,
    };

    onChange({
      ...sketch,
      strokes: [...sketch.strokes, nextStroke],
    });
    setDraftPoints([]);
    lastPointRef.current = null;
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !readOnly,
        onMoveShouldSetPanResponder: () => !readOnly,
        onPanResponderGrant: (event) => {
          if (readOnly) return;
          Keyboard.dismiss();
          onDrawStart?.();
          const nextPoint = {
            x: Math.max(0, Math.min(1, event.nativeEvent.locationX / canvasWidth)),
            y: Math.max(0, Math.min(1, event.nativeEvent.locationY / CANVAS_HEIGHT)),
          };
          lastPointRef.current = nextPoint;
          setDraftPoints([nextPoint]);
        },
        onPanResponderMove: (event) => {
          if (readOnly) return;
          const nextPoint = {
            x: Math.max(0, Math.min(1, event.nativeEvent.locationX / canvasWidth)),
            y: Math.max(0, Math.min(1, event.nativeEvent.locationY / CANVAS_HEIGHT)),
          };

          const previousPoint = lastPointRef.current;
          if (previousPoint && previousPoint.x === nextPoint.x && previousPoint.y === nextPoint.y) {
            return;
          }

          lastPointRef.current = nextPoint;
          setDraftPoints((current) => [...current, nextPoint]);
        },
        onPanResponderRelease: commitStroke,
        onPanResponderTerminate: commitStroke,
      }),
    [canvasWidth, commitStroke, readOnly]
  );

  const hasContent = sketch.strokes.length > 0 || draftPoints.length > 0;

  return (
    <View
      style={[
        styles.canvasShell,
        {
          borderColor: eraser ? colors.warning + '60' : colors.border,
          backgroundColor: colors.surface,
        },
      ]}
      onLayout={(event) => setCanvasWidth(Math.max(1, event.nativeEvent.layout.width))}
      {...panResponder.panHandlers}
    >
      {eraser && !readOnly ? (
        <View style={styles.eraserBadge} pointerEvents="none">
          <Text style={[styles.eraserBadgeText, { color: colors.warning }]}>Borrador</Text>
        </View>
      ) : null}
      <Svg width="100%" height={CANVAS_HEIGHT} style={styles.canvasSvg}>
        {sketch.strokes.map((stroke) =>
          stroke.points.length > 1 ? (
            <Path
              key={stroke.id}
              d={buildPath(stroke.points, canvasWidth, CANVAS_HEIGHT)}
              fill="none"
              stroke={stroke.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={stroke.width}
            />
          ) : stroke.points[0] ? (
            <Circle
              key={stroke.id}
              {...renderSinglePoint(stroke.points[0], canvasWidth, CANVAS_HEIGHT)}
              fill={stroke.color}
              r={Math.max(2, stroke.width)}
            />
          ) : null
        )}
        {draftPoints.length > 1 ? (
          <Path
            d={buildPath(draftPoints, canvasWidth, CANVAS_HEIGHT)}
            fill="none"
            stroke={effectiveColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={effectiveWidth}
          />
        ) : draftPoints[0] ? (
          <Circle
            {...renderSinglePoint(draftPoints[0], canvasWidth, CANVAS_HEIGHT)}
            fill={effectiveColor}
            r={Math.max(2, effectiveWidth)}
          />
        ) : null}

        {eraser && draftPoints.length > 0 ? (
          <Circle
            cx={draftPoints[draftPoints.length - 1].x * canvasWidth}
            cy={draftPoints[draftPoints.length - 1].y * CANVAS_HEIGHT}
            r={effectiveWidth / 2}
            fill="transparent"
            stroke={colors.textTertiary}
            strokeWidth={1.5}
            strokeDasharray="3,3"
          />
        ) : null}
      </Svg>

      {!hasContent ? (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            {readOnly ? 'Sin trazos en este lienzo' : 'Dibuja aqui con el dedo'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  canvasShell: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  canvasSvg: {
    height: CANVAS_HEIGHT,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  eraserBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 5,
  },
  eraserBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
