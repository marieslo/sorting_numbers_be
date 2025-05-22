This is a simple Express.js server that provides an API for serving a large list of items with support for filtering, pagination, sorting, and saving user state.

---

## Features

- Generates a list of 1,000,000 items in memory
- Supports filtering items by search term (case-insensitive)
- Supports pagination via `offset` and `limit` query parameters
- Supports custom sorting order saved per user
- Stores user state (selected item IDs and sorted order) in memory
- Provides endpoints to save and fetch user state

---

## API Endpoints

### GET /items

Fetches a paginated list of items with optional filtering and sorting.

**Query parameters:**

- `search` (string, optional) — filter items containing this substring (case-insensitive)
- `offset` (number, optional, default: 0) — start index for pagination
- `limit` (number, optional, default: 20) — number of items to return
- `useSorted` (string, optional, default: 'false') — if 'true', returns items in the user's saved sorted order

**Response:**

```json
{
  "items": [ { "id": number, "value": string }, ... ],
  "total": number
}