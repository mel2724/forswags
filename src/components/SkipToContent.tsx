import { Button } from "@/components/ui/button";

export function SkipToContent() {
  const handleSkip = () => {
    const mainContent = document.querySelector("main");
    if (mainContent) {
      mainContent.setAttribute("tabindex", "-1");
      mainContent.focus();
      setTimeout(() => {
        mainContent.removeAttribute("tabindex");
      }, 100);
    }
  };

  return (
    <Button
      onClick={handleSkip}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3"
      variant="secondary"
    >
      Skip to main content
    </Button>
  );
}
