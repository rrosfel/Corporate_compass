import React, { useMemo } from 'react';
import { SearchResult, GroundingChunk } from '../types';

interface ResultsSectionProps {
  data: SearchResult | null;
}

interface ParsedItem {
  name: string;
  description: string;
  mapChunk?: GroundingChunk;
  webChunk?: GroundingChunk;
  extractedUrl?: string;
}

const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();

export const ResultsSection: React.FC<ResultsSectionProps> = ({ data }) => {
  if (!data) return null;

  const { text, chunks } = data;

  // Parse the text to extract Name and Description pairs
  const parsedItems: ParsedItem[] = useMemo(() => {
    // Split by the delimiter set in the prompt
    const rawItems = text.split('### ').filter(item => item.trim().length > 0);
    
    // If the model didn't follow instructions and returned a blob, treat it as one item
    if (rawItems.length === 0 && text.trim().length > 0) {
       return [{
           name: "General Results",
           description: text,
           mapChunk: undefined
       }];
    }

    return rawItems.map(raw => {
      // Split into lines to find specific fields
      const lines = raw.split('\n').map(l => l.trim()).filter(l => l !== '');
      
      if (lines.length === 0) return { name: "Unknown", description: "" };

      const name = lines[0];
      let websiteLineIndex = -1;
      let extractedUrlFromField: string | undefined = undefined;

      // Look for Website: line
      for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('Website:')) {
              websiteLineIndex = i;
              const urlPart = lines[i].replace(/^Website:\s*/i, '').trim();
              if (urlPart && urlPart.toLowerCase() !== 'n/a' && urlPart.toLowerCase() !== 'none') {
                  // Basic cleanup if markdown link is provided [text](url) or plain url
                  const match = urlPart.match(/\((https?:\/\/[^)]+)\)/) || urlPart.match(/(https?:\/\/[^\s]+)/);
                  if (match) {
                      extractedUrlFromField = match[1] || match[0];
                  } else if (urlPart.startsWith('http')) {
                      extractedUrlFromField = urlPart;
                  }
              }
              break;
          }
      }

      // Reconstruct description without the website line and name
      const descriptionLines = lines.filter((_, index) => index !== 0 && index !== websiteLineIndex);
      const description = descriptionLines.join('\n');

      // Fallback: Try to find a URL in the description text if explicit line failed
      let extractedUrl = extractedUrlFromField;
      if (!extractedUrl) {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const urlMatch = description.match(urlRegex);
          if (urlMatch) {
              extractedUrl = urlMatch[0];
          }
      }

      // 2. Find matching Google Maps Chunk
      const mapChunk = chunks.find(c => {
        if (!c.maps?.title) return false;
        const chunkName = normalize(c.maps.title);
        const itemName = normalize(name);
        return chunkName.includes(itemName) || itemName.includes(chunkName);
      });

      // 3. Find matching Web Search Chunk (for website button)
      const webChunk = chunks.find(c => {
        if (!c.web?.title) return false;
        const chunkName = normalize(c.web.title);
        const itemName = normalize(name);
        return (chunkName.includes(itemName) || itemName.includes(chunkName));
      });

      return {
        name,
        description: description,
        mapChunk,
        webChunk,
        extractedUrl
      };
    });
  }, [text, chunks]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center space-x-2 mb-2">
         <h2 className="text-xl font-bold text-slate-900">Identified Corporate Locations</h2>
         <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{parsedItems.length} Found</span>
      </div>

      {parsedItems.map((item, idx) => {
        // Determine the best URL for "Website" button
        // Priority: Explicitly Extracted URL > Web Chunk URI > Map Website
        const websiteUrl = item.extractedUrl || item.webChunk?.web?.uri;
        const mapUrl = item.mapChunk?.maps?.uri;

        return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="flex flex-col md:flex-row">
                    
                    {/* Left Side: Label & Actions */}
                    <div className="md:w-1/3 bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 leading-tight mb-4">
                                {item.name.replace(/\*\*/g, '')}
                            </h3>
                            
                            <div className="space-y-3">
                                {/* View on Maps Button */}
                                {mapUrl ? (
                                    <a 
                                        href={mapUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all group"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        View on Maps
                                    </a>
                                ) : (
                                    <span className="flex items-center justify-center w-full px-4 py-2 bg-slate-100 border border-transparent rounded-lg text-sm font-medium text-slate-400 cursor-not-allowed">
                                        Map unavailable
                                    </span>
                                )}

                                {/* Website Button */}
                                {websiteUrl && (
                                    <a 
                                        href={websiteUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                        Visit Website
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Optional Address (if available in chunks) */}
                        {item.mapChunk?.maps?.address && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <p className="text-xs text-slate-500">
                                    {item.mapChunk.maps.address}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Insights & Analysis */}
                    <div className="md:w-2/3 p-6 flex flex-col justify-center">
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Insight & Analysis
                        </h4>
                        <div className="prose prose-sm prose-slate max-w-none text-slate-600">
                            {item.description ? (
                                item.description.split('\n').map((para, i) => (
                                    <p key={i} className={`mb-2 ${para.startsWith('-') ? 'pl-4' : ''}`}>
                                        {para}
                                    </p>
                                ))
                            ) : (
                                <p className="italic text-slate-400">No specific analysis available.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        );
      })}
      
      <div className="text-center pt-4">
        <p className="text-xs text-slate-400">
            Results generated by AI. Verify details with the official sources provided.
        </p>
      </div>
    </div>
  );
};