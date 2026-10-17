const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = 60 * 60 * 24;

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signToken(payload) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET belum dikonfigurasi.");
  }

  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL,
  });
  const content = `${header}.${body}`;
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(content)
    .digest("base64url");

  return `${content}.${signature}`;
}

function verifyToken(token) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET belum dikonfigurasi.");

  const [header, body, signature] = String(token).split(".");
  if (!header || !body || !signature) return null;

  const content = `${header}.${body}`;
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(content)
    .digest();
  const receivedSignature = Buffer.from(signature, "base64url");

  if (
    receivedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");
  if (!salt || !hash) return false;

  const derivedKey = await scrypt(password, salt, 64);
  const expectedHash = Buffer.from(hash, "hex");
  return (
    expectedHash.length === derivedKey.length &&
    crypto.timingSafeEqual(expectedHash, derivedKey)
  );
}

module.exports = {
  signToken,
  verifyToken,
  hashPassword,
  comparePassword,
};
