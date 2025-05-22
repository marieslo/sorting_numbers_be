This is a simple Express.js server that provides an API for serving a large list of items with support for filtering, pagination, sorting, and saving user state.

---

## Features

- Generates a list of 1,000,000 items in memory
- Supports filtering items by search term (case-insensitive)
- Supports pagination via `offset` and `limit` query parameters
- Supports custom sorting order saved per user
- Stores user state (selected item IDs and sorted order) in memory
- Provides endpoints to save and fetch user state
