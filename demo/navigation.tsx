import { useMemo, useSyncExternalStore } from "react";
export const CHANGE = "planora-demo-change";
export function notify() {
  window.dispatchEvent(new Event(CHANGE));
}
export function subscribe(callback: () => void) {
  window.addEventListener(CHANGE, callback);
  window.addEventListener("popstate", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE, callback);
    window.removeEventListener("popstate", callback);
    window.removeEventListener("storage", callback);
  };
}
export function useLocation() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.pathname + window.location.search,
  );
}
const router = {
  push(path: string) {
    if (!path.startsWith("/") || path.startsWith("//")) return;
    window.history.pushState(null, "", path);
    notify();
    window.scrollTo(0, 0);
  },
  replace(path: string, options?: { scroll?: boolean }) {
    if (!path.startsWith("/") || path.startsWith("//")) return;
    window.history.replaceState(null, "", path);
    notify();
    if (options?.scroll !== false) window.scrollTo(0, 0);
  },
  refresh: notify,
};
export function useRouter() {
  return router;
}
export function usePathname() {
  return useLocation().split("?")[0];
}
export function useSearchParams() {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.split("?")[1]), [location]);
}
