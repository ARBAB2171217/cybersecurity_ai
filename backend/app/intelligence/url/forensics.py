import socket
import ssl
import datetime
import logging
from urllib.parse import urlparse
try:
    import dns.resolver
except ImportError:
    pass
try:
    import whois
except ImportError:
    pass

logger = logging.getLogger(__name__)

async def gather_forensics(domain: str, final_url: str) -> dict:
    results = {
        "ssl": {
            "status": "Disabled",
            "issuer": "Unavailable",
            "expiry": "Unavailable",
            "algorithm": "Unavailable",
            "tls_version": "Unavailable",
            "self_signed": "Unknown",
            "security_grade": "Unavailable"
        },
        "dns": {
            "a_records": [],
            "ns_records": [],
            "mx_records": [],
            "ip_address": "Unavailable",
            "provider": "Unavailable",
            "country": "Unavailable"
        },
        "whois": {
            "creation_date": "Unavailable",
            "expiration_date": "Unavailable",
            "updated_date": "Unavailable",
            "domain_age_days": "Unavailable"
        }
    }

    if not domain:
        return results

    # 1. DNS lookups
    try:
        if "dns" in globals():
            resolver = dns.resolver.Resolver()
            resolver.timeout = 2
            resolver.lifetime = 2
            
            try:
                a_answers = resolver.resolve(domain, 'A')
                results["dns"]["a_records"] = [str(rdata) for rdata in a_answers]
                if results["dns"]["a_records"]:
                    results["dns"]["ip_address"] = results["dns"]["a_records"][0]
            except Exception:
                pass
                
            try:
                ns_answers = resolver.resolve(domain, 'NS')
                results["dns"]["ns_records"] = [str(rdata) for rdata in ns_answers]
                if results["dns"]["ns_records"]:
                    ns1 = results["dns"]["ns_records"][0].lower()
                    if "cloudflare" in ns1: results["dns"]["provider"] = "Cloudflare"
                    elif "awsdns" in ns1: results["dns"]["provider"] = "AWS Route53"
                    elif "googledomains" in ns1: results["dns"]["provider"] = "Google Domains"
                    elif "godaddy" in ns1 or "domaincontrol" in ns1: results["dns"]["provider"] = "GoDaddy"
                    elif "namecheap" in ns1: results["dns"]["provider"] = "Namecheap"
            except Exception:
                pass
                
            try:
                mx_answers = resolver.resolve(domain, 'MX')
                results["dns"]["mx_records"] = [str(rdata.exchange) for rdata in mx_answers]
            except Exception:
                pass
    except Exception as e:
        logger.error(f"DNS lookup failed: {e}")

    # Fallback to basic socket if dns is not available or failed A record
    if results["dns"]["ip_address"] == "Unavailable":
        try:
            ip = socket.gethostbyname(domain)
            results["dns"]["ip_address"] = ip
            results["dns"]["a_records"] = [ip]
        except Exception:
            pass

    # 2. SSL Intelligence
    try:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        with socket.create_connection((domain, 443), timeout=3) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert(binary_form=True)
                # To parse binary cert details natively without OpenSSL requires crypto lib or hacky parsing
                # But we can get standard dict by requiring verification
                
        # To get issuer easily without heavy dependencies, we use standard getpeercert() which needs valid cert
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=3) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                tls_version = ssock.version()
                
                issuer_dict = dict(x[0] for x in cert.get("issuer", []))
                issuer = issuer_dict.get("organizationName", issuer_dict.get("commonName", "Unknown"))
                
                not_after = cert.get("notAfter")
                
                results["ssl"]["status"] = "Enabled"
                results["ssl"]["issuer"] = issuer
                results["ssl"]["expiry"] = not_after
                results["ssl"]["tls_version"] = tls_version
                results["ssl"]["self_signed"] = "No"
                results["ssl"]["algorithm"] = "RSA/SHA256" # Fallback heuristic
                results["ssl"]["security_grade"] = "A" if tls_version in ["TLSv1.2", "TLSv1.3"] else "B"
                
    except Exception as e:
        logger.error(f"SSL lookup failed: {e}")
        # If port 443 is open but cert is invalid, status is enabled but invalid
        if "ssl" in str(e).lower() or "certificate" in str(e).lower():
            results["ssl"]["status"] = "Enabled (Invalid Cert)"

    # 3. WHOIS
    try:
        if "whois" in globals():
            w = whois.whois(domain)
            if w.creation_date:
                creation = w.creation_date[0] if isinstance(w.creation_date, list) else w.creation_date
                results["whois"]["creation_date"] = creation.strftime("%Y-%m-%d") if isinstance(creation, datetime.datetime) else str(creation)
                
                if isinstance(creation, datetime.datetime):
                    age = (datetime.datetime.now() - creation).days
                    results["whois"]["domain_age_days"] = f"{age} days"
                    
            if w.expiration_date:
                exp = w.expiration_date[0] if isinstance(w.expiration_date, list) else w.expiration_date
                results["whois"]["expiration_date"] = exp.strftime("%Y-%m-%d") if isinstance(exp, datetime.datetime) else str(exp)
                
            if w.updated_date:
                upd = w.updated_date[0] if isinstance(w.updated_date, list) else w.updated_date
                results["whois"]["updated_date"] = upd.strftime("%Y-%m-%d") if isinstance(upd, datetime.datetime) else str(upd)
    except Exception as e:
        logger.error(f"WHOIS lookup failed: {e}")

    return results
