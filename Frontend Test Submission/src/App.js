import React, { useState } from 'react';
import { Link2, BarChart3, Clock, MousePointer, MapPin, Calendar, ExternalLink, Copy, Check } from 'lucide-react';

// Logging service connected to middleware
const logEvent = async (eventType, data) => {
  try {
    await fetch('http://localhost:5000/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        data,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Logging failed:', error);
  }
};

const URLShortenerApp = () => {
  const [currentPage, setCurrentPage] = useState('shortener');
  const [urls, setUrls] = useState([]);
  const [formData, setFormData] = useState({
    originalUrl: '',
    validityPeriod: 30,
    customShortcode: ''
  });
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(null);

  // Generate random shortcode
  const generateShortcode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Validate URL format
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Validate shortcode
  const isValidShortcode = (shortcode) => {
    return /^[a-zA-Z0-9]{3,10}$/.test(shortcode);
  };

  // Handle form submission
  const handleSubmit = () => {
    const newErrors = {};

    // Validate original URL
    if (!formData.originalUrl) {
      newErrors.originalUrl = 'Original URL is required';
    } else if (!isValidUrl(formData.originalUrl)) {
      newErrors.originalUrl = 'Please enter a valid URL';
    }

    // Validate validity period
    if (formData.validityPeriod < 1) {
      newErrors.validityPeriod = 'Validity period must be at least 1 minute';
    }

    // Validate custom shortcode if provided
    if (formData.customShortcode) {
      if (!isValidShortcode(formData.customShortcode)) {
        newErrors.customShortcode = 'Shortcode must be 3-10 alphanumeric characters';
      } else if (urls.some(url => url.shortcode === formData.customShortcode)) {
        newErrors.customShortcode = 'This shortcode is already taken';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      logEvent('VALIDATION_ERROR', { errors: newErrors });
      return;
    }

    // Create new shortened URL
    const shortcode = formData.customShortcode || generateShortcode();
    const expiryDate = new Date(Date.now() + formData.validityPeriod * 60000);
    
    const newUrl = {
      id: Date.now(),
      originalUrl: formData.originalUrl,
      shortcode,
      shortUrl: `http://localhost:3000/${shortcode}`,
      expiryDate,
      createdAt: new Date(),
      clicks: 0,
      clickDetails: []
    };

    setUrls(prev => [...prev, newUrl]);
    logEvent('URL_CREATED', { shortcode, originalUrl: formData.originalUrl, expiryDate });

    // Reset form
    setFormData({
      originalUrl: '',
      validityPeriod: 30,
      customShortcode: ''
    });
    setErrors({});
  };

  // Handle URL redirection simulation
  const handleRedirect = (shortcode) => {
    const url = urls.find(u => u.shortcode === shortcode);
    if (!url) {
      logEvent('URL_NOT_FOUND', { shortcode });
      return;
    }

    if (new Date() > url.expiryDate) {
      logEvent('URL_EXPIRED', { shortcode });
      alert('This shortened URL has expired');
      return;
    }

    // Simulate click tracking
    const clickData = {
      timestamp: new Date(),
      source: 'direct',
      location: 'Kanpur, India'
    };

    setUrls(prev => prev.map(u => 
      u.shortcode === shortcode 
        ? { ...u, clicks: u.clicks + 1, clickDetails: [...u.clickDetails, clickData] }
        : u
    ));

    logEvent('URL_CLICKED', { shortcode, originalUrl: url.originalUrl, clickData });
    window.open(url.originalUrl, '_blank');
  };

  // Copy to clipboard
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
      logEvent('URL_COPIED', { shortUrl: text });
    });
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Navigation component
  const Navigation = () => (
    <nav className="bg-white shadow-sm border-b mb-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Link2 className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-gray-900">URL Shortener</span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentPage('shortener')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                currentPage === 'shortener'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Shortener
            </button>
            <button
              onClick={() => setCurrentPage('statistics')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                currentPage === 'statistics'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Statistics
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  // URL Shortener Page
  const URLShortenerPage = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Shorten Your URL</h1>
        
        <div className="space-y-6">
          {/* Original URL Input */}
          <div>
            <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Original URL *
            </label>
            <input
              type="url"
              id="originalUrl"
              value={formData.originalUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, originalUrl: e.target.value }))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.originalUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://example.com/very-long-url"
            />
            {errors.originalUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.originalUrl}</p>
            )}
          </div>

          {/* Validity Period */}
          <div>
            <label htmlFor="validityPeriod" className="block text-sm font-medium text-gray-700 mb-2">
              Validity Period (minutes)
            </label>
            <input
              type="number"
              id="validityPeriod"
              min="1"
              value={formData.validityPeriod}
              onChange={(e) => setFormData(prev => ({ ...prev, validityPeriod: parseInt(e.target.value) || 30 }))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.validityPeriod ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.validityPeriod && (
              <p className="mt-1 text-sm text-red-600">{errors.validityPeriod}</p>
            )}
          </div>

          {/* Custom Shortcode */}
          <div>
            <label htmlFor="customShortcode" className="block text-sm font-medium text-gray-700 mb-2">
              Custom Shortcode (optional)
            </label>
            <input
              type="text"
              id="customShortcode"
              value={formData.customShortcode}
              onChange={(e) => setFormData(prev => ({ ...prev, customShortcode: e.target.value }))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.customShortcode ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="my-custom-code"
            />
            {errors.customShortcode && (
              <p className="mt-1 text-sm text-red-600">{errors.customShortcode}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              3-10 alphanumeric characters. Leave empty for auto-generation.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
          >
            Shorten URL
          </button>
        </div>
      </div>

      {/* Display Results */}
      {urls.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Shortened URLs</h2>
          <div className="space-y-4">
            {urls.slice(-5).reverse().map((url) => (
              <div key={url.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 truncate">{url.originalUrl}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-mono text-blue-600">{url.shortUrl}</span>
                      <button
                        onClick={() => copyToClipboard(url.shortUrl, url.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {copied === url.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleRedirect(url.shortcode)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Expires: {formatDate(url.expiryDate)}</span>
                  <span>{url.clicks} clicks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Statistics Page
  const StatisticsPage = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">URL Statistics</h1>
        </div>

        {urls.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No shortened URLs yet</p>
            <p className="text-gray-400">Create some shortened URLs to see statistics here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center">
                  <Link2 className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Total URLs</p>
                    <p className="text-2xl font-bold text-blue-900">{urls.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-center">
                  <MousePointer className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">Total Clicks</p>
                    <p className="text-2xl font-bold text-green-900">
                      {urls.reduce((sum, url) => sum + url.clicks, 0)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-600">Active URLs</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {urls.filter(url => new Date() <= url.expiryDate).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Detailed Statistics</h2>
              {urls.map((url) => (
                <div key={url.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-mono text-blue-600">{url.shortUrl}</span>
                        {new Date() > url.expiryDate && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Expired</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 truncate">{url.originalUrl}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created: {formatDate(url.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Expires: {formatDate(url.expiryDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{url.clicks}</div>
                      <div className="text-sm text-gray-500">clicks</div>
                    </div>
                  </div>

                  {/* Click Details */}
                  {url.clickDetails.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Recent Clicks</h4>
                      <div className="space-y-2">
                        {url.clickDetails.slice(-3).reverse().map((click, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-gray-600">{formatDate(click.timestamp)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-500">
                              <MapPin className="h-4 w-4" />
                              <span>{click.location}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {currentPage === 'shortener' ? <URLShortenerPage /> : <StatisticsPage />}
      </div>
    </div>
  );
};

export default URLShortenerApp;

























