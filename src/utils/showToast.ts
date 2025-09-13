export type ToastType = 'success' | 'error' | 'warn';
// Re-export the existing showToast utility from the public bundle
// This keeps auth flows consistent across frameworks.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- importing JS file outside src root
export { showToast } from '../public/src/ui/toast.js';
