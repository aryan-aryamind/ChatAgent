"""
Hybrid scraper that combines BeautifulSoup and Playwright.
Intelligently chooses the best scraper based on page characteristics.
"""

import logging
from typing import Optional
from datetime import datetime

from .base_scraper import BaseScraper, ScraperConfig, detect_js_heavy_page, merge_scraped_pages
from .beautifulsoup_scraper import BeautifulSoupScraper
from .playwright_scraper import PlaywrightScraper
from .async_website_scraper import ScrapedPage

logger = logging.getLogger(__name__)


class HybridScraper(BaseScraper):
    """
    Hybrid scraper that intelligently combines BeautifulSoup and Playwright.
    
    Strategy:
    1. First tries BeautifulSoup (fast, lightweight)
    2. Analyzes content quality and page characteristics
    3. Falls back to Playwright if content is insufficient or page is JS-heavy
    4. Merges results from multiple scrapers if needed
    """
    
    def __init__(
        self,
        config: Optional[ScraperConfig] = None,
        timeout: int = 30,
        user_agent: str = "Chatbase-Clone-Scraper/1.0"
    ):
        super().__init__(timeout, user_agent)
        self.config = config or ScraperConfig()
        
        # Initialize scrapers
        self.bs_scraper = BeautifulSoupScraper(timeout=timeout, user_agent=user_agent)
        self.pw_scraper = None
        
        if self.config.enable_playwright:
            try:
                self.pw_scraper = PlaywrightScraper(
                    timeout=timeout,
                    user_agent=user_agent,
                    page_timeout=self.config.playwright_timeout,
                    wait_until=self.config.playwright_wait_until
                )
                if not self.pw_scraper.is_available():
                    logger.warning("Playwright scraper requested but not available")
                    self.pw_scraper = None
            except Exception as e:
                logger.warning(f"Could not initialize Playwright scraper: {e}")
                self.pw_scraper = None
    
    def get_name(self) -> str:
        return "Hybrid"
    
    async def scrape(self, url: str) -> Optional[ScrapedPage]:
        """
        Scrape a URL using hybrid strategy.
        
        Args:
            url: URL to scrape
        
        Returns:
            ScrapedPage or None if all scrapers failed
        """
        logger.info(f"🔀 [Hybrid] Starting hybrid scrape: {url}")
        
        # Strategy 1: Try BeautifulSoup first (unless forced to Playwright)
        bs_page = None
        if not self.config.prefer_playwright:
            try:
                bs_page = await self.bs_scraper.scrape(url)
                if bs_page:
                    logger.info(f"✅ [Hybrid] BeautifulSoup extracted {len(bs_page.main_content)} chars")
            except Exception as e:
                logger.warning(f"⚠️  [Hybrid] BeautifulSoup failed: {e}")
        
        # Analyze if we need Playwright
        needs_playwright = False
        
        if self.config.prefer_playwright:
            needs_playwright = True
            logger.info("🎭 [Hybrid] Forced to use Playwright (prefer_playwright=True)")
        elif bs_page is None:
            needs_playwright = True
            logger.info("🎭 [Hybrid] BeautifulSoup failed, trying Playwright")
        elif len(bs_page.main_content) < self.config.min_content_length:
            needs_playwright = True
            logger.info(f"🎭 [Hybrid] Content too short ({len(bs_page.main_content)} chars), trying Playwright")
        else:
            # Check HTML for JS indicators (need to fetch HTML again)
            try:
                import httpx
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(url)
                    if response.status_code == 200:
                        html = response.text
                        if detect_js_heavy_page(html, self.config):
                            needs_playwright = True
                            logger.info("🎭 [Hybrid] Detected JS-heavy page, trying Playwright")
            except Exception as e:
                logger.warning(f"Could not analyze HTML for JS detection: {e}")
        
        # Strategy 2: Try Playwright if needed
        pw_page = None
        if needs_playwright and self.pw_scraper:
            try:
                pw_page = await self.pw_scraper.scrape(url)
                if pw_page:
                    logger.info(f"✅ [Hybrid] Playwright extracted {len(pw_page.main_content)} chars")
            except Exception as e:
                logger.warning(f"⚠️  [Hybrid] Playwright failed: {e}")
        
        # Strategy 3: Merge or choose best result
        if bs_page and pw_page:
            # Merge both results
            merged = merge_scraped_pages(bs_page, pw_page)
            logger.info(f"🔀 [Hybrid] Merged results: {len(merged.main_content)} chars")
            return merged
        elif pw_page:
            return pw_page
        elif bs_page:
            return bs_page
        else:
            logger.error(f"❌ [Hybrid] All scrapers failed for {url}")
            return None
    
    async def close(self):
        """Cleanup resources"""
        if self.pw_scraper:
            await self.pw_scraper.close()
    
    def is_content_sufficient(self, page: Optional[ScrapedPage]) -> bool:
        """
        Check if scraped content is sufficient.
        
        Args:
            page: ScrapedPage to check
        
        Returns:
            True if content meets quality thresholds
        """
        if not page:
            return False
        
        # Check content length
        if len(page.main_content) < self.config.min_content_length:
            return False
        
        # Check if we have meaningful content (headings, paragraphs)
        if len(page.headings) == 0 and len(page.paragraphs) == 0:
            return False
        
        return True
