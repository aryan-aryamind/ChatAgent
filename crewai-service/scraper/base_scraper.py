"""
Base scraper interface and shared utilities for all scraper implementations.
"""

from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass
from .async_website_scraper import ScrapedPage

logger = None  # Will be set by importing module


class BaseScraper(ABC):
    """
    Abstract base class for all scrapers.
    Defines the interface that all scraper implementations must follow.
    """
    
    def __init__(self, timeout: int = 30, user_agent: str = "Chatbase-Clone-Scraper/1.0"):
        """
        Initialize base scraper.
        
        Args:
            timeout: Request timeout in seconds
            user_agent: User agent string for requests
        """
        self.timeout = timeout
        self.user_agent = user_agent
    
    @abstractmethod
    async def scrape(self, url: str) -> Optional[ScrapedPage]:
        """
        Scrape a single URL and return a ScrapedPage.
        
        Args:
            url: URL to scrape
        
        Returns:
            ScrapedPage object or None if scraping failed
        """
        pass
    
    @abstractmethod
    def get_name(self) -> str:
        """Return the name of this scraper implementation."""
        pass
    
    def is_available(self) -> bool:
        """
        Check if this scraper is available (dependencies installed, etc.).
        Override in subclasses if needed.
        
        Returns:
            True if scraper can be used
        """
        return True


@dataclass
class ScraperConfig:
    """Configuration for hybrid scraper"""
    # Content quality thresholds
    min_content_length: int = 200  # Minimum characters to consider content sufficient
    max_script_ratio: float = 0.3  # Max ratio of script tags to total tags
    js_indicators: list = None  # Indicators of JS-heavy pages (e.g., ['#root', '#app'])
    
    # Scraper selection
    prefer_playwright: bool = False  # Force Playwright even if BeautifulSoup works
    enable_playwright: bool = True  # Enable Playwright fallback
    enable_selenium: bool = False  # Enable Selenium as third fallback (not implemented yet)
    
    # Performance
    playwright_timeout: int = 30000  # Playwright page load timeout (ms)
    playwright_wait_until: str = "networkidle"  # Playwright wait strategy
    
    def __post_init__(self):
        if self.js_indicators is None:
            self.js_indicators = ['#root', '#app', '#__next', '[data-reactroot]', '[ng-app]']


def detect_js_heavy_page(html: str, config: ScraperConfig) -> bool:
    """
    Detect if a page is JavaScript-heavy and needs Playwright.
    
    Args:
        html: HTML content
        config: Scraper configuration
    
    Returns:
        True if page appears to be JS-heavy
    """
    if not html:
        return False
    
    # Check for JS framework indicators
    for indicator in config.js_indicators:
        if indicator in html:
            return True
    
    # Count script tags
    script_count = html.lower().count('<script')
    tag_count = html.lower().count('<')
    
    if tag_count > 0:
        script_ratio = script_count / tag_count
        if script_ratio > config.max_script_ratio:
            return True
    
    # Check for common JS framework patterns
    js_frameworks = ['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt']
    html_lower = html.lower()
    for framework in js_frameworks:
        if framework in html_lower:
            return True
    
    return False


def merge_scraped_pages(page1: ScrapedPage, page2: ScrapedPage) -> ScrapedPage:
    """
    Merge two ScrapedPage objects, preferring the one with more content.
    
    Args:
        page1: First scraped page
        page2: Second scraped page
    
    Returns:
        Merged ScrapedPage with best content from both
    """
    # Choose page with more content
    if len(page2.main_content) > len(page1.main_content):
        primary, secondary = page2, page1
    else:
        primary, secondary = page1, page2
    
    # Merge headings (deduplicate by text)
    seen_headings = {h.get('text', '').lower(): h for h in primary.headings}
    for heading in secondary.headings:
        text = heading.get('text', '').lower()
        if text and text not in seen_headings:
            seen_headings[text] = heading
    
    # Merge paragraphs (deduplicate)
    seen_paragraphs = {p.lower(): p for p in primary.paragraphs}
    for para in secondary.paragraphs:
        if para.lower() not in seen_paragraphs:
            seen_paragraphs[para.lower()] = para
    
    # Merge images (deduplicate by src)
    seen_images = {img.get('src', ''): img for img in primary.images}
    for img in secondary.images:
        src = img.get('src', '')
        if src and src not in seen_images:
            seen_images[src] = img
    
    # Merge links (deduplicate)
    seen_links = set(primary.links)
    for link in secondary.links:
        if link not in seen_links:
            seen_links.add(link)
    
    # Combine main content if secondary has unique content
    combined_content = primary.main_content
    if len(secondary.main_content) > len(primary.main_content) * 0.5:  # If secondary has significant content
        # Append unique content from secondary
        secondary_unique = secondary.main_content[len(primary.main_content):]
        if secondary_unique.strip():
            combined_content = f"{primary.main_content}\n\n{secondary_unique}"
    
    return ScrapedPage(
        url=primary.url,
        title=primary.title or secondary.title,
        meta_description=primary.meta_description or secondary.meta_description,
        headings=list(seen_headings.values()),
        paragraphs=list(seen_paragraphs.values()),
        images=list(seen_images.values()),
        main_content=combined_content,
        links=list(seen_links),
        timestamp=primary.timestamp,
        depth=primary.depth
    )
