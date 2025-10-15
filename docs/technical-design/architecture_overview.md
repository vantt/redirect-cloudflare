## System Architecture Overview

The system is deployed as a single Cloudflare Worker running on the edge network. This worker encapsulates all three core components.

```mermaid
graph LR
    subgraph Cloudflare Edge
        direction LR
        subgraph Worker
            RH[Request Handler] --> TS(Tracking System)
            RH --> RE(Redirect Engine)
        end
        Worker --> RESP(Response Generation)
    end

    Client -- HTTPS Request --> RH
    TS -- Tracking Events (Async) --> Analytics(Analytics Platforms e.g., GTM/GA4)
    RESP -- HTTP Response (Redirect/OK/Error) --> Client
```

**Key Characteristics:**
- **Stateless:** The core redirection logic is stateless, relying only on the incoming URL.
- **Edge Deployment:** Leverages Cloudflare's global network for low latency.
- **Single Worker:** Simplifies deployment and management, containing all logic.
- **Asynchronous Tracking:** Tracking events are typically sent asynchronously to avoid delaying the user redirection. 