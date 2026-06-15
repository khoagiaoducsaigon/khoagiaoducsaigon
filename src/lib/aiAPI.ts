/* ==================================================================== */
/*  Multi-Provider AI API Integration  —  Moonshot, OpenAI, OpenRouter   */
/*  Supports CORS proxy for browser-direct calls                        */
/* ==================================================================== */

export type AIProvider = 'moonshot' | 'openai' | 'openrouter' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  proxyUrl: string;      // e.g. "https://corsproxy.io/?"
  customBaseUrl: string;   // only used when provider === 'custom'
  model: string;
}

export interface AIAnalysisResponse {
  interpretation: string;
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Provider presets                                                    */
/* ------------------------------------------------------------------ */

const PROVIDER_PRESETS: Record<AIProvider, { baseUrl: string; defaultModel: string; modelChoices: string[] }> = {
  moonshot: {
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'kimi-latest',
    modelChoices: ['kimi-latest', 'kimi-k2', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    modelChoices: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    modelChoices: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash-001'],
  },
  custom: {
    baseUrl: '',
    defaultModel: '',
    modelChoices: [],
  },
};

export function getProviderPreset(provider: AIProvider) {
  return PROVIDER_PRESETS[provider];
}

/* ------------------------------------------------------------------ */
/*  Build final API URL (with proxy support)                            */
/* ------------------------------------------------------------------ */

function buildApiUrl(config: AIConfig): string {
  const preset = PROVIDER_PRESETS[config.provider];
  const baseUrl = config.provider === 'custom'
    ? (config.customBaseUrl || '')
    : preset.baseUrl;

  const endpoint = '/chat/completions';
  const fullUrl = `${baseUrl.replace(/\/$/, '')}${endpoint}`;

  // If proxy URL is set, prefix it
  if (config.proxyUrl && config.proxyUrl.trim()) {
    const proxy = config.proxyUrl.trim().replace(/\/$/, '');
    return `${proxy}/${encodeURIComponent(fullUrl)}`;
  }

  return fullUrl;
}

function buildHeaders(config: AIConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };

  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.href;
    headers['X-Title'] = 'StatsPro Analysis';
  }

  return headers;
}

/* ------------------------------------------------------------------ */
/*  Main call                                                           */
/* ------------------------------------------------------------------ */

export async function analyzeWithAI(
  config: AIConfig,
  method: string,
  data: any,
  results: any
): Promise<string> {
  const prompt = buildAnalysisPrompt(method, data, results);
  const apiUrl = buildApiUrl(config);
  const model = config.model || PROVIDER_PRESETS[config.provider].defaultModel;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Ban la mot nha thong ke hoc chuyen nghiep. Phan tich ket qua thong ke va dua ra dien giai chi tiet bang tieng Viet. Bao gom: y nghia thuc tien, han che, khuyen ngh.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content || 'Khong co phan hoi tu AI';
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Loi ket noi AI';
    if (
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('Network request failed') ||
      msg.includes('CORS')
    ) {
      if (config.proxyUrl && config.proxyUrl.trim()) {
        throw new Error(
          `Loi ket noi qua proxy "${config.proxyUrl}": ${msg}. Vui long kiem tra proxy URL va API key.`
        );
      }
      throw new Error(
        'CORS: Khong the goi API truc tiep tu trinh duyet. Vui long nhap CORS Proxy URL (vi du: https://corsproxy.io/?) trong cai dat.'
      );
    }
    throw new Error(msg);
  }
}

/* ------------------------------------------------------------------ */
/*  Test connection                                                     */
/* ------------------------------------------------------------------ */

export async function testAIConnection(config: AIConfig): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const apiUrl = buildApiUrl(config);
    const model = config.model || PROVIDER_PRESETS[config.provider].defaultModel;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say "OK" only.' }],
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        message: err.error?.message || `HTTP ${response.status}`,
      };
    }

    return { success: true, message: 'Ket noi thanh cong!' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Loi ket noi';
    return { success: false, message: msg };
  }
}

/* ------------------------------------------------------------------ */
/*  Prompt builder                                                      */
/* ------------------------------------------------------------------ */

function buildAnalysisPrompt(method: string, data: any, results: any): string {
  return `Phan tich thong ke: ${method}\n\nDu lieu:\n${JSON.stringify(data, null, 2)}\n\nKet qua:\n${JSON.stringify(results, null, 2)}\n\nHay dien giai ket qua nay mot cach chi tiet bang tieng Viet, bao gom:\n1. Tom tat phat hien chinh\n2. Y nghia thong ke\n3. Y nghia thuc tien\n4. Han che\n5. Khuyen ngh`;
}

/* ------------------------------------------------------------------ */
/*  Multi-API-Key localStorage persistence                              */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'statspro-ai-config';
const CONFIGS_KEY = 'statspro-ai-configs'; // multiple configs
const LEGACY_KEY = 'statspro-ai-api-key'; // backward compat

export function getAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AIConfig;
  } catch { /* ignore */ }

  // Migrate legacy single-key storage
  const legacyKey = localStorage.getItem(LEGACY_KEY) || '';
  return {
    provider: 'moonshot',
    apiKey: legacyKey,
    proxyUrl: '',
    customBaseUrl: '',
    model: 'kimi-latest',
  };
}

export function saveAIConfig(config: AIConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Also save key to legacy location for backward compat
    localStorage.setItem(LEGACY_KEY, config.apiKey);
    // Also save to multi-config list
    const configs = getAIConfigs();
    const existingIndex = configs.findIndex(
      (c) => c.provider === config.provider && c.model === config.model
    );
    if (existingIndex >= 0) {
      configs[existingIndex] = config;
    } else {
      configs.push(config);
    }
    localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs));
  } catch { /* ignore */ }
}

export function getAIConfigs(): AIConfig[] {
  try {
    const raw = localStorage.getItem(CONFIGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AIConfig[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  // Fallback: return single config as array
  const cfg = getAIConfig();
  if (cfg.apiKey) return [cfg];
  return [];
}

export function deleteAIConfig(provider: AIProvider, model: string): void {
  try {
    const configs = getAIConfigs().filter(
      (c) => !(c.provider === provider && c.model === model)
    );
    localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs));
  } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  Auto AI analysis                                                    */
/* ------------------------------------------------------------------ */

export async function runAutoAI(
  configs: AIConfig[],
  results: any,
  methodName?: string,
  dataInfo?: any
): Promise<{ provider: string; interpretation: string }[]> {
  const interpretations: { provider: string; interpretation: string }[] = [];

  for (const config of configs) {
    if (!config.apiKey) continue;
    try {
      const result = await analyzeWithAI(
        config,
        methodName || results?.methodId || 'Thong ke',
        dataInfo || {},
        results
      );
      interpretations.push({
        provider: `${config.provider} (${config.model})`,
        interpretation: result,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Loi';
      interpretations.push({
        provider: `${config.provider} (${config.model})`,
        interpretation: `[Loi] Khong the phan tich: ${msg}`,
      });
    }
  }

  return interpretations;
}

/* ------------------------------------------------------------------ */
/*  Backward-compatible wrappers (used by old components)               */
/* ------------------------------------------------------------------ */

export function getAIApiKey(): string {
  return getAIConfig().apiKey;
}

export function saveAIApiKey(key: string): void {
  const cfg = getAIConfig();
  cfg.apiKey = key;
  saveAIConfig(cfg);
}

/* ------------------------------------------------------------------ */
/*  Extended AI Config (with id, label, customEndpoint)               */
/* ------------------------------------------------------------------ */

export interface AIConfigItem {
  id: string;
  provider: 'moonshot' | 'openai' | 'openrouter' | 'custom';
  apiKey: string;
  proxyUrl?: string;
  customEndpoint?: string;
  model?: string;
  label?: string;
}

export function getAIConfigItems(): AIConfigItem[] {
  try {
    const raw = localStorage.getItem('statspro-ai-configs');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveAIConfigItem(config: AIConfigItem): void {
  const configs = getAIConfigItems().filter(c => c.id !== config.id);
  configs.push(config);
  localStorage.setItem('statspro-ai-configs', JSON.stringify(configs));
}

export async function runAutoAIWithCallbacks(
  configs: AIConfigItem[],
  method: string,
  data: any,
  results: any,
  onResult: (provider: string, text: string) => void,
  onError: (provider: string, err: string) => void
): Promise<void> {
  for (const config of configs) {
    try {
      const aiConfig: AIConfig = {
        provider: config.provider,
        apiKey: config.apiKey,
        proxyUrl: config.proxyUrl || '',
        customBaseUrl: config.customEndpoint || '',
        model: config.model || '',
      };
      const text = await analyzeWithAI(aiConfig, method, data, results);
      onResult(config.provider, text);
    } catch (err) {
      onError(config.provider, err instanceof Error ? err.message : String(err));
    }
  }
}
