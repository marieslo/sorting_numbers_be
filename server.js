const express = require('express');
const cors = require('cors');
const app = express();
const allowedOrigins = [
  'https://sorting-numbers-fe.netlify.app',
  'http://localhost:5173',
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.use(express.json());

const PORT = 4000;

// Эмуляция БД: 1_000_000 элементов
const items = Array.from({ length: 1_000_000 }, (_, i) => ({
  id: i + 1,
  value: `${i + 1}`
}));

// Временное хранилище состояния пользователя
let userState = {
  selectedIds: [],
  sortedIds: [],
  offset: 0,
  scrollTop: 0
};

// GET: получить состояние пользователя
app.get('/get-state', (req, res) => {
  res.json(userState);
});

// POST: сохранить состояние пользователя
app.post('/save-state', (req, res) => {
  const { selectedIds, sortedIds, offset, scrollTop } = req.body;
  if (selectedIds) userState.selectedIds = selectedIds;
  if (sortedIds) userState.sortedIds = sortedIds;
  if (typeof offset === 'number') userState.offset = offset;
  if (typeof scrollTop === 'number') userState.scrollTop = scrollTop;
  res.json({ status: 'ok' });
});

function getFilteredIds(search = '', useSorted = false) {
  let filtered = search
    ? items.filter(item => item.value.toLowerCase().includes(search.toLowerCase())).map(i => i.id)
    : items.map(i => i.id);

  if (useSorted && userState.sortedIds.length > 0) {
    const filteredSet = new Set(filtered);
    const sortedFiltered = userState.sortedIds.filter(id => filteredSet.has(id));
    const remaining = filtered.filter(id => !userState.sortedIds.includes(id));
    return [...sortedFiltered, ...remaining];
  }
  return filtered;
}

// GET /items - с пагинацией и поиском
app.get('/items', (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const useSorted = req.query.useSorted === 'true';

  const filteredIds = getFilteredIds(search, useSorted);
  const total = filteredIds.length;

  const pageIds = filteredIds.slice(offset, offset + limit);
  const pageItems = pageIds.map(id => ({ id, value: id.toString() }));

  res.json({ items: pageItems, total });
});

// POST /items/bulk - получить элементы по массиву ID
app.post('/items/bulk', (req, res) => {
  const ids = req.body.ids || [];
  const filtered = ids.filter(id => id >= 1 && id <= items.length);
  const bulkItems = filtered.map(id => ({ id, value: id.toString() }));
  res.json({ items: bulkItems });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});