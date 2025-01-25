import React, { useState } from 'react';

import SearchBar from '../components/SearchBar';

interface MovieResult {
    title: string;
    snippet: string;
    pageid: number;
    imageUrl?: string;
}

interface WikiImageResponse {
    query: {
        pages: {
            [key: string]: {
                pageimage?: string;
                original?: {
                    source: string;
                };
            };
        };
    };
}

function Search() {

    <SearchBar />
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<MovieResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchImageForMovie = async (pageId: number): Promise<string | undefined> => {
        try {
            const response = await fetch(
                `https://en.wikipedia.org/w/api.php?` +
                `action=query&format=json&prop=pageimages&` +
                `piprop=original&origin=*&pageids=${pageId}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch image');
            }

            const data: WikiImageResponse = await response.json();
            const page = data.query.pages[pageId];
            return page.original?.source;
        } catch (err) {
            console.error('Error fetching image:', err);
            return undefined;
        }
    };

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
            const moviesWithoutImages = data.query.search.map((item: any) => ({
                title: item.title,
                snippet: item.snippet.replace(/<\/?span[^>]*>/g, ''),
                pageid: item.pageid
            }));

            const moviesWithImages = await Promise.all(
                moviesWithoutImages.map(async (movie: { pageid: number; }) => {
                    const imageUrl = await fetchImageForMovie(movie.pageid);
                    return { ...movie, imageUrl };
                })
            );

            setResults(moviesWithImages);
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

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-6">
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
                    <div key={movie.pageid} className="p-4 border rounded-lg flex gap-4">
                        {/* Image container with smaller fixed dimensions */}
                        <div className="flex-shrink-0 w-24 h-36">
                            {movie.imageUrl ? (
                                <div className="w-full h-full relative rounded-lg overflow-hidden">
                                    <img
                                        src={movie.imageUrl}
                                        alt={`Poster for ${movie.title}`}
                                        className="w-full h-full object-cover absolute inset-0"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.parentElement!.classList.add('bg-gray-200');
                                            target.parentElement!.innerHTML = `
                        <div class="flex items-center justify-center w-full h-full">
                          <div class="text-gray-400 flex flex-col items-center">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span class="mt-1 text-xs">No image</span>
                          </div>
                        </div>
                      `;
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                    <div className="text-gray-400 flex flex-col items-center">
                                        <span className="mt-1 text-xs">No image</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Content container */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold truncate">{movie.title}</h3>
                            <p className="text-gray-600 mt-1 line-clamp-3"
                               dangerouslySetInnerHTML={{ __html: movie.snippet }} />
                            <a
                                href={`https://en.wikipedia.org/?curid=${movie.pageid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline mt-2 inline-block"
                            >
                                Read more
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {results.length > 0 && (
                <p className="text-gray-600 text-sm">
                    Found {results.length} results
                </p>
            )}
        </div>
    );
}

export default Search
