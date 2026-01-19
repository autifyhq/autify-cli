/* eslint-disable unicorn/filename-case */
import { getSystemProxy } from "os-proxy-config";
import { ProxyAgent } from "undici";

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

// Cache proxy agent to reuse across requests
let proxyAgent: ProxyAgent | null = null;

/**
 * Get a ProxyAgent instance configured with detected proxy settings
 * Returns a cached ProxyAgent instance or undefined if no proxy is configured
 */
export async function getProxyAgent(): Promise<ProxyAgent | undefined> {
  if (proxyAgent !== null) {
    return proxyAgent || undefined;
  }

  const proxyUrl = await getProxyUrl();
  if (proxyUrl) {
    proxyAgent = new ProxyAgent(proxyUrl);
    return proxyAgent;
  }

  proxyAgent = null; // Explicitly set to null if no proxy
  return undefined;
}
