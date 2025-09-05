/**
 * Notification Templates System
 *
 * Provides predefined templates for common notification types
 * with variable substitution support
 */
import type { NotificationCategory } from '@lib/types/notification-center';

export interface NotificationTemplate {
  /** Template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Notification category */
  category: NotificationCategory;
  /** Default priority */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Default notification type */
  type: 'changelog' | 'message';
  /** Title template with variables */
  title: string;
  /** Content template with variables */
  content: string;
  /** Template variables */
  variables: TemplateVariable[];
  /** Default target roles */
  defaultTargetRoles: string[];
  /** Template tags for categorization */
  tags: string[];
}

export interface TemplateVariable {
  /** Variable name (without braces) */
  name: string;
  /** Variable description */
  description: string;
  /** Variable type */
  type: 'string' | 'number' | 'date' | 'url' | 'email';
  /** Whether variable is required */
  required: boolean;
  /** Default value if any */
  defaultValue?: string;
  /** Example value */
  example?: string;
}

/**
 * Predefined notification templates
 */
export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  token_warning: {
    id: 'token_warning',
    name: 'Token Usage Warning',
    description: 'Warning notification when token usage reaches threshold',
    category: 'token_usage',
    priority: 'medium',
    type: 'message',
    title: 'Token Usage Warning',
    content: `Your token usage has reached {percentage}%. Please control your usage to avoid service interruption.

Current Status:
• Used: {currentUsage} tokens
• Total Limit: {limit} tokens
• Usage Rate: {percentage}%
• Updated: {updateTime}

Recommended Actions:
• Check recent usage records
• Optimize API call frequency
• Consider upgrading service plan

If you have any questions, please contact technical support.`,
    variables: [
      {
        name: 'percentage',
        description: 'Usage percentage',
        type: 'number',
        required: true,
        example: '85',
      },
      {
        name: 'currentUsage',
        description: 'Current usage amount',
        type: 'number',
        required: true,
        example: '8500',
      },
      {
        name: 'limit',
        description: 'Total limit',
        type: 'number',
        required: true,
        example: '10000',
      },
      {
        name: 'updateTime',
        description: 'Update time',
        type: 'date',
        required: true,
        example: '2024-01-20 14:30',
      },
    ],
    defaultTargetRoles: ['user'],
    tags: ['token', 'usage', 'warning', 'system'],
  },

  agent_completed: {
    id: 'agent_completed',
    name: 'Agent Execution Completed',
    description: 'Notification for successful AI Agent execution completion',
    category: 'agent_result',
    priority: 'low',
    type: 'message',
    title: 'Agent Execution Completed',
    content: `Agent "{agentName}" has been successfully executed.

Execution Information:
• Agent Name: {agentName}
• Execution Time: {duration}
• Completion Time: {completedAt}
• Status: Success

Execution Result:
{result}

You can view detailed execution logs and result data in the Agent management page.`,
    variables: [
      {
        name: 'agentName',
        description: 'Agent name',
        type: 'string',
        required: true,
        example: 'DataAnalyzer',
      },
      {
        name: 'duration',
        description: 'Execution duration',
        type: 'string',
        required: true,
        example: '2 minutes 38 seconds',
      },
      {
        name: 'completedAt',
        description: 'Completion time',
        type: 'date',
        required: true,
        example: '2024-01-20 15:45',
      },
      {
        name: 'result',
        description: 'Execution result description',
        type: 'string',
        required: true,
        example: 'Successfully processed 1000 data records',
      },
    ],
    defaultTargetRoles: ['user'],
    tags: ['agent', 'completion', 'success', 'automation'],
  },

  agent_failed: {
    id: 'agent_failed',
    name: 'Agent Execution Failed',
    description: 'Error notification for failed AI Agent execution',
    category: 'agent_result',
    priority: 'medium',
    type: 'message',
    title: 'Agent Execution Failed',
    content: `Agent "{agentName}" execution failed. Please check configuration and input data.

Error Information:
• Agent Name: {agentName}
• Failure Time: {failedAt}
• Execution Duration: {duration}
• Error Type: {errorType}

Error Details:
{errorMessage}

Recommended Actions:
• Check input data format
• Verify Agent configuration parameters
• View detailed error logs
• Contact technical support (if needed)

You can re-execute or modify configuration in the Agent management page.`,
    variables: [
      {
        name: 'agentName',
        description: 'Agent name',
        type: 'string',
        required: true,
        example: 'DataProcessor',
      },
      {
        name: 'failedAt',
        description: 'Failure time',
        type: 'date',
        required: true,
        example: '2024-01-20 15:30',
      },
      {
        name: 'duration',
        description: 'Execution duration',
        type: 'string',
        required: true,
        example: '45 seconds',
      },
      {
        name: 'errorType',
        description: 'Error type',
        type: 'string',
        required: true,
        example: 'Data format error',
      },
      {
        name: 'errorMessage',
        description: 'Error details',
        type: 'string',
        required: true,
        example:
          'Input file format not supported, please use CSV or Excel format',
      },
    ],
    defaultTargetRoles: ['user'],
    tags: ['agent', 'failure', 'error', 'troubleshooting'],
  },

  maintenance_notice: {
    id: 'maintenance_notice',
    name: 'System Maintenance Notice',
    description: 'Advance notice for system maintenance and upgrades',
    category: 'system_maintenance',
    priority: 'high',
    type: 'message',
    title: 'System Maintenance Notice',
    content: `System will undergo routine maintenance at {startTime}, expected to last {duration}.

Maintenance Details:
• Start Time: {startTime}
• End Time: {endTime}
• Maintenance Type: {maintenanceType}
• Affected Services: {affectedServices}

Potential Impact During Maintenance:
• Temporary service interruption
• Data synchronization delays
• Temporary unavailability of features
• Login may be affected

Important Reminder:
Please save your work progress before maintenance begins to avoid data loss.

All services will return to normal after maintenance completion. For urgent issues, please contact technical support.

Thank you for your understanding and cooperation!`,
    variables: [
      {
        name: 'startTime',
        description: 'Maintenance start time',
        type: 'date',
        required: true,
        example: '2024-01-20 23:00',
      },
      {
        name: 'endTime',
        description: 'Maintenance end time',
        type: 'date',
        required: true,
        example: '2024-01-21 01:00',
      },
      {
        name: 'duration',
        description: 'Maintenance duration',
        type: 'string',
        required: true,
        example: '2 hours',
      },
      {
        name: 'maintenanceType',
        description: 'Maintenance type',
        type: 'string',
        required: true,
        example: 'Database upgrade',
      },
      {
        name: 'affectedServices',
        description: 'Affected services',
        type: 'string',
        required: true,
        example: 'All online services',
      },
    ],
    defaultTargetRoles: ['user', 'admin'],
    tags: ['maintenance', 'system', 'downtime', 'upgrade'],
  },

  security_alert: {
    id: 'security_alert',
    name: 'Security Alert',
    description: 'Urgent security-related warning notification',
    category: 'security_alert',
    priority: 'critical',
    type: 'message',
    title: 'Security Alert',
    content: `Abnormal activity detected on your account. Please take immediate security measures.

Abnormal Details:
• Detection Time: {detectedAt}
• Alert Type: {alertType}
• Source Location: {location}
• IP Address: {ipAddress}
• Device Information: {deviceInfo}

Security Recommendations:
1. Change your account password immediately
2. Check account activity records
3. Enable two-factor authentication (if not enabled)
4. Log out from all devices
5. Check account-bound email and phone

Detailed Information:
{details}

If this is not your operation, please contact our security team immediately.

Security Hotline: {securityHotline}
Support Email: {supportEmail}`,
    variables: [
      {
        name: 'detectedAt',
        description: 'Detection time',
        type: 'date',
        required: true,
        example: '2024-01-20 14:30',
      },
      {
        name: 'alertType',
        description: 'Alert type',
        type: 'string',
        required: true,
        example: 'Unusual login location',
      },
      {
        name: 'location',
        description: 'Source location',
        type: 'string',
        required: true,
        example: 'Beijing, China',
      },
      {
        name: 'ipAddress',
        description: 'IP address',
        type: 'string',
        required: true,
        example: '192.168.1.100',
      },
      {
        name: 'deviceInfo',
        description: 'Device information',
        type: 'string',
        required: true,
        example: 'Chrome/Windows',
      },
      {
        name: 'details',
        description: 'Detailed information',
        type: 'string',
        required: true,
        example:
          'Attempt to access sensitive features from unauthorized device',
      },
      {
        name: 'securityHotline',
        description: 'Security hotline',
        type: 'string',
        required: false,
        example: '400-123-4567',
      },
      {
        name: 'supportEmail',
        description: 'Support email',
        type: 'email',
        required: false,
        example: 'security@example.com',
      },
    ],
    defaultTargetRoles: ['user'],
    tags: ['security', 'alert', 'urgent', 'protection'],
  },

  feature_announcement: {
    id: 'feature_announcement',
    name: 'New Feature Release',
    description: 'Announcement notification for new feature releases',
    category: 'feature',
    priority: 'medium',
    type: 'changelog',
    title: 'New Feature Release: {featureName}',
    content: `We are excited to announce the launch of new feature: {featureName}!

Feature Highlights:
{highlights}

Main Features:
{features}

Usage Guide:
{usage}

Update Details:
• Release Version: {version}
• Release Date: {releaseDate}
• Compatibility: {compatibility}

Get Started Now:
{callToAction}

We believe this new feature will greatly enhance your user experience. If you have any questions or suggestions, please feel free to contact us.

For more details, please visit: {documentationUrl}`,
    variables: [
      {
        name: 'featureName',
        description: 'Feature name',
        type: 'string',
        required: true,
        example: 'AI Smart Assistant',
      },
      {
        name: 'highlights',
        description: 'Feature highlights',
        type: 'string',
        required: true,
        example:
          'Supports multilingual conversation, 50% faster response speed',
      },
      {
        name: 'features',
        description: 'Main features list',
        type: 'string',
        required: true,
        example:
          '• Natural language processing\n• Code generation\n• Document writing',
      },
      {
        name: 'usage',
        description: 'Usage method',
        type: 'string',
        required: true,
        example:
          'Click the AI assistant icon in the bottom right corner to start using',
      },
      {
        name: 'version',
        description: 'Version number',
        type: 'string',
        required: true,
        example: 'v2.1.0',
      },
      {
        name: 'releaseDate',
        description: 'Release date',
        type: 'date',
        required: true,
        example: '2024-01-20',
      },
      {
        name: 'compatibility',
        description: 'Compatibility information',
        type: 'string',
        required: true,
        example: 'Supports all modern browsers',
      },
      {
        name: 'callToAction',
        description: 'Call to action',
        type: 'string',
        required: true,
        example: 'Visit the new feature page to start experiencing',
      },
      {
        name: 'documentationUrl',
        description: 'Documentation link',
        type: 'url',
        required: false,
        example: 'https://docs.example.com/new-feature',
      },
    ],
    defaultTargetRoles: ['user', 'admin'],
    tags: ['feature', 'release', 'announcement', 'update'],
  },

  api_deprecation: {
    id: 'api_deprecation',
    name: 'API Deprecation Notice',
    description: 'Notification for API version deprecation and migration',
    category: 'api_change',
    priority: 'high',
    type: 'changelog',
    title: 'API Deprecation Notice: {apiName}',
    content: `Important Notice: API "{apiName}" will be deprecated on {deprecationDate}.

Deprecation Details:
• API Name: {apiName}
• Current Version: {currentVersion}
• Deprecation Date: {deprecationDate}
• Complete Shutdown Date: {shutdownDate}

New Version Information:
• New API Name: {newApiName}
• New Version: {newVersion}
• New Features: {newFeatures}

Migration Guide:
{migrationSteps}

Important Timeline:
• {deprecationDate} - Deprecation warning begins
• {migrationDeadline} - Recommended migration completion
• {shutdownDate} - Old version completely discontinued

Affected Scope:
{affectedComponents}

Technical Support:
For migration assistance, please contact the technical team:
• Technical Documentation: {documentationUrl}
• Support Email: {supportEmail}
• Migration Tool: {migrationToolUrl}

Please update your integration code promptly to avoid service interruption.`,
    variables: [
      {
        name: 'apiName',
        description: 'API name',
        type: 'string',
        required: true,
        example: 'Legacy Chat API v1.0',
      },
      {
        name: 'currentVersion',
        description: 'Current version',
        type: 'string',
        required: true,
        example: 'v1.0',
      },
      {
        name: 'deprecationDate',
        description: 'Deprecation start date',
        type: 'date',
        required: true,
        example: '2024-03-01',
      },
      {
        name: 'shutdownDate',
        description: 'Complete shutdown date',
        type: 'date',
        required: true,
        example: '2024-06-01',
      },
      {
        name: 'newApiName',
        description: 'New API name',
        type: 'string',
        required: true,
        example: 'Modern Chat API v2.0',
      },
      {
        name: 'newVersion',
        description: 'New version',
        type: 'string',
        required: true,
        example: 'v2.0',
      },
      {
        name: 'newFeatures',
        description: 'New feature features',
        type: 'string',
        required: true,
        example: 'Higher performance, better error handling, enhanced security',
      },
      {
        name: 'migrationSteps',
        description: 'Migration steps',
        type: 'string',
        required: true,
        example:
          '1. Update API endpoints\n2. Modify request format\n3. Test new interfaces',
      },
      {
        name: 'migrationDeadline',
        description: 'Recommended migration deadline',
        type: 'date',
        required: true,
        example: '2024-05-01',
      },
      {
        name: 'affectedComponents',
        description: 'Affected components',
        type: 'string',
        required: true,
        example: 'Chat functionality, message push, real-time notifications',
      },
      {
        name: 'documentationUrl',
        description: 'Technical documentation link',
        type: 'url',
        required: false,
        example: 'https://docs.example.com/api-migration',
      },
      {
        name: 'supportEmail',
        description: 'Support email',
        type: 'email',
        required: false,
        example: 'api-support@example.com',
      },
      {
        name: 'migrationToolUrl',
        description: 'Migration tool link',
        type: 'url',
        required: false,
        example: 'https://tools.example.com/migration',
      },
    ],
    defaultTargetRoles: ['developer', 'admin'],
    tags: ['api', 'deprecation', 'migration', 'breaking-change'],
  },

  user_onboarding: {
    id: 'user_onboarding',
    name: 'User Welcome',
    description: 'New user welcome and onboarding notification',
    category: 'feature_tip',
    priority: 'low',
    type: 'message',
    title: 'Welcome to {platformName}!',
    content: `Dear {username}, welcome to {platformName}!

We are delighted that you have chosen our platform. To help you get started better, we have prepared a complete getting started guide for you.

Quick Start:
1. Complete your profile
2. Browse platform main features
3. View tutorials and documentation
4. Join the user community

Main Features:
{mainFeatures}

Learning Resources:
• Tutorial: {tutorialUrl}
• Documentation: {documentationUrl}
• Community Forum: {communityUrl}
• Help Center: {helpUrl}

Exclusive Offers:
As a new user, you can enjoy:
{specialOffers}

Need Help?
Our customer service team is ready to support you:
• Online Support: {supportChat}
• Service Email: {supportEmail}
• Service Hotline: {supportPhone}

Thank you again for joining us, and enjoy your experience!

{platformName} Team`,
    variables: [
      {
        name: 'username',
        description: 'Username',
        type: 'string',
        required: true,
        example: 'john_doe',
      },
      {
        name: 'platformName',
        description: 'Platform name',
        type: 'string',
        required: true,
        example: 'AgentifUI',
      },
      {
        name: 'mainFeatures',
        description: 'Main features introduction',
        type: 'string',
        required: true,
        example:
          '• AI assistant conversation\n• Smart code generation\n• Project management tools',
      },
      {
        name: 'tutorialUrl',
        description: 'Tutorial link',
        type: 'url',
        required: false,
        example: 'https://tutorial.example.com',
      },
      {
        name: 'documentationUrl',
        description: 'Documentation link',
        type: 'url',
        required: false,
        example: 'https://docs.example.com',
      },
      {
        name: 'communityUrl',
        description: 'Community link',
        type: 'url',
        required: false,
        example: 'https://community.example.com',
      },
      {
        name: 'helpUrl',
        description: 'Help center link',
        type: 'url',
        required: false,
        example: 'https://help.example.com',
      },
      {
        name: 'specialOffers',
        description: 'Exclusive offers',
        type: 'string',
        required: false,
        example: 'First month free trial, additional 1000 tokens',
      },
      {
        name: 'supportChat',
        description: 'Online support',
        type: 'string',
        required: false,
        example: 'Click the chat icon in the bottom right corner',
      },
      {
        name: 'supportEmail',
        description: 'Service email',
        type: 'email',
        required: false,
        example: 'support@example.com',
      },
      {
        name: 'supportPhone',
        description: 'Service hotline',
        type: 'string',
        required: false,
        example: '400-123-4567',
      },
    ],
    defaultTargetRoles: ['user'],
    tags: ['onboarding', 'welcome', 'getting-started', 'tutorial'],
  },
};

/**
 * Template processing utilities
 */
export class NotificationTemplateProcessor {
  /**
   * Process template with variable substitution
   */
  static processTemplate(
    template: NotificationTemplate,
    variables: Record<string, unknown>
  ): { title: string; content: string } {
    let processedTitle = template.title;
    let processedContent = template.content;

    // Replace variables in title and content
    template.variables.forEach(variable => {
      const value =
        variables[variable.name] ||
        variable.defaultValue ||
        `{${variable.name}}`;
      const placeholder = new RegExp(`\\{${variable.name}\\}`, 'g');

      processedTitle = processedTitle.replace(placeholder, String(value));
      processedContent = processedContent.replace(placeholder, String(value));
    });

    return {
      title: processedTitle,
      content: processedContent,
    };
  }

  /**
   * Validate required variables
   */
  static validateVariables(
    template: NotificationTemplate,
    variables: Record<string, unknown>
  ): { isValid: boolean; missingVariables: string[] } {
    const missingVariables = template.variables
      .filter(variable => variable.required && !variables[variable.name])
      .map(variable => variable.name);

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
    };
  }

  /**
   * Get template by ID
   */
  static getTemplate(templateId: string): NotificationTemplate | null {
    return NOTIFICATION_TEMPLATES[templateId] || null;
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(
    category: NotificationCategory
  ): NotificationTemplate[] {
    return Object.values(NOTIFICATION_TEMPLATES).filter(
      template => template.category === category
    );
  }

  /**
   * Get templates by type
   */
  static getTemplatesByType(
    type: 'changelog' | 'message'
  ): NotificationTemplate[] {
    return Object.values(NOTIFICATION_TEMPLATES).filter(
      template => template.type === type
    );
  }

  /**
   * Search templates by name or description
   */
  static searchTemplates(query: string): NotificationTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return Object.values(NOTIFICATION_TEMPLATES).filter(
      template =>
        template.name.toLowerCase().includes(lowercaseQuery) ||
        template.description.toLowerCase().includes(lowercaseQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Get all template categories
   */
  static getAllCategories(): NotificationCategory[] {
    const categories = new Set<NotificationCategory>();
    Object.values(NOTIFICATION_TEMPLATES).forEach(template => {
      categories.add(template.category);
    });
    return Array.from(categories);
  }

  /**
   * Get all template tags
   */
  static getAllTags(): string[] {
    const tags = new Set<string>();
    Object.values(NOTIFICATION_TEMPLATES).forEach(template => {
      template.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }
}

export default NOTIFICATION_TEMPLATES;
