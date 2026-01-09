import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import mammoth from 'mammoth';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

interface Chunk {
  content: string;
  start: number;
  end: number;
}

function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push({
      content: text.substring(start, end),
      start,
      end,
    });
    start = end - overlap;
  }

  return chunks;
}

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  console.log(`Extracting text from file: ${file.name}, type: ${fileType}`);

  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Try multiple methods to load pdfjs-dist
      try {
        let pdfjs: any = null;
        
        // Method 1: Try dynamic import with main module
        try {
          const pdfjsModule = await import('pdfjs-dist');
          pdfjs = (pdfjsModule as any).default || pdfjsModule;
          if (pdfjs && pdfjs.getDocument) {
            console.log('✅ Loaded pdfjs-dist via main import');
          }
        } catch (importError) {
          console.log('Main import failed, trying legacy build...');
        }
        
        // Method 2: Try legacy build with dynamic import
        if (!pdfjs || !pdfjs.getDocument) {
          try {
            const legacyModule = await import('pdfjs-dist/legacy/build/pdf.mjs');
            pdfjs = (legacyModule as any).default || legacyModule;
            if (pdfjs && pdfjs.getDocument) {
              console.log('✅ Loaded pdfjs-dist via legacy .mjs');
            }
          } catch (mjsError) {
            console.log('Legacy .mjs import failed, trying .js...');
          }
        }
        
        // Method 3: Try require with createRequire (for CommonJS)
        if (!pdfjs || !pdfjs.getDocument) {
          try {
            const { createRequire } = await import('module');
            const require = createRequire(import.meta.url);
            // Try different paths
            const paths = [
              'pdfjs-dist/legacy/build/pdf.js',
              'pdfjs-dist/build/pdf.js',
              'pdfjs-dist',
            ];
            
            for (const path of paths) {
              try {
                pdfjs = require(path);
                if (pdfjs && pdfjs.getDocument) {
                  console.log(`✅ Loaded pdfjs-dist via require: ${path}`);
                  break;
                }
              } catch (reqError) {
                // Try next path
                continue;
              }
            }
          } catch (requireError) {
            console.log('Require method failed');
          }
        }
        
        if (!pdfjs || !pdfjs.getDocument) {
          throw new Error('Could not load pdfjs-dist. Tried multiple import methods.');
        }
        
        // Load the PDF document
        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(buffer),
          useSystemFonts: true,
          verbosity: 0, // Suppress warnings
        });
        
        const pdfDocument = await loadingTask.promise;
        const numPages = pdfDocument.numPages;
        
        console.log(`📄 PDF loaded: ${numPages} pages`);
        
        // Extract text from all pages
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine all text items from the page
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ');
          
          fullText += pageText + '\n\n';
        }
        
        if (!fullText || fullText.trim().length === 0) {
          throw new Error('PDF appears to be empty or contains no extractable text');
        }
        
        console.log(`✅ Extracted ${fullText.length} characters from PDF`);
        return fullText.trim();
      } catch (parseError) {
        console.error('Error parsing PDF with pdfjs-dist:', parseError);
        
        // Fallback 1: Try pdf2json (simpler, more reliable)
        try {
          console.log('Attempting fallback with pdf2json...');
          const { createRequire } = await import('module');
          const require = createRequire(import.meta.url);
          const PDFParser = require('pdf2json');
          
          return new Promise((resolve, reject) => {
            const pdfParser = new PDFParser(null, 1);
            
            pdfParser.on('pdfParser_dataError', (errData: any) => {
              console.error('pdf2json parse error:', errData);
              reject(new Error(`PDF parsing error: ${errData.parserError}`));
            });
            
            pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
              try {
                // Extract text from all pages
                let fullText = '';
                if (pdfData.Pages && pdfData.Pages.length > 0) {
                  for (const page of pdfData.Pages) {
                    if (page.Texts && page.Texts.length > 0) {
                      for (const textItem of page.Texts) {
                        if (textItem.R && textItem.R.length > 0) {
                          for (const run of textItem.R) {
                            if (run.T) {
                              // Decode URI component if needed
                              try {
                                fullText += decodeURIComponent(run.T) + ' ';
                              } catch {
                                fullText += run.T + ' ';
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
                
                if (!fullText || fullText.trim().length === 0) {
                  reject(new Error('PDF appears to be empty or contains no extractable text'));
                } else {
                  console.log(`✅ Extracted ${fullText.length} characters using pdf2json`);
                  resolve(fullText.trim());
                }
              } catch (extractError) {
                reject(extractError);
              }
            });
            
            // Parse the buffer
            pdfParser.parseBuffer(Buffer.from(buffer));
          });
        } catch (pdf2jsonError) {
          console.error('pdf2json also failed:', pdf2jsonError);
          
          // Fallback 2: Try pdf-parse as last resort
          try {
            console.log('Attempting final fallback with pdf-parse...');
            const { createRequire } = await import('module');
            const require = createRequire(import.meta.url);
            const pdfParseLib = require('pdf-parse');
            
            // Try to use PDFParse class if available
            if (pdfParseLib.PDFParse && typeof pdfParseLib.PDFParse === 'function') {
              // PDFParse is a class - we need to check if it can be called or needs instantiation
              // Some versions export it as a callable class
              try {
                const result = await new Promise((resolve, reject) => {
                  // Try calling as constructor with callback
                  const parser = new pdfParseLib.PDFParse(Buffer.from(buffer), (err: any, data: any) => {
                    if (err) reject(err);
                    else resolve(data);
                  });
                  
                  // If no callback pattern, try direct instantiation
                  if (!parser || typeof parser !== 'object') {
                    // Try synchronous approach
                    try {
                      const directResult = new pdfParseLib.PDFParse(Buffer.from(buffer));
                      if (directResult && directResult.text) {
                        resolve(directResult);
                      } else {
                        // Wait a bit and check again
                        setTimeout(() => {
                          if (directResult && directResult.text) {
                            resolve(directResult);
                          } else {
                            reject(new Error('PDFParse did not return text'));
                          }
                        }, 100);
                      }
                    } catch (syncError) {
                      reject(syncError);
                    }
                  }
                });
                
                const text = (result as any)?.text || '';
                if (text && text.trim().length > 0) {
                  return text;
                }
              } catch (classError) {
                console.error('PDFParse class instantiation failed:', classError);
              }
            }
            
            // Last resort: try default export
            const pdfParseFn = pdfParseLib.default || pdfParseLib;
            if (typeof pdfParseFn === 'function') {
              const data = await pdfParseFn(Buffer.from(buffer));
              const text = data?.text || '';
              if (text && text.trim().length > 0) {
                return text;
              }
            }
          } catch (fallbackError) {
            console.error('Fallback pdf-parse also failed:', fallbackError);
          }
          
          throw new Error(`Failed to parse PDF: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      }
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      const text = result.value || '';
      if (text.trim().length === 0) {
        throw new Error('DOCX file appears to be empty or contains no extractable text');
      }
      return text;
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      fileType === 'application/vnd.ms-powerpoint' ||
      fileName.endsWith('.pptx') ||
      fileName.endsWith('.ppt')
    ) {
      // For PPTX/PPT, return a basic placeholder - full extraction would require additional libraries
      return `[PowerPoint file: ${file.name}]\n\nNote: Full text extraction from PowerPoint files requires additional processing. The file has been uploaded but detailed text extraction is not available for this format.`;
    } else if (fileName.endsWith('.doc')) {
      // Old DOC format - not fully supported
      return `[Word Document: ${file.name}]\n\nNote: Old .doc format is not fully supported. Please convert to .docx for better text extraction.`;
    } else if (fileName.endsWith('.txt')) {
      // Plain text file
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(buffer);
    }

    throw new Error(`Unsupported file type: ${fileType || 'unknown'}. Supported: PDF, DOCX, PPTX, TXT`);
  } catch (error) {
    console.error(`Error in extractTextFromFile for ${file.name}:`, error);
    throw error;
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenAI API key not found. Using simple text-based embedding fallback.');
    // Return a simple hash-based embedding (not ideal but works for basic functionality)
    const hash = text.split('').reduce((acc, char) => {
      const hash = ((acc << 5) - acc) + char.charCodeAt(0);
      return hash & hash;
    }, 0);
    // Return a 384-dimensional vector (common embedding size) based on text hash
    const embedding = new Array(384).fill(0).map((_, i) => 
      Math.sin((hash + i) * 0.1) * 0.1
    );
    return embedding;
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate embedding');
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function generateAINotes(text: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  
  if (!apiKey) {
    console.warn('OpenRouter API key not found. Using placeholder notes.');
    return `# Key Study Notes\n\n## Important Points\n\n${text.substring(0, 500)}...\n\n*Note: AI note generation requires OpenRouter API key.*`;
  }

  try {
    // Limit text to avoid token limits and memory issues
    // Reduced from 12000 to 8000 to prevent memory problems
    const textToProcess = text.length > 8000 ? text.substring(0, 8000) + '\n\n[Content truncated for processing...]' : text;
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Study Notes',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          {
            role: 'system',
            content: `You are an expert study assistant. Your task is to extract and organize KEY NOTES from study materials.

IMPORTANT INSTRUCTIONS:
1. Extract only the MOST IMPORTANT and KEY information
2. Organize notes with clear headings and subheadings
3. Use bullet points for key concepts
4. Highlight definitions, formulas, dates, names, and critical facts
5. Focus on information that would appear in exams
6. Remove redundant or less important information
7. Format with markdown (use # for headings, - for bullets, ** for emphasis)
8. Keep it concise but comprehensive
9. Structure: Main Topic → Key Points → Important Details

Example format:
# [Main Topic]
## Key Concept 1
- Important point 1
- Important point 2
- **Definition**: [key definition]

## Key Concept 2
- Important point 1
- **Formula/Date/Name**: [specific detail]`,
          },
          {
            role: 'user',
            content: `Extract and organize KEY NOTES from this study material. Focus on the most important information only:\n\n${textToProcess}`,
          },
        ],
        temperature: 0.3, // Lower temperature for more focused, factual notes
        max_tokens: 2000, // Allow more tokens for comprehensive notes
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      // Fallback to structured summary
      return `# Key Study Notes\n\n## Summary\n\n${text.substring(0, 1500)}...\n\n*Note: AI generation failed. Showing text summary.*`;
    }

    const data = await response.json();
    const generatedNotes = data.choices?.[0]?.message?.content;
    
    if (!generatedNotes || generatedNotes.trim().length === 0) {
      console.warn('AI returned empty notes, using fallback');
      return `# Key Study Notes\n\n## Important Points\n\n${text.substring(0, 1500)}...`;
    }
    
    return generatedNotes;
  } catch (error) {
    console.error('Error generating AI notes:', error);
    return `# Key Study Notes\n\n## Summary\n\n${text.substring(0, 1500)}...\n\n*Note: Error generating AI notes. Showing text summary.*`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    // Try to get auth token from Authorization header first (from client)
    const authHeader = request.headers.get('Authorization');
    let user = null;
    let authError = null;
    let supabase;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use token from header
      const token = authHeader.substring(7);
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser();
      user = tokenUser;
      authError = tokenError;
    } else {
      // Fallback to cookies - create client without cookie options (will use default)
      supabase = createClient(supabaseUrl, supabaseAnonKey);
      const result = await supabase.auth.getUser();
      user = result.data.user;
      authError = result.error;
    }

    if (authError) {
      console.error('Auth error:', authError.message);
      return NextResponse.json({ error: `Authentication failed: ${authError.message}` }, { status: 401 });
    }

    if (!user) {
      console.error('No user found - user not authenticated');
      return NextResponse.json({ error: 'Please log in to upload files' }, { status: 401 });
    }

    const formData = await request.formData();
    const collectionName = formData.get('collectionName') as string;
    const files = formData.getAll('files') as File[];

    if (!collectionName || !collectionName.trim()) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 files allowed' }, { status: 400 });
    }

    // Validate all files
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name} is not a supported format. Please upload PDF, PPT, PPTX, or DOCX files.` },
          { status: 400 }
        );
      }
    }

    // Create collection
    const { data: collectionData, error: collectionError } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name: collectionName.trim(),
      })
      .select()
      .single();

    if (collectionError) {
      console.error('Collection creation error:', collectionError);
      return NextResponse.json(
        { error: 'Failed to create collection' },
        { status: 500 }
      );
    }

    // Process all files
    const allExtractedText: string[] = [];
    const uploadedDocuments: any[] = [];
    const extractionErrors: string[] = [];

    for (const file of files) {
      try {
        console.log(`📄 Processing file: ${file.name} (${file.type}, ${file.size} bytes)`);
        
        // Extract text from file
        let extractedText: string;
        try {
          extractedText = await extractTextFromFile(file);
          console.log(`✅ Extracted ${extractedText.length} characters from ${file.name}`);
        } catch (extractError) {
          const errorMsg = extractError instanceof Error ? extractError.message : String(extractError);
          console.error(`❌ Error extracting text from ${file.name}:`, errorMsg);
          extractionErrors.push(`${file.name}: ${errorMsg}`);
          // Continue with other files, but log the error
          continue;
        }

        if (!extractedText || extractedText.trim().length === 0) {
          console.warn(`⚠️ No text extracted from ${file.name}, skipping...`);
          extractionErrors.push(`${file.name}: File appears to be empty or contains no extractable text`);
          continue;
        }

        allExtractedText.push(extractedText);

        // Chunk the text
        const chunks = chunkText(extractedText, 1000, 200);

        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        const fileBuffer = await file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          continue; // Skip this file but continue with others
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        // Skip embedding generation for now to save memory
        // Embeddings can be generated later if needed for search
        // This significantly reduces memory usage
        console.log(`⏭️ Skipping embedding generation for ${chunks.length} chunks to save memory`);
        
        // Optional: Save chunks without embeddings (for future use)
        // We'll skip this to save memory and processing time
        const documentChunks: any[] = [];

        // Save file directly to document_collections (matching your schema)
        const { data: documentData, error: documentError } = await supabase
          .from('document_collections')
          .insert({
            collection_id: collectionData.id,
            user_id: user.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            content: extractedText, // Store extracted text
            embedding: null, // Will be set if needed for search
          })
          .select()
          .single();

        if (documentError) {
          console.error(`❌ Document collection insert error for ${file.name}:`, documentError);
          console.error('Error details:', {
            code: documentError.code,
            message: documentError.message,
            details: documentError.details,
            hint: documentError.hint,
          });
          
          // Check if table doesn't exist
          if (documentError.code === 'PGRST116' || documentError.message?.includes('does not exist')) {
            console.error('⚠️ document_collections table does not exist! Please run the SQL schema from SUPABASE_SCHEMA.md');
            // Still continue to try generating notes, but warn the user
          }
          
          // Don't continue - we want to know about this error
          // But we'll still try to generate notes from the extracted text
          console.warn(`⚠️ File ${file.name} was not saved to database, but text was extracted. Continuing...`);
        } else {
          console.log(`✅ Saved file ${file.name} to document_collections (ID: ${documentData.id})`);
        }

        // Also save to documents table for compatibility (if it exists)
        try {
          await supabase
            .from('documents')
            .insert({
              user_id: user.id,
              file_name: file.name,
              file_size: file.size,
              content: extractedText,
              embedding: null,
            });
        } catch (error) {
          // Documents table might not exist or have different structure - that's okay
          console.warn('Could not save to documents table:', error);
        }

        // Only add to uploadedDocuments if document was successfully saved
        if (documentData) {
          uploadedDocuments.push({
            id: documentData.id,
            name: documentData.file_name,
            status: 'completed',
          });
        } else {
          // Even if save failed, track that we processed the file
          uploadedDocuments.push({
            id: `temp-${Date.now()}-${Math.random()}`,
            name: file.name,
            status: 'error',
          });
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with other files
      }
    }

    // Generate AI notes from all extracted text
    if (allExtractedText.length === 0) {
      console.error('❌ No text extracted from any files');
      console.error(`Processed ${files.length} files, but extractedText array is empty`);
      console.error('Extraction errors:', extractionErrors);
      return NextResponse.json(
        { 
          error: 'Could not extract text from uploaded files. Please check if files are valid PDF, DOCX, or TXT files.',
          details: `Tried to process ${files.length} file(s) but no text was extracted.`,
          errors: extractionErrors.length > 0 ? extractionErrors : ['Unknown error during text extraction']
        },
        { status: 400 }
      );
    }

    // Limit combined text to prevent memory issues
    // Use first 50000 characters max (about 10-15 pages of text)
    const combinedText = allExtractedText.join('\n\n--- Document Separator ---\n\n');
    const maxTextLength = 50000; // Limit to ~50KB of text
    const textToProcess = combinedText.length > maxTextLength 
      ? combinedText.substring(0, maxTextLength) + '\n\n[Content truncated due to size limits...]'
      : combinedText;
    
    console.log(`📝 Generating AI notes from ${textToProcess.length} characters of text (${combinedText.length} total available)...`);
    
    const aiNotes = await generateAINotes(textToProcess);
    
    if (!aiNotes || aiNotes.trim().length === 0) {
      console.error('❌ AI notes generation returned empty result');
      return NextResponse.json(
        { error: 'Failed to generate notes. Please try again or check your OpenRouter API key.' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Generated notes (${aiNotes.length} characters)`);

    // Save notes to database
    console.log(`💾 Saving notes to database for collection ${collectionData.id}...`);
    const { data: notesData, error: notesError } = await supabase
      .from('notes')
      .insert({
        collection_id: collectionData.id,
        user_id: user.id,
        content: aiNotes,
      })
      .select()
      .single();

    if (notesError) {
      console.error('❌ Notes insert error:', notesError);
      console.error('Error details:', {
        code: notesError.code,
        message: notesError.message,
        details: notesError.details,
        hint: notesError.hint,
      });
      
      if (notesError.code === 'PGRST116' || notesError.message?.includes('does not exist')) {
        console.error('⚠️ notes table does not exist! Please run the SQL schema from SUPABASE_SCHEMA.md');
        return NextResponse.json(
          { 
            error: 'Notes table does not exist. Please run the SQL schema from SUPABASE_SCHEMA.md',
            collection: {
              id: collectionData.id,
              name: collectionData.name,
            },
            notesGenerated: true, // Notes were generated but not saved
            notesContent: aiNotes.substring(0, 500) + '...', // Return preview
          },
          { status: 500 }
        );
      }
      
      // Don't fail the whole request if notes fail, but log it
      console.warn('⚠️ Notes were generated but could not be saved to database');
      console.warn('⚠️ Generated notes preview:', aiNotes.substring(0, 200) + '...');
      
      // Still return success, but indicate notes weren't saved
      return NextResponse.json({
        success: true,
        collection: {
          id: collectionData.id,
          name: collectionData.name,
        },
        documents: uploadedDocuments.map((doc) => ({
          id: doc.id,
          name: doc.name,
          status: doc.status,
        })),
        notesId: null,
        notesSaved: false,
        notesGenerated: true,
        error: `Notes were generated but could not be saved: ${notesError.message}`,
        filesSaved: uploadedDocuments.filter(doc => doc.status === 'completed').length,
        totalFiles: uploadedDocuments.length,
      });
    } else {
      console.log(`✅ Notes saved successfully! (ID: ${notesData.id})`);
    }

    console.log(`✅ Upload complete! Collection: ${collectionData.name}, Files: ${uploadedDocuments.length}, Notes: ${notesData ? 'saved' : 'failed to save'}`);
    
    return NextResponse.json({
      success: true,
      collection: {
        id: collectionData.id,
        name: collectionData.name,
      },
      documents: uploadedDocuments.map((doc) => ({
        id: doc.id,
        name: doc.name,
        status: doc.status,
      })),
      notesId: notesData?.id,
      notesSaved: !!notesData,
      filesSaved: uploadedDocuments.filter(doc => doc.status === 'completed').length,
      totalFiles: uploadedDocuments.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

