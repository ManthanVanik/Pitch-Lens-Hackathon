from googleapiclient.discovery import build
from typing import Dict, List
import logging
from config.settings import settings
from utils.summarizer import GeminiSummarizer
import asyncio
import time
import random
from googleapiclient.errors import HttpError
from concurrent.futures import TimeoutError as FuturesTimeoutError

logger = logging.getLogger(__name__)

class PublicDataGatherer:
    def __init__(self):
        self.search_service = build("customsearch", "v1", developerKey=settings.GOOGLE_API_KEY)
        self.summarizer = GeminiSummarizer()

    async def gather_data(self, company_name: str, founder_name: List[str], sector: str) -> Dict:
        """Gather public data about company, founder, and market"""
        try:
#             data = {}

#             # Founder profile
#             data['founder_profile'] = await self._search_founder_profile(founder_name)

#             # Competitors
#             data['competitors'] = await self._search_competitors(company_name, sector)

#             # Market stats
#             data['market_stats'] = await self._search_market_data(sector)

#             # Recent news
#             data['news'] = await self._search_news(company_name, founder_name)

#             return data
        
        
            results = await asyncio.gather(
                # self._search_founder_profile(founder_name),
                # self._search_competitors(company_name, sector),
                # self._search_market_data(sector),
                # self._search_news(company_name, founder_name),
                self._run_in_thread(self._search_founder_profile, founder_name),
                self._run_in_thread(self._search_competitors, company_name, sector),
                self._run_in_thread(self._search_market_data, sector),
                self._run_in_thread(self._search_news, company_name, founder_name),
                return_exceptions=True  # ensures one failure doesn't stop others
            )

            # Map results to keys
            data = {
                'founder_profile': results[0] if not isinstance(results[0], Exception) else "Error gathering founder info",
                'competitors': results[1] if not isinstance(results[1], Exception) else [],
                'market_stats': results[2] if not isinstance(results[2], Exception) else {},
                'news': results[3] if not isinstance(results[3], Exception) else []
            }

            return data

        except Exception as e:
            logger.error(f"Public data gathering error: {str(e)}")
            return {}
        
    async def _run_in_thread(self, func, *args):
        """Run blocking function in ThreadPoolExecutor safely"""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(executor, lambda: func(*args))

    async def _search_founder_profile(self, founder_name: List[str]) -> str:
        """Search for founder background information"""
        try:
            founder_combined = ", ".join(founder_name)
            queries = [
                f"{founder_combined} background experience",
                f"{founder_combined} LinkedIn profile career",
                f"{founder_combined} founder entrepreneur"
            ]

#             patterns = [
#                 "background experience",
#                 "LinkedIn profile career",
#                 "founder entrepreneur"
#             ]

#             queries = [f"{name} {pattern}" for name in founder_name for pattern in patterns]
            
            all_results = []
            for query in queries:
                results = await self._perform_search(query, num_results=3)
                all_results.extend(results)
                
            print("Founder All data: ", all_results)
            # Summarize findings
            if all_results:
                combined_text = "".join([f"{r['title']}: {r['snippet']}" for r in all_results])
                summary = self.summarizer.model.generate_content(
                    f"Summarize the professional background of {founder_combined} based on {combined_text}"
                )
                print("Founder all_results data sumary: ", summary.text)
                return summary.text.strip()

            return "No public information found"

        except Exception as e:
            logger.error(f"Founder search error: {str(e)}")
            return "Error gathering founder information"

    async def _search_competitors(self, company_name: str, sector: str) -> List[str]:
        """Search for competitors in the same sector"""
        try:
            query = f"{sector} companies competitors startups"
            results = await self._perform_search(query, num_results=5)

            if not results:
                return []

            # Extract competitor names using Gemini
            print("Competitor Data : ", results);
            combined_text = "".join([f"{r['title']}: {r['snippet']}" for r in results])
            response = self.summarizer.model.generate_content(
                f"Extract a list of company names that are competitors to {company_name} in the {sector} sector from: {combined_text}. Return only company names, one per line."
            )
            
            # competitors = [line.strip() for line in response.text.split('') if line.strip()]
            competitors = [line.strip() for line in response.text.splitlines() if line.strip()]
            print("competitors: ", competitors);
            return competitors[:5]  # Limit to top 5

        except Exception as e:
            logger.error(f"Competitor search error: {str(e)}")
            return []

    async def _search_market_data(self, sector: str) -> Dict[str, str]:
        """Search for market size and growth data"""
        try:
            queries = [
                f"{sector} market size TAM SAM",
                f"{sector} industry growth rate CAGR",
                f"{sector} market trends 2024 2025"
            ]

            all_results = []
            for query in queries:
                results = await self._perform_search(query, num_results=3)
                all_results.extend(results)

            if not all_results:
                return {}

            print("Market Data : ", all_results);
            # Extract market statistics
            combined_text = "".join([f"{r['title']}: {r['snippet']}" for r in all_results])
            response = self.summarizer.model.generate_content(
                f"""Extract market statistics for the {sector} sector from the following information:
                {combined_text}

                Return as JSON with keys: TAM (Total Addressable Market), SAM (Serviceable Addressable Market), CAGR (Compound Annual Growth Rate), key_trends.
                If specific data is not available, use "Not specified".
                """
            )

            try:
                import json
                print("Market Data Summaey: ", response.text);
                return json.loads(response.text.strip())
            except:
                return {"summary": response.text.strip()}

        except Exception as e:
            logger.error(f"Market data search error: {str(e)}")
            return {}

    async def _search_news(self, company_name: str, founder_name: List[str]) -> List[str]:
        """Search for recent news and updates"""
        try:
            founder_combined = ", ".join(founder_name)
            queries = [
                f"{company_name} funding investment news",
                f"{company_name} partnership launch news",
                f"{founder_combined} {company_name} announcement"
            ]

            news_items = []
            for query in queries:
                results = await self._perform_search(query, num_results=2)
                for result in results:
                    news_items.append(f"{result['title']}: {result['snippet']}")
            print("News Summaey: ", news_items);
            return news_items[:5]  # Limit to top 5 news items

        except Exception as e:
            logger.error(f"News search error: {str(e)}")
            return []

#     def _perform_search(self, query: str, num_results: int = 5) -> List[Dict]:
#         """Perform Google Custom Search"""
#         try:
#             result = self.search_service.cse().list(
#                 q=query,
#                 cx=settings.GOOGLE_SEARCH_ENGINE_ID,
#                 num=num_results
#             ).execute()

#             items = result.get('items', [])
#             return [
#                 {
#                     'title': item.get('title', ''),
#                     'snippet': item.get('snippet', ''),
#                     'link': item.get('link', '')
#                 }
#                 for item in items
#             ]

#         except Exception as e:
#             logger.error(f"Search API error: {str(e)}")
#             return []

#     def _perform_search_sync(self, query: str, num_results: int = 5) -> List[Dict]:
#         try:
#             result = self.search_service.cse().list(
#                 q=query,
#                 cx=settings.GOOGLE_SEARCH_ENGINE_ID,
#                 num=num_results
#             ).execute()

#             items = result.get('items', [])
#             return [
#                 {
#                     'title': item.get('title', ''),
#                     'snippet': item.get('snippet', ''),
#                     'link': item.get('link', '')
#                 }
#                 for item in items
#             ]

#         except Exception as e:
#             logger.error(f"Search API error: {str(e)}")
#             return []
        
        
#     def _perform_search_sync(self, query: str, num_results: int = 5) -> List[Dict]:
#         for attempt in range(3):
#             try:
#                 result = self.search_service.cse().list(
#                     q=query,
#                     cx=settings.GOOGLE_SEARCH_ENGINE_ID,
#                     num=num_results
#                 ).execute()

#                 items = result.get('items', [])
#                 return [
#                     {
#                         'title': item.get('title', ''),
#                         'snippet': item.get('snippet', ''),
#                         'link': item.get('link', '')
#                     }
#                     for item in items
#                 ]

#             except Exception as e:
#                 logger.error(f"Search API error (attempt {attempt+1}): {str(e)}")
#                 time.sleep(2)  # wait before retry
#         return []

    # async def _perform_search(self, query: str, num_results: int = 5) -> List[Dict]:
    #     loop = asyncio.get_running_loop()
    #     return await loop.run_in_executor(None, lambda: self._perform_search_sync(query, num_results))
    
    def _perform_search_sync(self, query: str, num_results: int = 5) -> List[Dict]:
        """Perform Google Custom Search with retry + exponential backoff"""
        max_attempts = 5
        base_delay = 1  # seconds

        for attempt in range(1, max_attempts + 1):
            try:
                result = self.search_service.cse().list(
                    q=query,
                    cx=settings.GOOGLE_SEARCH_ENGINE_ID,
                    num=num_results
                ).execute()

                items = result.get('items', [])
                return [
                    {
                        'title': item.get('title', ''),
                        'snippet': item.get('snippet', ''),
                        'link': item.get('link', '')
                    }
                    for item in items
                ]

            except (HttpError, OSError, ConnectionError) as e:
                # Log the error with attempt count
                logger.error(f"Search API error (attempt {attempt}/{max_attempts}): {str(e)}")

                # If last attempt, give up
                if attempt == max_attempts:
                    return []

                # Exponential backoff with jitter
                delay = base_delay * (2 ** (attempt - 1)) + random.uniform(0, 0.5)
                time.sleep(delay)

    async def _perform_search(self, query: str, num_results: int = 5, timeout: int = 30) -> List[Dict]:
        """Async wrapper for _perform_search_sync with timeout"""
        loop = asyncio.get_running_loop()
        try:
            # Run the sync search in executor with timeout
            future = loop.run_in_executor(None, lambda: self._perform_search_sync(query, num_results))
            results = await asyncio.wait_for(future, timeout=timeout)
            return results
        except FuturesTimeoutError:
            logger.error(f"Search API timeout for query: {query}")
            return []
        except Exception as e:
            logger.error(f"Async search error for query: {query}, error: {str(e)}")
            return []


# from googleapiclient.discovery import build
# from googleapiclient.errors import HttpError
# from typing import Dict, List
# import logging
# import asyncio
# import random
# import functools
# from config.settings import settings
# from utils.summarizer import GeminiSummarizer

# logger = logging.getLogger(__name__)

# class PublicDataGatherer:
#     def __init__(self):
#         self.search_service = build("customsearch", "v1", developerKey=settings.GOOGLE_API_KEY)
#         self.summarizer = GeminiSummarizer()
#         self.search_semaphore = asyncio.Semaphore(3)  # Limit concurrent searches

#     @functools.lru_cache(maxsize=128)
#     def _perform_search_sync(self, query: str, num_results: int = 5) -> List[Dict]:
#         """Sync Google search with retries (used inside async wrapper)"""
#         max_attempts = 5
#         base_delay = 1
#         for attempt in range(1, max_attempts + 1):
#             try:
#                 result = self.search_service.cse().list(
#                     q=query,
#                     cx=settings.GOOGLE_SEARCH_ENGINE_ID,
#                     num=num_results
#                 ).execute()
#                 items = result.get("items", [])
#                 return [{"title": i.get("title", ""), "snippet": i.get("snippet", ""), "link": i.get("link", "")} for i in items]
#             except (HttpError, OSError, ConnectionError) as e:
#                 logger.error(f"Search API error (attempt {attempt}/{max_attempts}): {str(e)}")
#                 if attempt == max_attempts:
#                     return []
#                 delay = base_delay * (2 ** (attempt - 1)) + random.uniform(0, 0.5)
#                 # Can't use asyncio.sleep here, will be handled in async wrapper
#                 import time
#                 time.sleep(delay)

#     async def _perform_search(self, query: str, num_results: int = 5, timeout: int = 30) -> List[Dict]:
#         """Async wrapper for _perform_search_sync with concurrency limit and timeout"""
#         async with self.search_semaphore:
#             loop = asyncio.get_running_loop()
#             try:
#                 future = loop.run_in_executor(None, lambda: self._perform_search_sync(query, num_results))
#                 results = await asyncio.wait_for(future, timeout=timeout)
#                 return results
#             except asyncio.TimeoutError:
#                 logger.error(f"Search API timeout for query: {query}")
#                 return []
#             except Exception as e:
#                 logger.error(f"Async search error for query: {query}, error: {str(e)}")
#                 return []

#     async def gather_data(self, company_name: str, founder_name: List[str], sector: str) -> Dict:
#         """Gather public data about company, founder, and market"""
#         try:
#             tasks = [
#                 self._search_founder_profile(founder_name),
#                 self._search_competitors(company_name, sector),
#                 self._search_market_data(sector),
#                 self._search_news(company_name, founder_name)
#             ]
#             results = await asyncio.gather(*tasks, return_exceptions=True)

#             data = {
#                 'founder_profile': results[0] if not isinstance(results[0], Exception) else "Error gathering founder info",
#                 'competitors': results[1] if not isinstance(results[1], Exception) else [],
#                 'market_stats': results[2] if not isinstance(results[2], Exception) else {},
#                 'news': results[3] if not isinstance(results[3], Exception) else []
#             }
#             return data
#         except Exception as e:
#             logger.error(f"Public data gathering error: {str(e)}")
#             return {}

#     # ===== Your search functions remain largely the same, just call new _perform_search =====
#     async def _search_founder_profile(self, founder_name: List[str]) -> str:
#         try:
#             founder_combined = ", ".join(founder_name)
#             queries = [
#                 f"{founder_combined} background experience",
#                 f"{founder_combined} LinkedIn profile career",
#                 f"{founder_combined} founder entrepreneur"
#             ]
#             all_results = []
#             for query in queries:
#                 results = await self._perform_search(query, num_results=3)
#                 all_results.extend(results)

#             if all_results:
#                 combined_text = "".join([f"{r['title']}: {r['snippet']}" for r in all_results])
#                 summary = self.summarizer.model.generate_content(
#                     f"Summarize the professional background of {founder_combined} based on {combined_text}"
#                 )
#                 return summary.text.strip()
#             return "No public information found"
#         except Exception as e:
#             logger.error(f"Founder search error: {str(e)}")
#             return "Error gathering founder information"

#     async def _search_competitors(self, company_name: str, sector: str) -> List[str]:
#         try:
#             query = f"{sector} companies competitors startups"
#             results = await self._perform_search(query, num_results=5)
#             if not results:
#                 return []
#             combined_text = "".join([f"{r['title']}: {r['snippet']}" for r in results])
#             response = self.summarizer.model.generate_content(
#                 f"Extract a list of company names that are competitors to {company_name} in the {sector} sector from: {combined_text}. Return only company names, one per line."
#             )
#             competitors = [line.strip() for line in response.text.splitlines() if line.strip()]
#             return competitors[:5]
#         except Exception as e:
#             logger.error(f"Competitor search error: {str(e)}")
#             return []

#     async def _search_market_data(self, sector: str) -> Dict[str, str]:
#         try:
#             queries = [
#                 f"{sector} market size TAM SAM",
#                 f"{sector} industry growth rate CAGR",
#                 f"{sector} market trends 2024 2025"
#             ]
#             all_results = []
#             for query in queries:
#                 results = await self._perform_search(query, num_results=3)
#                 all_results.extend(results)

#             if not all_results:
#                 return {}
#             combined_text = "".join([f"{r['title']}: {r['snippet']}" for r in all_results])
#             response = self.summarizer.model.generate_content(
#                 f"""Extract market statistics for the {sector} sector from the following information:
#                 {combined_text}
#                 Return as JSON with keys: TAM, SAM, CAGR, key_trends.
#                 If specific data is not available, use "Not specified"."""
#             )
#             import json
#             try:
#                 return json.loads(response.text.strip())
#             except:
#                 return {"summary": response.text.strip()}
#         except Exception as e:
#             logger.error(f"Market data search error: {str(e)}")
#             return {}

#     async def _search_news(self, company_name: str, founder_name: List[str]) -> List[str]:
#         try:
#             founder_combined = ", ".join(founder_name)
#             queries = [
#                 f"{company_name} funding investment news",
#                 f"{company_name} partnership launch news",
#                 f"{founder_combined} {company_name} announcement"
#             ]
#             news_items = []
#             for query in queries:
#                 results = await self._perform_search(query, num_results=2)
#                 for result in results:
#                     news_items.append(f"{result['title']}: {result['snippet']}")
#             return news_items[:5]
#         except Exception as e:
#             logger.error(f"News search error: {str(e)}")
#             return []
