// TypeScript can't see platform extensions (.web / .native), so this file gives
// it a module to resolve. Metro picks DateRangeSelector.web.tsx on web and
// DateRangeSelector.native.tsx on Android/iOS before ever falling back here.
export { default } from "./DateRangeSelector.native";

