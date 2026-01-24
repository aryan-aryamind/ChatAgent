# Web Scraping & Q&A Generation Guide

## Overview
This guide explains how the web scraping functionality works in the Chatbase Clone application. When users add a website URL during agent creation, the system automatically scrapes the content and generates Q&A pairs for the chatbot.

## How It Works

### Flow
1. **User adds URL** → In Step 2 (Details), user enters a website URL
2. **URL stored** → URL is saved as a "link" type source
3. **Step 3 Processing** → When user reaches Step 3, the system automatically:
   - Scrapes the URL content
   - Extracts headings, text, and metadata
   - Generates Q&A pairs from the content
   - Stores Q&A pairs with the source
4. **Step 4** → Q&A pairs are available for CrewAI mode
5. **Agent Created** → Agent includes all Q&A pairs from scraped sources

## Architecture

### Files Created

1. **`lib/scraper/index.ts`**
   - Core scraping functionality
   - Content extraction and cleaning
   - Q&A pair generation
   - Intent classification

2. **`pages/api/agents/[id]/scrape.ts`**
   - API endpoint for scraping URLs
   - Accepts URL and options
   - Returns scraped content and Q&A pairs

3. **Updated Components**
   - `step3-sources.tsx` - Processes sources and scrapes URLs
   - `step4-model.tsx` - Includes scraped Q&A pairs
   - `AgentCreationContext.tsx` - Added `updateSourceQAPairs` function

## Features

### Content Extraction
- Extracts title, main content, headings
- Removes ads, navigation, scripts
- Converts HTML to clean markdown
- Extracts metadata (description, keywords, author)

### Q&A Generation Strategies

1. **From Headings** (Primary)
   - Converts headings (h1-h6) to questions
   - Uses content under headings as answers
   - Example: "About Us" → "What is About Us?"

2. **FAQ Pattern Detection**
   - Detects Q: ... A: ... patterns
   - Extracts existing FAQ structures
   - Preserves original Q&A format

3. **Paragraph-based** (Fallback)
   - Generates questions from paragraphs
   - Creates summary questions
   - Used when headings are insufficient

### Intent Classification
Automatically classifies Q&A pairs into intents:
- `business_hours` - Hours, time, schedule
- `pricing` - Price, cost, fees
- `support` - Help, assistance
- `refund` - Returns, cancellations
- `contact` - Email, phone, address
- `location` - Where, address
- `general` - Default category

## Usage

### For Users

1. **Add URL in Step 2**
   ```
   Enter: https://example.com/docs
   ```

2. **Wait for Processing in Step 3**
   - Status shows "Scraping website..."
   - Automatically generates Q&A pairs
   - Shows count: "Scraped successfully - 25 Q&A pairs generated"

3. **Use in Step 4**
   - Q&A pairs automatically included
   - Available for CrewAI mode
   - Can see preview of generated pairs

### API Usage

```typescript
POST /api/agents/[id]/scrape

Body:
{
  "url": "https://example.com",
  "options": {
    "maxPairs": 50,
    "minAnswerLength": 20
  }
}

Response:
{
  "success": true,
  "data": {
    "title": "Page Title",
    "content": "...",
    "url": "https://example.com",
    "headings": [...],
    "qaPairs": [
      {
        "id": "qa-123",
        "question": "What is...?",
        "answer": "...",
        "intent": "general"
      }
    ],
    "stats": {
      "totalCharacters": 5000,
      "headingsCount": 10,
      "qaPairsCount": 25
    }
  }
}
```

## Dependencies

Add these to `package.json`:
```json
{
  "cheerio": "^1.0.0-rc.12",
  "jsdom": "^23.0.1",
  "turndown": "^7.1.3"
}
```

Install with:
```bash
npm install cheerio jsdom turndown
```

## Error Handling

- Invalid URLs → Returns 400 error
- Network failures → Returns 500 error with message
- Timeout → 30 second timeout
- Empty content → Returns empty Q&A pairs array
- Processing errors → Source marked as "error" status

## Limitations

1. **JavaScript-heavy sites** - May not work perfectly (consider Puppeteer for future)
2. **Rate limiting** - Some sites may block requests
3. **Authentication** - Doesn't handle login-protected sites
4. **Dynamic content** - May miss content loaded via JavaScript

## Future Enhancements

1. **Puppeteer integration** - For JavaScript-heavy sites
2. **Multi-page scraping** - Scrape entire websites
3. **Sitemap support** - Auto-discover pages
4. **Content filtering** - User-defined filters
5. **Manual Q&A editing** - Edit generated pairs
6. **Re-scraping** - Update content periodically

## Testing

Test with these URLs:
- Documentation sites: `https://docs.example.com`
- FAQ pages: `https://example.com/faq`
- Blog posts: `https://example.com/blog/post`
- Company pages: `https://example.com/about`

## Troubleshooting

**Issue**: No Q&A pairs generated
- Check if site has headings or structured content
- Verify URL is accessible
- Check browser console for errors

**Issue**: Scraping fails
- Verify URL format
- Check network connectivity
- Some sites block scraping (CORS)

**Issue**: Poor quality Q&A pairs
- Site may not have structured content
- Consider manual Q&A entry
- Try different pages from same site
