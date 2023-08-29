# A record vs CNAME record

The `A record` and `CNAME record` are both types of DNS (Domain Name System) records, but they serve different purposes:

## A Record (Address Record)

`Purpose`: Maps a domain or subdomain directly to an IP address.

`Example`: If you want `example.com` to point to the `IP address 192.0.2.1`, you'd set up an A record for example.com with that IP address.

`Format`:

```sh
example.com.     A     192.0.2.1
```

`Usage`: Typically used for pointing a domain or subdomain to the static IP address of a server where the website or service is hosted.

## CNAME Record (Canonical Name Record)

`Purpose`: Maps a domain or subdomain to another domain name. It essentially creates an `alias and points to the canonical`, or primary, domain. The system will then resolve the CNAME to its corresponding A record to get the final IP address.

`Example`: If `blog.example.com` should point to the same location as `myblogplatform.com`, you'd set up a CNAME record to point blog.example.com to myblogplatform.com.

`Format`:

```sh
blog.example.com.     CNAME     myblogplatform.com.
```

`Usage`: Commonly used for subdomains, or when using third-party platforms where the actual IP address might change, making it easier to manage. For instance, many website builders or CDN services ask users to point their custom domains to them using CNAME records.

Key Differences:

- An A record points directly to an IP address.
- A CNAME record points to another domain or subdomain, which then gets resolved to an IP (usually via an A record).

Remember, due to the additional resolution step (going from alias to canonical domain to IP), using a CNAME can introduce a slight delay in DNS resolution compared to an A record. Also, according to DNS standards, a domain that has a CNAME record can't have any other records, which can limit configurations for that particular domain name.
