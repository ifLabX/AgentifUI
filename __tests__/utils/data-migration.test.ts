import { isDynamicFormat } from '@lib/types/about-page-components';
import type {
  AboutTranslationData,
  ComponentInstance,
  LegacyAboutData,
  PageContent,
} from '@lib/types/about-page-components';
import {
  createDefaultComponent,
  generateUniqueId,
  migrateAboutTranslationData,
  migrateLegacyToSections,
  validateMigratedData,
} from '@lib/utils/data-migration';

describe('Data Migration Utilities', () => {
  describe('generateUniqueId', () => {
    it('generates unique IDs with correct prefix', () => {
      const id1 = generateUniqueId('comp');
      const id2 = generateUniqueId('comp');

      expect(id1).toMatch(/^comp-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^comp-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('generates IDs with different prefixes', () => {
      const compId = generateUniqueId('comp');
      const sectionId = generateUniqueId('section');

      expect(compId).toMatch(/^comp-/);
      expect(sectionId).toMatch(/^section-/);
    });
  });

  describe('createDefaultComponent', () => {
    it('creates default heading component', () => {
      const component = createDefaultComponent('heading', 'Test Heading');

      expect(component.type).toBe('heading');
      expect(component.props.content).toBe('Test Heading');
      expect(component.props.level).toBe(2);
      expect(component.props.textAlign).toBe('left');
      expect(component.id).toMatch(/^comp-/);
    });

    it('creates default paragraph component', () => {
      const component = createDefaultComponent('paragraph', 'Test paragraph');

      expect(component.type).toBe('paragraph');
      expect(component.props.content).toBe('Test paragraph');
      expect(component.props.textAlign).toBe('left');
    });

    it('creates default button component', () => {
      const component = createDefaultComponent('button', 'Click Me');

      expect(component.type).toBe('button');
      expect(component.props.text).toBe('Click Me');
      expect(component.props.variant).toBe('primary');
      expect(component.props.action).toBe('link');
      expect(component.props.url).toBe('#');
    });

    it('creates default cards component', () => {
      const component = createDefaultComponent('cards');

      expect(component.type).toBe('cards');
      expect(component.props.layout).toBe('grid');
      expect(component.props.items).toEqual([]);
    });

    it('uses fallback content when no content provided', () => {
      const component = createDefaultComponent('heading');

      expect(component.props.content).toBe('New Heading');
    });
  });

  describe('isDynamicFormat', () => {
    it('identifies dynamic format correctly', () => {
      const dynamicData: AboutTranslationData = {
        sections: [
          {
            id: 'section-1',
            layout: 'single-column',
            columns: [[]],
          },
        ],
        metadata: {
          version: '1.0.0',
          lastModified: '2024-01-01T00:00:00.000Z',
          author: 'test',
        },
      };

      expect(isDynamicFormat(dynamicData)).toBe(true);
    });

    it('identifies legacy format correctly', () => {
      const legacyData = {
        title: 'Legacy Title',
        subtitle: 'Legacy Subtitle',
        mission: { description: 'Mission' },
        values: { items: [] },
        buttonText: 'Button',
        copyright: { prefix: '', linkText: '', suffix: '' },
      };

      expect(isDynamicFormat(legacyData as any)).toBe(false);
    });

    it('handles empty/null data', () => {
      expect(isDynamicFormat(null as any)).toBe(false);
      expect(isDynamicFormat({} as any)).toBe(false);
      expect(isDynamicFormat({ sections: [] } as any)).toBe(false);
    });
  });

  describe('migrateLegacyToSections', () => {
    const createLegacyData = (): LegacyAboutData => ({
      title: 'About Our Company',
      subtitle: 'Innovation and Excellence',
      mission: {
        description: 'To provide excellent services to our customers.',
      },
      values: {
        items: [
          { title: 'Quality', description: 'We deliver high-quality products' },
          { title: 'Innovation', description: 'We embrace new technologies' },
        ],
      },
      buttonText: 'Get Started',
      copyright: {
        prefix: `© ${new Date().getFullYear()} `,
        linkText: 'Company Name',
        suffix: '. All rights reserved.',
      },
    });

    it('migrates title and subtitle correctly', () => {
      const legacy = createLegacyData();
      const migrated = migrateLegacyToSections(legacy);

      expect(migrated.sections).toHaveLength(5); // title, mission, values, button, copyright

      const titleSection = migrated.sections[0];
      expect(titleSection.layout).toBe('single-column');
      expect(titleSection.columns[0]).toHaveLength(2); // title + subtitle

      expect(titleSection.columns[0][0].type).toBe('heading');
      expect(titleSection.columns[0][0].props.content).toBe(
        'About Our Company'
      );
      expect(titleSection.columns[0][0].props.level).toBe(1);
      expect(titleSection.columns[0][0].props.textAlign).toBe('center');

      expect(titleSection.columns[0][1].type).toBe('paragraph');
      expect(titleSection.columns[0][1].props.content).toBe(
        'Innovation and Excellence'
      );
      expect(titleSection.columns[0][1].props.textAlign).toBe('center');
    });

    it('migrates mission section correctly', () => {
      const legacy = createLegacyData();
      const migrated = migrateLegacyToSections(legacy);

      const missionSection = migrated.sections[1];
      expect(missionSection.columns[0]).toHaveLength(2); // heading + paragraph

      expect(missionSection.columns[0][0].type).toBe('heading');
      expect(missionSection.columns[0][0].props.content).toBe('Our Mission');

      expect(missionSection.columns[0][1].type).toBe('paragraph');
      expect(missionSection.columns[0][1].props.content).toBe(
        'To provide excellent services to our customers.'
      );
    });

    it('migrates values section with cards correctly', () => {
      const legacy = createLegacyData();
      const migrated = migrateLegacyToSections(legacy);

      const valuesSection = migrated.sections[2];
      expect(valuesSection.columns[0]).toHaveLength(2); // heading + cards

      expect(valuesSection.columns[0][0].type).toBe('heading');
      expect(valuesSection.columns[0][0].props.content).toBe('Our Values');

      expect(valuesSection.columns[0][1].type).toBe('cards');
      expect(valuesSection.columns[0][1].props.items).toEqual([
        { title: 'Quality', description: 'We deliver high-quality products' },
        { title: 'Innovation', description: 'We embrace new technologies' },
      ]);
    });

    it('migrates button section correctly', () => {
      const legacy = createLegacyData();
      const migrated = migrateLegacyToSections(legacy);

      const buttonSection = migrated.sections[3];
      expect(buttonSection.columns[0]).toHaveLength(1);

      const buttonComponent = buttonSection.columns[0][0];
      expect(buttonComponent.type).toBe('button');
      expect(buttonComponent.props.text).toBe('Get Started');
      expect(buttonComponent.props.textAlign).toBe('center');
    });

    it('migrates copyright section correctly', () => {
      const legacy = createLegacyData();
      const migrated = migrateLegacyToSections(legacy);

      const copyrightSection = migrated.sections[4];
      expect(copyrightSection.columns[0]).toHaveLength(1);

      const copyrightComponent = copyrightSection.columns[0][0];
      expect(copyrightComponent.type).toBe('paragraph');
      expect(copyrightComponent.props.content).toContain(
        new Date().getFullYear().toString()
      ); // Current year
      expect(copyrightComponent.props.content).toContain('Company Name');
      expect(copyrightComponent.props.textAlign).toBe('center');
    });

    it('handles missing optional fields', () => {
      const minimal: LegacyAboutData = {
        title: 'Title Only',
        subtitle: '',
        mission: { description: '' },
        values: { items: [] },
        buttonText: '',
        copyright: { prefix: '', linkText: '', suffix: '' },
      };

      const migrated = migrateLegacyToSections(minimal);

      // Should only create title section (other sections should be skipped for empty content)
      expect(migrated.sections).toHaveLength(1);
      expect(migrated.sections[0].columns[0][0].props.content).toBe(
        'Title Only'
      );
    });

    it('includes proper metadata', () => {
      const legacy = createLegacyData();
      const migrated = migrateLegacyToSections(legacy);

      expect(migrated.metadata?.version).toBe('1.0.0');
      expect(migrated.metadata?.author).toBe('system-migration');
      expect(migrated.metadata?.lastModified).toBeDefined();
    });
  });

  describe('validateMigratedData', () => {
    const createValidData = (): AboutTranslationData => ({
      sections: [
        {
          id: 'section-1',
          layout: 'single-column',
          columns: [
            [
              {
                id: 'comp-1',
                type: 'heading',
                props: { content: 'Test', level: 1 },
              },
            ],
          ],
        },
      ],
      metadata: {
        version: '1.0.0',
        lastModified: '2024-01-01T00:00:00.000Z',
        author: 'test',
      },
    });

    it('validates correct data successfully', () => {
      const data = createValidData();
      const result = validateMigratedData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects missing sections', () => {
      const data = { sections: [], metadata: {} } as AboutTranslationData;
      const result = validateMigratedData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('迁移后的数据缺少sections');
    });

    it('detects missing section ID', () => {
      const data = createValidData();
      delete (data.sections?.[0] as any).id;

      const result = validateMigratedData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Section 0 缺少ID');
    });

    it('detects missing component properties', () => {
      const data = createValidData();
      delete (data.sections?.[0]?.columns[0][0] as any).props;

      const result = validateMigratedData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Section 0, Column 0, Component 0 缺少props'
      );
    });
  });

  describe('migrateAboutTranslationData', () => {
    it('returns dynamic data unchanged', () => {
      const dynamicData: AboutTranslationData = {
        sections: [
          {
            id: 'section-1',
            layout: 'single-column',
            columns: [[]],
          },
        ],
        metadata: {
          version: '1.0.0',
          lastModified: '2024-01-01',
          author: 'test',
        },
      };

      const result = migrateAboutTranslationData(dynamicData);

      expect(result).toBe(dynamicData); // Should return same object
    });

    it('migrates legacy data to dynamic format', () => {
      const legacyData = {
        title: 'Test Title',
        subtitle: 'Test Subtitle',
        mission: { description: 'Test mission' },
        values: { items: [{ title: 'Value', description: 'Description' }] },
        buttonText: 'Button',
        copyright: { prefix: '© ', linkText: 'Test', suffix: '' },
      } as any;

      const result = migrateAboutTranslationData(legacyData);

      expect(result.sections).toBeDefined();
      expect(result.sections!.length).toBeGreaterThan(0);
      expect(result.metadata?.migrated).toBe(true);
    });
  });
});
