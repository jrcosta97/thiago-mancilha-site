import BioLinks from '@/components/BioLinks';
import { useBrandTheme } from '@/lib/useBrandTheme';
import { MotionProvider } from '@/components/motion/primitives';

export default function LinkBio() {
  useBrandTheme();
  return (
    <MotionProvider>
      <BioLinks />
    </MotionProvider>
  );
}
