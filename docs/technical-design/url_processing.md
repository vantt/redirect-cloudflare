## Core URL Processing Mechanism
- The system processes URLs structured as: `https://redirect.example.com#[destination-url]?isNoRedirect=[0|1]`
- The `destination-url` is extracted from the hash fragment (`#`).
- Optional query parameters like `isNoRedirect` are parsed from the `destination-url` itself *after* the hash.
- All tracking parameters (UTM, platform-specific) are expected *within* the `destination-url`. 