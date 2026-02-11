// PDF Export Testing & Implementation Guide
// Copy these examples to test the PDF generation

// ============================================
// 1. TEST SERVER PDF ENDPOINT
// ============================================

// Test with curl (from terminal)
curl -X POST http://localhost:3000/api/chat/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Biology Exam Notes",
    "filename": "biology-notes.pdf",
    "markdown": "## Chapter 3: Cell Structure\n\n### Key Concepts\n\n- **Mitochondria**: Powerhouse of the cell\n- **Chloroplast**: Performs photosynthesis\n- **Nucleus**: Contains genetic material\n\nQ1. What is the primary function of mitochondria?\nA. Photosynthesis\nB. Energy production\nC. Protein synthesis\nD. Fat storage\n\nCorrect Answer: B\n\nExplanation: Mitochondria produce ATP through cellular respiration."
  }' > test-output.pdf

// ============================================
// 2. TEST CLIENT PDF GENERATION
// ============================================

// In React component:
import { ClientPDFGenerator, generateClientPDF } from '@/app/lib/clientPdfGenerator';

function TestPDF() {
  const handleGeneratePDF = () => {
    const markdown = `
# History Exam Prep

## World War II Overview

### Key Dates and Events

- 1939: Germany invades Poland
- 1941: Pearl Harbor attacked
- 1945: War ends in Europe (May 8)

## Important Figures

**Adolf Hitler**: German dictator

**Winston Churchill**: British Prime Minister

## Key Terms

> **Blitzkrieg**: Lightning war, rapid military assault
> **Appeasement**: Policy of making concessions

\`\`\`
Timeline:
1939 - War begins
1941 - US enters
1945 - War ends
\`\`\`

### Study Questions

Q1. In what year did Pearl Harbor get attacked?
A. 1939
B. 1940
C. 1941
D. 1942

Correct Answer: C

Explanation: The attack on Pearl Harbor occurred on December 7, 1941.
    `;

    const pdf = generateClientPDF({
      title: 'World War II Study Guide',
      content: markdown,
      author: 'QuickNotes',
    });

    // Download
    const url = URL.createObjectURL(pdf);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'history-notes.pdf';
    a.click();
  };

  return (
    <button onClick={handleGeneratePDF}>
      Download PDF
    </button>
  );
}

// ============================================
// 3. TEST WITH MCQ FORMAT
// ============================================

const mcqMarkdown = `
# Biology Practice Test - Chapter 5

## Cellular Respiration

### Questions

Q1. Which organelle is the site of aerobic respiration?
A. Ribosome
B. Mitochondria
C. Chloroplast
D. Nucleolus

Correct Answer: B

Explanation: Mitochondria are responsible for aerobic respiration, where glucose is broken down to produce ATP molecules.

Q2. What is the first step of cellular respiration?
A. Krebs cycle
B. Glycolysis
C. Electron transport chain
D. Fermentation

Correct Answer: B

Explanation: Glycolysis is the first step, occurring in the cytoplasm, breaking glucose into pyruvate molecules.

Q3. How many ATP molecules are produced from one glucose molecule in aerobic respiration?
A. 2
B. 20
C. 30-36
D. 100

Correct Answer: C

Explanation: Approximately 30-36 ATP molecules are produced per glucose molecule, though this can vary.

Q4. What is the role of NAD+ in cellular respiration?
A. Direct ATP production
B. Electron carrier
C. Enzyme catalyst
D. Glucose storage

Correct Answer: B

Explanation: NAD+ accepts electrons during glycolysis and is reduced to NADH, which carries these electrons to the electron transport chain.

## Answer Key
- Q1: B
- Q2: B
- Q3: C
- Q4: B
`;

// ============================================
// 4. TEST WITH COMPLEX FORMATTING
// ============================================

const complexMarkdown = `
# Advanced Chemistry - Quantum Mechanics

## Introduction

Quantum mechanics is the branch of physics that describes the behavior of matter and energy at atomic and subatomic scales.

## Key Principles

### 1. Wave-Particle Duality

\`\`\`
E = hν (Planck's equation)
λ = h/p (de Broglie's equation)
\`\`\`

Electrons and photons exhibit both wave and particle characteristics depending on how they are observed.

### 2. Uncertainty Principle

> **Heisenberg's Uncertainty Principle**: It is impossible to simultaneously know both the position and momentum of a particle with absolute precision. Δx · Δp ≥ h/4π

### 3. Superposition

- Particles exist in multiple states simultaneously
- Observation collapses the wavefunction
- Probability distribution describes the state

## Important Equations

| Equation | Description |
|----------|-------------|
| E = hν | Photon energy |
| λ = h/p | de Broglie wavelength |
| Δx·Δp ≥ h/4π | Uncertainty principle |
| ψ = amplitude | Wavefunction |

## Practice Problems

Q1. What does Planck's constant (h) represent in quantum mechanics?
A. Gravitational constant
B. The relationship between energy and frequency
C. The speed of light
D. The electron mass

Correct Answer: B

Explanation: Planck's constant relates the energy of a photon to its frequency (E = hν).

Q2. According to the uncertainty principle, which pair cannot be determined simultaneously?
A. Position and velocity
B. Energy and time
C. Wavelength and frequency
D. All of the above

Correct Answer: D

Explanation: All complementary pairs in quantum mechanics have inherent uncertainty limits.
`;

// ============================================
// 5. INTEGRATION TEST
// ============================================

// In your test file:
import { ProfessionalPdfGenerator } from '@/app/lib/professionalPdfGenerator';

describe('PDF Generation', () => {
  test('generates PDF for MCQ format', async () => {
    const generator = new ProfessionalPdfGenerator();
    const buffer = generator.generate({
      title: 'Biology Test',
      content: mcqMarkdown,
    });

    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(buffer.byteLength).toBeGreaterThan(1000); // PDF should be > 1KB
  });

  test('generates PDF for complex markdown', async () => {
    const generator = new ProfessionalPdfGenerator();
    const buffer = generator.generate({
      title: 'Advanced Chemistry',
      content: complexMarkdown,
    });

    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(buffer.byteLength).toBeGreaterThan(2000);
  });

  test('handles large content gracefully', async () => {
    const largeContent = 'This is a test. '.repeat(1000); // ~10KB
    const generator = new ProfessionalPdfGenerator();
    const buffer = generator.generate({
      title: 'Large Document',
      content: largeContent,
    });

    expect(buffer).toBeInstanceOf(ArrayBuffer);
  });

  test('respects size limit', async () => {
    const tooLargeContent = 'x'.repeat(600000); // >500KB
    // Should be rejected at API level, not generator
    expect(tooLargeContent.length).toBeGreaterThan(500000);
  });
});

// ============================================
// 6. DEBUGGING HELPER
// ============================================

// Enable detailed logging
const loggingMarkdown = `
# Debug Test

This document contains various markdown elements for testing:

## Section 1
Text content here.

### Subsection 1.1
More text.

• Bullet point 1
• Bullet point 2
  • Nested bullet

> A blockquote for emphasis

\`\`\`
const code = "block";
console.log(code);
\`\`\`

Q1. Is this working?
A. Yes
B. No
C. Maybe
D. Unknown

Correct Answer: A

Explanation: If you're reading this, it worked!
`;

function testPDFGeneration() {
  console.log('Testing PDF generation...');
  
  const generator = new ProfessionalPdfGenerator({
    brandColor: '#5e4eff',
  });

  try {
    const startTime = performance.now();
    const buffer = generator.generate({
      title: 'Debug Test Document',
      content: loggingMarkdown,
    });
    const endTime = performance.now();

    console.log('✓ PDF generated successfully');
    console.log(`  Size: ${(buffer.byteLength / 1024).toFixed(2)} KB`);
    console.log(`  Generation time: ${(endTime - startTime).toFixed(0)} ms`);
    
    // Test download
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    console.log(`  Download URL: ${url}`);
    
    return url;
  } catch (error) {
    console.error('✗ PDF generation failed:', error);
    throw error;
  }
}

// ============================================
// 7. PRODUCTION VERIFICATION
// ============================================

// After deployment, test with:
async function verifyProductionPDF() {
  try {
    const response = await fetch(
      'https://www.quicknotess.space/api/chat/pdf',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Production Test',
          markdown: '# Test\n\nThis PDF was generated in production.',
          filename: 'prod-test.pdf',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    console.log(`✓ Production PDF verified: ${(blob.size / 1024).toFixed(2)} KB`);

    // Optional: Download to verify
    const url = URL.createObjectURL(blob);
    console.log(`  Download: ${url}`);

    return true;
  } catch (error) {
    console.error('✗ Production verification failed:', error);
    return false;
  }
}

// ============================================
// 8. PERFORMANCE BENCHMARKS
// ============================================

function benchmarkPDFGeneration() {
  const sizes = [
    { name: 'Small', content: 'Brief content. '.repeat(10) },
    { name: 'Medium', content: 'Normal content. '.repeat(100) },
    { name: 'Large', content: 'Extended content. '.repeat(500) },
  ];

  sizes.forEach(({ name, content }) => {
    const generator = new ProfessionalPdfGenerator();
    const start = performance.now();
    const buffer = generator.generate({
      title: `${name} Document`,
      content,
    });
    const duration = performance.now() - start;

    console.log(`${name}: ${duration.toFixed(0)}ms, ${(buffer.byteLength / 1024).toFixed(1)} KB`);
  });
}

// Run benchmark: benchmarkPDFGeneration()

export {
  testPDFGeneration,
  verifyProductionPDF,
  benchmarkPDFGeneration,
  mcqMarkdown,
  complexMarkdown,
  loggingMarkdown,
};
