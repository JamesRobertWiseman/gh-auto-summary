import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { config } from "../config/index.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("OIDCService");

export class OIDCService {
  constructor() {
    this.jwksClient = jwksClient({
      jwksUri: config.copilot.oidc.jwksUrl,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000, // 10 minutes
    });
  }

  /**
   * Validate an OIDC token from GitHub
   * @param {string} token - The JWT token to validate
   * @returns {Promise<object>} The decoded token payload
   */
  async validateOIDCToken(token) {
    try {
      logger.debug("Validating OIDC token");

      // Get the signing key
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || !decoded.header.kid) {
        throw new Error("Invalid token: missing key ID");
      }

      const key = await this.getSigningKey(decoded.header.kid);

      // Verify the token
      const payload = jwt.verify(token, key, {
        issuer: config.copilot.oidc.issuer,
        audience: config.copilot.oidc.audience,
        algorithms: ["RS256"],
      });

      // Validate required claims
      this.validateClaims(payload);

      logger.debug("OIDC token validated successfully");
      return payload;
    } catch (error) {
      logger.error("OIDC token validation failed:", error.message);
      throw new Error(`Invalid OIDC token: ${error.message}`);
    }
  }

  /**
   * Get the signing key for JWT verification
   * @param {string} kid - The key ID from the JWT header
   * @returns {Promise<string>} The signing key
   */
  async getSigningKey(kid) {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(err);
        } else {
          const signingKey = key.getPublicKey();
          resolve(signingKey);
        }
      });
    });
  }

  /**
   * Validate required OIDC claims
   * @param {object} payload - The decoded JWT payload
   */
  validateClaims(payload) {
    const requiredClaims = ["aud", "sub", "iat", "nbf", "exp", "act"];

    for (const claim of requiredClaims) {
      if (payload[claim] === undefined) {
        throw new Error(`Missing required claim: ${claim}`);
      }
    }

    // Validate timestamps
    const now = Math.floor(Date.now() / 1000);

    if (payload.nbf > now) {
      throw new Error("Token not yet valid (nbf)");
    }

    if (payload.exp < now) {
      throw new Error("Token expired (exp)");
    }

    // Validate audience
    if (payload.aud !== config.copilot.oidc.audience) {
      throw new Error(
        `Invalid audience: expected ${config.copilot.oidc.audience}, got ${payload.aud}`
      );
    }

    // Validate actor (should be constant for Copilot)
    if (!payload.act || payload.act.sub !== "api.copilotchat.com") {
      throw new Error("Invalid actor claim");
    }
  }

  /**
   * Handle token exchange endpoint (RFC 8693)
   * @param {object} body - The form-encoded request body
   * @returns {Promise<object>} The token exchange response
   */
  async handleTokenExchange(body) {
    try {
      logger.debug("Handling token exchange request");

      // Validate request parameters
      if (
        body.grant_type !== "urn:ietf:params:oauth:grant-type:token-exchange"
      ) {
        throw new Error("Invalid grant_type");
      }

      if (
        body.subject_token_type !== "urn:ietf:params:oauth:token-type:id_token"
      ) {
        throw new Error("Invalid subject_token_type");
      }

      if (!body.subject_token) {
        throw new Error("Missing subject_token");
      }

      // Validate the OIDC token
      const payload = await this.validateOIDCToken(body.subject_token);

      // Generate our service token (simplified - in production you'd generate a real token)
      const serviceToken = this.generateServiceToken(payload);

      logger.info(`Token exchange successful for user: ${payload.sub}`);

      return {
        access_token: serviceToken,
        issued_token_type: "urn:ietf:params:oauth:token-type:access_token",
        token_type: "Bearer",
        expires_in: 600, // 10 minutes
      };
    } catch (error) {
      logger.error("Token exchange failed:", error.message);
      throw error;
    }
  }

  /**
   * Generate a service token for the validated user
   * @param {object} payload - The validated OIDC payload
   * @returns {string} The service token
   */
  generateServiceToken(payload) {
    // In a real implementation, you'd generate a proper JWT or session token
    // For now, we'll create a simple token with the user info
    const servicePayload = {
      sub: payload.sub,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 600, // 10 minutes
      service: "github-auto-summary",
    };

    // Sign with your own secret (you should have a separate secret for this)
    return jwt.sign(servicePayload, config.github.privateKey, {
      algorithm: "RS256",
    });
  }

  /**
   * Validate a service token generated by this service
   * @param {string} token - The service token to validate
   * @returns {object} The decoded token payload
   */
  validateServiceToken(token) {
    try {
      return jwt.verify(token, config.github.privateKey, {
        algorithms: ["RS256"],
      });
    } catch (error) {
      throw new Error(`Invalid service token: ${error.message}`);
    }
  }
}

export const oidcService = new OIDCService();
