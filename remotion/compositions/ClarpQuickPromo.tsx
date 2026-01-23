import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  staticFile,
  Img,
} from 'remotion';

// Color palette from Design Guide
const colors = {
  desktop: '#0a0a0a',
  windowBg: '#141413',
  ivoryLight: '#FAF9F5',
  terracotta: '#D97757',
  accentOrange: '#C6613F',
  slateLight: '#5E5D59',
  success: '#2ECC71',
  error: '#E74C3C',
  larpPurple: '#9B59B6',
};

const fontMono = '"JetBrains Mono", "SF Mono", "Fira Code", monospace';
const fontDisplay = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// Scene 1: Opening hook (0-2.5s) - "They raised $400M" with CSS 3D
const OpeningHook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textIn = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 200 },
  });

  const strikeProgress = interpolate(frame, [1.5 * fps, 2 * fps], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  const rotationY = interpolate(frame, [0, 2.5 * fps], [8, -8], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.desktop,
        justifyContent: 'center',
        alignItems: 'center',
        perspective: 1000,
      }}
    >
      <div
        style={{
          fontFamily: fontDisplay,
          fontSize: 64,
          color: colors.ivoryLight,
          fontWeight: 600,
          transform: `translateY(${interpolate(textIn, [0, 1], [40, 0])}px) rotateY(${rotationY}deg)`,
          opacity: textIn,
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        <span style={{ position: 'relative' }}>
          they raised $400M
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: `${strikeProgress}%`,
              height: 4,
              backgroundColor: colors.error,
              transform: 'translateY(-50%)',
            }}
          />
        </span>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: The flip (2.5-4s) - "we shipped a rug detector" with CSS 3D
const TheFlip = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textIn = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 200 },
  });

  const rotationY = interpolate(frame, [0, 1.5 * fps], [-12, 4], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.desktop,
        justifyContent: 'center',
        alignItems: 'center',
        perspective: 1000,
      }}
    >
      <div
        style={{
          fontFamily: fontDisplay,
          fontSize: 72,
          color: colors.terracotta,
          fontWeight: 700,
          transform: `scale(${textIn}) rotateY(${rotationY}deg)`,
          opacity: textIn,
          transformStyle: 'preserve-3d',
        }}
      >
        we shipped a rug detector.
      </div>
    </AbsoluteFill>
  );
};

// Terminal Window Component
const TerminalWindow = ({ frame, fps }: { frame: number; fps: number }) => {
  const command = '$ clarp scan @crypto_kol';
  const typingProgress = interpolate(frame, [0.3 * fps, 1.2 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const visibleChars = Math.floor(typingProgress * command.length);
  const typedCommand = command.slice(0, visibleChars);

  const resultsIn = interpolate(frame, [1.5 * fps, 2 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  const scoreBarWidth = interpolate(frame, [1.8 * fps, 2.5 * fps], [0, 23], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        backgroundColor: colors.windowBg,
        borderRadius: 12,
        padding: 24,
        width: 480,
        boxShadow: '0 25px 80px rgba(0,0,0,0.9)',
        border: `1px solid ${colors.slateLight}33`,
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#febc2e' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28c840' }} />
        <span style={{ marginLeft: 'auto', fontFamily: fontMono, fontSize: 11, color: colors.slateLight }}>
          Terminal
        </span>
      </div>

      <div style={{ fontFamily: fontMono, fontSize: 15, color: colors.ivoryLight, marginBottom: 14 }}>
        <span style={{ color: colors.terracotta }}>{typedCommand.slice(0, 2)}</span>
        {typedCommand.slice(2)}
        <span
          style={{
            backgroundColor: colors.terracotta,
            width: 2,
            height: 18,
            display: 'inline-block',
            marginLeft: 2,
            opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
          }}
        />
      </div>

      <div style={{ opacity: resultsIn }}>
        <div style={{ fontFamily: fontMono, fontSize: 13, color: colors.slateLight, marginBottom: 10 }}>
          @crypto_kol · 800 posts analyzed
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontFamily: fontMono, fontSize: 16, color: colors.ivoryLight, fontWeight: 600 }}>
            SCORE: {Math.round(scoreBarWidth)}/100
          </span>
          <div style={{ flex: 1, height: 6, backgroundColor: `${colors.slateLight}33`, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${scoreBarWidth}%`, height: '100%', backgroundColor: colors.error, borderRadius: 3 }} />
          </div>
          <span style={{ fontFamily: fontMono, fontSize: 11, color: colors.error, fontWeight: 700 }}>HIGH RISK</span>
        </div>

        <div style={{ fontFamily: fontMono, fontSize: 13, color: colors.ivoryLight, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div><span style={{ color: colors.terracotta }}>▸</span> serial shill: <span style={{ color: colors.error }}>14</span> tokens</div>
          <div><span style={{ color: colors.terracotta }}>▸</span> hype merchant: <span style={{ color: colors.error }}>89%</span></div>
        </div>
      </div>
    </div>
  );
};

// Browser Window Component
const BrowserWindow = ({ frame, fps }: { frame: number; fps: number }) => {
  const scanProgress = interpolate(frame, [0.5 * fps, 1.5 * fps], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const resultsIn = interpolate(frame, [1.8 * fps, 2.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  return (
    <div
      style={{
        backgroundColor: colors.windowBg,
        borderRadius: 12,
        width: 480,
        overflow: 'hidden',
        boxShadow: '0 25px 80px rgba(0,0,0,0.9)',
        border: `1px solid ${colors.slateLight}33`,
      }}
    >
      <div style={{ backgroundColor: '#1e1e1c', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#febc2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28c840' }} />
        </div>
        <div style={{
          flex: 1,
          backgroundColor: colors.windowBg,
          borderRadius: 6,
          padding: '5px 10px',
          fontFamily: fontMono,
          fontSize: 11,
          color: colors.slateLight,
        }}>
          clarp.lukehalley.com/terminal
        </div>
      </div>

      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36,
            height: 36,
            backgroundColor: colors.terracotta,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fontDisplay,
            fontSize: 18,
            fontWeight: 700,
            color: colors.desktop,
          }}>
            C
          </div>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 600, color: colors.ivoryLight }}>
              CLARP Terminal
            </div>
            <div style={{ fontFamily: fontMono, fontSize: 11, color: colors.slateLight }}>
              Trust Intelligence
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a19',
          borderRadius: 8,
          padding: 10,
          marginBottom: 14,
          border: `1px solid ${colors.slateLight}33`,
        }}>
          <div style={{ fontFamily: fontMono, fontSize: 13, color: colors.ivoryLight }}>
            <span style={{ color: colors.terracotta }}>@</span>crypto_kol
          </div>
        </div>

        {scanProgress < 100 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: fontMono, fontSize: 11, color: colors.slateLight, marginBottom: 6 }}>
              Scanning posts...
            </div>
            <div style={{ height: 4, backgroundColor: `${colors.slateLight}33`, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${scanProgress}%`, height: '100%', backgroundColor: colors.terracotta }} />
            </div>
          </div>
        )}

        <div style={{ opacity: resultsIn }}>
          <div style={{
            backgroundColor: `${colors.error}15`,
            border: `1px solid ${colors.error}40`,
            borderRadius: 8,
            padding: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 700, color: colors.error }}>
                23/100
              </span>
              <span style={{
                backgroundColor: colors.error,
                color: colors.ivoryLight,
                fontFamily: fontMono,
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 7px',
                borderRadius: 4,
              }}>
                HIGH RISK
              </span>
            </div>
            <div style={{ fontFamily: fontMono, fontSize: 11, color: colors.ivoryLight }}>
              <div style={{ marginBottom: 3 }}>• Serial shill detected</div>
              <div>• Hype merchant patterns</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Scene 3: CSS 3D Terminal + Browser demo (4-7s)
const DualWindowDemo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowIn = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const rotationY = interpolate(frame, [0, 3 * fps], [-8, 8], {
    extrapolateRight: 'clamp',
  });

  const floatOffset = Math.sin(frame * 0.05) * 8;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.desktop,
        justifyContent: 'center',
        alignItems: 'center',
        perspective: 1200,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 60,
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotationY}deg)`,
        }}
      >
        {/* Terminal window - left side, tilted */}
        <div
          style={{
            transform: `
              scale(${windowIn})
              translateY(${floatOffset}px)
              rotateY(15deg)
              rotateX(2deg)
            `,
            transformStyle: 'preserve-3d',
            opacity: windowIn,
          }}
        >
          <TerminalWindow frame={frame} fps={fps} />
        </div>

        {/* Browser window - right side, tilted opposite */}
        <div
          style={{
            transform: `
              scale(${windowIn})
              translateY(${-floatOffset * 0.5}px)
              translateZ(-30px)
              rotateY(-12deg)
              rotateX(-1deg)
            `,
            transformStyle: 'preserve-3d',
            opacity: windowIn,
          }}
        >
          <BrowserWindow frame={frame} fps={fps} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Key value prop (7-8.5s) with CSS 3D
const ValueProp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1In = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 200 },
  });

  const line2In = spring({
    frame: frame - 0.3 * fps,
    fps,
    config: { damping: 20, stiffness: 200 },
  });

  const rotationX = interpolate(frame, [0, 1.5 * fps], [6, -3], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.desktop,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 20,
        perspective: 1000,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          transform: `rotateX(${rotationX}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 48,
            color: colors.ivoryLight,
            fontWeight: 500,
            transform: `translateY(${interpolate(line1In, [0, 1], [30, 0])}px)`,
            opacity: line1In,
          }}
        >
          polymarket odds + on-chain receipts
        </div>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 36,
            color: colors.slateLight,
            fontWeight: 400,
            transform: `translateY(${interpolate(line2In, [0, 1], [30, 0])}px)`,
            opacity: line2In,
          }}
        >
          know who to trust before you ape
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Closing (8.5-10s) with CSS 3D
const Closing = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mascotIn = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const logoIn = spring({
    frame: frame - 0.2 * fps,
    fps,
    config: { damping: 15, stiffness: 150 },
  });

  const taglineIn = spring({
    frame: frame - 0.5 * fps,
    fps,
    config: { damping: 20, stiffness: 200 },
  });

  const urlIn = interpolate(frame, [0.8 * fps, 1.2 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const glowIntensity = interpolate(Math.sin(frame * 0.15), [-1, 1], [0.3, 0.6]);
  const rotationY = Math.sin(frame * 0.03) * 3;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.desktop,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 24,
        perspective: 1000,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          transform: `rotateY(${rotationY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Mascot */}
        <div
          style={{
            transform: `scale(${mascotIn}) translateY(${interpolate(mascotIn, [0, 1], [-30, 0])}px)`,
            opacity: mascotIn,
          }}
        >
          <Img
            src={staticFile('clarp-mascot.svg')}
            style={{
              width: 140,
              height: 140,
              borderRadius: 20,
            }}
          />
        </div>

        {/* Logo */}
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 96,
            color: colors.terracotta,
            fontWeight: 700,
            transform: `scale(${logoIn})`,
            opacity: logoIn,
            textShadow: `0 0 ${40 * glowIntensity}px ${colors.terracotta}`,
          }}
        >
          $CLARP
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 32,
            color: colors.ivoryLight,
            fontWeight: 500,
            transform: `translateY(${interpolate(taglineIn, [0, 1], [20, 0])}px)`,
            opacity: taglineIn,
          }}
        >
          CLARP spots LARPs.
        </div>

        {/* URL */}
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 20,
            color: colors.slateLight,
            opacity: urlIn,
          }}
        >
          clarp.lukehalley.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main composition
export const ClarpQuickPromo = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: colors.desktop }}>
      {/* Scene 1: Opening hook (0-2.5s) */}
      <Sequence from={0} durationInFrames={Math.round(2.5 * fps)} premountFor={fps}>
        <OpeningHook />
      </Sequence>

      {/* Scene 2: The flip (2.5-4s) */}
      <Sequence from={Math.round(2.5 * fps)} durationInFrames={Math.round(1.5 * fps)} premountFor={fps}>
        <TheFlip />
      </Sequence>

      {/* Scene 3: 3D Terminal + Browser demo (4-7s) */}
      <Sequence from={Math.round(4 * fps)} durationInFrames={Math.round(3 * fps)} premountFor={fps}>
        <DualWindowDemo />
      </Sequence>

      {/* Scene 4: Value prop (7-8.5s) */}
      <Sequence from={Math.round(7 * fps)} durationInFrames={Math.round(1.5 * fps)} premountFor={fps}>
        <ValueProp />
      </Sequence>

      {/* Scene 5: Closing (8.5-10s) */}
      <Sequence from={Math.round(8.5 * fps)} durationInFrames={Math.round(1.5 * fps)} premountFor={fps}>
        <Closing />
      </Sequence>
    </AbsoluteFill>
  );
};
