<script lang="ts">
  import { cva, type VariantProps } from "class-variance-authority";
  import { cn } from "../../../utils/cn";

  const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    {
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground hover:opacity-90",
          secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          outline: "border border-input bg-white hover:bg-secondary",
          ghost: "hover:bg-secondary hover:text-secondary-foreground",
          destructive: "bg-destructive text-destructive-foreground hover:opacity-90"
        },
        size: {
          default: "h-9 px-4 py-2",
          sm: "h-8 rounded-md px-3 text-xs",
          lg: "h-10 rounded-md px-6"
        }
      },
      defaultVariants: {
        variant: "default",
        size: "default"
      }
    }
  );

  export let variant: VariantProps<typeof buttonVariants>["variant"] = "default";
  export let size: VariantProps<typeof buttonVariants>["size"] = "default";
  export let type: "button" | "submit" | "reset" = "button";
  export let disabled = false;
  let className = "";
  export { className as class };
</script>

<button
  {type}
  {disabled}
  class={cn(buttonVariants({ variant, size }), className)}
  on:click
  on:pointerdown
  on:pointerup
  on:pointercancel
  on:pointerleave
  on:keydown
  on:keyup
  on:blur
  {...$$restProps}
>
  <slot />
</button>
