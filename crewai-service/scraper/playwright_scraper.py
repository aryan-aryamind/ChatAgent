"""
Playwright-based scraper for JavaScript-heavy pages.
Renders pages in a real browser to handle dynamic content.
"""

import logging
from typing import List, Dict, Optional, Any
from datetime import datetime
from urllib.parse import urljoin, urlparse

from .base_scraper import BaseScraper
from .async_website_scraper import ScrapedPage

logger = logging.getLogger(__name__)

# Try to import Playwright
try:
    from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright not installed. Install with: pip install playwright && playwright install")


class PlaywrightScraper(BaseScraper):
    """
    Playwright-based scraper for JavaScript-heavy pages.
    Renders pages in a real browser to handle dynamic content.
    """
    
    def __init__(
        self,
        timeout: int = 30,
        user_agent: str = "Chatbase-Clone-Scraper/1.0",
        page_timeout: int = 30000,
        wait_until: str = "domcontentloaded"
    ):
        super().__init__(timeout, user_agent)
        self.page_timeout = page_timeout
        self.wait_until = wait_until
        self._browser: Optional[Browser] = None
        self._playwright = None
    
    def get_name(self) -> str:
        return "Playwright"
    
    def is_available(self) -> bool:
        """Check if Playwright is installed and available"""
        return PLAYWRIGHT_AVAILABLE
    
    async def _get_browser(self):
        """Get or create browser instance"""
        if not PLAYWRIGHT_AVAILABLE:
            raise RuntimeError("Playwright is not installed")
        
        if self._browser is None:
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
        
        return self._browser
    
    async def close(self):
        """Close browser and cleanup"""
        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
    
    async def scrape(self, url: str) -> Optional[ScrapedPage]:
        """
        Scrape a URL using Playwright.
        
        Args:
            url: URL to scrape
        
        Returns:
            ScrapedPage or None if failed
        """
        if not PLAYWRIGHT_AVAILABLE:
            logger.error("Playwright is not installed")
            return None
        
        page: Optional[Page] = None
        try:
            logger.info(f"🎭 [Playwright] Scraping: {url}")
            
            browser = await self._get_browser()
            page = await browser.new_page(
                user_agent=self.user_agent,
                viewport={'width': 1920, 'height': 1080}
            )
            
            # Navigate to page
            await page.goto(url, wait_until=self.wait_until, timeout=self.page_timeout)
            
            # Wait a bit for any remaining dynamic content
            await page.wait_for_timeout(1000)
            
            # Try to get text directly from page first (cleaner than HTML parsing)
            try:
                # Get visible text from main content areas
                main_text = await page.evaluate("""
                    () => {
                        // Try to get text from main content areas
                        const main = document.querySelector('main') || 
                                   document.querySelector('article') || 
                                   document.querySelector('[role="main"]') ||
                                   document.querySelector('.content') ||
                                   document.querySelector('#content') ||
                                   document.body;
                        
                        if (!main) return '';
                        
                        // Clone to avoid modifying original
                        const clone = main.cloneNode(true);
                        
                        // Remove unwanted elements
                        clone.querySelectorAll('script, style, nav, header, footer, aside, iframe, svg, canvas, form, .ad, .advertisement, .sidebar, .social, .share, .comments, .cookie, .popup, .modal, .menu, .navigation').forEach(el => el.remove());
                        
                        return clone.innerText || clone.textContent || '';
                    }
                """)
                
                if main_text and len(main_text.strip()) > 100:
                    logger.info(f"✅ [Playwright] Extracted {len(main_text)} chars directly from page")
                    # Use direct text extraction - create a simple ScrapedPage
                    from bs4 import BeautifulSoup
                    html = await page.content()
                    soup = BeautifulSoup(html, 'lxml')
                    
                    # Get title and metadata from HTML
                    title = ''
                    if soup.title:
                        title = soup.title.get_text().strip()
                    if not title:
                        h1 = soup.find('h1')
                        if h1:
                            title = h1.get_text().strip()
                    if not title:
                        title = urlparse(url).path.split('/')[-1] or 'Untitled'
                    
                    # Extract headings and other metadata
                    headings = []
                    for i in range(1, 4):
                        for heading in soup.find_all(f'h{i}'):
                            text = heading.get_text().strip()
                            if text:
                                headings.append({"level": i, "text": text})
                    
                    paragraphs = []
                    for p in soup.find_all('p'):
                        text = p.get_text().strip()
                        if text and len(text) > 10:
                            paragraphs.append(text)
                    
                    images = []
                    for img in soup.find_all('img', src=True):
                        src = img.get('src', '').strip()
                        alt = img.get('alt', '').strip()
                        if src:
                            if not src.startswith(('http://', 'https://')):
                                src = urljoin(url, src)
                            images.append({"src": src, "alt": alt or ""})
                    
                    meta_description = None
                    meta_desc_tag = soup.find('meta', attrs={'name': 'description'}) or \
                                   soup.find('meta', attrs={'property': 'og:description'})
                    if meta_desc_tag:
                        meta_description = meta_desc_tag.get('content', '').strip()
                    
                    links = self._extract_links(soup, url)
                    
                    scraped_page = ScrapedPage(
                        url=url,
                        title=title,
                        meta_description=meta_description,
                        headings=headings,
                        paragraphs=paragraphs,
                        images=images,
                        main_content=main_text.strip(),
                        links=links,
                        timestamp=datetime.now().isoformat(),
                        depth=0
                    )
                    
                    logger.info(f"✅ [Playwright] Scraped {url}: {len(scraped_page.main_content)} chars, {len(scraped_page.headings)} headings")
                    return scraped_page
            except Exception as e:
                logger.warning(f"⚠️  [Playwright] Direct text extraction failed, using HTML parsing: {e}")
            
            # Fallback: Get HTML content and parse with BeautifulSoup
            html = await page.content()
            
            # Extract content using BeautifulSoup (easier than Playwright selectors)
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'lxml')
            
            # Extract content
            extracted = self._extract_content(soup, url)
            
            # Extract links
            links = self._extract_links(soup, url)
            
            # Create ScrapedPage
            scraped_page = ScrapedPage(
                url=url,
                title=extracted['title'],
                meta_description=extracted['meta_description'],
                headings=extracted['headings'],
                paragraphs=extracted['paragraphs'],
                images=extracted['images'],
                main_content=extracted['main_content'],
                links=links,
                timestamp=datetime.now().isoformat(),
                depth=0
            )
            
            logger.info(f"✅ [Playwright] Scraped {url}: {len(scraped_page.main_content)} chars, {len(scraped_page.headings)} headings")
            return scraped_page
            
        except PlaywrightTimeoutError as e:
            logger.error(f"⏱️  [Playwright] Timeout scraping {url}: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ [Playwright] Error scraping {url}: {e}")
            return None
        finally:
            if page:
                await page.close()
    
    def _extract_content(self, soup, url: str) -> Dict[str, Any]:
        """Extract content from BeautifulSoup object (same as BeautifulSoupScraper)"""
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
        
        # Extract headings
        headings = []
        for i in range(1, 4):
            for heading in soup.find_all(f'h{i}'):
                text = heading.get_text().strip()
                if text:
                    headings.append({
                        "level": i,
                        "text": text
                    })
        
        # Extract paragraphs
        paragraphs = []
        for p in soup.find_all('p'):
            text = p.get_text().strip()
            if text and len(text) > 10:
                paragraphs.append(text)
        
        # Extract images
        images = []
        for img in soup.find_all('img', src=True):
            src = img.get('src', '').strip()
            alt = img.get('alt', '').strip()
            if src:
                if not src.startswith(('http://', 'https://')):
                    src = urljoin(url, src)
                images.append({
                    "src": src,
                    "alt": alt or ""
                })
        
        # Extract main content
        main_content = self._extract_main_content(soup, url)
        
        return {
            'title': title,
            'meta_description': meta_description,
            'headings': headings,
            'paragraphs': paragraphs,
            'images': images,
            'main_content': main_content
        }
    
    def _extract_main_content(self, soup, url: str) -> str:
        """Extract main content (same logic as BeautifulSoupScraper)"""
        content_selectors = [
            'main', 'article', '[role="main"]',
            '.content', '#content', '.main-content', '.post-content',
            '.entry-content', '.page-content', '.article-content',
            '.post-body', '.entry-body', '.container', '.wrapper'
        ]
        
        main_content = None
        for selector in content_selectors:
            try:
                main_content = soup.select_one(selector)
                if main_content:
                    break
            except Exception:
                continue
        
        if not main_content:
            main_content = soup.find('body') or soup
        
        # Clean unwanted elements
        unwanted_tags = ['script', 'style', 'noscript', 'nav', 'header', 'footer', 
                        'aside', 'iframe', 'svg', 'canvas', 'form']
        for tag in unwanted_tags:
            try:
                for element in main_content.find_all(tag):
                    element.decompose()
            except Exception:
                continue
        
        # Remove ad/sidebar elements
        unwanted_classes = ['ad', 'advertisement', 'ads', 'sidebar', 'social', 
                           'share', 'comments', 'cookie', 'popup', 'modal',
                           'menu', 'navigation', 'nav']
        for class_name in unwanted_classes:
            try:
                for element in main_content.find_all(class_=lambda x: x and class_name in str(x).lower()):
                    element.decompose()
            except Exception:
                continue
        
        main_text = main_content.get_text(separator='\n', strip=True)
        
        # Fallback to paragraphs
        if not main_text or len(main_text.strip()) < 50:
            all_paragraphs_text = '\n\n'.join([p.get_text(strip=True) for p in soup.find_all('p') if p.get_text(strip=True)])
            if all_paragraphs_text and len(all_paragraphs_text) > len(main_text):
                main_text = all_paragraphs_text
        
        return main_text
    
    def _extract_links(self, soup, url: str) -> List[str]:
        """Extract all links"""
        links = []
        for tag in soup.find_all('a', href=True):
            href = tag.get('href', '').strip()
            if href and not href.startswith(('javascript:', 'mailto:', 'tel:', '#')):
                if not href.startswith(('http://', 'https://')):
                    href = urljoin(url, href)
                links.append(href)
        return links
