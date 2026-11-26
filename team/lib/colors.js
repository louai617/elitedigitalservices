export const PALETTE = ["#EAB877", "#60A5FA", "#A78BFA", "#34D399", "#F87171", "#F472B6", "#FBBF24", "#22D3EE"];

/** Next colour in the palette, so new people don't all look the same. */
export const colorForIndex = (n) => PALETTE[n % PALETTE.length];
