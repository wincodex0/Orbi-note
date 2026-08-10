export interface ErrorState {
  bannerMessage: string | null;
  fatalMessage: string | null;
  setBannerMessage: (message: string | null) => void;
  setFatalMessage: (message: string | null) => void;
}

export const createErrorSlice = () => ({
  bannerMessage: null,
  fatalMessage: null,
  setBannerMessage: (message: string | null) => ({ bannerMessage: message }),
  setFatalMessage: (message: string | null) => ({ fatalMessage: message })
});
