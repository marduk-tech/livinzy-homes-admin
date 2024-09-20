import { useMediaQuery } from "react-responsive";

export function useDevice() {
  const isTabletOrMobile = useMediaQuery({
    query: "(max-width: 992px)",
  });
  const isMobile = useMediaQuery({
    query: "(max-width: 576px)",
  });
  return {
    isTabletOrMobile,
    isMobile,
  };
}
