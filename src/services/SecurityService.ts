import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { EncryptedPayload } from '../types';

const SECURE_STORE_KEY = 'm_notes_master_key_v1';

// Convert Uint8Array to hex string
export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// Convert hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Secure random generator with fallback
export function getRandomBytes(length: number): Uint8Array {
  if (typeof Crypto !== 'undefined' && typeof Crypto.getRandomBytes === 'function') {
    return Crypto.getRandomBytes(length);
  }
  const bytes = new Uint8Array(length);
  if (typeof Crypto !== 'undefined' && typeof Crypto.getRandomValues === 'function') {
    return Crypto.getRandomValues(bytes);
  }
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    return globalThis.crypto.getRandomValues(bytes);
  }
  // Fallback for tests if needed
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

class SecurityService {
  private masterKey: Uint8Array | null = null;
  private keyPromise: Promise<Uint8Array> | null = null;

  /**
   * Override key for automated testing without native hardware Keystore.
   */
  public setCustomKeyForTesting(key: Uint8Array): void {
    if (key.length !== 32) {
      throw new Error('AES-256 requires exactly 32 bytes key');
    }
    this.masterKey = key;
  }

  /**
   * Reset internal key (used in test teardown)
   */
  public resetKeyForTesting(): void {
    this.masterKey = null;
    this.keyPromise = null;
  }

  /**
   * Retrieve or initialize the 256-bit AES master encryption key from Expo SecureStore.
   */
  public async getMasterKey(): Promise<Uint8Array> {
    if (this.masterKey) {
      return this.masterKey;
    }

    if (this.keyPromise) {
      return this.keyPromise;
    }

    this.keyPromise = (async () => {
      try {
        let storedKeyHex: string | null = null;
        try {
          storedKeyHex = await SecureStore.getItemAsync(SECURE_STORE_KEY);
        } catch {
          // Native SecureStore might not be available in standard node test runner
          storedKeyHex = null;
        }

        if (storedKeyHex && storedKeyHex.length === 64) {
          this.masterKey = hexToBytes(storedKeyHex);
          return this.masterKey;
        }

        // Generate a new 256-bit (32 bytes) cryptographically secure random key
        const newKey = getRandomBytes(32);
        const newKeyHex = bytesToHex(newKey);

        try {
          await SecureStore.setItemAsync(SECURE_STORE_KEY, newKeyHex, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          });
        } catch {
          // Fallback in environments without hardware storage
        }

        this.masterKey = newKey;
        return this.masterKey;
      } finally {
        this.keyPromise = null;
      }
    })();

    return this.keyPromise;
  }

  /**
   * Encrypts plaintext string using AES-256-GCM authenticated encryption.
   * GCM mode guarantees confidentiality AND authenticity (tamper-proofing).
   */
  public async encrypt(plaintext: string): Promise<EncryptedPayload> {
    const key = await this.getMasterKey();
    // 12-byte nonce/IV is standard and optimal for AES-GCM
    const iv = getRandomBytes(12);

    const plaintextBytes = new TextEncoder().encode(plaintext);
    const cipher = gcm(key, iv);
    const ciphertextBytes = cipher.encrypt(plaintextBytes);

    return {
      iv: bytesToHex(iv),
      ciphertext: bytesToHex(ciphertextBytes),
      version: 1,
    };
  }

  /**
   * Decrypts AES-256-GCM ciphertext payload and validates authenticity tag.
   * Throws an error immediately if data was modified, corrupted, or forged.
   */
  public async decrypt(payload: EncryptedPayload): Promise<string> {
    const key = await this.getMasterKey();
    const iv = hexToBytes(payload.iv);
    const ciphertextBytes = hexToBytes(payload.ciphertext);

    const cipher = gcm(key, iv);
    const decryptedBytes = cipher.decrypt(ciphertextBytes);

    return new TextDecoder().decode(decryptedBytes);
  }

  /**
   * Check if device supports Biometric Authentication (Fingerprint, Face ID, etc.)
   */
  public async checkBiometrics(): Promise<{
    hasHardware: boolean;
    isEnrolled: boolean;
    supportedTypes: LocalAuthentication.AuthenticationType[];
  }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
      };
    } catch {
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
      };
    }
  }

  /**
   * Prompts the user with the native Android Biometric / PIN authentication dialog.
   */
  public async authenticate(promptMessage: string = 'Unlock M Notes'): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.checkBiometrics();

      // If device doesn't have biometrics enrolled, prompt with device passcode/PIN
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Device PIN / Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Authentication error',
      };
    }
  }
}

export const securityService = new SecurityService();
export default securityService;
