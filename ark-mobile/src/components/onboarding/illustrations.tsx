import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

// A cohesive, flat turquoise illustration set — one scene per onboarding step.
// Deliberately gradient-free (solid brand fills) so there are no <Defs> id
// collisions and it renders identically on iOS, Android and web.
//
// Shared canvas: viewBox 240×180, a soft teal panel with a white halo.

const DEEP = '#006a6a';
const MID = '#00b8bb';
const BRIGHT = '#00d7d7';
const PALE = '#bff0f0';
const LINE = '#e1eceb';
const WHITE = '#ffffff';

type ArtProps = { size?: number };

function frame(size: number) {
  return { width: size, height: (size * 180) / 240 };
}

function Panel() {
  return (
    <G>
      <Rect x={4} y={6} width={232} height={168} rx={28} fill="#e6f7f7" />
      <Circle cx={120} cy={90} r={60} fill={WHITE} opacity={0.6} />
    </G>
  );
}

export function HomeArt({ size = 224 }: ArtProps) {
  const { width, height } = frame(size);
  return (
    <Svg width={width} height={height} viewBox="0 0 240 180">
      <Panel />
      {/* tower */}
      <Rect x={86} y={72} width={68} height={78} rx={9} fill={WHITE} stroke={DEEP} strokeWidth={3} />
      <Rect x={98} y={86} width={16} height={14} rx={3} fill={PALE} />
      <Rect x={126} y={86} width={16} height={14} rx={3} fill={PALE} />
      <Rect x={98} y={108} width={16} height={14} rx={3} fill={PALE} />
      <Rect x={126} y={108} width={16} height={14} rx={3} fill={BRIGHT} />
      <Rect x={112} y={128} width={16} height={22} rx={3} fill={DEEP} />
      {/* location pin */}
      <Path d="M120 34 C110 34 102 42 102 52 C102 64 120 78 120 78 C120 78 138 64 138 52 C138 42 130 34 120 34 Z" fill={DEEP} />
      <Circle cx={120} cy={52} r={7} fill={WHITE} />
    </Svg>
  );
}

export function PayArt({ size = 224 }: ArtProps) {
  const { width, height } = frame(size);
  return (
    <Svg width={width} height={height} viewBox="0 0 240 180">
      <Panel />
      {/* cheque */}
      <Rect x={50} y={58} width={140} height={76} rx={12} fill={WHITE} stroke="#cfe0df" strokeWidth={2} />
      <Rect x={64} y={72} width={54} height={9} rx={4} fill={MID} />
      <Rect x={64} y={92} width={112} height={7} rx={3} fill={LINE} />
      <Rect x={64} y={106} width={82} height={7} rx={3} fill={LINE} />
      <Path d="M64 124 q9 -8 18 0 t18 0" fill="none" stroke={DEEP} strokeWidth={3} strokeLinecap="round" />
      {/* paid badge */}
      <Circle cx={176} cy={122} r={15} fill={DEEP} />
      <Path d="M169 122 l5 5 l9 -10" fill="none" stroke={WHITE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RentArt({ size = 224 }: ArtProps) {
  const { width, height } = frame(size);
  return (
    <Svg width={width} height={height} viewBox="0 0 240 180">
      <Panel />
      {/* banknote */}
      <Rect x={58} y={72} width={124} height={60} rx={12} fill={WHITE} stroke="#cfe0df" strokeWidth={2} />
      <Rect x={68} y={82} width={104} height={40} rx={7} fill="none" stroke={PALE} strokeWidth={2} />
      <Circle cx={120} cy={102} r={13} fill="#e8f6f6" stroke={DEEP} strokeWidth={2} />
      {/* coin */}
      <Circle cx={170} cy={78} r={20} fill={BRIGHT} stroke={DEEP} strokeWidth={2} />
      <Circle cx={170} cy={78} r={11} fill={WHITE} opacity={0.55} />
    </Svg>
  );
}

export function DateArt({ size = 224 }: ArtProps) {
  const { width, height } = frame(size);
  const dots = [82, 102, 122, 142, 162];
  return (
    <Svg width={width} height={height} viewBox="0 0 240 180">
      <Panel />
      {/* binder rings */}
      <Rect x={84} y={52} width={6} height={16} rx={3} fill={MID} />
      <Rect x={150} y={52} width={6} height={16} rx={3} fill={MID} />
      {/* calendar body */}
      <Rect x={64} y={60} width={112} height={90} rx={12} fill={WHITE} stroke="#cfe0df" strokeWidth={2} />
      <Rect x={64} y={60} width={112} height={22} rx={12} fill={DEEP} />
      <Rect x={64} y={74} width={112} height={8} fill={DEEP} />
      {/* day dots */}
      {dots.map((x) => (
        <Circle key={`a${x}`} cx={x} cy={98} r={4} fill={LINE} />
      ))}
      {dots.map((x) =>
        x === 122 ? (
          <Circle key={`b${x}`} cx={x} cy={118} r={10} fill={BRIGHT} />
        ) : (
          <Circle key={`b${x}`} cx={x} cy={118} r={4} fill={LINE} />
        ),
      )}
      {dots.map((x) => (
        <Circle key={`c${x}`} cx={x} cy={138} r={4} fill={LINE} />
      ))}
    </Svg>
  );
}

export function RemindArt({ size = 224 }: ArtProps) {
  const { width, height } = frame(size);
  return (
    <Svg width={width} height={height} viewBox="0 0 240 180">
      <Panel />
      {/* chat bubble */}
      <Rect x={58} y={58} width={120} height={72} rx={22} fill={DEEP} />
      <Path d="M82 128 l0 18 l20 -15 z" fill={DEEP} />
      {/* bell inside */}
      <Path d="M118 82 c-11 0 -16 8 -16 18 v9 h32 v-9 c0 -10 -5 -18 -16 -18 z" fill={WHITE} />
      <Circle cx={118} cy={80} r={3} fill={WHITE} />
      <Path d="M112 116 a6 6 0 0 0 12 0" fill="none" stroke={WHITE} strokeWidth={3} strokeLinecap="round" />
      {/* email badge (2nd channel) */}
      <Circle cx={170} cy={126} r={18} fill={WHITE} stroke={DEEP} strokeWidth={2} />
      <Rect x={160} y={119} width={20} height={14} rx={3} fill="none" stroke={DEEP} strokeWidth={2} />
      <Path d="M160 121 l10 7 l10 -7" fill="none" stroke={DEEP} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlanArt({ size = 224 }: ArtProps) {
  const { width, height } = frame(size);
  const rows = [0, 1, 2, 3];
  return (
    <Svg width={width} height={height} viewBox="0 0 240 180">
      <Panel />
      <Rect x={54} y={50} width={132} height={104} rx={14} fill={WHITE} stroke="#cfe0df" strokeWidth={2} />
      <Rect x={68} y={64} width={48} height={9} rx={4} fill={DEEP} />
      {rows.map((i) => {
        const cy = 90 + i * 18;
        return (
          <G key={i}>
            <Circle cx={78} cy={cy} r={8} fill={i < 2 ? DEEP : BRIGHT} />
            <Path
              d={`M74 ${cy} l3 3 l6 -6`}
              fill="none"
              stroke={WHITE}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Rect x={94} y={cy - 3} width={78 - i * 8} height={6} rx={3} fill={LINE} />
          </G>
        );
      })}
    </Svg>
  );
}

export function SaveArt({ size = 224 }: ArtProps) {
  const { width, height } = frame(size);
  return (
    <Svg width={width} height={height} viewBox="0 0 240 180">
      <Panel />
      <Path
        d="M120 44 L166 62 V102 C166 128 145 146 120 154 C95 146 74 128 74 102 V62 Z"
        fill={DEEP}
        stroke={MID}
        strokeWidth={3}
      />
      <Circle cx={120} cy={94} r={11} fill={WHITE} />
      <Rect x={116} y={98} width={8} height={20} rx={4} fill={WHITE} />
    </Svg>
  );
}

export function CelebrateArt({ size = 224 }: ArtProps) {
  const { width, height } = frame(size);
  return (
    <Svg width={width} height={height} viewBox="0 0 240 180">
      <Panel />
      <Circle cx={120} cy={92} r={44} fill={DEEP} />
      <Path
        d="M99 93 l15 15 l28 -32"
        fill="none"
        stroke={WHITE}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* sparkles */}
      <G stroke={BRIGHT} strokeWidth={3} strokeLinecap="round">
        <Line x1={58} y1={54} x2={58} y2={68} />
        <Line x1={51} y1={61} x2={65} y2={61} />
        <Line x1={182} y1={62} x2={182} y2={74} />
        <Line x1={176} y1={68} x2={188} y2={68} />
      </G>
      <Circle cx={70} cy={128} r={4} fill={MID} />
      <Circle cx={176} cy={126} r={5} fill={PALE} />
    </Svg>
  );
}
