import BioLinks from '@/components/BioLinks';
import { useBrandTheme } from '@/lib/useBrandTheme';

export default function LinkBio() {
  useBrandTheme();
  return <BioLinks />;
}
