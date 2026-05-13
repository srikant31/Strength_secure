import crypto from 'crypto';

/**
 * Checks a plain-text password against the Have I Been Pwned API.
 * Uses k-Anonymity model: only the first 5 chars of the SHA-1 hash are sent.
 * 
 * @param {string} password - The plain-text password to check.
 * @returns {Promise<number>} - Returns the number of times the password was in a breach (0 if safe).
 */
export async function checkPasswordBreach(password) {
  if (!password) return 0;

  // Generate SHA-1 hash of the password
  const shasum = crypto.createHash('sha1');
  shasum.update(password);
  const hash = shasum.digest('hex').toUpperCase();

  // Split hash into prefix (first 5 chars) and suffix (the rest)
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) {
      throw new Error(`HIBP API Error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    const lines = text.split('\r\n');
    
    // Check if our hash suffix is in the response list
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix === suffix) {
        return parseInt(countStr, 10);
      }
    }
    
    return 0; // Not found, password is safe
  } catch (error) {
    console.error('Error checking HIBP API:', error);
    // On API failure, we typically bypass instead of blocking the user completely.
    return 0;
  }
}
