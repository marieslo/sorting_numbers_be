const express = require('express');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Генерация массива от 1 до 1 000 000
const items = Array.from({ length: 1_000_000 }, (_, i) => ({
  id: i + 1,
  value: `Item ${i + 1}`,
}));

// Состояние пользователя (в памяти)
let userState = {
  selectedIds: [],
  sortedIds: [],
};

// Получение элементов с фильтром, пагинацией и сортировкой
app.get('/items', (req, res) => {
  const { search = '', offset = 0, limit = 20, useSorted = 'false' } = req.query;

  let filtered = items;
  if (search) {
    filtered = items.filter((item) =>
      item.value.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (useSorted === 'true' && userState.sortedIds.length > 0) {
    const sortedItems = [];
    const remainingMap = new Map(filtered.map((item) => [item.id, item]));

    for (const id of userState.sortedIds) {
      if (remainingMap.has(id)) {
        sortedItems.push(remainingMap.get(id));
        remainingMap.delete(id);
      }
    }

    sortedItems.push(...remainingMap.values());
    filtered = sortedItems;
  }

  const sliced = filtered.slice(Number(offset), Number(offset) + Number(limit));
  res.json({ items: sliced, total: filtered.length });
});

// Сохранение состояния
app.post('/save-state', (req, res) => {
  const { selectedIds, sortedIds } = req.body;
  userState = { selectedIds, sortedIds };
  res.sendStatus(200);
});

// Получение состояния
app.get('/get-state', (req, res) => {
  res.json(userState);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});