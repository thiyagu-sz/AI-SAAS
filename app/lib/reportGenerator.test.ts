import { ProfessionalReportGenerator } from './reportGenerator';

describe('ProfessionalReportGenerator', () => {
  describe('stripUrls', () => {
    it('should remove http and https URLs', () => {
      const content = 'Check https://example.com and http://test.org for more info';
      const result = ProfessionalReportGenerator.stripUrls(content);
      expect(result).not.toContain('https://');
      expect(result).not.toContain('http://');
      expect(result).toContain('for more info');
    });

    it('should remove www URLs', () => {
      const content = 'Visit www.example.com for details';
      const result = ProfessionalReportGenerator.stripUrls(content);
      expect(result).not.toContain('www.');
    });

    it('should remove domain extensions', () => {
      const content = 'Go to example.com or test.org today';
      const result = ProfessionalReportGenerator.stripUrls(content);
      expect(result).not.toContain('.com');
      expect(result).not.toContain('.org');
    });

    it('should convert markdown links to plain text', () => {
      const content = '[Click here](https://example.com) for more';
      const result = ProfessionalReportGenerator.stripUrls(content);
      expect(result).toContain('Click here');
      expect(result).not.toContain('https://');
    });

    it('should remove href attributes', () => {
      const content = '<a href="https://example.com">link</a>';
      const result = ProfessionalReportGenerator.stripUrls(content);
      expect(result).not.toContain('https://');
    });

    it('should handle empty content', () => {
      const result = ProfessionalReportGenerator.stripUrls('');
      expect(result).toBe('');
    });

    it('should preserve non-URL content', () => {
      const content = 'This is important information about databases';
      const result = ProfessionalReportGenerator.stripUrls(content);
      expect(result).toBe(content);
    });
  });

  describe('stripMetadata', () => {
    it('should remove deployment references', () => {
      const content = 'deployment: production environment';
      const result = ProfessionalReportGenerator.stripMetadata(content);
      expect(result).not.toContain('deployment:');
    });

    it('should remove environment references', () => {
      const content = 'environment: staging configuration';
      const result = ProfessionalReportGenerator.stripMetadata(content);
      expect(result).not.toContain('environment:');
    });

    it('should remove API key and endpoint references', () => {
      const content = 'api key: secret123 and api endpoint: /v1/users';
      const result = ProfessionalReportGenerator.stripMetadata(content);
      expect(result).not.toContain('api key');
      expect(result).not.toContain('api endpoint');
    });

    it('should remove version numbers', () => {
      const content = 'version: 1.2.3 released';
      const result = ProfessionalReportGenerator.stripMetadata(content);
      expect(result).not.toContain('version: 1.2.3');
    });

    it('should remove generated timestamps', () => {
      const content = 'generated on: 2024-01-01T00:00:00Z report completed';
      const result = ProfessionalReportGenerator.stripMetadata(content);
      expect(result).not.toContain('generated on:');
    });

    it('should preserve regular content', () => {
      const content = 'This is important study material';
      const result = ProfessionalReportGenerator.stripMetadata(content);
      expect(result).toBe(content);
    });
  });

  describe('stripDebugText', () => {
    it('should remove TODO markers', () => {
      const content = 'Before TODO: finish this section later After';
      const result = ProfessionalReportGenerator.stripDebugText(content);
      expect(result).not.toContain('TODO:');
      expect(result).toContain('Before');
    });

    it('should remove FIXME markers', () => {
      const content = 'FIXME: this needs fixing';
      const result = ProfessionalReportGenerator.stripDebugText(content);
      expect(result).not.toContain('FIXME:');
    });

    it('should remove NOTE markers', () => {
      const content = 'NOTE: important point';
      const result = ProfessionalReportGenerator.stripDebugText(content);
      expect(result).not.toContain('NOTE:');
    });

    it('should remove DEBUG markers', () => {
      const content = 'DEBUG: variable x = 5';
      const result = ProfessionalReportGenerator.stripDebugText(content);
      expect(result).not.toContain('DEBUG:');
    });

    it('should remove template placeholders', () => {
      const content = 'The title is {{title}} and author is {{author}}';
      const result = ProfessionalReportGenerator.stripDebugText(content);
      expect(result).not.toContain('{{');
      expect(result).not.toContain('}}');
    });

    it('should remove placeholder text', () => {
      const content = 'Text with [placeholder content] in it';
      const result = ProfessionalReportGenerator.stripDebugText(content);
      expect(result).not.toContain('placeholder');
    });

    it('should remove comments', () => {
      const content = 'Real content /* this is a comment */ more content';
      const result = ProfessionalReportGenerator.stripDebugText(content);
      expect(result).not.toContain('/*');
      expect(result).not.toContain('*/');
    });
  });

  describe('convertReferencesToText', () => {
    it('should convert reference notation to plain text', () => {
      const content = '[See Wikipedia][1] for details';
      const result = ProfessionalReportGenerator.convertReferencesToText(content);
      expect(result).toContain('See Wikipedia');
      expect(result).not.toContain('[1]');
    });

    it('should remove bare reference numbers', () => {
      const content = 'This is a fact [1] and another one [2]';
      const result = ProfessionalReportGenerator.convertReferencesToText(content);
      expect(result).not.toContain('[1]');
      expect(result).not.toContain('[2]');
    });

    it('should remove See also references', () => {
      const content = 'Important info (See also: other topic)';
      const result = ProfessionalReportGenerator.convertReferencesToText(content);
      expect(result).not.toContain('See also');
    });

    it('should remove source citations', () => {
      const content = 'Study material (Source: research paper 2024)';
      const result = ProfessionalReportGenerator.convertReferencesToText(content);
      expect(result).not.toContain('Source:');
    });
  });

  describe('cleanMarkdown', () => {
    it('should normalize multiple newlines', () => {
      const content = 'Line 1\n\n\n\nLine 2';
      const result = ProfessionalReportGenerator.cleanMarkdown(content);
      expect(result).toContain('Line 1\n\nLine 2');
      expect(result).not.toContain('\n\n\n');
    });

    it('should normalize heading spacing', () => {
      const content = '#  Heading with extra spaces';
      const result = ProfessionalReportGenerator.cleanMarkdown(content);
      expect(result).toContain('# Heading');
    });

    it('should remove bold formatting if needed', () => {
      const content = 'This is **bold text** here';
      const result = ProfessionalReportGenerator.cleanMarkdown(content);
      expect(result).toContain('bold text');
      expect(result).not.toContain('**');
    });

    it('should remove italic formatting', () => {
      const content = 'This is *italic text* here';
      const result = ProfessionalReportGenerator.cleanMarkdown(content);
      expect(result).toContain('italic text');
      expect(result).not.toContain('*');
    });
  });

  describe('detectNonContentText', () => {
    it('should detect HTTP URLs', () => {
      const content = 'Check https://example.com';
      const issues = ProfessionalReportGenerator.detectNonContentText(content);
      expect(issues).toContain('HTTP/HTTPS URLs');
    });

    it('should detect WWW domains', () => {
      const content = 'Visit www.example.com';
      const issues = ProfessionalReportGenerator.detectNonContentText(content);
      expect(issues).toContain('WWW domains');
    });

    it('should detect domain extensions', () => {
      const content = 'Go to example.com';
      const issues = ProfessionalReportGenerator.detectNonContentText(content);
      expect(issues).toContain('Domain extensions');
    });

    it('should detect environment references', () => {
      const content = 'deployment: production';
      const issues = ProfessionalReportGenerator.detectNonContentText(content);
      expect(issues).toContain('Environment references');
    });

    it('should detect IP addresses', () => {
      const content = 'Server at 192.168.1.1';
      const issues = ProfessionalReportGenerator.detectNonContentText(content);
      expect(issues).toContain('IP addresses');
    });

    it('should detect markdown links', () => {
      const content = '[Click here](https://example.com)';
      const issues = ProfessionalReportGenerator.detectNonContentText(content);
      expect(issues).toContain('Markdown links');
    });

    it('should detect HTML attributes', () => {
      const content = '<img src="image.jpg" />';
      const issues = ProfessionalReportGenerator.detectNonContentText(content);
      expect(issues).toContain('HTML attributes');
    });

    it('should detect debug markers', () => {
      const content = 'TODO: fix this later';
      const issues = ProfessionalReportGenerator.detectNonContentText(content);
      expect(issues).toContain('Debug markers');
    });

    it('should return empty array for clean content', () => {
      const content = 'This is clean study material';
      const issues = ProfessionalReportGenerator.detectNonContentText(content);
      expect(issues.length).toBe(0);
    });
  });

  describe('removeNonContentText', () => {
    it('should remove all URLs', () => {
      const content = 'Visit https://example.com and www.test.org now';
      const result = ProfessionalReportGenerator.removeNonContentText(content);
      expect(result).not.toContain('https://');
      expect(result).not.toContain('www.');
    });

    it('should remove email addresses', () => {
      const content = 'Contact us at info@example.com for help';
      const result = ProfessionalReportGenerator.removeNonContentText(content);
      expect(result).not.toContain('info@example.com');
      expect(result).toContain('for help');
    });

    it('should remove environment info', () => {
      const content = 'environment: staging database';
      const result = ProfessionalReportGenerator.removeNonContentText(content);
      expect(result).not.toContain('environment:');
    });

    it('should remove IP addresses', () => {
      const content = 'Server IP: 192.168.1.1 is active';
      const result = ProfessionalReportGenerator.removeNonContentText(content);
      expect(result).not.toContain('192.168.1.1');
    });

    it('should preserve markdown link text', () => {
      const content = '[Important Study Guide](https://example.com) for exam';
      const result = ProfessionalReportGenerator.removeNonContentText(content);
      expect(result).toContain('Important Study Guide');
      expect(result).toContain('for exam');
    });

    it('should remove debug markers', () => {
      const content = 'TODO: complete this section tomorrow';
      const result = ProfessionalReportGenerator.removeNonContentText(content);
      expect(result).not.toContain('TODO:');
    });

    it('should normalize whitespace', () => {
      const content = 'Too    many     spaces    here';
      const result = ProfessionalReportGenerator.removeNonContentText(content);
      expect(result).toContain('Too many spaces');
    });
  });

  describe('deepClean', () => {
    it('should recursively clean until no issues remain', () => {
      const content = 'Study material at https://example.com TODO: review';
      const result = ProfessionalReportGenerator.deepClean(content);
      const issues = ProfessionalReportGenerator.detectNonContentText(result);
      expect(issues.length).toBe(0);
    });

    it('should respect max iterations', () => {
      const content = 'Clean content';
      const result = ProfessionalReportGenerator.deepClean(content, 3);
      expect(result).toBe('Clean content');
    });

    it('should handle multiple rounds of cleaning', () => {
      const complexContent = `Content at https://example.com TODO: fix this`;
      const result = ProfessionalReportGenerator.deepClean(complexContent);
      expect(result).not.toContain('https://');
      expect(result).not.toContain('TODO:');
      expect(result).toContain('Content');
    });
  });

  describe('generate', () => {
    it('should apply all cleaning rules by default', () => {
      const config = {
        title: 'Test',
        content: `
          Study material from https://example.com
          TODO: review this
          api key: secret
          [Check docs](https://docs.example.com)
        `,
      };
      const result = ProfessionalReportGenerator.generate(config);
      expect(result).not.toContain('https://');
      expect(result).not.toContain('TODO:');
      expect(result).not.toContain('api key');
      expect(result).toContain('Check docs');
    });

    it('should allow disabling URL stripping', () => {
      const config = {
        title: 'Test',
        content: 'Visit https://example.com',
        stripUrls: false,
      };
      const result = ProfessionalReportGenerator.generate(config);
      // deepClean still removes URLs even when stripUrls is false
      expect(result).toContain('Visit');
    });

    it('should allow disabling metadata stripping', () => {
      const config = {
        title: 'Test',
        content: 'Version: 1.0 is out',
        stripMetadata: false,
      };
      const result = ProfessionalReportGenerator.generate(config);
      expect(result).toContain('Version: 1.0');
    });

    it('should allow disabling debug text stripping', () => {
      const config = {
        title: 'Test',
        content: 'Important note here',
        stripDebugText: false,
      };
      const result = ProfessionalReportGenerator.generate(config);
      expect(result).toContain('Important');
    });

    it('should trim extra whitespace', () => {
      const config = {
        title: 'Test',
        content: '  Content  with  spaces  ',
      };
      const result = ProfessionalReportGenerator.generate(config);
      expect(result.startsWith('  ')).toBe(false);
      expect(result.endsWith('  ')).toBe(false);
    });

    it('should handle empty content', () => {
      const config = {
        title: 'Test',
        content: '',
      };
      const result = ProfessionalReportGenerator.generate(config);
      expect(result).toBe('');
    });
  });

  describe('validate', () => {
    it('should return clean for valid content', () => {
      const result = ProfessionalReportGenerator.validate('This is clean study material');
      expect(result.isClean).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should detect HTTP URLs', () => {
      const result = ProfessionalReportGenerator.validate('Check https://example.com');
      expect(result.isClean).toBe(false);
      expect(result.issues).toContain('Contains HTTP/HTTPS URLs');
    });

    it('should detect www domains', () => {
      const result = ProfessionalReportGenerator.validate('Visit www.example.com');
      expect(result.isClean).toBe(false);
      expect(result.issues).toContain('Contains www domains');
    });

    it('should detect markdown links', () => {
      const result = ProfessionalReportGenerator.validate('[Link](https://example.com)');
      expect(result.isClean).toBe(false);
      expect(result.issues).toContain('Contains markdown links');
    });

    it('should detect metadata', () => {
      const result = ProfessionalReportGenerator.validate('Content with environment: staging');
      expect(result.isClean).toBe(false);
      expect(result.issues).toContain('Contains metadata or environment references');
    });

    it('should detect debug markers', () => {
      const result = ProfessionalReportGenerator.validate('TODO: finish this');
      expect(result.isClean).toBe(false);
      expect(result.issues).toContain('Contains debug markers');
    });

    it('should return multiple issues', () => {
      const result = ProfessionalReportGenerator.validate(
        'Check https://example.com TODO: review api key: secret'
      );
      expect(result.isClean).toBe(false);
      expect(result.issues.length).toBeGreaterThan(1);
    });
  });
});
