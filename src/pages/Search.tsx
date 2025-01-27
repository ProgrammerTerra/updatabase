import React, { useState } from 'react';

import "./Search.css";

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
        <div>
            {/* Top of page */}
            <div>
                <h2>Search</h2>
            </div>

            <div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter a movie title..."
                    disabled={isLoading}
                />
                <button
                    onClick={searchMovies}
                    disabled={isLoading}
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {error && (
                <div>
                    {error}
                </div>
            )}

            {/* Results */}
            <div>
                {results.map((movie) => (
                    <div className="content-pair" key={movie.pageid}>
                        <div className="image">
                            {movie.imageUrl ? (
                                <div>
                                    <img
                                        src={movie.imageUrl}
                                        alt={`Poster for ${movie.title}`}
                                        height="300"
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
                            <span className="image">No image</span>
                          </div>
                        </div>
                      `;
                                        }}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <div>
                                        <span>No image</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Content container */}
                        <div className="content">
                            <h3>{movie.title}</h3>
                            <p dangerouslySetInnerHTML={{__html: movie.snippet}}/>
                            <a
                                href={`https://en.wikipedia.org/?curid=${movie.pageid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Read more
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Search
