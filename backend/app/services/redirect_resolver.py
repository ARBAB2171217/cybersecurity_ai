import httpx
from typing import Dict, Any, List
import urllib.parse

class RedirectResolverService:
    @staticmethod
    async def resolve_url(url: str, max_redirects: int = 5, timeout: float = 4.0) -> Dict[str, Any]:
        """
        Safely and programmatically resolves redirect chains for a URL
        without loading it in a browser context. Detects loops, circular links,
        and extracts server-side headers.
        """
        chain = []
        current_url = url
        visited = {current_url}
        total_redirects = 0
        status_code = 200
        headers = {}
        error = None

        transport = httpx.AsyncHTTPTransport(retries=0)
        
        # We will attempt to fetch with verify=True first to validate SSL
        ssl_valid = False
        ssl_error = None
        
        try:
            async with httpx.AsyncClient(transport=transport, verify=True, timeout=timeout) as test_client:
                await test_client.head(url, follow_redirects=False)
                ssl_valid = True
        except Exception as e:
            ssl_error = str(e)
            
        html_content = ""
        
        # Now follow redirects with verify=False for robustness during analysis
        async with httpx.AsyncClient(transport=transport, verify=False, timeout=timeout) as client:
            while total_redirects <= max_redirects:
                try:
                    headers_to_send = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    }
                    response = await client.get(current_url, follow_redirects=False, headers=headers_to_send)
                    
                    if status_code in (200, 201, 202) and not (300 <= status_code < 400):
                        html_content = response.text[:50000] # Get up to 50KB for static analysis
                    
                    status_code = response.status_code
                    headers = dict(response.headers)
                    
                    parsed_step = urllib.parse.urlparse(current_url)
                    chain.append({
                        "url": current_url,
                        "status_code": status_code,
                        "hostname": parsed_step.hostname or "",
                        "server": headers.get("server", "Unknown"),
                        "content_type": headers.get("content-type", "Unknown")
                    })
                    
                    # Handle 3xx redirect codes
                    if status_code in (301, 302, 303, 307, 308):
                        location = headers.get("location") or headers.get("Location")
                        if not location:
                            break
                        
                        # Resolve relative paths relative to current URL
                        next_url = urllib.parse.urljoin(current_url, location)
                        
                        total_redirects += 1
                        if total_redirects > max_redirects:
                            error = f"Maximum redirect limit ({max_redirects}) exceeded."
                            break
                            
                        # Loop / circularity check
                        if next_url in visited:
                            error = "Redirect loop/circular redirect detected."
                            chain.append({
                                "url": next_url,
                                "status_code": 0,
                                "hostname": urllib.parse.urlparse(next_url).hostname or "",
                                "server": "N/A",
                                "content_type": "N/A"
                            })
                            break
                            
                        visited.add(next_url)
                        current_url = next_url
                    else:
                        break
                except httpx.TimeoutException:
                    error = "Connection timeout during redirect resolution."
                    break
                except Exception as e:
                    error = f"Failed to resolve URL redirect: {str(e)}"
                    break

        final_url = current_url
        parsed_final = urllib.parse.urlparse(final_url)
        
        return {
            "original_url": url,
            "final_url": final_url,
            "total_redirects": total_redirects,
            "redirect_chain": chain,
            "status_code": status_code,
            "error": error,
            "https_enabled": parsed_final.scheme == "https",
            "ssl_valid": ssl_valid,
            "ssl_error": ssl_error,
            "port": parsed_final.port or ("443" if parsed_final.scheme == "https" else "80"),
            "server": headers.get("server", "Unknown") if not error else "Unknown",
            "content_type": headers.get("content-type", "Unknown") if not error else "Unknown",
            "html_content": html_content
        }
