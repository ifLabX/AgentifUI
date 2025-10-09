/**
 * generic CAS unified authentication service
 * support standard CAS 2.0/3.0 protocol clients, configuration-based implementation
 */
import { createClient } from '@lib/supabase/server';
import type { SsoProvider } from '@lib/types/database';
import { normalizeEmail } from '@lib/utils/validation';
import { XMLParser } from 'fast-xml-parser';

// generic CAS config interface
export interface CASConfig {
  id: string; // SSO provider ID
  name: string; // provider name
  baseUrl: string; // CAS server base URL
  serviceUrl: string; // app callback service URL
  version: '2.0' | '3.0'; // CAS protocol version
  timeout: number; // request timeout
  endpoints: {
    login: string;
    logout: string;
    validate: string;
    validate_v3?: string;
  };
  attributesMapping: {
    employee_id: string; // employee number field mapping
    username: string; // username field mapping
    full_name: string; // full name field mapping
    email: string; // email field mapping
  };
  emailDomain: string; // email domain
}

// CAS attribute value types - flexible for different CAS implementations
type CASAttributeValue =
  | string
  | string[]
  | number
  | boolean
  | null
  | undefined
  | Record<string, unknown>;

// CAS user info interface - flexible attributes structure
export interface CASUserInfo {
  employeeNumber: string; // Employee number (primary identifier)
  username: string; // Username
  email?: string; // Email extracted from SSO (new field)
  success: boolean; // Whether validation is successful
  attributes?: {
    name?: string; // Real name (common field)
    username?: string; // Username (common field)
    [key: string]: CASAttributeValue; // Flexible attributes for different CAS implementations
  };
  rawResponse?: string; // Original XML response (for debugging)
}

// CAS validation error type
export interface CASValidationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * generic CAS service implementation class
 */
export class GenericCASService {
  private config: CASConfig;
  private xmlParser: XMLParser;

  constructor(config: CASConfig) {
    this.config = config;

    // initialize XML parser, configure for CAS response
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: false, // disable attribute value auto type conversion
      trimValues: true,
    });
  }

  /**
   * generate CAS login URL
   * @param returnUrl redirect URL after login (optional)
   * @returns CAS login page URL
   */
  generateLoginURL(returnUrl?: string): string {
    try {
      // build service params, if returnUrl, append to callback URL
      const serviceUrl = returnUrl
        ? `${this.config.serviceUrl}?returnUrl=${encodeURIComponent(returnUrl)}`
        : this.config.serviceUrl;

      const params = new URLSearchParams({
        service: serviceUrl,
      });

      const loginUrl = `${this.config.baseUrl}${this.config.endpoints.login}?${params.toString()}`;

      return loginUrl;
    } catch (error) {
      console.error(
        `Failed to generate login URL for ${this.config.name}:`,
        error
      );
      throw new Error(
        `Failed to generate CAS login URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * generate CAS logout URL
   * @param returnUrl redirect URL after logout (optional)
   * @returns CAS logout page URL
   */
  generateLogoutURL(returnUrl?: string): string {
    try {
      const params = new URLSearchParams();

      if (returnUrl) {
        params.set('service', returnUrl);
      }

      const logoutUrl = `${this.config.baseUrl}${this.config.endpoints.logout}${params.toString() ? '?' + params.toString() : ''}`;

      return logoutUrl;
    } catch (error) {
      console.error(
        `Failed to generate logout URL for ${this.config.name}:`,
        error
      );
      throw new Error(
        `Failed to generate CAS logout URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * validate CAS ticket and get user info
   * @param ticket CAS returned ticket
   * @param service service URL (must match service param at login time)
   * @returns user info or validation failure result
   */
  async validateTicket(ticket: string, service: string): Promise<CASUserInfo> {
    if (!ticket || !service) {
      console.error('Missing required parameters for ticket validation');
      return {
        employeeNumber: '',
        username: '',
        success: false,
      };
    }

    try {
      // build validation request params
      const params = new URLSearchParams({
        service: service,
        ticket: ticket,
      });

      // select validation endpoint based on config
      const validateEndpoint =
        this.config.version === '3.0'
          ? this.config.endpoints.validate_v3 || this.config.endpoints.validate
          : this.config.endpoints.validate;

      const validateUrl = `${this.config.baseUrl}${validateEndpoint}?${params.toString()}`;

      // send validation request
      const response = await fetch(validateUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/xml, text/xml',
          'User-Agent': 'AgentifUI-CAS-SSO-Client/1.0',
        },
        // set timeout to avoid long wait
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();

      return this.parseValidationResponse(xmlText);
    } catch (error) {
      console.error(
        `CAS ticket validation failed for ${this.config.name}:`,
        error
      );
      return {
        employeeNumber: '',
        username: '',
        success: false,
        attributes: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * parse CAS validation response XML
   * @private
   * @param xmlText CAS returned XML response
   * @returns parsed user info
   */
  private parseValidationResponse(xmlText: string): CASUserInfo {
    try {
      const parsed = this.xmlParser.parse(xmlText);

      const serviceResponse = parsed['cas:serviceResponse'];

      if (!serviceResponse) {
        throw new Error('Invalid CAS response: missing cas:serviceResponse');
      }

      // check authentication success
      if (serviceResponse['cas:authenticationSuccess']) {
        const success = serviceResponse['cas:authenticationSuccess'];
        const user = success['cas:user'];
        const attributes = success['cas:attributes'] || {};

        // extract user info based on config attributes mapping
        const employeeNumber = String(
          this.extractAttribute(
            attributes,
            this.config.attributesMapping.employee_id
          ) ||
            user ||
            ''
        );
        const username = String(
          this.extractAttribute(
            attributes,
            this.config.attributesMapping.username
          ) ||
            user ||
            ''
        );
        const fullName = String(
          this.extractAttribute(
            attributes,
            this.config.attributesMapping.full_name
          ) || ''
        );
        const emailAttr = this.extractAttribute(
          attributes,
          this.config.attributesMapping.email
        );
        // Normalize email to lowercase for consistent storage
        const extractedEmail = emailAttr
          ? normalizeEmail(emailAttr as string)
          : '';

        return {
          username,
          employeeNumber,
          email: extractedEmail,
          success: true,
          attributes: {
            name: fullName,
            username: username,
            // save all attributes for later use, remove cas: prefix
            ...Object.keys(attributes).reduce(
              (acc, key) => {
                if (key.startsWith('cas:')) {
                  const cleanKey = key.replace('cas:', '');
                  const value = attributes[key];
                  // Keep the original type (could be string, array, etc.)
                  acc[cleanKey] = value as CASAttributeValue;
                }
                return acc;
              },
              {} as Record<string, CASAttributeValue>
            ),
          },
          rawResponse: xmlText,
        };
      }
      // check authentication failure
      else if (serviceResponse['cas:authenticationFailure']) {
        const failure = serviceResponse['cas:authenticationFailure'];
        const errorCode = failure['@_code'] || 'UNKNOWN_ERROR';
        const errorMessage =
          typeof failure === 'string'
            ? failure
            : failure['#text'] || 'Authentication failed';

        console.error(
          `CAS authentication failed for ${this.config.name}: ${errorCode} - ${errorMessage}`
        );

        return {
          employeeNumber: '',
          username: '',
          success: false,
          attributes: {
            error_code: errorCode,
            error_message: errorMessage,
          },
          rawResponse: xmlText,
        };
      }

      throw new Error(
        'Unexpected CAS response format: no success or failure element found'
      );
    } catch (error) {
      console.error(
        `Failed to parse CAS response for ${this.config.name}:`,
        error
      );
      return {
        employeeNumber: '',
        username: '',
        success: false,
        attributes: {
          parse_error: error instanceof Error ? error.message : String(error),
        },
        rawResponse: xmlText,
      };
    }
  }

  /**
   * extract specified field value from CAS attributes
   * @private
   * @param attributes CAS attributes object
   * @param fieldName field name (supports cas: prefix)
   * @returns field value
   */
  private extractAttribute(
    attributes: Record<string, unknown>,
    fieldName: string
  ): CASAttributeValue {
    // prioritize fields with cas: prefix
    const casFieldName = fieldName.startsWith('cas:')
      ? fieldName
      : `cas:${fieldName}`;
    if (attributes[casFieldName] !== undefined) {
      return attributes[casFieldName] as CASAttributeValue;
    }

    // fallback to fields without prefix
    const plainFieldName = fieldName.replace('cas:', '');
    if (attributes[plainFieldName] !== undefined) {
      return attributes[plainFieldName] as CASAttributeValue;
    }

    return undefined;
  }

  /**
   * get current config info
   * @returns config object (sensitive info masked)
   */
  getConfig(): Partial<CASConfig> {
    return {
      id: this.config.id,
      name: this.config.name,
      baseUrl: this.config.baseUrl,
      version: this.config.version,
      // serviceUrl may contain sensitive info, return only domain part
      serviceUrl: new URL(this.config.serviceUrl).origin + '/***',
    };
  }
}

/**
 * CAS config service - read SSO provider config from database
 */
export class CASConfigService {
  /**
   * get CAS config by provider ID
   * use SECURITY DEFINER function to get config
   * @param providerId SSO provider ID
   * @returns CAS config object
   */
  static async getCASConfig(providerId: string): Promise<CASConfig> {
    const supabase = await createClient();

    // use SECURITY DEFINER function to get full config
    const { data: providers, error } = await supabase.rpc(
      'get_sso_provider_config',
      { provider_id_param: providerId }
    );

    if (error) {
      throw new Error(`Failed to get CAS provider config: ${error.message}`);
    }

    const provider = providers?.[0];
    if (!provider || provider.protocol !== 'CAS') {
      throw new Error(`CAS provider not found or disabled: ${providerId}`);
    }

    const settings = provider.settings as Record<string, unknown>;
    const protocolConfig =
      (settings.protocol_config as Record<string, unknown>) || {};

    // get current app URL for building callback URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error(
        'NEXT_PUBLIC_APP_URL environment variable is required for SSO configuration'
      );
    }

    // Helper function to safely access nested properties
    const getConfigValue = (
      path: string[],
      defaultValue: unknown = ''
    ): unknown => {
      let current: unknown = protocolConfig;
      for (const key of path) {
        if (current && typeof current === 'object' && key in current) {
          current = (current as Record<string, unknown>)[key];
        } else {
          return defaultValue;
        }
      }
      return current;
    };

    return {
      id: provider.id,
      name: provider.name,
      baseUrl: String(getConfigValue(['base_url'], '')),
      serviceUrl: `${appUrl}/api/sso/${provider.id}/callback`,
      version: String(getConfigValue(['version'], '2.0')) as '2.0' | '3.0',
      timeout: Number(getConfigValue(['timeout'], 10000)),
      endpoints: {
        login: String(getConfigValue(['endpoints', 'login'], '/login')),
        logout: String(getConfigValue(['endpoints', 'logout'], '/logout')),
        validate: String(
          getConfigValue(['endpoints', 'validate'], '/serviceValidate')
        ),
        validate_v3: String(
          getConfigValue(['endpoints', 'validate_v3'], '/p3/serviceValidate')
        ),
      },
      attributesMapping: {
        employee_id: String(
          getConfigValue(['attributes_mapping', 'employee_id'], 'cas:user')
        ),
        username: String(
          getConfigValue(['attributes_mapping', 'username'], 'cas:username')
        ),
        full_name: String(
          getConfigValue(['attributes_mapping', 'full_name'], 'cas:name')
        ),
        email: String(
          getConfigValue(['attributes_mapping', 'email'], 'cas:mail')
        ),
      },
      emailDomain:
        provider.settings?.email_domain || process.env.DEFAULT_SSO_EMAIL_DOMAIN,
    };
  }

  /**
   * find CAS provider by name
   * @param name provider name
   * @returns SSO provider info
   */
  static async findCASProviderByName(
    name: string
  ): Promise<SsoProvider | null> {
    const supabase = await createClient();

    const { data: provider, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('name', name)
      .eq('protocol', 'CAS')
      .eq('enabled', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return provider;
  }

  /**
   * get all enabled CAS providers
   * @returns CAS provider list
   */
  static async getEnabledCASProviders(): Promise<SsoProvider[]> {
    const supabase = await createClient();

    const { data: providers, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('protocol', 'CAS')
      .eq('enabled', true)
      .order('display_order');

    if (error) {
      throw error;
    }

    return providers || [];
  }

  /**
   * create generic CAS service instance
   * @param providerId SSO provider ID
   * @returns GenericCASService instance
   */
  static async createCASService(
    providerId: string
  ): Promise<GenericCASService> {
    const config = await this.getCASConfig(providerId);
    return new GenericCASService(config);
  }
}
