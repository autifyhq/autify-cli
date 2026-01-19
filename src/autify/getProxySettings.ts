/* eslint-disable unicorn/filename-case */
import { getSystemProxy } from "os-proxy-config";
import { ProxyAgent, setGlobalDispatcher } from "undici";

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

// Track if proxy dispatcher has been initialized
let proxyInitialized = false;

/**
 * Initialize global proxy dispatcher for all fetch requests
 * This should be called once at the start of any operation that uses fetch
 * After calling this, all fetch() calls will automatically use the configured proxy
 */
export async function initializeProxy(): Promise<void> {
  if (proxyInitialized) {
    return;
  }

  const proxyUrl = await getProxyUrl();
  if (proxyUrl) {
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
  }

  proxyInitialized = true;
}
