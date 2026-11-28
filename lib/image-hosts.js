/**
 * next/image can only optimise images from known hosts. Our own uploads
 * (/media/…) are served by nginx, not Next, and CRM editors may paste any
 * URL — those are shown as-is. (Shared by server and client components.)
 */
const OPTIMISABLE = /^(\/(?!media\/)|https:\/\/(i\.imgur\.com|images\.unsplash\.com)\/)/;
export const canOptimise = (src) => OPTIMISABLE.test(src || "");
