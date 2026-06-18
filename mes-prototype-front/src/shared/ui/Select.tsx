"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";

type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type SelectProps<T extends string | number = string> = Omit<
  ComponentPropsWithoutRef<"select">,
  "children"
> & {
  options?: SelectOption<T>[];
  onValueChange?: (value: T) => void;
  className?: string;
  ariaLabel?: string;
  children?: ReactNode;
};

function SelectInner<T extends string | number = string>({
  options,
  onValueChange,
  className = "",
  ariaLabel,
  children,
  onChange,
  ...props
}: SelectProps<T>, ref: ForwardedRef<HTMLSelectElement>) {
  return (
    <span className="relative block w-full">
      <select
        {...props}
        ref={ref}
        aria-label={ariaLabel}
        onChange={(e) => {
          onChange?.(e);
          onValueChange?.(e.target.value as T);
        }}
        className={`h-9 w-full appearance-none rounded-md border border-input bg-card px-3 pr-9 text-sm outline-none transition-colors hover:bg-accent/35 focus:border-ring focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {children ??
          options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </span>
  );
}

export const Select = forwardRef(SelectInner) as <T extends string | number = string>(
  props: SelectProps<T> & { ref?: ForwardedRef<HTMLSelectElement> }
) => ReactElement;
