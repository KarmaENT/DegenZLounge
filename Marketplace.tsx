import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  category: 'agent' | 'template' | 'tool';
  price: number;
  tokenPrice: number;
  creator: string;
  rating: number;
  downloads: number;
  imageUrl: string;
  featured: boolean;
}

const Marketplace: React.FC = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchMarketplaceItems = async () => {
      try {
        // In a real implementation, you would fetch items from your API
        // For this example, we'll use mock data
        const mockItems: MarketplaceItem[] = [
          {
            id: '1',
            name: 'Research Assistant Pro',
            description: 'Advanced research agent with web search capabilities and citation management',
            category: 'agent',
            price: 0,
            tokenPrice: 250,
            creator: 'DeGeNz Official',
            rating: 4.8,
            downloads: 1250,
            imageUrl: '/assets/marketplace/research-assistant.png',
            featured: true
          },
          {
            id: '2',
            name: 'Creative Writer',
            description: 'Specialized agent for creative writing, storytelling, and content generation',
            category: 'agent',
            price: 4.99,
            tokenPrice: 0,
            creator: 'WriterStudio',
            rating: 4.6,
            downloads: 875,
            imageUrl: '/assets/marketplace/creative-writer.png',
            featured: true
          },
          {
            id: '3',
            name: 'Code Review Template',
            description: 'Template for creating code review agents with best practices and security checks',
            category: 'template',
            price: 2.99,
            tokenPrice: 150,
            creator: 'DevToolsInc',
            rating: 4.9,
            downloads: 2100,
            imageUrl: '/assets/marketplace/code-review.png',
            featured: true
          },
          {
            id: '4',
            name: 'Market Analysis Tool',
            description: 'Tool for analyzing market trends and generating insights',
            category: 'tool',
            price: 9.99,
            tokenPrice: 0,
            creator: 'FinanceAI',
            rating: 4.7,
            downloads: 560,
            imageUrl: '/assets/marketplace/market-analysis.png',
            featured: false
          },
          {
            id: '5',
            name: 'Social Media Manager',
            description: 'Agent for scheduling and creating social media content across platforms',
            category: 'agent',
            price: 7.99,
            tokenPrice: 0,
            creator: 'SocialBoost',
            rating: 4.5,
            downloads: 1890,
            imageUrl: '/assets/marketplace/social-media.png',
            featured: false
          },
          {
            id: '6',
            name: 'Product Design Template',
            description: 'Template for creating product design agents with UI/UX expertise',
            category: 'template',
            price: 0,
            tokenPrice: 350,
            creator: 'DesignMasters',
            rating: 4.4,
            downloads: 780,
            imageUrl: '/assets/marketplace/product-design.png',
            featured: false
          },
          {
            id: '7',
            name: 'Data Visualization Tool',
            description: 'Tool for creating interactive data visualizations from various data sources',
            category: 'tool',
            price: 5.99,
            tokenPrice: 0,
            creator: 'DataVizPro',
            rating: 4.8,
            downloads: 1450,
            imageUrl: '/assets/marketplace/data-viz.png',
            featured: false
          },
          {
            id: '8',
            name: 'Legal Assistant',
            description: 'Specialized agent for legal research and document preparation',
            category: 'agent',
            price: 14.99,
            tokenPrice: 0,
            creator: 'LegalTech',
            rating: 4.9,
            downloads: 620,
            imageUrl: '/assets/marketplace/legal-assistant.png',
            featured: false
          }
        ];
        
        setItems(mockItems);
        setFilteredItems(mockItems);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch marketplace items');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMarketplaceItems();
  }, []);
  
  useEffect(() => {
    // Filter and sort items based on user selections
    let result = [...items];
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        item => 
          item.name.toLowerCase().includes(term) || 
          item.description.toLowerCase().includes(term) ||
          item.creator.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'featured':
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case 'popular':
        result.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price_low':
        result.sort((a, b) => {
          const aPrice = a.price > 0 ? a.price : a.tokenPrice;
          const bPrice = b.price > 0 ? b.price : b.tokenPrice;
          return aPrice - bPrice;
        });
        break;
      case 'price_high':
        result.sort((a, b) => {
          const aPrice = a.price > 0 ? a.price : a.tokenPrice;
          const bPrice = b.price > 0 ? b.price : b.tokenPrice;
          return bPrice - aPrice;
        });
        break;
      default:
        break;
    }
    
    setFilteredItems(result);
  }, [items, searchTerm, selectedCategory, sortBy]);
  
  const handlePurchase = async (item: MarketplaceItem) => {
    try {
      // In a real implementation, you would call your API to process the purchase
      // For this example, we'll simulate a successful purchase
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      setPurchaseSuccess(`Successfully purchased ${item.name}!`);
      
      // Clear success message after a delay
      setTimeout(() => {
        setPurchaseSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to purchase item');
      console.error(err);
    }
  };
  
  const renderPrice = (item: MarketplaceItem) => {
    if (item.price > 0) {
      return `$${item.price.toFixed(2)}`;
    } else if (item.tokenPrice > 0) {
      return `${item.tokenPrice} tokens`;
    } else {
      return 'Free';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          DeGeNz Marketplace
        </h2>
        <p className="mt-4 text-xl text-gray-600">
          Discover and purchase premium agents, templates, and tools
        </p>
      </div>
      
      {purchaseSuccess && (
        <div className="mb-6 p-4 bg-green-100 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{purchaseSuccess}</p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
          <div className="mt-1">
            <input
              type="text"
              name="search"
              id="search"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Search marketplace"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="category"
            name="category"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="agent">Agents</option>
            <option value="template">Templates</option>
            <option value="tool">Tools</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700">Sort By</label>
          <select
            id="sort"
            name="sort"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <span className="text-sm text-gray-500">
            Showing {filteredItems.length} of {items.length} items
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="h-48 bg-gray-200 relative">
                {/* In a real app, you would use actual images */}
                <div className="absolute inset-0 flex items-center justify-center bg-indigo-100">
                  <span className="text-indigo-600 font-medium">{item.name}</span>
                </div>
                
                {item.featured && (
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">
                    Featured
                  </div>
                )}
                
                <div className="absolute bottom-2 left-2 bg-white text-gray-800 text-xs font-medium px-2 py-1 rounded-full shadow-sm">
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 text-sm text-gray-600">{item.rating}</span>
                  </div>
                </div>
                
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description}</p>
                
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">By {item.creator}</p>
                    <p className="text-xs text-gray-400">{item.downloads} downloads</p>
                  </div>
                  <div className="text-lg font-bold text-indigo-600">
                    {renderPrice(item)}
                  </div>
                </div>
                
                <button
                  type="button"
                  className="mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => handlePurchase(item)}
                >
                  {item.price > 0 ? 'Buy Now' : item.tokenPrice > 0 ? 'Purchase with Tokens' : 'Get for Free'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
