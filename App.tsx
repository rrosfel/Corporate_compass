import React, { useState } from 'react';
import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { ResultsSection } from './components/ResultsSection';
import { searchCorporateOffices } from './services/geminiService';
import { SearchResult } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (location: string) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await searchCorporateOffices(location);
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError("Unable to fetch results. Please check your internet connection or API Key configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header />
      
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-8">
        <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                Discover Corporate Offices
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
                Enter a street name and city to find corporate offices, business centers, and headquarters using real-time Google Maps data.
            </p>
        </div>

        <SearchForm onSearch={handleSearch} isLoading={isLoading} />

        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                         <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">
                            {error}
                        </p>
                    </div>
                </div>
            </div>
        )}

        <ResultsSection data={data} />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Corporate Compass. Using Gemini 2.5 Flash & Google Maps Grounding.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
