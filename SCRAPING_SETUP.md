# Advanced Website Scraping Setup Guide

## ✅ What's Been Implemented

Your scraping system has been upgraded to use **BeautifulSoup** with **unlimited content scraping** and **multi-page crawling** support!

### Features:
- ✅ **No character limits** - Scrapes full website content
- ✅ **Multi-page crawling** - Can scrape entire websites (up to 50 pages by default)
- ✅ **Sitemap support** - Auto-discovers pages via sitemap.xml
- ✅ **Smart content extraction** - Removes ads/navigation, keeps important content
- ✅ **Respects robots.txt** - Follows website crawling rules
- ✅ **Configurable depth** - Control how many levels deep to crawl
- ✅ **Python-based** - Fast and efficient BeautifulSoup implementation

## 🚀 Setup Instructions

### 1. Install Python Dependencies

All required packages are already in `requirements.txt`. Just install them:

```bash
cd crewai-service
pip install -r requirements.txt
```

**Already included:**
- `beautifulsoup4>=4.12.0` ✅
- `lxml>=4.9.0` ✅
- `requests>=2.31.0` ✅
- `urllib3>=2.0.0` ✅
- `html5lib>=1.1` ✅

### 2. Start Python Service

```bash
cd crewai-service
python main.py
```

The service will run on `http://localhost:8016`

### 3. Test the Scraping

The Next.js frontend will automatically use the Python scraper. When you add a URL in Step 3 of agent creation, it will:

1. Call Python service at `/scrape` endpoint
2. Scrape the website (single page or multiple pages)
3. Return full content without limits
4. Generate Q&A pairs from all scraped content

## 📋 API Usage

### Python Service Endpoint

**POST** `http://localhost:8016/scrape`

```json
{
  "url": "https://example.com",
  "max_pages": 50,
  "max_depth": 3,
  "follow_external": false,
  "respect_robots": true,
  "delay": 0.5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Page Title",
    "content": "Full website content...",  // NO LIMITS!
    "url": "https://example.com",
    "headings": [...],
    "metadata": {...},
    "stats": {
      "totalPages": 5,
      "totalCharacters": 50000,
      "headingsCount": 25,
      "sitemapUrls": 10
    },
    "pages": [...]
  }
}
```

### Next.js API (Automatic)

The frontend automatically calls the Python service. No changes needed in your UI code!

## ⚙️ Configuration Options

When scraping, you can configure:

- **max_pages**: Maximum number of pages to scrape (default: 50)
- **max_depth**: How many levels deep to crawl (default: 3)
  - `0` = Only the start page
  - `1` = Start page + direct links
  - `2` = Start page + 2 levels deep
  - `3` = Start page + 3 levels deep
- **follow_external**: Follow links to other domains (default: false)
- **respect_robots**: Respect robots.txt (default: true)
- **delay**: Seconds to wait between requests (default: 0.5)

## 🔄 How It Works

### Flow:
```
User enters URL in Step 3
    ↓
Next.js calls: /api/agents/[id]/scrape
    ↓
Next.js calls: http://localhost:8016/scrape (Python)
    ↓
Python BeautifulSoup:
  - Scrapes homepage
  - Finds all internal links
  - Scrapes each page (up to max_pages)
  - Extracts all content (NO LIMITS)
  - Returns full website content
    ↓
Next.js generates Q&A pairs from full content
    ↓
Q&A pairs saved to agent
```

## 🎯 What's Different from Before

### Before:
- ❌ Limited to 5000 characters
- ❌ Single page only
- ❌ JSDOM (slower, less reliable)
- ❌ No multi-page support

### Now:
- ✅ **Unlimited content** - No character limits!
- ✅ **Multi-page crawling** - Scrapes entire websites
- ✅ **BeautifulSoup** - Fast, reliable Python library
- ✅ **Sitemap support** - Auto-discovers pages
- ✅ **Smart filtering** - Better content extraction

## 🐛 Troubleshooting

### Python Service Not Running
If you see connection errors, make sure:
1. Python service is running: `python main.py` in `crewai-service/`
2. Service is on port 8016 (or update `CREWAI_SERVICE_URL` env var)
3. Fallback: The system will automatically use local TypeScript scraper if Python service is unavailable

### Scraping Fails
- Check if URL is accessible
- Some sites block scraping (try different URL)
- Check Python service logs for errors
- Verify network connectivity

### Too Many Pages
- Reduce `max_pages` in options
- Reduce `max_depth` to limit crawling depth
- Increase `delay` to be more respectful

## 📝 Example Usage

### Scrape Single Page (Default)
```javascript
// In your frontend, just provide URL
{
  url: "https://example.com/docs"
}
// Will scrape just that page
```

### Scrape Entire Website
```javascript
{
  url: "https://example.com",
  max_pages: 50,
  max_depth: 3
}
// Will crawl up to 50 pages, 3 levels deep
```

### Fast Scraping (Less Respectful)
```javascript
{
  url: "https://example.com",
  delay: 0.1  // Faster, but less respectful
}
```

## 🎉 You're All Set!

Your scraping system is now ready to:
- Scrape entire websites without limits
- Generate comprehensive Q&A pairs
- Create better AI agents with full website knowledge

Just start the Python service and use your agent creation flow as normal!
