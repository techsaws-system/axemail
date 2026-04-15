import argon2 from "argon2";
import crypto from "node:crypto";

const ARGON2_PREFIX = "$argon2";

export async function hashPassword(value: string) {
  return argon2.hash(value, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(value: string, passwordHash: string) {
  if (passwordHash.startsWith(ARGON2_PREFIX)) {
    return argon2.verify(passwordHash, value);
  }

  const computed = crypto.createHash("sha256").update(value).digest("hex");
  const computedBuffer = Buffer.from(computed, "utf8");
  const hashBuffer = Buffer.from(passwordHash, "utf8");

  if (computedBuffer.length !== hashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(computedBuffer, hashBuffer);
}

export function needsPasswordRehash(passwordHash: string) {
  return !passwordHash.startsWith(ARGON2_PREFIX);
}

export function hashOpaqueToken(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
