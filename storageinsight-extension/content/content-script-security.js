/**
 * StorageInsight Content Script - Security Enhanced Version
 * Includes fingerprinting detection and PII protection
 */

// ============================================================================
// PII DETECTION & SECURITY
// ============================================================================

/**
 * PII pattern matchers
 */
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  jwt: /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/,
  apiKey: /\b[a-zA-Z0-9]{32,}\b/,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/
};

/**
 * Sensitive key patterns
 */
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /passwd/i,
  /pwd/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
  /private[_-]?key/i,
  /access[_-]?key/i,
  /session/i,
  /bearer/i,
  /oauth/i,
  /refresh[_-]?token/i
];

/**
 * Hash a value using SHA-256
 * @param {string} value - The value to hash
 * @returns {Promise<string>} - The hash as a hex string
 */
async function hashValue(value) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    // Fallback to simple hash if SubtleCrypto not available
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

/**
 * Detect PII type in a value
 * @param {string} value - The value to check
 * @returns {string|null} - The PII type or null
 */
function detectPIIType(value) {
  if (typeof value !== 'string') return null;

  if (PII_PATTERNS.email.test(value)) return 'email';
  if (PII_PATTERNS.ssn.test(value)) return 'ssn';
  if (PII_PATTERNS.creditCard.test(value)) return 'credit_card';
  if (PII_PATTERNS.phone.test(value)) return 'phone';
  if (PII_PATTERNS.jwt.test(value)) return 'jwt_token';
  if (PII_PATTERNS.apiKey.test(value) && value.length > 30) return 'api_key';
  if (PII_PATTERNS.ipAddress.test(value)) return 'ip_address';

  return null;
}

/**
 * Check if a key is sensitive
 * @param {string} key - The key to check
 * @returns {boolean} - Whether the key is sensitive
 */
function isSensitiveKey(key) {
  if (typeof key !== 'string') return false;
  return SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Sanitize a storage value for safe reporting
 * @param {string} key - The storage key
 * @param {*} value - The storage value
 * @param {boolean} includeValues - Whether to include actual values
 * @returns {Promise<Object>} - Sanitized value object
 */
async function sanitizeValue(key, value, includeValues = false) {
  // If including values and no sensitive data, return as is
  if (includeValues && !isSensitiveKey(key)) {
    const piiType = detectPIIType(value);
    if (!piiType) {
      return { value, redacted: false };
    }
  }

  // Check for sensitive key
  const sensitiveKey = isSensitiveKey(key);

  // Check for PII in value
  const piiType = detectPIIType(value);

  // If sensitive or PII detected, redact
  if (sensitiveKey || piiType) {
    const valueStr = String(value);
    const hash = await hashValue(valueStr);

    return {
      redacted: true,
      hash: hash.substring(0, 16),
      piiType: piiType,
      keyPattern: sensitiveKey ? 'sensitive' : 'normal',
      length: valueStr.length
    };
  }

  // For non-sensitive data when not including values
  if (!includeValues) {
    return {
      redacted: true,
      length: String(value).length,
      keyPattern: 'normal'
    };
  }

  return { value, redacted: false };
}

// ============================================================================
// FINGERPRINTING DETECTION
// ============================================================================

/**
 * Get the caller stack for fingerprinting detection
 * @returns {string} - The caller stack trace
 */
function getCallerStack() {
  const stack = new Error().stack || '';
  const lines = stack.split('\n').slice(3, 8);
  return lines.join('\n');
}

/**
 * Report fingerprinting activity to the background script
 * @param {string} type - The type of fingerprinting detected
 * @param {Object} details - Additional details about the detection
 */
function reportFingerprinting(type, details) {
  try {
    chrome.runtime.sendMessage({
      type: 'FINGERPRINT_DETECTED',
      data: {
        type,
        details,
        timestamp: Date.now(),
        url: window.location.href,
        domain: window.location.hostname,
        caller: details.caller || getCallerStack()
      }
    });
  } catch (error) {
    console.warn('Failed to report fingerprinting:', error);
  }
}

// ============================================================================
// CANVAS FINGERPRINTING DETECTION
// ============================================================================

(function() {
  const canvasOperations = new WeakMap();

  // Wrap toDataURL
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function(...args) {
    try {
      const canvas = this;
      const width = canvas.width;
      const height = canvas.height;

      // Detect suspicious patterns
      if (width < 300 && height < 300 && width * height > 0) {
        const operations = canvasOperations.get(canvas) || { drawCount: 0, textCount: 0 };

        if (operations.drawCount > 0 || operations.textCount > 0) {
          reportFingerprinting('canvas_toDataURL', {
            width,
            height,
            drawOperations: operations.drawCount,
            textOperations: operations.textCount,
            caller: getCallerStack()
          });
        }
      }

      return originalToDataURL.apply(this, args);
    } catch (e) {
      return originalToDataURL.apply(this, args);
    }
  };

  // Wrap toBlob
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function(...args) {
    try {
      const canvas = this;
      const width = canvas.width;
      const height = canvas.height;

      if (width < 300 && height < 300 && width * height > 0) {
        const operations = canvasOperations.get(canvas) || { drawCount: 0, textCount: 0 };

        if (operations.drawCount > 0 || operations.textCount > 0) {
          reportFingerprinting('canvas_toBlob', {
            width,
            height,
            drawOperations: operations.drawCount,
            textOperations: operations.textCount,
            caller: getCallerStack()
          });
        }
      }

      return originalToBlob.apply(this, args);
    } catch (e) {
      return originalToBlob.apply(this, args);
    }
  };

  // Wrap getImageData
  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData = function(...args) {
    try {
      const canvas = this.canvas;
      const width = canvas.width;
      const height = canvas.height;

      if (width < 300 && height < 300 && width * height > 0) {
        reportFingerprinting('canvas_getImageData', {
          width,
          height,
          extractArea: { x: args[0], y: args[1], w: args[2], h: args[3] },
          caller: getCallerStack()
        });
      }

      return originalGetImageData.apply(this, args);
    } catch (e) {
      return originalGetImageData.apply(this, args);
    }
  };

  // Track canvas drawing operations
  const originalFillText = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function(...args) {
    try {
      const canvas = this.canvas;
      const ops = canvasOperations.get(canvas) || { drawCount: 0, textCount: 0 };
      ops.textCount++;
      canvasOperations.set(canvas, ops);
    } catch (e) {}
    return originalFillText.apply(this, args);
  };

  const originalStrokeText = CanvasRenderingContext2D.prototype.strokeText;
  CanvasRenderingContext2D.prototype.strokeText = function(...args) {
    try {
      const canvas = this.canvas;
      const ops = canvasOperations.get(canvas) || { drawCount: 0, textCount: 0 };
      ops.textCount++;
      canvasOperations.set(canvas, ops);
    } catch (e) {}
    return originalStrokeText.apply(this, args);
  };

  const originalFillRect = CanvasRenderingContext2D.prototype.fillRect;
  CanvasRenderingContext2D.prototype.fillRect = function(...args) {
    try {
      const canvas = this.canvas;
      const ops = canvasOperations.get(canvas) || { drawCount: 0, textCount: 0 };
      ops.drawCount++;
      canvasOperations.set(canvas, ops);
    } catch (e) {}
    return originalFillRect.apply(this, args);
  };
})();

// ============================================================================
// AUDIO FINGERPRINTING DETECTION
// ============================================================================

(function() {
  let audioContextCount = 0;
  const audioFingerprinting = { oscillators: 0, compressors: 0, analyser: 0 };

  // Wrap AudioContext constructor
  const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
  if (OriginalAudioContext) {
    const AudioContextWrapper = function(...args) {
      try {
        audioContextCount++;
        const context = new OriginalAudioContext(...args);

        // Wrap createOscillator
        const originalCreateOscillator = context.createOscillator;
        if (originalCreateOscillator) {
          context.createOscillator = function(...args) {
            audioFingerprinting.oscillators++;

            if (audioFingerprinting.oscillators > 2 && audioContextCount === 1) {
              reportFingerprinting('audio_oscillator', {
                oscillatorCount: audioFingerprinting.oscillators,
                compressorCount: audioFingerprinting.compressors,
                analyserCount: audioFingerprinting.analyser,
                caller: getCallerStack()
              });
            }

            return originalCreateOscillator.apply(this, args);
          };
        }

        // Wrap createDynamicsCompressor
        const originalCreateCompressor = context.createDynamicsCompressor;
        if (originalCreateCompressor) {
          context.createDynamicsCompressor = function(...args) {
            audioFingerprinting.compressors++;

            if (audioFingerprinting.compressors > 1 && audioFingerprinting.oscillators > 0) {
              reportFingerprinting('audio_compressor', {
                oscillatorCount: audioFingerprinting.oscillators,
                compressorCount: audioFingerprinting.compressors,
                analyserCount: audioFingerprinting.analyser,
                caller: getCallerStack()
              });
            }

            return originalCreateCompressor.apply(this, args);
          };
        }

        // Wrap createAnalyser
        const originalCreateAnalyser = context.createAnalyser;
        if (originalCreateAnalyser) {
          context.createAnalyser = function(...args) {
            audioFingerprinting.analyser++;

            if (audioFingerprinting.analyser > 0 && audioFingerprinting.oscillators > 0) {
              reportFingerprinting('audio_analyser', {
                oscillatorCount: audioFingerprinting.oscillators,
                compressorCount: audioFingerprinting.compressors,
                analyserCount: audioFingerprinting.analyser,
                caller: getCallerStack()
              });
            }

            return originalCreateAnalyser.apply(this, args);
          };
        }

        return context;
      } catch (e) {
        return new OriginalAudioContext(...args);
      }
    };

    try {
      Object.setPrototypeOf(AudioContextWrapper, OriginalAudioContext);
      Object.setPrototypeOf(AudioContextWrapper.prototype, OriginalAudioContext.prototype);

      window.AudioContext = AudioContextWrapper;
      if (window.webkitAudioContext) {
        window.webkitAudioContext = AudioContextWrapper;
      }
    } catch (e) {}
  }
})();

// ============================================================================
// WEBGL FINGERPRINTING DETECTION
// ============================================================================

(function() {
  const suspiciousParameters = [
    'UNMASKED_VENDOR_WEBGL',
    'UNMASKED_RENDERER_WEBGL',
    'MAX_TEXTURE_SIZE',
    'MAX_VIEWPORT_DIMS',
    'MAX_CUBE_MAP_TEXTURE_SIZE',
    'MAX_RENDERBUFFER_SIZE',
    'MAX_VERTEX_ATTRIBS',
    'MAX_VERTEX_UNIFORM_VECTORS',
    'MAX_VARYING_VECTORS',
    'MAX_FRAGMENT_UNIFORM_VECTORS',
    'SHADING_LANGUAGE_VERSION',
    'VERSION'
  ];

  const parameterQueries = new Map();

  // Wrap getParameter for WebGLRenderingContext
  if (window.WebGLRenderingContext) {
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(pname) {
      try {
        let paramName = pname;
        for (const key in WebGLRenderingContext) {
          if (WebGLRenderingContext[key] === pname && key.includes('UNMASKED')) {
            paramName = key;
            break;
          }
        }

        const count = parameterQueries.get(paramName) || 0;
        parameterQueries.set(paramName, count + 1);

        if (suspiciousParameters.some(p => String(paramName).includes(p))) {
          let suspiciousCount = 0;
          for (const [key, val] of parameterQueries) {
            if (suspiciousParameters.some(p => String(key).includes(p))) {
              suspiciousCount++;
            }
          }

          if (suspiciousCount >= 3) {
            reportFingerprinting('webgl_parameter', {
              parameter: String(paramName),
              totalQueries: Array.from(parameterQueries.entries()),
              suspiciousCount,
              caller: getCallerStack()
            });
          }
        }

        return originalGetParameter.apply(this, [pname]);
      } catch (e) {
        return originalGetParameter.apply(this, [pname]);
      }
    };
  }

  // Wrap getParameter for WebGL2RenderingContext
  if (window.WebGL2RenderingContext) {
    const originalGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function(pname) {
      try {
        let paramName = pname;
        for (const key in WebGL2RenderingContext) {
          if (WebGL2RenderingContext[key] === pname && key.includes('UNMASKED')) {
            paramName = key;
            break;
          }
        }

        const count = parameterQueries.get(paramName) || 0;
        parameterQueries.set(paramName, count + 1);

        if (suspiciousParameters.some(p => String(paramName).includes(p))) {
          let suspiciousCount = 0;
          for (const [key, val] of parameterQueries) {
            if (suspiciousParameters.some(p => String(key).includes(p))) {
              suspiciousCount++;
            }
          }

          if (suspiciousCount >= 3) {
            reportFingerprinting('webgl2_parameter', {
              parameter: String(paramName),
              totalQueries: Array.from(parameterQueries.entries()),
              suspiciousCount,
              caller: getCallerStack()
            });
          }
        }

        return originalGetParameter2.apply(this, [pname]);
      } catch (e) {
        return originalGetParameter2.apply(this, [pname]);
      }
    };
  }
})();

// ============================================================================
// FONT ENUMERATION DETECTION
// ============================================================================

(function() {
  if (!document.fonts) return;

  let fontCheckCount = 0;
  let lastCheckTime = 0;
  const checkedFonts = new Set();

  const originalCheck = document.fonts.check;
  if (originalCheck) {
    document.fonts.check = function(font, ...args) {
      try {
        const now = Date.now();
        fontCheckCount++;
        checkedFonts.add(font);

        // Detect rapid font checking (more than 10 fonts in 1 second)
        if (now - lastCheckTime < 1000) {
          if (fontCheckCount > 10) {
            reportFingerprinting('font_enumeration', {
              checkCount: fontCheckCount,
              uniqueFonts: checkedFonts.size,
              fonts: Array.from(checkedFonts).slice(0, 20),
              timeWindow: now - lastCheckTime,
              caller: getCallerStack()
            });
          }
        } else {
          fontCheckCount = 1;
          lastCheckTime = now;
        }

        return originalCheck.apply(this, [font, ...args]);
      } catch (e) {
        return originalCheck.apply(this, [font, ...args]);
      }
    };
  }
})();

// ============================================================================
// SCREEN AND HARDWARE FINGERPRINTING DETECTION
// ============================================================================

(function() {
  const screenProperties = [
    'width', 'height', 'availWidth', 'availHeight',
    'colorDepth', 'pixelDepth', 'orientation'
  ];
  const screenAccess = new Map();

  screenProperties.forEach(prop => {
    try {
      const originalDescriptor = Object.getOwnPropertyDescriptor(Screen.prototype, prop) ||
                               Object.getOwnPropertyDescriptor(window.screen, prop);

      if (originalDescriptor && originalDescriptor.get) {
        Object.defineProperty(window.screen, prop, {
          get: function() {
            try {
              const count = screenAccess.get(prop) || 0;
              screenAccess.set(prop, count + 1);

              if (screenAccess.size >= 4) {
                const totalAccess = Array.from(screenAccess.values()).reduce((a, b) => a + b, 0);
                if (totalAccess >= 8) {
                  reportFingerprinting('screen_properties', {
                    properties: Array.from(screenAccess.entries()),
                    caller: getCallerStack()
                  });
                  screenAccess.clear();
                }
              }
            } catch (e) {}

            return originalDescriptor.get.call(this);
          },
          configurable: true
        });
      }
    } catch (e) {}
  });
})();

// ============================================================================
// PRIVACY-RELATED API MONITORING
// ============================================================================

(function() {
  // Detect geolocation access
  if (navigator.geolocation) {
    const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
    if (originalGetCurrentPosition) {
      navigator.geolocation.getCurrentPosition = function(...args) {
        try {
          reportFingerprinting('geolocation_access', {
            method: 'getCurrentPosition',
            caller: getCallerStack()
          });
        } catch (e) {}
        return originalGetCurrentPosition.apply(this, args);
      };
    }

    const originalWatchPosition = navigator.geolocation.watchPosition;
    if (originalWatchPosition) {
      navigator.geolocation.watchPosition = function(...args) {
        try {
          reportFingerprinting('geolocation_access', {
            method: 'watchPosition',
            caller: getCallerStack()
          });
        } catch (e) {}
        return originalWatchPosition.apply(this, args);
      };
    }
  }

  // Detect media device enumeration
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;
    navigator.mediaDevices.enumerateDevices = function(...args) {
      try {
        reportFingerprinting('device_enumeration', {
          type: 'media_devices',
          caller: getCallerStack()
        });
      } catch (e) {}
      return originalEnumerateDevices.apply(this, args);
    };
  }

  // Detect battery status access
  if (navigator.getBattery) {
    const originalGetBattery = navigator.getBattery;
    navigator.getBattery = function(...args) {
      try {
        reportFingerprinting('battery_status', {
          caller: getCallerStack()
        });
      } catch (e) {}
      return originalGetBattery.apply(this, args);
    };
  }
})();

// ============================================================================
// ENHANCED STORAGE INFO WITH PII PROTECTION
// ============================================================================

/**
 * Get storage info with PII sanitization
 * @param {boolean} includeValues - Whether to include actual values (will be sanitized)
 * @returns {Promise<Object>} - Storage information with PII protection
 */
async function getStorageInfoWithSecurity(includeValues = false) {
  const info = {
    url: window.location.href,
    domain: window.location.hostname,
    localStorage: {
      keys: [],
      items: [],
      totalSize: 0,
      piiDetected: false
    },
    sessionStorage: {
      keys: [],
      items: [],
      totalSize: 0,
      piiDetected: false
    },
    cookies: document.cookie.split(';').filter((c) => c.trim()).length,
    security: {
      httpsEnabled: window.location.protocol === 'https:',
      cspEnabled: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
      sandboxed: window.self !== window.top
    }
  };

  // Get localStorage info with sanitization
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        const sanitized = await sanitizeValue(key, value, includeValues);

        info.localStorage.keys.push(key);
        info.localStorage.totalSize += key.length + value.length;

        if (includeValues || sanitized.redacted) {
          info.localStorage.items.push({
            key,
            ...sanitized
          });
        }

        if (sanitized.piiType) {
          info.localStorage.piiDetected = true;
        }
      }
    }
  } catch (error) {
    console.warn('Cannot access localStorage:', error);
  }

  // Get sessionStorage info with sanitization
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key) || '';
        const sanitized = await sanitizeValue(key, value, includeValues);

        info.sessionStorage.keys.push(key);
        info.sessionStorage.totalSize += key.length + value.length;

        if (includeValues || sanitized.redacted) {
          info.sessionStorage.items.push({
            key,
            ...sanitized
          });
        }

        if (sanitized.piiType) {
          info.sessionStorage.piiDetected = true;
        }
      }
    }
  } catch (error) {
    console.warn('Cannot access sessionStorage:', error);
  }

  return info;
}

console.log('Security features loaded: Fingerprint detection and PII protection active');