"""
Asynchronous website scraper using httpx and BeautifulSoup with multi-page crawling support.
Enhanced version with full async/await support, concurrency control, and detailed content extraction.
"""

import asyncio
import httpx
import logging
import json
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urlunparse
from urllib.robotparser import RobotFileParser
from typing import List, Set, Optional, Dict, Any
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
import aiofiles
import random

# Try to import chardet for encoding detection, but don't fail if not available
try:
    import chardet
    CHARDET_AVAILABLE = True
except ImportError:
    CHARDET_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG to see more details
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
# Set specific loggers to INFO to reduce noise
logging.getLogger('httpx').setLevel(logging.INFO)
logging.getLogger('httpcore').setLevel(logging.INFO)


@dataclass
class ScrapedPage:
    """Represents a single scraped page with detailed content"""
    url: str
    title: str
    meta_description: Optional[str]
    headings: List[Dict[str, str]]  # [{"level": "h1", "text": "..."}]
    paragraphs: List[str]
    images: List[Dict[str, str]]  # [{"src": "...", "alt": "..."}]
    main_content: str
    links: List[str]
    timestamp: str
    depth: int


@dataclass
class AsyncScrapeOptions:
    """Options for async website scraping"""
    max_pages: int = 300   # Increased for better coverage
    max_depth: int = 10    # Increased to reach deep product pages
    concurrency: int = 25  # Increased for extreme speed
    delay: float = 0.05    # Minimal delay for internal scale
    timeout: int = 30
    follow_external: bool = False
    respect_robots: bool = True
    user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    include_patterns: Optional[List[str]] = None
    exclude_patterns: Optional[List[str]] = None


@dataclass
class ScrapedContent:
    """Complete scraped content from a website"""
    base_url: str
    pages: List[ScrapedPage]
    total_pages: int
    total_characters: int
    timestamp: str
    errors: List[Dict[str, str]]  # [{"url": "...", "error": "..."}]


class AsyncWebsiteScraper:
    """
    Asynchronous website scraper with full async/await support.
    Crawls entire websites with configurable concurrency and limits.
    """
    
    def __init__(
        self,
        base_url: str,
        options: Optional[AsyncScrapeOptions] = None,
        storage_dir: str = "content_storage"
    ):
        self.base_url = self._normalize_url(base_url, base_url)
        self.options = options or AsyncScrapeOptions()
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True, parents=True)
        
        # State management
        self.visited_urls: Set[str] = set()
        self.scraped_pages: List[ScrapedPage] = []
        self.scraped_pages_urls: Set[str] = set() # Track for fast deduplication check
        self.errors: List[Dict[str, str]] = []
        self.queue: asyncio.Queue = asyncio.Queue()
        self.semaphore: asyncio.Semaphore = asyncio.Semaphore(self.options.concurrency)
        self.robots_parser: Optional[RobotFileParser] = None
        
        # HTTP client configuration
        self.client_config = {
            "timeout": httpx.Timeout(self.options.timeout),
            "follow_redirects": True,
            "headers": {
                "User-Agent": self.options.user_agent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            }
        }
    
    def _normalize_url(self, url: str, base_url: str) -> str:
        """
        Normalize URL by removing fragments and trailing slashes.
        Returns absolute URL.
        """
        try:
            # Remove fragments
            url = url.split('#')[0].strip()
            if not url:
                return ''
            
            # Parse URL
            parsed = urlparse(url)
            
            # If already absolute URL
            if parsed.scheme:
                normalized = urlunparse(parsed._replace(fragment=''))
            else:
                # Handle relative URLs
                if url.startswith('//'):
                    url = 'https:' + url
                # Join with base URL
                normalized = urljoin(base_url, url)
            
            # Remove fragment again and trailing slash (but keep root path)
            normalized = normalized.split('#')[0]
            # Only remove trailing slash if it's not the root path
            if normalized.endswith('/') and urlparse(normalized).path != '/':
                normalized = normalized.rstrip('/')
            
            # Ensure it's a valid URL
            parsed = urlparse(normalized)
            if not parsed.scheme or not parsed.netloc:
                return ''
            
            return normalized
        except Exception as e:
            logger.warning(f"Error normalizing URL '{url}': {e}")
            return ''
    
    def _is_same_domain(self, url1: str, url2: str) -> bool:
        """Check if two URLs are from the same domain"""
        try:
            domain1 = urlparse(url1).netloc.lower()
            domain2 = urlparse(url2).netloc.lower()
            return domain1 == domain2
        except Exception:
            return False
    
    def _should_follow_link(self, url: str) -> bool:
        """Determine if a link should be followed"""
        # Normalize URL
        normalized = self._normalize_url(url, self.base_url)
        if not normalized:
            return False
        
        # Check if already visited
        if normalized in self.visited_urls:
            return False
        
        # Check if external link
        if not self.options.follow_external and not self._is_same_domain(normalized, self.base_url):
            return False
        
        # Check include patterns
        if self.options.include_patterns:
            if not any(re.search(pattern, normalized) for pattern in self.options.include_patterns):
                return False
        
        # Check exclude patterns
        if self.options.exclude_patterns:
            if any(re.search(pattern, normalized) for pattern in self.options.exclude_patterns):
                return False
        
        # Common exclusions - file extensions
        exclude_extensions = [
            '.pdf', '.zip', '.jpg', '.jpeg', '.png', '.gif', '.svg',
            '.css', '.js', '.xml', '.json', '.rss', '.atom', '.ico',
            '.mp4', '.mp3', '.avi', '.mov', '.wmv', '.webp', '.woff', '.ttf'
        ]
        # Check if URL ends with excluded extension (but allow query params)
        url_path = urlparse(normalized).path.lower()
        if any(url_path.endswith(ext) for ext in exclude_extensions):
            return False
        
        # Exclude common non-content paths
        exclude_paths = [
            '/wp-admin', '/wp-content', '/wp-includes',  # WordPress
            '/admin', '/login', '/logout', '/register',  # Auth pages
            '/api/', '/ajax/', '/_next/', '/static/',    # API/static
            '/feed', '/rss', '/sitemap',                 # Feeds
            '/search?', '/?s=',                          # Search pages
        ]
        normalized_lower = normalized.lower()
        if any(exclude_path in normalized_lower for exclude_path in exclude_paths):
            return False
        
        # Check robots.txt
        if self.options.respect_robots and self.robots_parser:
            try:
                if not self.robots_parser.can_fetch(self.options.user_agent, normalized):
                    return False
            except Exception as e:
                logger.debug(f"Robots.txt check failed for {normalized}: {e}")
                # Continue if robots.txt check fails
        
        return True
    
    async def _load_robots_txt(self):
        """Load and parse robots.txt asynchronously"""
        if not self.options.respect_robots:
            return
        
        try:
            robots_url = urljoin(self.base_url, '/robots.txt')
            async with httpx.AsyncClient(**self.client_config) as client:
                response = await client.get(robots_url)
                if response.status_code == 200:
                    self.robots_parser = RobotFileParser()
                    self.robots_parser.set_url(robots_url)
                    # Parse robots.txt content
                    self.robots_parser.read()
                    logger.info("Loaded robots.txt")
                    
                    # Check for sitemaps in robots.txt
                    # robots_parser doesn't expose sitemaps easily in some versions, 
                    # so we grep it manually
                    content = response.text
                    sitemap_matches = re.findall(r'^Sitemap:\s*(.+)$', content, re.MULTILINE | re.IGNORECASE)
                    for sm in sitemap_matches:
                        sitemap_url = sm.strip()
                        logger.info(f"📍 Found sitemap in robots.txt: {sitemap_url}")
                        await self._discover_sitemap_urls(sitemap_url)
        except Exception as e:
            logger.warning(f"Could not load robots.txt: {e}")
            self.robots_parser = None

    async def _discover_sitemap_urls(self, sitemap_url: str):
        """Discover URLs from a sitemap or sitemap index"""
        try:
            async with httpx.AsyncClient(**self.client_config) as client:
                response = await client.get(sitemap_url)
                if response.status_code != 200:
                    return

                # Very basic XML parsing for <loc> tags
                # This works for both sitemap indices and standard sitemaps
                content = response.text
                loc_tags = re.findall(r'<loc>(.+?)</loc>', content)
                
                added_count = 0
                for loc in loc_tags:
                    loc = loc.strip()
                    if loc.endswith(('.xml', '.xml.gz')) and 'sitemap' in loc.lower():
                        # It's a sitemap index entry
                        await self._discover_sitemap_urls(loc)
                    else:
                        # It's a page URL
                        normalized = self._normalize_url(loc, self.base_url)
                        if normalized and normalized not in self.visited_urls:
                            if self._is_same_domain(normalized, self.base_url):
                                await self.queue.put((normalized, 0)) # Sitemaps are depth 0
                                added_count += 1
                
                if added_count > 0:
                    logger.info(f"✅ Added {added_count} URLs from sitemap: {sitemap_url}")
        except Exception as e:
            logger.warning(f"Error parsing sitemap {sitemap_url}: {e}")
    
    def _extract_content(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """
        Extract detailed content from BeautifulSoup object.
        Returns dictionary with all extracted content.
        """
        # Extract title
        title = ''
        if soup.title:
            title = soup.title.get_text().strip()
        if not title:
            h1 = soup.find('h1')
            if h1:
                title = h1.get_text().strip()
        if not title:
            title = urlparse(url).path.split('/')[-1] or 'Untitled'
        
        # Extract meta description
        meta_description = None
        meta_desc_tag = soup.find('meta', attrs={'name': 'description'}) or \
                       soup.find('meta', attrs={'property': 'og:description'})
        if meta_desc_tag:
            meta_description = meta_desc_tag.get('content', '').strip()
        
        # Extract headings (h1, h2, h3)
        headings = []
        for i in range(1, 4):
            for heading in soup.find_all(f'h{i}'):
                text = heading.get_text().strip()
                if text:
                    headings.append({
                        "level": i,  # Use numeric level for compatibility
                        "text": text
                    })
        
        # Extract paragraphs
        paragraphs = []
        for p in soup.find_all('p'):
            text = p.get_text().strip()
            if text and len(text) > 10:  # Filter out very short paragraphs
                paragraphs.append(text)
        
        # Extract images
        images = []
        for img in soup.find_all('img', src=True):
            src = img.get('src', '').strip()
            alt = img.get('alt', '').strip()
            if src:
                # Convert relative URLs to absolute
                if not src.startswith(('http://', 'https://')):
                    src = urljoin(url, src)
                images.append({
                    "src": src,
                    "alt": alt or ""
                })
        
        # Extract main content - use same logic as BeautifulSoupScraper
        main_content = None
        content_selectors = [
            'main', 'article', '[role="main"]',
            '.content', '#content', '.main-content', '.post-content',
            '.entry-content', '.page-content', '.article-content',
            '.post-body', '.entry-body', '.container', '.wrapper'
        ]
        
        content_containers = []
        for selector in content_selectors:
            try:
                found = soup.select(selector)
                if found:
                    for element in found:
                        # Avoid duplicates if we use overlapping selectors
                        if element not in content_containers:
                            content_containers.append(element)
                    # If we found major containers, we can stop or keep looking for others
                    # For now, let's keep looking to get all relevant sections
            except Exception:
                continue
        
        # If we found specific containers, use them. Otherwise fallback.
        if content_containers:
            # Create a combined container to clean and extract from
            main_content = soup.new_tag('div')
            for container in content_containers:
                # Deep copy to avoid modifying the original soup too much during iteration
                import copy
                main_content.append(copy.copy(container))
        else:
            main_content = soup.find('body')
            if not main_content:
                # If no body tag, use the whole soup
                main_content = soup
        
        if not main_content:
            logger.error(f"Could not find any content container in {url}")
            # Still try to extract what we can
            return {
                'title': title or 'Untitled',
                'meta_description': meta_description,
                'headings': headings,
                'paragraphs': paragraphs,
                'images': images,
                'main_content': ''  # Return empty if we can't find content
            }
        
        # Verify we have a valid soup object
        if not hasattr(main_content, 'get_text'):
            logger.error(f"main_content object doesn't have get_text method: {type(main_content)}")
            return {
                'title': title or 'Untitled',
                'meta_description': meta_description,
                'headings': headings,
                'paragraphs': paragraphs,
                'images': images,
                'main_content': ''
            }
        
        # Clean main content (remove scripts, styles, etc.)
        # Use same approach as BeautifulSoupScraper
        try:
            # Determine if this is an info page
            url_lower = url.lower()
            is_info_page = any(w in url_lower for w in ["contact", "about", "support", "headquarter", "location"])

            # Remove unwanted tags - but spare footer/nav on info pages
            unwanted_tags = ['script', 'style', 'noscript', 'iframe', 'svg', 'canvas', 'form']
            if not is_info_page:
                unwanted_tags.extend(['nav', 'header', 'footer', 'aside'])
            
            for tag in unwanted_tags:
                try:
                    for element in main_content.find_all(tag):
                        element.decompose()
                except Exception as e:
                    logger.debug(f"Error removing {tag} tags: {e}")
                    continue
            
            # Also remove elements with common ad/sidebar classes
            unwanted_classes = ['ad', 'advertisement', 'ads', 'social', 
                               'share', 'comments', 'cookie', 'popup', 'modal']
            
            for class_name in unwanted_classes:
                try:
                    for element in main_content.find_all(class_=lambda x: x and class_name in str(x).lower()):
                        # Check if it contains a price OR contact info before decomposing
                        text = element.get_text().lower()
                        spare_keywords = ['₹', 'rs.', 'price', 'cost', 'email', 'phone', '+91', '@']
                        if any(p in text for p in spare_keywords):
                            continue
                        element.decompose()
                except Exception as e:
                    logger.debug(f"Error removing {class_name} class elements: {e}")
                    continue
        except Exception as e:
            logger.warning(f"Error cleaning content for {url}: {e}")
            # Continue anyway - don't fail if cleaning has issues
        
        # Get text content with better formatting - same as BeautifulSoupScraper
        try:
            main_text = main_content.get_text(separator='\n', strip=True)
            
            # Clean up common markdown patterns that leak into text (e.g. from developer docs)
            # Strips [text](/url) -> text
            main_text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', main_text)
            
            # Clean up repeated newlines and extra spaces
            main_text = re.sub(r'\n{3,}', '\n\n', main_text)
            main_text = re.sub(r' +', ' ', main_text)
            
            # Debug: log if we got text
            if main_text:
                logger.debug(f"Extracted {len(main_text)} chars from main_content for {url}")
            else:
                logger.debug(f"No text extracted from main_content for {url}")
        except Exception as e:
            logger.error(f"Error extracting text from main_content for {url}: {e}")
            import traceback
            logger.debug(traceback.format_exc())
            main_text = ''
        
        # If main_text is still empty or very short, try getting all paragraph text
        if not main_text or len(main_text.strip()) < 50:
            # Fallback: combine all paragraphs
            all_paragraphs_text = '\n\n'.join([p.get_text(strip=True) for p in soup.find_all('p') if p.get_text(strip=True)])
            if all_paragraphs_text and len(all_paragraphs_text) > len(main_text):
                main_text = all_paragraphs_text
                logger.warning(f"Used paragraph fallback for {url}: {len(main_text)} chars")
        
        # If still empty, try getting text from divs
        if not main_text or len(main_text.strip()) < 50:
            divs_text = []
            for div in soup.find_all('div', limit=20):  # Limit to avoid too much
                text = div.get_text(strip=True)
                if text and len(text) > 20:  # Only meaningful text
                    divs_text.append(text)
            if divs_text:
                main_text = '\n\n'.join(divs_text[:10])  # Limit to first 10 divs
                logger.warning(f"Used div fallback for {url}: {len(main_text)} chars")
        
        # Final fallback: if still empty, get text from body without cleaning
        if not main_text or len(main_text.strip()) < 50:
            body = soup.find('body')
            if body:
                try:
                    # Create a copy and remove only scripts/styles
                    body_copy = BeautifulSoup(str(body), 'html.parser')
                    for tag in body_copy.find_all(['script', 'style']):
                        tag.decompose()
                    fallback_text = body_copy.get_text(separator='\n', strip=True)
                    if fallback_text and len(fallback_text) > len(main_text or ''):
                        main_text = fallback_text
                        logger.warning(f"Used body fallback for {url}: {len(main_text)} chars")
                except Exception as e:
                    logger.debug(f"Body fallback failed: {e}")
                    # Try direct text extraction from body
                    try:
                        fallback_text = body.get_text(separator='\n', strip=True)
                        if fallback_text and len(fallback_text) > len(main_text or ''):
                            main_text = fallback_text
                            logger.warning(f"Used direct body text for {url}: {len(main_text)} chars")
                    except Exception as e2:
                        logger.debug(f"Direct body text extraction failed: {e2}")
        
        # Ultimate fallback: use all text from soup if still empty
        if not main_text or len(main_text.strip()) < 50:
            try:
                ultimate_text = soup.get_text(separator='\n', strip=True)
                # Remove excessive whitespace
                ultimate_text = re.sub(r'\n{3,}', '\n\n', ultimate_text)
                if ultimate_text and len(ultimate_text.strip()) > len(main_text or ''):
                    main_text = ultimate_text[:5000]  # Limit to avoid too much
                    logger.warning(f"Used ultimate soup fallback for {url}: {len(main_text)} chars")
            except Exception as e:
                logger.error(f"Ultimate fallback also failed: {e}")
        
        # Log if content is still very short
        if not main_text or len(main_text.strip()) < 50:
            logger.error(f"⚠️  Failed to extract meaningful content from {url}: only {len(main_text) if main_text else 0} chars")
            # Try to debug why
            logger.debug(f"   - Soup has body: {soup.find('body') is not None}")
            logger.debug(f"   - Soup has html: {soup.find('html') is not None}")
            logger.debug(f"   - Total elements: {len(soup.find_all())}")
            logger.debug(f"   - Paragraphs found: {len(soup.find_all('p'))}")
            logger.debug(f"   - Headings found: {len(soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']))}")
        
        return {
            'title': title,
            'meta_description': meta_description,
            'headings': headings,
            'paragraphs': paragraphs,
            'images': images,
            'main_content': main_text or ''  # Ensure it's never None
        }
    
    def _extract_links(self, soup: BeautifulSoup, url: str) -> List[str]:
        """Extract all links from a page"""
        links = []
        raw_links_count = 0
        filtered_count = 0
        normalized_links = []
        
        # Find all anchor tags with href
        for tag in soup.find_all('a', href=True):
            href = tag.get('href', '').strip()
            raw_links_count += 1
            
            if not href or href.startswith(('javascript:', 'mailto:', 'tel:', '#')):
                filtered_count += 1
                continue
            
            # Normalize URL first
            normalized = self._normalize_url(href, url)
            if not normalized:
                filtered_count += 1
                continue
            
            # Store normalized link (we'll filter which ones to follow later)
            normalized_links.append(normalized)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_normalized = []
        for link in normalized_links:
            if link not in seen:
                seen.add(link)
                unique_normalized.append(link)
        
        # Now filter which ones should be followed (for queue)
        # But we still want to return all valid links for the ScrapedPage
        for link in unique_normalized:
            if self._should_follow_link(link):
                links.append(link)
            else:
                filtered_count += 1
        
        # Log extraction results
        logger.info(f"🔗 Extracted {len(links)} followable links from {url} (out of {raw_links_count} total, {len(unique_normalized)} unique, {filtered_count} filtered)")
        
        return links
    
    async def _scrape_page(self, url: str, depth: int) -> Optional[ScrapedPage]:
        """
        Scrape a single page asynchronously.
        Automatically falls back to Playwright if BeautifulSoup results are poor
        on detected JS-heavy sites.
        """
        async with self.semaphore:
            # Final deduplication guard to catch race conditions
            if url in self.scraped_pages_urls:
                return None
                
            try:
                # Add delay for politeness (now much lower)
                if self.visited_urls:
                    await asyncio.sleep(self.options.delay)
                
                # Mark as visited (redundant but safe)
                self.visited_urls.add(url)
                
                # Try BeautifulSoup first
                bs_page = None
                async with httpx.AsyncClient(**self.client_config) as client:
                    response = await client.get(url)
                    response.raise_for_status()
                    
                    html_text = response.text
                    soup = BeautifulSoup(html_text, 'lxml')
                    extracted = self._extract_content(soup, url)
                    
                    # Create temporary ScrapedPage to evaluate quality
                    bs_page = ScrapedPage(
                        url=url,
                        title=extracted['title'],
                        meta_description=extracted['meta_description'],
                        headings=extracted['headings'],
                        paragraphs=extracted['paragraphs'],
                        images=extracted['images'],
                        main_content=extracted['main_content'],
                        links=self._extract_links(soup, url),
                        timestamp=datetime.now().isoformat(),
                        depth=depth
                    )

                # Detection: triggers Playwright for JS-heavy sites or empty content
                js_indicators = ["loading...", "select role", "searching...", "react-root", "nextjs", "__next"]
                content_lower = bs_page.main_content.lower()
                is_js_heavy = any(ind in content_lower for ind in js_indicators)
                is_low_content = len(bs_page.main_content.strip()) < 500
                
                # Fast Mode: Playwright is slow, only use if absolutely necessary AND if specifically allowed
                # For high-speed crawls, we skip it by default unless it's a critical page
                allow_playwright = depth == 0 # Only allow on root page for speed
                
                if (is_js_heavy or is_low_content) and allow_playwright:
                    try:
                        from .playwright_scraper import PlaywrightScraper
                        pw = PlaywrightScraper(timeout=45, page_timeout=45000)
                        if pw.is_available():
                            logger.info(f"🎭 [Playwright Fallback] Rendering JS for: {url}")
                            pw_page = await pw.scrape(url)
                            if pw_page and len(pw_page.main_content) > len(bs_page.main_content):
                                # Use Playwright's depth and metadata
                                pw_page.depth = depth
                                await pw.close()
                                return pw_page
                            await pw.close()
                    except (ImportError, Exception) as e:
                        logger.debug(f"Playwright fallback failed for {url}: {e}")

                return bs_page
                    
            except Exception as e:
                error_msg = str(e)
                logger.error(f"❌ Error scraping {url}: {error_msg}")
                self.errors.append({"url": url, "error": error_msg})
                return None
                    
            except httpx.HTTPStatusError as e:
                # httpx.Response uses reason_phrase, not status_text
                reason = e.response.reason_phrase if hasattr(e.response, "reason_phrase") else "Unknown Error"
                error_msg = f"HTTP {e.response.status_code}: {reason}"
                logger.warning(f"❌ HTTP error for {url}: {error_msg}")
                self.errors.append({"url": url, "error": error_msg})
                return None
            except httpx.RequestError as e:
                error_msg = f"Request error: {str(e)}"
                logger.warning(f"❌ Request error for {url}: {error_msg}")
                self.errors.append({"url": url, "error": error_msg})
                return None
            except Exception as e:
                error_msg = f"Unexpected error: {str(e)}"
                logger.error(f"❌ Error scraping {url}: {error_msg}", exc_info=True)
                self.errors.append({"url": url, "error": error_msg})
                return None
    
    async def _save_page_json(self, page: ScrapedPage):
        """Save a scraped page as JSON file"""
        try:
            # Create safe filename from URL
            parsed = urlparse(page.url)
            path_parts = [part for part in parsed.path.split('/') if part]
            filename = '_'.join(path_parts) if path_parts else 'index'
            filename = re.sub(r'[^\w\-_\.]', '_', filename)[:200]  # Limit length and sanitize
            
            # Add domain for uniqueness
            domain = parsed.netloc.replace('.', '_')
            filename = f"{domain}_{filename}.json"
            
            filepath = self.storage_dir / filename
            
            # Convert page to dict and save
            page_dict = asdict(page)
            async with aiofiles.open(filepath, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(page_dict, indent=2, ensure_ascii=False))
            
            logger.debug(f"💾 Saved: {filename}")
            
        except Exception as e:
            logger.error(f"Error saving page {page.url}: {e}")
    
    async def _crawl_worker(self):
        """Worker coroutine that processes URLs from the queue"""
        while True:
            try:
                # Get URL from queue (with longer timeout to allow more processing)
                try:
                    url, depth = await asyncio.wait_for(self.queue.get(), timeout=5.0)  # Increased from 1.0 to 5.0
                except asyncio.TimeoutError:
                    # Check if we should continue
                    if self.queue.empty():
                        # Wait a bit more to see if more URLs are added
                        await asyncio.sleep(0.5)
                        if self.queue.empty() and len(self.scraped_pages) >= self.options.max_pages:
                            logger.info(f"Worker stopping: queue empty and max pages ({self.options.max_pages}) reached")
                            break
                        if self.queue.empty():
                            logger.info(f"Worker stopping: queue empty, {len(self.scraped_pages)} pages scraped")
                            break
                    continue
                
                # Check limits
                if len(self.scraped_pages) >= self.options.max_pages:
                    self.queue.task_done()
                    continue
                
                if depth > self.options.max_depth:
                    self.queue.task_done()
                    continue
                
                # Scrape page
                page = await self._scrape_page(url, depth)
                
                if page:
                    self.scraped_pages.append(page)
                    self.scraped_pages_urls.add(page.url)
                    
                    # Save page as JSON
                    await self._save_page_json(page)
                    
                    # Add new links to queue if within limits
                    if depth < self.options.max_depth and len(self.scraped_pages) < self.options.max_pages:
                        links_added = 0
                        for link in page.links:
                            # CRITICAL: Add to visited_urls IMMEDIATELY when queuing
                            # This is the primary fix for duplicate crawling
                            if link not in self.visited_urls:
                                try:
                                    self.visited_urls.add(link)
                                    self.queue.put_nowait((link, depth + 1))
                                    links_added += 1
                                except asyncio.QueueFull:
                                    logger.warning(f"Queue full, skipping link: {link}")
                        if links_added > 0:
                            logger.info(f"📎 Added {links_added} links to queue from {url[:60]}... (depth: {depth})")
                
                self.queue.task_done()
                
            except Exception as e:
                logger.error(f"Error in crawl worker: {e}", exc_info=True)
                self.queue.task_done()
    
    async def run(self, initial_page: Optional[ScrapedPage] = None) -> ScrapedContent:
        """
        Start the asynchronous crawl.
        If initial_page is provided, it uses its links to seed the crawl.
        """
        logger.info(f"🚀 Starting async crawl: {self.base_url}")
        
        # Reset state
        self.visited_urls.clear()
        self.scraped_pages.clear()
        self.errors.clear()
        self.queue = asyncio.Queue()
        
        if initial_page:
            logger.info(f"📍 Using provided initial page for link discovery: {initial_page.url}")
            self.scraped_pages.append(initial_page)
            self.scraped_pages_urls.add(initial_page.url)
            self.visited_urls.add(initial_page.url)
            
            # Add links from initial page to queue
            for link in initial_page.links:
                if self._should_follow_link(link) and link not in self.visited_urls:
                    self.visited_urls.add(link)
                    await self.queue.put((link, 1))
        else:
            # Add starting URL to queue
            self.visited_urls.add(self.base_url)
            await self.queue.put((self.base_url, 0))
        
        # Start worker tasks
        workers = [
            asyncio.create_task(self._crawl_worker())
            for _ in range(self.options.concurrency)
        ]
        
        # Wait for all workers to complete
        try:
            # Wait for queue to be empty and workers to finish
            await self.queue.join()
            
            # Give workers a tiny bit of time to settle
            logger.info("Queue empty, finishing up...")
            await asyncio.sleep(0.2) 
            
            # Check if we've reached max pages
            if len(self.scraped_pages) >= self.options.max_pages:
                logger.info(f"Reached max pages limit ({self.options.max_pages}), stopping workers")
            
            # Cancel workers
            for worker in workers:
                worker.cancel()
            
            # Wait for cancellation
            await asyncio.gather(*workers, return_exceptions=True)
            
            logger.info(f"All workers stopped. Final page count: {len(self.scraped_pages)}")
            
        except Exception as e:
            logger.error(f"Error during crawl: {e}", exc_info=True)
        
        # Calculate stats - ensure we count actual content
        total_chars = sum(len(page.main_content) if page.main_content else 0 for page in self.scraped_pages)
        
        # Log detailed stats
        logger.info(f"🎉 Crawl complete:")
        logger.info(f"   - Pages scraped: {len(self.scraped_pages)}")
        logger.info(f"   - Total characters: {total_chars}")
        logger.info(f"   - Errors: {len(self.errors)}")
        logger.info(f"   - URLs visited: {len(self.visited_urls)}")
        
        # Log pages with content issues
        empty_pages = [p for p in self.scraped_pages if not p.main_content or len(p.main_content.strip()) < 50]
        if empty_pages:
            logger.warning(f"⚠️  Found {len(empty_pages)} pages with little/no content:")
            for p in empty_pages[:5]:  # Log first 5
                logger.warning(f"   - {p.url}: {len(p.main_content)} chars")
        
        return ScrapedContent(
            base_url=self.base_url,
            pages=self.scraped_pages,
            total_pages=len(self.scraped_pages),
            total_characters=total_chars,
            timestamp=datetime.now().isoformat(),
            errors=self.errors
        )


# Example usage
async def main():
    """Example usage of AsyncWebsiteScraper"""
    scraper = AsyncWebsiteScraper(
        base_url="https://example.com",
        options=AsyncScrapeOptions(
            max_pages=50,
            max_depth=3,
            concurrency=5,
            delay=0.3
        )
    )
    
    result = await scraper.run()
    
    print(f"\n✅ Scraped {result.total_pages} pages")
    print(f"📊 Total characters: {result.total_characters}")
    print(f"❌ Errors: {len(result.errors)}")
    
    if result.errors:
        print("\nErrors:")
        for error in result.errors[:5]:  # Show first 5 errors
            print(f"  - {error['url']}: {error['error']}")


if __name__ == "__main__":
    asyncio.run(main())
