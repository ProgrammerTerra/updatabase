// import Home from './pages/Home';


import { useState } from 'react';

interface WikipediaContent {
    title: string;
    pageId: string;
    url: string;
    textContent: string;
    categories: string[];
    links: string[];
    images: string[];
}

interface WikipediaApiResponse {
    query: {
        pages: {
            [key: string]: {
                title: string;
                fullurl: string;
                extract: string;
                categories?: Array<{ title: string }>;
                links?: Array<{ title: string }>;
                images?: Array<{ title: string }>;
            };
        };
    };
}


function App() {

    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<WikipediaContent | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const fetchWikipediaContent = async (pageTitle: string): Promise<void> => {
        setLoading(true);
        setError('');

        const apiUrl = 'https://en.wikipedia.org/w/api.php';
        const params = new URLSearchParams({
            origin: '*',
            action: 'query',
            format: 'json',
            titles: pageTitle,
            prop: 'extracts|categories|links|images|info',
            exintro: '0',
            explaintext: '1',
            inprop: 'url|displaytitle',
            hastemplate: 'Infobox_film'
        });

        try {
            const response = await fetch(`${apiUrl}?${params}`);
            const data: WikipediaApiResponse = await response.json();

            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            const pageData = pages[pageId];

            setContent({
                title: pageData.title,
                pageId: pageId,
                url: pageData.fullurl,
                textContent: pageData.extract,
                categories: pageData.categories?.map(cat => cat.title) || [],
                links: pageData.links?.map(link => link.title) || [],
                images: pageData.images?.map(img => img.title) || []
            });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            setError('Error fetching Wikipedia content. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (title.trim()) {
            fetchWikipediaContent(title);
        }
    };

    return (
        // <Search />
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-4">Wikipedia Content Viewer</h1>

                <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                        placeholder="Enter Wikipedia page title..."
                        className="flex-1 p-2 border rounded"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Search'}
                    </button>
                </form>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {content && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">{content.title}</h2>

                        <div className="bg-gray-50 p-4 rounded">
                            <h3 className="font-semibold mb-2">Quick Stats</h3>
                            <p>Categories: {content.categories.length}</p>
                            <p>Links: {content.links.length}</p>
                            <p>Images: {content.images.length}</p>
                            <a
                                href={content.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                            >
                                View on Wikipedia
                            </a>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Content</h3>
                            <div className="max-h-96 overflow-y-auto">
                                {content.textContent.split('\n').map((paragraph, index) => (
                                    paragraph && <p key={index} className="mb-4">{paragraph}</p>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Categories</h3>
                            <div className="flex flex-wrap gap-2">
                                {content.categories.slice(0, 10).map((category, index) => (
                                    <span key={index} className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {category.replace('Category:', '')}
                  </span>
                                ))}
                                {content.categories.length > 10 && (
                                    <span className="text-gray-500">+{content.categories.length - 10} more</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App
