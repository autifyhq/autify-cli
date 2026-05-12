/* eslint-disable unicorn/filename-case */
import { parse } from "shell-quote";
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

export type ProxyFromExtraArgs = {
  tunnelProxyUrl?: string;
  rejectUnauthorized?: boolean;
};

/**
 * Parse --tunnel-proxy and --experimental-no-ssl-verify from extra-arguments.
 * Matches mobilelink's parseExtraArguments for consistency.
 */
export function parseProxyFromExtraArguments(
  extraArguments: string | undefined
): ProxyFromExtraArgs {
  const out: ProxyFromExtraArgs = {};
  if (!extraArguments?.trim()) return out;
  const parsed = parse(extraArguments).filter(
    (entry): entry is string => typeof entry === "string"
  );
  for (let i = 0; i < parsed.length; ) {
    if (parsed[i] === "--tunnel-proxy" && i + 1 < parsed.length) {
      out.tunnelProxyUrl = parsed[i + 1];
      i += 2;
    } else if (parsed[i] === "--experimental-no-ssl-verify") {
      out.rejectUnauthorized = false;
      i += 1;
    } else {
      i += 1;
    }
  }

  return out;
}

/**
 * Extract --extra-arguments value from argv (for mobile link commands).
 */
function getExtraArgumentsFromArgv(argv: string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--extra-arguments" && i + 1 < argv.length) {
      return argv[i + 1];
    }

    if (arg.startsWith("--extra-arguments=")) {
      return arg.slice("--extra-arguments=".length);
    }
  }

  return undefined;
}

function isMobileLinkCommand(id: string): boolean {
  return id.includes("mobile") && id.includes("link");
}

// Track if proxy dispatcher has been initialized
let proxyInitialized = false;

export type InitializeProxyOptions = {
  id?: string;
  argv?: string[];
};

/**
 * Initialize global proxy dispatcher for all fetch requests
 * This should be called once at the start of any operation that uses fetch
 * After calling this, all fetch() calls will automatically use the configured proxy
 *
 * For mobile link commands, also reads --extra-arguments for --tunnel-proxy and
 * --experimental-no-ssl-verify (highest priority when present).
 */
export async function initializeProxy(
  options?: InitializeProxyOptions
): Promise<void> {
  if (proxyInitialized) {
    return;
  }

  let proxyUrl: string | null = null;
  let rejectUnauthorized: boolean | undefined;

  if (options?.id && isMobileLinkCommand(options.id) && options.argv) {
    const extraArgs = getExtraArgumentsFromArgv(options.argv);
    const { tunnelProxyUrl, rejectUnauthorized: ru } =
      parseProxyFromExtraArguments(extraArgs);
    if (tunnelProxyUrl) proxyUrl = tunnelProxyUrl;
    if (ru === false) rejectUnauthorized = false;
  }

  if (!proxyUrl) {
    proxyUrl = await getProxyUrl();
  }

  if (proxyUrl) {
    const agentOptions: {
      uri: string;
      requestTls?: { rejectUnauthorized?: boolean };
    } = {
      uri: proxyUrl,
    };
    if (rejectUnauthorized === false) {
      agentOptions.requestTls = { rejectUnauthorized: false };
    }

    setGlobalDispatcher(new ProxyAgent(agentOptions));
  }

  proxyInitialized = true;
}
