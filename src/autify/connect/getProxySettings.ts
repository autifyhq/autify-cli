/* eslint-disable unicorn/filename-case */
import { getSystemProxy } from "os-proxy-config";

/**
 * Get proxy URL from system settings or environment variables
 * Returns proxy URL string or null if no proxy is configured
 *
 * Priority:
 * 1. Environment variables (HTTP_PROXY/HTTPS_PROXY) - highest priority
 * 2. System proxy settings (Windows registry, macOS networksetup, etc.)
 */
export async function getProxyUrl(): Promise<string | null> {
  // First, check environment variables (highest priority)
  const envProxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (envProxy) {
    return envProxy;
  }

  // Then try to detect system proxy settings using os-proxy-config
  try {
    const systemProxy = await getSystemProxy();
    if (systemProxy?.proxyUrl) {
      return systemProxy.proxyUrl;
    }
  } catch {
    // System proxy detection failed, return null
  }

  return null;
}
