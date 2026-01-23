import { Composition, registerRoot } from 'remotion';
import { ClarpQuickPromo } from './compositions/ClarpQuickPromo';

const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ClarpQuickPromo"
        component={ClarpQuickPromo}
        durationInFrames={300} // 10 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};

registerRoot(RemotionRoot);
