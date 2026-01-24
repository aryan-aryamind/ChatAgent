"""
BeautifulSoup-based scraper for static HTML content.
Fast and lightweight, perfect for traditional websites.
"""

import asyncio
import httpx
import logging
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Optional, Any
from datetime import datetime

from .base_scraper import BaseScraper
from .async_website_scraper import ScrapedPage

logger = logging.getLogger(__name__)


class BeautifulSoupScraper(BaseScraper):
    """
    BeautifulSoup-based scraper for static HTML content.
    Fast, lightweight, and perfect for traditional websites.
    """
    
    def __init__(self, timeout: int = 30, user_agent: str = "Chatbase-Clone-Scraper/1.0"):
        super().__init__(timeout, user_agent)
        self.client_config = {
            'timeout': self.timeout,
            'follow_redirects': True,
            'headers': {
                'User-Agent': self.user_agent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        }
    
    def get_name(self) -> str:
        return "BeautifulSoup"
    
    async def scrape(self, url: str) -> Optional[ScrapedPage]:
        """
        Scrape a URL using BeautifulSoup.
        
        Args:
            url: URL to scrape
        
        Returns:
            ScrapedPage or None if failed
        """
        try:
            logger.info(f"🔍 [BeautifulSoup] Scraping: {url}")
            
            async with httpx.AsyncClient(**self.client_config) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                # Parse HTML
                soup = BeautifulSoup(response.content, 'lxml')
                
                # Extract content
                extracted = self._extract_content(soup, url)
                
                # Extract links
                links = self._extract_links(soup, url)
                
                # Create ScrapedPage
                page = ScrapedPage(
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
                
                logger.info(f"✅ [BeautifulSoup] Scraped {url}: {len(page.main_content)} chars, {len(page.headings)} headings")
                return page
                
        except Exception as e:
            logger.error(f"❌ [BeautifulSoup] Error scraping {url}: {e}")
            return None
    
    def _extract_content(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """Extract content from BeautifulSoup object"""
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
    
    def _extract_main_content(self, soup: BeautifulSoup, url: str) -> str:
        """Extract main content with fallback strategies"""
        # Try content selectors
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
        
        # If no main content found, use body
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
        
        # Remove elements with common ad/sidebar classes
        unwanted_classes = ['ad', 'advertisement', 'ads', 'sidebar', 'social', 
                           'share', 'comments', 'cookie', 'popup', 'modal',
                           'menu', 'navigation', 'nav']
        for class_name in unwanted_classes:
            try:
                for element in main_content.find_all(class_=lambda x: x and class_name in str(x).lower()):
                    element.decompose()
            except Exception:
                continue
        
        # Get text content
        main_text = main_content.get_text(separator='\n', strip=True)
        
        # Fallback strategies
        if not main_text or len(main_text.strip()) < 50:
            all_paragraphs_text = '\n\n'.join([p.get_text(strip=True) for p in soup.find_all('p') if p.get_text(strip=True)])
            if all_paragraphs_text and len(all_paragraphs_text) > len(main_text):
                main_text = all_paragraphs_text
                logger.warning(f"Used paragraph fallback for {url}: {len(main_text)} chars")
        
        if not main_text or len(main_text.strip()) < 50:
            divs_text = []
            for div in soup.find_all('div', limit=20):
                text = div.get_text(strip=True)
                if text and len(text) > 20:
                    divs_text.append(text)
            if divs_text:
                main_text = '\n\n'.join(divs_text[:10])
                logger.warning(f"Used div fallback for {url}: {len(main_text)} chars")
        
        return main_text
    
    def _extract_links(self, soup: BeautifulSoup, url: str) -> List[str]:
        """Extract all links from a page"""
        links = []
        for tag in soup.find_all('a', href=True):
            href = tag.get('href', '').strip()
            if href and not href.startswith(('javascript:', 'mailto:', 'tel:', '#')):
                if not href.startswith(('http://', 'https://')):
                    href = urljoin(url, href)
                links.append(href)
        return links
