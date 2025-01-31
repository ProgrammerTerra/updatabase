import React, { useState } from 'react';

import "./Search.css";

import SearchBar from '../components/SearchBar';

interface FilmResult {
    title: string;
    snippet: string;
    pageid: number;
    imageUrl?: string;
}

interface WikiImageResponse {
    query: {
        pages: {
            [key: string]: {
                images: {
                    title: string;
                };
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
    const [results, setResults] = useState<FilmResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchImageForFilm = async (pageId: number): Promise<string | undefined> => {
        try {
            const images = await fetch(
                `https://en.wikipedia.org/w/api.php?` +
                `action=query&prop=images&format=json&origin=*&` +
                `pageids=${pageId}`
            );

            if (!images.ok) {
                throw new Error('Failed to fetch image');
            }

            const data: WikiImageResponse = await images.json();
            // const page = data.query.pages[pageId];
            const responseImages = data.query.pages[pageId].images;
            const filmTitle = data.query.pages[pageId].title;
            let title;
            console.log("-------------" + data);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            for (const i of responseImages){
                console.log(i);
                if(i.title.includes("poster.") || i.title.includes(filmTitle.substring(0, 2))){
                    console.log(i.title)
                    title = i.title;
                    break;
                }
            }

            try{
                const image = await fetch(
                    `https://en.wikipedia.org/w/api.php?` +
                    `action=query&format=json&prop=imageinfo&` +
                    `iiprop=url&origin=*&titles=${title}`
                );
                //     File:Avatar (2009 film) poster.jpg
                //     "https://upload.wikimedia.org/wikipedia/commons/7/7d/The_Tree_in_a_Test_Tube%2C_1942_%28full%29.ogv"
                
                if (!image.ok) {
                    throw new Error('Failed to fetch image');
                }

                const data2: WikiImageResponse = await image.json();
                const page2 = data2.query.pages; //[74508300]
                const imageFile = Object.values(page2)[0].pageid;
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                return page2[imageFile].imageinfo[0].url;
            } catch (err) {
                console.error('Error fetching image:', err);
                return undefined;
            }
        } catch (err) {
            console.error('Error fetching image:', err);
            return undefined;
        }
    };

    const searchFilms = async () => {
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
            const filmsWithoutImages = data.query.search.map((item: any) => ({
                title: item.title,
                snippet: item.snippet.replace(/<\/?span[^>]*>/g, ''),
                pageid: item.pageid
            }));

            const filmsWithImages = await Promise.all(
                filmsWithoutImages.map(async (film: { pageid: number; }) => {
                    const imageUrl = await fetchImageForFilm(film.pageid);
                    return { ...film, imageUrl };
                })
            );

            setResults(filmsWithImages);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            setError('Failed to fetch films. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            searchFilms();
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
                    placeholder="Enter a film title..."
                    disabled={isLoading}
                />
                <button
                    onClick={searchFilms}
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
                {results.map((film) => (
                    <div className="content-pair" key={film.pageid}>
                        <div className="image">
                            {film.imageUrl ? (
                                <div>
                                    <img
                                        src={film.imageUrl}
                                        alt={`Poster for ${film.title}`}
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
                            <h3>{film.title}</h3>
                            <p dangerouslySetInnerHTML={{__html: film.snippet}}/>
                            <a
                                href={`https://en.wikipedia.org/?curid=${film.pageid}`}
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
