export interface MapsSource {
    uri: string;
    title?: string;
    websiteUri?: string;
    address?: string;
    placeAnswerSources?: {
        reviewSnippets?: {
            reviewText: string;
        }[];
    };
}

export interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
    maps?: MapsSource;
}

export interface GroundingMetadata {
    groundingChunks?: GroundingChunk[];
    groundingSupports?: any[]; // Simplified
    searchEntryPoint?: any;
    webSearchQueries?: string[];
}

export interface SearchResult {
    text: string;
    chunks: GroundingChunk[];
}

export interface PlaceSuggestion {
    name: string;
    address?: string;
    description?: string;
    uri?: string;
}