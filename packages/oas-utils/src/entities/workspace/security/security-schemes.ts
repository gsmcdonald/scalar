import { deepMerge } from '@/helpers'
import { z } from 'zod'

/** The uid here is actually the name key, called uid to re-use our mutators */
const uid = z.string().optional().default('default')
/* A description for security scheme. CommonMark syntax MAY be used for rich text representation. */
const description = z.string().optional()
/** A generic string value used for filling in fields  */
const value = z.string().optional().default('')

const securitySchemeApiKey = z.object({
  type: z.literal('apiKey'),
  uid,
  description,
  /** REQUIRED. The name of the header, query or cookie parameter to be used. */
  name: z.string().optional().default('default'),
  /** REQUIRED. The location of the API key. Valid values are "query", "header" or "cookie". */
  in: z.enum(['query', 'header', 'cookie']).optional().default('header'),

  value,
})

const securitySchemeHttp = z.object({
  type: z.literal('http'),
  uid,
  description,
  /**
   * REQUIRED. The name of the HTTP Authorization scheme to be used in the Authorization header as defined in
   * [RFC7235]. The values used SHOULD be registered in the IANA Authentication Scheme registry.
   */
  scheme: z.enum(['basic', 'bearer']).optional().default('basic'),
  /**
   * A hint to the client to identify how the bearer token is formatted.
   * Bearer tokens are usually generated by an authorization server, so
   * this information is primarily for documentation purposes.
   */
  bearerFormat: z
    .union([z.literal('JWT'), z.string()])
    .optional()
    .default('JWT'),

  value,
  secondValue: value,
})

/**
 * REQUIRED. The authorization URL to be used for this flow. This MUST be in
 * the form of a URL. The OAuth2 standard requires the use of TLS.
 */
const authorizationUrl = z.string().optional().default('https://scalar.com')

/** REQUIRED. The token URL to be used for this flow. This MUST be in the
 * form of a URL. The OAuth2 standard requires the use of TLS.
 */
const tokenUrl = z.string().optional().default('https://scalar.com')

/** The URL to be used for obtaining refresh tokens. This MUST be in the form of a
 * URL. The OAuth2 standard requires the use of TLS.
 */
const refreshUrl = z.string().optional()

/**
 * REQUIRED. The available scopes for the OAuth2 security scheme. A map
 * between the scope name and a short description for it. The map MAY be empty.
 */
const scopes = z
  .union([
    z.map(z.string(), z.string().optional()),
    z.record(z.string(), z.string().optional()),
    z.object({}),
  ])
  .optional()

/** User selected scopes per flow */
const selectedScopes = z.array(z.string()).optional().default([])

const oauthFlowSchema = z
  .object({
    /** Configuration for the OAuth Implicit flow */
    implicit: z
      .object({
        authorizationUrl,
        refreshUrl,
        scopes,

        selectedScopes,
        token: value,
      })
      .optional(),
    /** Configuration for the OAuth Resource Owner Password flow */
    password: z
      .object({
        tokenUrl,
        refreshUrl,
        scopes,

        username: value,
        password: value,
        selectedScopes,
        token: value,
      })
      .optional(),
    /** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
    clientCredentials: z
      .object({
        tokenUrl,
        refreshUrl,
        scopes,

        clientSecret: value,
        selectedScopes,
        token: value,
      })
      .optional(),
    /** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0.*/
    authorizationCode: z
      .object({
        authorizationUrl,
        tokenUrl,
        refreshUrl,
        scopes,

        code: value,
        clientSecret: value,
        selectedScopes,
        token: value,
      })
      .optional(),
  })
  .optional()
  .default({
    implicit: {},
  })

const securitySchemeOauth2 = z.object({
  type: z.literal('oauth2'),
  uid,
  description,
  /** REQUIRED. An object containing configuration information for the flow types supported. */
  flows: oauthFlowSchema,

  clientId: value,
})
export type SecuritySchemeOauth2 = z.infer<typeof securitySchemeOauth2>

const securitySchemeOpenId = z.object({
  type: z.literal('openIdConnect'),
  uid,
  description,
  /**
   * REQUIRED. OpenId Connect URL to discover OAuth2 configuration values. This MUST be in the
   * form of a URL. The OpenID Connect standard requires the use of TLS.
   */
  openIdConnectUrl: z.string().url().optional().default('https://scalar.com'),
})

const securityScheme = z.union([
  securitySchemeApiKey,
  securitySchemeHttp,
  securitySchemeOauth2,
  securitySchemeOpenId,
])

/**
 * Security Scheme Object
 *
 * @see https://spec.openapis.org/oas/latest.html#security-scheme-object
 */
export type SecurityScheme = z.infer<typeof securityScheme>
export type SecuritySchemePayload = z.input<typeof securityScheme>

/** Create Security Scheme with defaults */
export const createSecurityScheme = (payload: SecuritySchemePayload) =>
  deepMerge(securityScheme.parse({ type: payload.type }), payload)
