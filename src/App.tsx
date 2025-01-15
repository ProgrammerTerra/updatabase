import './App.css'
import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface MovieResult {
    title: string;
    snippet: string;
    pageid: number;
}

function App() {

    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<MovieResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchMovies = async () => {
        if (!searchTerm.trim()) {
            setError('Please enter a search term');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `https://en.wikipedia.org/w/api.php?` +
                `action=query&format=json&list=search&origin=*&` +
                `srsearch=${encodeURIComponent(searchTerm + ' hastemplate:Infobox_film')}&srlimit=10`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch results');
            }

            const data = await response.json();
            const movies = data.query.search.map((item: any) => ({
                title: item.title,
                snippet: item.snippet.replace(/<\/?span[^>]*>/g, ''),
                pageid: item.pageid
            }));

            setResults(movies);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            setError('Failed to fetch movies. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            searchMovies();
        }
    };

    // export default MovieSearch;
  return (
    <>
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Movie Search</h2>
                <p className="text-gray-600">Search for movies on Wikipedia</p>
            </div>

            <div className="flex space-x-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter a movie title..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
                <button
                    onClick={searchMovies}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Search size={20}/>
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {results.map((movie) => (
                    <div key={movie.pageid} className="p-4 border rounded-lg">
                        <h3 className="text-lg font-semibold">{movie.title}</h3>
                        <p className="text-gray-600 mt-1"
                           dangerouslySetInnerHTML={{__html: movie.snippet}}/>
                        <a
                            href={`https://en.wikipedia.org/?curid=${movie.pageid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline mt-2 inline-block"
                        >
                            Read more
                        </a>
                    </div>
                ))}
            </div>

            {results.length > 0 && (
                <p className="text-gray-600 text-sm">
                    Found {results.length} results
                </p>
            )}
        </div>
    </>
  )
}

export default App
