"""
Advanced website scraper using BeautifulSoup with multi-page crawling support.
Can scrape entire websites without character limits.
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urlunparse
from typing import List, Set, Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime
import time
import re
from urllib.robotparser import RobotFileParser


@dataclass
class ScrapedPage:
    """Represents a single scraped page"""
    url: str
    title: str
    content: str
    html: str
    headings: List[Dict[str, Any]]
    metadata: Dict[str, Optional[str]]
    links: List[str]
    timestamp: str


@dataclass
class ScrapeOptions:
    """Options for website scraping"""
    max_pages: int = 50  # Maximum number of pages to scrape
    max_depth: int = 3  # Maximum depth to crawl (0 = only start page)
    follow_external: bool = False  # Follow external links
    respect_robots: bool = True  # Respect robots.txt
    delay: float = 0.5  # Delay between requests (seconds)
    timeout: int = 30  # Request timeout (seconds)
    user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    include_patterns: Optional[List[str]] = None  # URL patterns to include
    exclude_patterns: Optional[List[str]] = None  # URL patterns to exclude


@dataclass
class ScrapedContent:
    """Complete scraped content from a website"""
    base_url: str
    pages: List[ScrapedPage]
    total_pages: int
    total_characters: int
    sitemap_urls: List[str]
    timestamp: str


class WebsiteScraper:
    """Advanced website scraper with multi-page crawling"""
    
    def __init__(self, options: Optional[ScrapeOptions] = None):
        self.options = options or ScrapeOptions()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.options.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        self.visited_urls: Set[str] = set()
        self.robots_parser: Optional[RobotFileParser] = None
        
    def _normalize_url(self, url: str, base_url: str) -> str:
        """Normalize URL to absolute form"""
        try:
            # Remove fragments
            url = url.split('#')[0].strip()
            if not url:
                return ''
            
            # If already absolute URL
            parsed = urlparse(url)
            if parsed.scheme:
                return urlunparse(parsed._replace(fragment=''))
            
            # Handle relative URLs
            # If starts with //, add https:
            if url.startswith('//'):
                url = 'https:' + url
            
            # Join with base URL
            absolute_url = urljoin(base_url, url)
            
            # Remove fragment again after joining
            return absolute_url.split('#')[0]
        except Exception as e:
            print(f"⚠️  Error normalizing URL '{url}': {e}")
            return ''
    
    def _is_same_domain(self, url1: str, url2: str) -> bool:
        """Check if two URLs are from the same domain"""
        domain1 = urlparse(url1).netloc
        domain2 = urlparse(url2).netloc
        return domain1 == domain2
    
    def _should_follow_link(self, url: str, base_url: str) -> bool:
        """Determine if a link should be followed"""
        # Normalize URL
        normalized = self._normalize_url(url, base_url)
        
        # Check if already visited
        if normalized in self.visited_urls:
            return False
        
        # Check if external link
        if not self.options.follow_external and not self._is_same_domain(normalized, base_url):
            return False
        
        # Check include patterns
        if self.options.include_patterns:
            if not any(re.search(pattern, normalized) for pattern in self.options.include_patterns):
                return False
        
        # Check exclude patterns
        if self.options.exclude_patterns:
            if any(re.search(pattern, normalized) for pattern in self.options.exclude_patterns):
                return False
        
        # Common exclusions
        exclude_extensions = ['.pdf', '.zip', '.jpg', '.jpeg', '.png', '.gif', '.svg', 
                             '.css', '.js', '.xml', '.json', '.rss', '.atom']
        if any(normalized.lower().endswith(ext) for ext in exclude_extensions):
            return False
        
        # Check robots.txt
        if self.options.respect_robots and self.robots_parser:
            if not self.robots_parser.can_fetch(self.options.user_agent, normalized):
                return False
        
        return True
    
    def _load_robots_txt(self, base_url: str):
        """Load and parse robots.txt"""
        try:
            robots_url = urljoin(base_url, '/robots.txt')
            self.robots_parser = RobotFileParser()
            self.robots_parser.set_url(robots_url)
            self.robots_parser.read()
        except Exception as e:
            print(f"Could not load robots.txt: {e}")
            self.robots_parser = None
    
    def _extract_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract all links from a page - improved to find more links"""
        links = []
        base_domain = urlparse(base_url).netloc
        
        # Find all anchor tags with href (including in nav, header, footer)
        all_links = soup.find_all('a', href=True)
        print(f"🔍 Found {len(all_links)} total <a> tags on page")
        
        for tag in all_links:
            href = tag.get('href', '').strip()
            if not href:
                continue
                
            # Skip empty, javascript, mailto, tel links, and anchors
            if href.startswith(('javascript:', 'mailto:', 'tel:')):
                continue
            
            # Handle anchor links (#section) - convert to full URL if needed
            if href.startswith('#'):
                # Skip pure anchors, but keep relative paths that might have anchors
                continue
            
            try:
                full_url = self._normalize_url(href, base_url)
                
                # Only follow same-domain links (unless follow_external is True)
                if self._is_same_domain(full_url, base_url) or self.options.follow_external:
                    if self._should_follow_link(full_url, base_url):
                        links.append(full_url)
            except Exception as e:
                # Skip invalid URLs
                continue
        
        # Also check for links in common navigation patterns (more aggressive)
        nav_selectors = [
            'nav a', '.menu a', '.navigation a', '.breadcrumb a', 
            '.pagination a', '[role="navigation"] a', 'header a',
            '.navbar a', '.nav a', '.main-menu a', '.primary-menu a',
            'footer a', '.footer a', '.site-nav a', '.main-nav a'
        ]
        for selector in nav_selectors:
            try:
                nav_links = soup.select(selector)
                for tag in nav_links:
                    href = tag.get('href', '').strip()
                    if href and not href.startswith(('javascript:', 'mailto:', 'tel:', '#')):
                        try:
                            full_url = self._normalize_url(href, base_url)
                            if self._is_same_domain(full_url, base_url) or self.options.follow_external:
                                if self._should_follow_link(full_url, base_url):
                                    links.append(full_url)
                        except Exception:
                            continue
            except Exception:
                pass
        
        # Remove duplicates and return
        unique_links = list(set(links))
        print(f"✅ Extracted {len(unique_links)} unique valid links")
        return unique_links
    
    def _clean_html(self, soup: BeautifulSoup):
        """Remove unwanted elements from HTML"""
        # Remove script and style elements
        for element in soup(['script', 'style', 'noscript']):
            element.decompose()
        
        # Remove common navigation and UI elements
        unwanted_selectors = [
            'nav', 'header', 'footer', 'aside',
            '.advertisement', '.ads', '[class*="ad"]', '[id*="ad"]',
            '.social', '.share', '.comments', '.sidebar',
            '[role="banner"]', '[role="navigation"]', '[role="complementary"]',
            '.cookie', '.popup', '.modal', '.overlay',
            '[class*="menu"]', '[class*="navigation"]', '[id*="menu"]', '[id*="nav"]',
            '.skip-link', '.accessibility', '.skip-to-content'
        ]
        
        for selector in unwanted_selectors:
            try:
                for element in soup.select(selector):
                    element.decompose()
            except Exception:
                pass  # Ignore invalid selectors
    
    def _extract_content(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract content from a BeautifulSoup object"""
        # Extract title
        title = ''
        if soup.title:
            title = soup.title.get_text().strip()
        if not title:
            h1 = soup.find('h1')
            if h1:
                title = h1.get_text().strip()
        
        # Extract metadata
        metadata = {
            'description': None,
            'keywords': None,
            'author': None,
            'og_title': None,
            'og_description': None,
        }
        
        # Meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'}) or \
                   soup.find('meta', attrs={'property': 'og:description'})
        if meta_desc:
            metadata['description'] = meta_desc.get('content', '').strip()
        
        # Meta keywords
        meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
        if meta_keywords:
            metadata['keywords'] = meta_keywords.get('content', '').strip()
        
        # Meta author
        meta_author = soup.find('meta', attrs={'name': 'author'})
        if meta_author:
            metadata['author'] = meta_author.get('content', '').strip()
        
        # OG tags
        og_title = soup.find('meta', attrs={'property': 'og:title'})
        if og_title:
            metadata['og_title'] = og_title.get('content', '').strip()
        
        # Extract headings
        headings = []
        for i in range(1, 7):
            for heading in soup.find_all(f'h{i}'):
                text = heading.get_text().strip()
                if text:
                    headings.append({
                        'level': i,
                        'text': text,
                        'id': heading.get('id')
                    })
        
        # Extract main content
        # Try to find main content area
        main_content = None
        content_selectors = [
            'main', 'article', '[role="main"]',
            '.content', '#content', '.main-content', '.post-content',
            '.entry-content', '.page-content', '.article-content',
            '.post-body', '.entry-body', '[class*="content"]', '[id*="content"]'
        ]
        
        for selector in content_selectors:
            try:
                main_content = soup.select_one(selector)
                if main_content:
                    break
            except Exception:
                continue
        
        # If no main content found, use body
        if not main_content:
            main_content = soup.find('body') or soup
        
        # Get text content
        text_content = main_content.get_text(separator='\n', strip=True)
        
        # Get HTML content
        html_content = str(main_content)
        
        return {
            'title': title or 'Untitled',
            'content': text_content,
            'html': html_content,
            'headings': headings,
            'metadata': metadata
        }
    
    def _scrape_page(self, url: str) -> Optional[ScrapedPage]:
        """Scrape a single page"""
        try:
            # Add delay to be respectful
            if self.visited_urls:
                time.sleep(self.options.delay)
            
            # Fetch page
            response = self.session.get(
                url,
                timeout=self.options.timeout,
                allow_redirects=True
            )
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'lxml')
            
            # IMPORTANT: Extract links BEFORE cleaning HTML
            # Otherwise navigation links get removed before we can find them
            links = self._extract_links(soup, url)
            
            # Now clean HTML (remove unwanted elements)
            self._clean_html(soup)
            
            # Extract content
            extracted = self._extract_content(soup)
            
            # Mark as visited
            self.visited_urls.add(url)
            
            return ScrapedPage(
                url=url,
                title=extracted['title'],
                content=extracted['content'],
                html=extracted['html'],
                headings=extracted['headings'],
                metadata=extracted['metadata'],
                links=links,
                timestamp=datetime.now().isoformat()
            )
            
        except requests.RequestException as e:
            print(f"Error fetching {url}: {e}")
            return None
        except Exception as e:
            print(f"Error parsing {url}: {e}")
            return None
    
    def _find_sitemap(self, base_url: str) -> List[str]:
        """Try to find and parse sitemap.xml"""
        sitemap_urls = []
        try:
            # Try common sitemap locations
            sitemap_locations = [
                '/sitemap.xml',
                '/sitemap_index.xml',
                '/sitemap-index.xml',
            ]
            
            for location in sitemap_locations:
                sitemap_url = urljoin(base_url, location)
                try:
                    response = self.session.get(sitemap_url, timeout=10)
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.content, 'xml')
                        # Extract URLs from sitemap
                        for url_tag in soup.find_all('url'):
                            loc = url_tag.find('loc')
                            if loc:
                                sitemap_urls.append(loc.get_text().strip())
                        break
                except Exception:
                    continue
        except Exception as e:
            print(f"Error finding sitemap: {e}")
        
        return sitemap_urls
    
    def scrape(self, start_url: str, options: Optional[ScrapeOptions] = None) -> ScrapedContent:
        """
        Scrape a website starting from a URL.
        Can scrape multiple pages by following links.
        """
        if options:
            self.options = options
        
        # Normalize start URL
        start_url = self._normalize_url(start_url, start_url)
        base_domain = urlparse(start_url).netloc
        
        # Load robots.txt
        if self.options.respect_robots:
            self._load_robots_txt(start_url)
        
        # Find sitemap - use it if available for better coverage
        sitemap_urls = self._find_sitemap(start_url)
        
        # Initialize queue for BFS crawling
        queue: List[tuple[str, int]] = [(start_url, 0)]  # (url, depth)
        pages: List[ScrapedPage] = []
        
        # Add sitemap URLs to queue if found (up to max_pages)
        if sitemap_urls:
            print(f"📋 Found sitemap with {len(sitemap_urls)} URLs")
            for sitemap_url in sitemap_urls[:self.options.max_pages]:
                normalized_sitemap_url = self._normalize_url(sitemap_url, start_url)
                if self._is_same_domain(normalized_sitemap_url, start_url):
                    if normalized_sitemap_url not in self.visited_urls:
                        queue.append((normalized_sitemap_url, 0))  # Add at depth 0 for priority
        
        # Process queue
        print(f"🚀 Starting crawl with max_pages={self.options.max_pages}, max_depth={self.options.max_depth}")
        while queue and len(pages) < self.options.max_pages:
            current_url, depth = queue.pop(0)
            
            # Skip if already visited
            if current_url in self.visited_urls:
                continue
            
            # Check depth limit
            if depth > self.options.max_depth:
                print(f"⏭️  Skipping {current_url} (depth {depth} > {self.options.max_depth})")
                continue
            
            # Scrape page
            print(f"📄 Scraping [{len(pages)+1}/{self.options.max_pages}]: {current_url} (depth: {depth})")
            page = self._scrape_page(current_url)
            if page:
                pages.append(page)
                print(f"✅ Scraped: {page.title[:50]}... ({len(page.content)} chars, {len(page.links)} links found)")
                if len(page.links) == 0:
                    print(f"⚠️  WARNING: No links found on {current_url} - website might use JavaScript for navigation")
                
                # Add links to queue if within limits
                if depth < self.options.max_depth and len(pages) < self.options.max_pages:
                    new_links_added = 0
                    for link in page.links:
                        if link not in self.visited_urls and len(queue) < 200:  # Increased queue size
                            queue.append((link, depth + 1))
                            new_links_added += 1
                    if new_links_added > 0:
                        print(f"🔗 Added {new_links_added} new links to queue (queue size: {len(queue)})")
            else:
                print(f"❌ Failed to scrape: {current_url}")
        
        # Calculate stats
        total_chars = sum(len(page.content) for page in pages)
        
        print(f"🎉 Crawl complete: {len(pages)} pages, {total_chars} characters")
        
        return ScrapedContent(
            base_url=start_url,
            pages=pages,
            total_pages=len(pages),
            total_characters=total_chars,
            sitemap_urls=sitemap_urls,
            timestamp=datetime.now().isoformat()
        )
