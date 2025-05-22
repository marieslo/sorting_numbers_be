const express = require('express');
const cors = require('cors');
const app = express();
const port = 4000;

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

const ITEMS_COUNT = 1_000_000;
const items = Array.from({ length: ITEMS_COUNT }, (_, i) => ({
  id: i + 1,
  value: `${i + 1}`,
}));

// Пользовательское состояние (для одного пользователя)
let userState = {
  selectedIds: [],
  sortedIds: [],
  offset: 0,
};

// Чтобы ускорить поиск, создадим Map из id -> item (готовится один раз)
const itemsMap = new Map(items.map(item => [item.id, item]));

// GET /items — с фильтрацией, сортировкой, пагинацией
app.get('/items', (req, res) => {
  let { search = '', offset = 0, limit = 20, useSorted = 'false' } = req.query;

  offset = Number(offset);
  limit = Number(limit);

  let filteredIds;

  if (search) {
    // Если есть поиск, нужно фильтровать по значению
    const searchLower = search.toLowerCase();

    // Эффективно фильтруем: идем по массиву и собираем id элементов, которые подходят
    filteredIds = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].value.includes(searchLower)) {
        filteredIds.push(items[i].id);
      }
    }
  } else {
    // Если поиска нет, то берем все id
    filteredIds = items.map(item => item.id);
  }

  // Если нужно сортировать по пользовательскому порядку
  if (useSorted === 'true' && userState.sortedIds.length > 0) {
    // Создаем Set из filteredIds для быстрого поиска
    const filteredSet = new Set(filteredIds);

    // Сначала добавим id из userState.sortedIds, которые есть в filteredIds
    const sortedFilteredIds = [];
    for (const id of userState.sortedIds) {
      if (filteredSet.has(id)) {
        sortedFilteredIds.push(id);
        filteredSet.delete(id);
      }
    }

    // Затем добавим id, которые есть в filteredIds, но отсутствуют в sortedIds
    for (const id of filteredSet) {
      sortedFilteredIds.push(id);
    }

    filteredIds = sortedFilteredIds;
  }

  // Пагинация - отрезаем кусок id
  const pagedIds = filteredIds.slice(offset, offset + limit);

  // Получаем объекты по id из Map
  const pagedItems = pagedIds.map(id => itemsMap.get(id));

  res.json({
    items: pagedItems,
    total: filteredIds.length,
  });
});

// POST /save-state — сохраняем пользовательское состояние
app.post('/save-state', (req, res) => {
  const { selectedIds = [], sortedIds = [], offset = 0 } = req.body;

  userState.selectedIds = selectedIds;
  userState.sortedIds = sortedIds;
  userState.offset = offset;

  res.sendStatus(200);
});

// GET /get-state — возвращаем текущее состояние пользователя
app.get('/get-state', (req, res) => {
  res.json(userState);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});