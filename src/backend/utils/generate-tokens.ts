import { randomBytes } from "crypto";

/**
 * Generates a secure, unique string for verification purposes.
 * @param length Desired length of the output string (default: 64 characters)
 * @returns A base64url-safe unique string
 */
export function generateToken(length = 64): string {
  // Calculate the number of bytes needed to achieve the desired length in base64url
  const bytesNeeded = Math.ceil((length * 3) / 4);
  const buffer = randomBytes(bytesNeeded);

  // Convert to base64url: replace + with -, / with _, and remove =
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    .slice(0, length); // Ensure final length
}
