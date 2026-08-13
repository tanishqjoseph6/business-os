"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { cn } from "@repo/ui/utils";
import {
  KAIROS_CHAT_MODELS,
  KAIROS_DEFAULT_PLAN,
  KAIROS_MODEL_GROUPS,
  getKairosChatModel,
  isKairosModelAllowedForPlan,
  requiredPlanForKairosModel,
  type KairosChatModelId,
  type KairosPlanId,
} from "@repo/ai/chat/kairos-models";

type ModelSelectorProps = {
  model: KairosChatModelId;
  onChange: (model: KairosChatModelId) => void;
  plan?: KairosPlanId;
  disabled?: boolean;
  onLockedSelect?: () => void;
};

export function ModelSelector({
  model,
  onChange,
  plan = KAIROS_DEFAULT_PLAN,
  disabled,
  onLockedSelect,
}: ModelSelectorProps) {
  const active = getKairosChatModel(model) ?? KAIROS_CHAT_MODELS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Select Kairos model"
          className={cn(
            "inline-flex h-8 max-w-[200px] items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-foreground transition",
            "hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <span aria-hidden>{active?.icon}</span>
          <span className="truncate">{active?.label}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-1.5">
        {KAIROS_MODEL_GROUPS.map((group, groupIndex) => (
          <div key={group.id}>
            {groupIndex > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold tracking-[0.16em] text-muted">
              {group.label}
            </DropdownMenuLabel>
            {group.modelIds.map((id) => {
              const option = getKairosChatModel(id);
              if (!option) return null;
              const selected = option.id === model;
              const locked = !isKairosModelAllowedForPlan(option.id, plan);
              const badge = locked
                ? requiredPlanForKairosModel(option.id).toUpperCase()
                : null;

              return (
                <DropdownMenuItem
                  key={option.id}
                  onSelect={() => {
                    if (locked) {
                      onLockedSelect?.();
                      return;
                    }
                    onChange(option.id);
                  }}
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl px-2.5 py-2.5",
                    "focus:bg-primary/10 focus:text-foreground",
                    selected && "bg-primary/10 text-foreground",
                    locked && "opacity-90",
                  )}
                >
                  <span className="mt-0.5 text-sm" aria-hidden>
                    {option.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">
                        {option.label}
                      </span>
                      {badge ? (
                        <span className="rounded-md border border-primary/35 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-primary">
                          {badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs leading-4 text-muted">
                      {option.description}
                    </span>
                  </span>
                  {selected ? (
                    <Check
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-primary"
                      aria-hidden
                    />
                  ) : (
                    <span className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
