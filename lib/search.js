import axios from 'axios';




// Tavily Search API
export async function tavilySearch(query) {
  if (!process.env.TAVILY_API_KEY) {
    console.warn('Tavily API key not configured');
    return null;
  }

  try {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: process.env.TAVILY_API_KEY,
      query: query,
      search_depth: 'basic',
      max_results: 5
    });

    return response.data.results.map(result => ({
      title: result.title,
      snippet: result.content,
      url: result.url
    }));
  } catch (error) {
    console.error('Tavily search error:', error.message);
    return null;
  }
}

// Brave Search API
export async function braveSearch(query) {
  if (!process.env.BRAVE_API_KEY) {
    console.warn('Brave API key not configured');
    return null;
  }

  try {
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: {
        q: query,
        count: 5
      },
      headers: {
        'X-Subscription-Token': process.env.BRAVE_API_KEY,
        'Accept': 'application/json'
      }
    });

    return response.data.web?.results?.slice(0, 5).map(result => ({
      title: result.title,
      snippet: result.description,
      url: result.url
    })) || [];
  } catch (error) {
    console.error('Brave search error:', error.message);
    return null;
  }
}

// Main search function - tries Tavily first, then Brave
export async function webSearch(query) {
  console.log(`🔍 Searching for: "${query}"`);

  // Try Tavily first
  let results = await tavilySearch(query);

  // Fall back to Brave if Tavily fails
  if (!results) {
    results = await braveSearch(query);
  }

  if (results && results.length > 0) {
    console.log(`✅ Found ${results.length} search results`);
    return results;
  }

  console.log('❌ No search results found');
  return null;
}
