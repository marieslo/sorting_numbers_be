# Sorting Items

An Express-based backend for handling a list of 1,000,000 items with support for filtering, sorting (including drag & drop), selection, infinite scrolling, and persistent user state.

> [!NOTE]
> This is the backend\
> [This is a link to the frontend](https://github.com/marieslo/sorting_numbers_fe)


> [!NOTE]
> My free instance will spin down with inactivity, which can delay requests by 50 seconds or more

---

## Features

- Generates 1,000,000 unique items
- Supports multi-item selection
- Text-based filtering (search)
- Custom sorting using drag & drop
- Infinite scrolling with pagination
- Persistent user state (selection, sort order, scroll offset)
- In-memory state management (no database)

---

## To install and run locally

```bash
npm install
npm run dev