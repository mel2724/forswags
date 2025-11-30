import { useState, useCallback } from "react";
import { useUserTier } from "./useFeatureAccess";

interface UpgradePromptConfig {
  title?: string;
  description?: string;
  feature?: string;
  benefits?: string[];
  context?: "general" | "limit" | "feature" | "analytics";
}

export function useUpgradePrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<UpgradePromptConfig>({});
  const { isFree } = useUserTier();

  const showUpgradePrompt = useCallback((promptConfig?: UpgradePromptConfig) => {
    if (!isFree) return false; // Don't show for paid users
    
    setConfig(promptConfig || {});
    setIsOpen(true);
    return true;
  }, [isFree]);

  const closeUpgradePrompt = useCallback(() => {
    setIsOpen(false);
  }, []);

  const checkLimitAndPrompt = useCallback(
    (currentUsage: number, limit: number, promptConfig: UpgradePromptConfig) => {
      if (currentUsage >= limit && isFree) {
        showUpgradePrompt({
          ...promptConfig,
          context: "limit",
        });
        return true;
      }
      return false;
    },
    [isFree, showUpgradePrompt]
  );

  return {
    isOpen,
    config,
    showUpgradePrompt,
    closeUpgradePrompt,
    checkLimitAndPrompt,
    isFree,
  };
}
