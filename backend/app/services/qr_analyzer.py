import re
import urllib.parse
from typing import Dict, Any

class QRAnalyzerService:
    """
    Analyzes decoded QR content based on its type and extracts structured information.
    """

    @staticmethod
    def analyze(qr_type: str, decoded_value: str) -> Dict[str, Any]:
        extracted = {}
        status = "VALID"
        errors = []

        if not decoded_value:
            return {
                "qr_type": qr_type,
                "decoded_value": decoded_value,
                "extracted_information": {},
                "validation_status": "INVALID",
                "validation_errors": ["Empty decoded value"]
            }

        if qr_type == "UPI Payment":
            # Example: upi://pay?pa=someone@upi&pn=Someone&am=100&tn=Note&cu=INR
            try:
                parsed = urllib.parse.urlparse(decoded_value)
                query_params = urllib.parse.parse_qs(parsed.query)
                
                pa = query_params.get("pa", [None])[0]
                pn = query_params.get("pn", [None])[0]
                am = query_params.get("am", [None])[0]
                tn = query_params.get("tn", [None])[0]
                cu = query_params.get("cu", [None])[0]

                extracted = {
                    "UPI ID": pa,
                    "Payee Name": pn,
                    "Transaction Amount": am,
                    "Transaction Note": tn,
                    "Currency": cu
                }
                
                # Validation
                if not pa:
                    errors.append("Missing Payee Address (UPI ID) 'pa'")
                elif not re.match(r"^[\w.-]+@[\w.-]+$", pa):
                    errors.append("Invalid UPI ID format")
            except Exception as e:
                errors.append(f"Failed to parse UPI format: {e}")

        elif qr_type == "Website URL":
            try:
                if not (decoded_value.startswith("http://") or decoded_value.startswith("https://")):
                    # It might be missing protocol, assume https for parsing if forced
                    parsed = urllib.parse.urlparse("https://" + decoded_value if not "://" in decoded_value else decoded_value)
                else:
                    parsed = urllib.parse.urlparse(decoded_value)
                
                domain_parts = parsed.netloc.split(".")
                tld = domain_parts[-1] if len(domain_parts) > 1 else None
                subdomain = ".".join(domain_parts[:-2]) if len(domain_parts) > 2 else None
                domain = ".".join(domain_parts[-2:]) if len(domain_parts) >= 2 else parsed.netloc

                extracted = {
                    "Complete URL": decoded_value,
                    "Protocol": parsed.scheme.upper(),
                    "Domain": domain,
                    "Subdomain": subdomain,
                    "Path": parsed.path,
                    "Query Parameters": urllib.parse.parse_qs(parsed.query),
                    "Top Level Domain": tld
                }
                if not parsed.netloc:
                    errors.append("Invalid URL structure")
            except Exception as e:
                errors.append(f"Failed to parse URL: {e}")

        elif qr_type == "Email":
            try:
                # mailto:someone@example.com?subject=Hi&body=There
                url_str = decoded_value[7:] if decoded_value.lower().startswith("mailto:") else decoded_value
                if "?" in url_str:
                    email, query = url_str.split("?", 1)
                    query_params = urllib.parse.parse_qs(query)
                    subject = query_params.get("subject", [None])[0]
                    body = query_params.get("body", [None])[0]
                else:
                    email = url_str
                    subject = None
                    body = None

                extracted = {
                    "Email Address": email,
                    "Subject": subject,
                    "Body": body
                }
                if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
                    errors.append("Invalid email address format")
            except Exception as e:
                errors.append(f"Failed to parse Email format: {e}")

        elif qr_type == "Phone Number":
            try:
                # tel:+123456789
                phone = decoded_value[4:] if decoded_value.lower().startswith("tel:") else decoded_value
                country_code = None
                if phone.startswith("+"):
                    match = re.match(r"^(\+\d{1,3})(\d+)$", phone)
                    if match:
                        country_code = match.group(1)
                        phone = match.group(2)
                
                extracted = {
                    "Phone Number": phone,
                    "Country Code": country_code
                }
                if not re.sub(r"\D", "", phone):
                    errors.append("Invalid phone number")
            except Exception as e:
                errors.append(f"Failed to parse Phone format: {e}")

        elif qr_type == "SMS":
            try:
                # sms:+123456789?body=Message
                url_str = decoded_value[4:] if decoded_value.lower().startswith("sms:") else decoded_value
                url_str = decoded_value[6:] if decoded_value.lower().startswith("smsto:") else url_str
                
                if ":" in url_str and "?" not in url_str:
                    # smsto:number:message format sometimes
                    parts = url_str.split(":", 1)
                    phone = parts[0]
                    body = parts[1]
                elif "?" in url_str:
                    phone, query = url_str.split("?", 1)
                    query_params = urllib.parse.parse_qs(query)
                    body = query_params.get("body", [None])[0]
                else:
                    phone = url_str
                    body = None

                extracted = {
                    "Phone Number": phone,
                    "Message Content": body
                }
                if not re.sub(r"\D", "", phone):
                    errors.append("Invalid SMS phone number")
            except Exception as e:
                errors.append(f"Failed to parse SMS format: {e}")

        elif qr_type == "WiFi":
            try:
                # WIFI:T:WPA;S:MyNetwork;P:Password;H:true;;
                content = decoded_value[5:] if decoded_value.lower().startswith("wifi:") else decoded_value
                parts = content.split(";")
                
                ssid = None
                encryption = None
                password = None
                hidden = None
                
                for part in parts:
                    if part.startswith("S:"):
                        ssid = part[2:]
                    elif part.startswith("T:"):
                        encryption = part[2:]
                    elif part.startswith("P:"):
                        password = part[2:]
                    elif part.startswith("H:"):
                        hidden = part[2:].lower() == "true"
                        
                extracted = {
                    "SSID": ssid,
                    "Encryption Type": encryption,
                    "Password": password,
                    "Hidden Network": hidden
                }
                if not ssid:
                    errors.append("Missing SSID for WiFi network")
            except Exception as e:
                errors.append(f"Failed to parse WiFi format: {e}")

        elif qr_type == "Contact Card":
            try:
                # Basic parsing for VCARD or MECARD
                name = None
                org = None
                phone = None
                email = None
                website = None
                
                if decoded_value.lower().startswith("begin:vcard"):
                    for line in decoded_value.splitlines():
                        line_upper = line.upper()
                        if line_upper.startswith("FN:"):
                            name = line[3:]
                        elif line_upper.startswith("N:") and not name:
                            name = line[2:].replace(";", " ")
                        elif line_upper.startswith("ORG:"):
                            org = line[4:]
                        elif line_upper.startswith("TEL"):
                            if ":" in line:
                                phone = line.split(":", 1)[1]
                        elif line_upper.startswith("EMAIL"):
                            if ":" in line:
                                email = line.split(":", 1)[1]
                        elif line_upper.startswith("URL"):
                            if ":" in line:
                                website = line.split(":", 1)[1]
                elif decoded_value.lower().startswith("mecard:"):
                    content = decoded_value[7:]
                    parts = content.split(";")
                    for part in parts:
                        if part.startswith("N:"):
                            name = part[2:]
                        elif part.startswith("TEL:"):
                            phone = part[4:]
                        elif part.startswith("EMAIL:"):
                            email = part[6:]
                        elif part.startswith("URL:"):
                            website = part[4:]
                            
                extracted = {
                    "Name": name,
                    "Organization": org,
                    "Phone": phone,
                    "Email": email,
                    "Website": website
                }
                if not name:
                    errors.append("Contact name is missing")
            except Exception as e:
                errors.append(f"Failed to parse Contact Card format: {e}")

        elif qr_type == "Location":
            try:
                # geo:lat,long,alt
                content = decoded_value[4:] if decoded_value.lower().startswith("geo:") else decoded_value
                coords = content.split("?", 1)[0].split(",")
                lat = coords[0] if len(coords) > 0 else None
                lon = coords[1] if len(coords) > 1 else None
                
                extracted = {
                    "Latitude": lat,
                    "Longitude": lon
                }
                if not lat or not lon:
                    errors.append("Invalid geolocation coordinates")
            except Exception as e:
                errors.append(f"Failed to parse Location format: {e}")

        else:
            # Plain Text, Unknown, Cryptocurrency, etc.
            extracted = {
                "Text": decoded_value
            }

        if errors:
            status = "INVALID"

        return {
            "qr_type": qr_type,
            "decoded_value": decoded_value,
            "extracted_information": extracted,
            "validation_status": status,
            "validation_errors": errors
        }
