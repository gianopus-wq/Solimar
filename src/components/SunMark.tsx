import Svg, { Circle, Ellipse, G, Line, Rect } from 'react-native-svg';

/**
 * Naboria mark: a flat rendering of the Taíno sun (Sol de Jayuya).
 * Six round rays around a face with two slanted eyes, a band and a ring mouth.
 *
 * - `color`  fills the sun
 * - `detail` is used for the face and the ring inside each ray (shows as "cut-outs")
 * - `accent` optionally tints the ring inside each ray
 */
export function SunMark({
  size = 28,
  color,
  detail,
  accent,
}: {
  size?: number;
  color: string;
  detail: string;
  accent?: string;
}) {
  const rays = [0, 60, 120, 180, 240, 300];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Naboria">
      {rays.map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const x = 50 + 38 * Math.cos(rad);
        const y = 50 + 38 * Math.sin(rad);
        return (
          <G key={deg}>
            <Line x1={50} y1={50} x2={x} y2={y} stroke={color} strokeWidth={9} />
            <Circle cx={x} cy={y} r={11} fill={color} />
            <Circle cx={x} cy={y} r={6.2} fill={accent ?? detail} />
            <Circle cx={x} cy={y} r={2.6} fill={color} />
          </G>
        );
      })}

      <Circle cx={50} cy={50} r={27} fill={color} />
      {/* eyes */}
      <Ellipse cx={40.5} cy={40} rx={6.2} ry={3.8} rotation={-28} origin="40.5, 40" fill={detail} />
      <Ellipse cx={59.5} cy={40} rx={6.2} ry={3.8} rotation={28} origin="59.5, 40" fill={detail} />
      {/* band */}
      <Rect x={26} y={48.5} width={48} height={3.6} rx={1.8} fill={detail} />
      {/* mouth */}
      <Ellipse cx={50} cy={62.5} rx={9} ry={5.2} fill={detail} />
      <Ellipse cx={50} cy={62.5} rx={5} ry={2.2} fill={color} />
    </Svg>
  );
}
