/**
 * Professional Report Generator
 * Generates clean, publication-ready documents without URLs, links, or metadata
 */

interface ReportConfig {
  title: string;
  content: string;
  stripUrls?: boolean;
  stripMetadata?: boolean;
  stripDebugText?: boolean;
}

export class ProfessionalReportGenerator {
  /**
   * Strip all URLs and web references from content
   */
  static stripUrls(content: string): string {
    return content
      .replace(/https?:\/\/[^\s)]+/g, '') // Remove http/https URLs
      .replace(/www\.[^\s)]+/g, '') // Remove www URLs
      .replace(/\b[a-zA-Z0-9.-]+\.(com|org|net|io|dev|app|co|uk|de|fr|jp)\b/g, '') // Remove domains
      .replace(/\[([^\]]+)\]\(https?:[^\)]+\)/g, '$1') // Convert links to plain text
      .replace(/href\s*=\s*["'][^"']*["']/g, '') // Remove href attributes
      .replace(/\b(?:https?:|ftp:|mailto:)/g, '') // Remove protocol prefixes
      .trim();
  }

  /**
   * Strip metadata and environment details
   */
  static stripMetadata(content: string): string {
    return content
      .replace(/deployment\s*:/gi, '') // Remove deployment references
      .replace(/environment\s*:/gi, '') // Remove environment references
      .replace(/api\s*(?:key|endpoint)/gi, '') // Remove API references
      .replace(/version\s*:\s*[\d.]+/gi, '') // Remove version numbers
      .replace(/generated\s*on\s*:[^\n]*/gi, '') // Remove generation timestamps
      .replace(/\[.*\]\s*:\s*https?:[^\s]*/g, '') // Remove reference links
      .trim();
  }

  /**
   * Strip founder/developer/creator information
   */
  static stripFounderInfo(content: string): string {
    return content
      .replace(/founder\s*[&:].*?(?=\n|$)/gi, '') // Remove founder lines
      .replace(/developer\s*[&:].*?(?=\n|$)/gi, '') // Remove developer lines
      .replace(/creator\s*[&:].*?(?=\n|$)/gi, '') // Remove creator lines
      .replace(/created\s+by.*?(?=\n|$)/gi, '') // Remove created by
      .replace(/built\s+by.*?(?=\n|$)/gi, '') // Remove built by
      .replace(/owned\s+by.*?(?=\n|$)/gi, '') // Remove owned by
      .replace(/developed\s+by.*?(?=\n|$)/gi, '') // Remove developed by
      .replace(/portfolio\s*[&:].*?(?=\n|$)/gi, '') // Remove portfolio references
      .replace(/thiyagu[^\n]*/gi, '') // Remove any Thiyagu mentions
      .replace(/master'?s?\s+student[^\n]*/gi, '') // Remove student/degree info
      .replace(/vit\s+vellore[^\n]*/gi, '') // Remove university references
      .replace(/freelancer[^\n]*/gi, '') // Remove freelancer mentions
      .replace(/ai\s+&\s+ml[^\n]*/gi, '') // Remove field of study
      .trim();
  }

  /**
   * Strip debug text and placeholders
   */
  static stripDebugText(content: string): string {
    return content
      .replace(/TODO:|FIXME:|NOTE:|DEBUG:/gi, '') // Remove debug markers
      .replace(/\{\{.*?\}\}/g, '') // Remove template placeholders
      .replace(/\[placeholder.*?\]/gi, '') // Remove placeholders
      .replace(/\/\*.*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .trim();
  }

  /**
   * Convert markdown references to plain text
   */
  static convertReferencesToText(content: string): string {
    return content
      .replace(/\[([^\]]+)\]\s*\[\d+\]/g, '$1') // Remove reference notation [text][1]
      .replace(/\[\d+\]/g, '') // Remove bare reference numbers [1]
      .replace(/\(See also:.*?\)/gi, '') // Remove "See also" references
      .replace(/\(Source:.*?\)/gi, '') // Remove source citations
      .trim();
  }

  /**
   * Clean markdown formatting while preserving structure
   */
  static cleanMarkdown(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines to double
      .replace(/^[\s]*#\s+/gm, '# ') // Normalize heading spacing
      .replace(/^[\s]*##\s+/gm, '## ') // Normalize subheading spacing
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold if needed
      .replace(/__(.*?)__/g, '$1') // Remove bold alternate
      .replace(/\*(.*?)\*/g, '$1') // Remove italic if needed
      .replace(/_(.*?)_/g, '$1') // Remove italic alternate
      .trim();
  }

  /**
   * Detect non-content text (URLs, metadata, environment info)
   */
  static detectNonContentText(content: string): string[] {
    const issues: string[] = [];
    
    if (/https?:\/\//.test(content)) issues.push('HTTP/HTTPS URLs');
    if (/www\./.test(content)) issues.push('WWW domains');
    if (/\.(com|org|net|io|dev|app)\b/.test(content)) issues.push('Domain extensions');
    if (/deployment|environment|api|endpoint|server|port|localhost/i.test(content)) issues.push('Environment references');
    if (/\d+\.\d+\.\d+\.\d+/.test(content)) issues.push('IP addresses');
    if (/\[.*\]\(.*\)/g.test(content)) issues.push('Markdown links');
    if (/href\s*=|src\s*=/i.test(content)) issues.push('HTML attributes');
    if (/TODO:|FIXME:|DEBUG:|NOTE:/i.test(content)) issues.push('Debug markers');
    if (/founder|developer|creator|thiyagu|portfolio/i.test(content)) issues.push('Founder/Developer information');
    
    return issues;
  }

  /**
   * Aggressively remove all non-content patterns
   */
  static removeNonContentText(content: string): string {
    return content
      // Remove URLs and protocols
      .replace(/https?:\/\/[^\s)'"]+/g, '')
      .replace(/www\.[^\s)'"]+/g, '')
      .replace(/^https?:\/\/.*/gm, '')
      
      // Remove email-like and domain patterns
      .replace(/[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      .replace(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi, '')
      
      // Remove founder/developer/creator information
      .replace(/founder\s*[&:].*?(?=\n|$)/gi, '')
      .replace(/developer\s*[&:].*?(?=\n|$)/gi, '')
      .replace(/creator\s*[&:].*?(?=\n|$)/gi, '')
      .replace(/thiyagu[^\n]*/gi, '')
      .replace(/portfolio[^\n]*/gi, '')
      
      // Remove environment/deployment info
      .replace(/deployment[\s:]+[^\n]*/gi, '')
      .replace(/environment[\s:]+[^\n]*/gi, '')
      .replace(/\b(?:api[\s_-]?(?:key|endpoint|url|token))[\s:]*[^\n]*/gi, '')
      .replace(/\b(?:localhost|port|server|host)[\s:]*[^\n]*/gi, '')
      .replace(/\b(?:192\.168|10\.0|172\.16)\.[^\s]*/g, '') // IP addresses
      
      // Remove HTML attributes
      .replace(/(?:href|src|data)\s*=\s*["'][^"']*["']/g, '')
      .replace(/(?:href|src|data)\s*=\s*[^\s>]*/g, '')
      
      // Remove markdown links (keep text)
      .replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\s*\[\d+\]/g, '$1')
      
      // Remove debug/placeholder text
      .replace(/\b(?:TODO|FIXME|NOTE|DEBUG|XXX|HACK|BUG)[\s:]*[^\n]*/gi, '')
      .replace(/\{\{.*?\}\}/g, '')
      .replace(/\[(?:placeholder|TODO|FIXME|TBD|PENDING)[^\]]*\]/gi, '')
      
      // Remove source/reference citations
      .replace(/\(source[\s:]*[^\)]*\)/gi, '')
      .replace(/\(see also[\s:]*[^\)]*\)/gi, '')
      .replace(/\[(?:ref|reference|src|source)[\s:]*[^\]]*\]/gi, '')
      
      // Clean up whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/  +/g, ' ')
      
      .trim();
  }

  /**
   * Recursively clean content until no non-content text is detected
   */
  static deepClean(content: string, maxIterations: number = 5): string {
    let cleaned = content;
    let iteration = 0;

    while (iteration < maxIterations) {
      const issues = this.detectNonContentText(cleaned);
      
      if (issues.length === 0) {
        return cleaned;
      }

      console.log(`Cleaning iteration ${iteration + 1}: Removing ${issues.join(', ')}`);
      cleaned = this.removeNonContentText(cleaned);
      iteration++;
    }

    return cleaned;
  }

  /**
   * Main processing function
   */
  static generate(config: ReportConfig): string {
    let content = config.content;

    // Apply all cleaning rules
    if (config.stripUrls !== false) {
      content = this.stripUrls(content);
    }

    if (config.stripMetadata !== false) {
      content = this.stripMetadata(content);
    }

    if (config.stripDebugText !== false) {
      content = this.stripDebugText(content);
    }

    // Always strip founder/developer/creator information
    content = this.stripFounderInfo(content);

    // Convert references to plain text
    content = this.convertReferencesToText(content);

    // Clean markdown
    content = this.cleanMarkdown(content);

    // Apply deep cleaning (recursive)
    content = this.deepClean(content);

    // Remove extra whitespace
    content = content
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .trim();

    return content;
  }

  /**
   * Validate that content is clean (no URLs or metadata)
   */
  static validate(content: string): {
    isClean: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (/https?:\/\//.test(content)) {
      issues.push('Contains HTTP/HTTPS URLs');
    }

    if (/www\./.test(content)) {
      issues.push('Contains www domains');
    }

    if (/\[.*\]\(.*\)/g.test(content)) {
      issues.push('Contains markdown links');
    }

    if (/deployment|environment|api key/i.test(content)) {
      issues.push('Contains metadata or environment references');
    }

    if (/TODO:|FIXME:|DEBUG:/i.test(content)) {
      issues.push('Contains debug markers');
    }

    if (/founder|developer|creator|thiyagu|portfolio/i.test(content)) {
      issues.push('Contains founder or developer information');
    }

    return {
      isClean: issues.length === 0,
      issues,
    };
  }
}

export default ProfessionalReportGenerator;
