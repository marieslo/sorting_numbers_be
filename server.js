const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

// Разрешённые источники для CORS (клиенты, которые могут обращаться к API)
const allowedOrigins = [
  'https://sorting-numbers-fe.netlify.app',
  'http://localhost:5173',
];

// Настройки CORS с проверкой origin
const corsOptions = {
  origin: function (origin, callback) {
    // Если запрос без origin (например, curl или Postman) — разрешаем
    // Или если origin есть в списке разрешённых — разрешаем
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Иначе блокируем запрос с ошибкой CORS
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],             // Разрешённые HTTP методы
  allowedHeaders: ['Content-Type'],     // Разрешённые заголовки
};

// Подключаем CORS middleware с настройками
app.use(cors(corsOptions));
// для парсинга JSON тела запросов
app.use(express.json());

/**
 * Эмуляция базы данных — 1 000 000 элементов.
 * Каждый элемент — объект с id и value (строковым представлением id).
 */
const items = Array.from({ length: 1_000_000 }, (_, i) => ({
  id: i + 1,
  value: `${i + 1}`,
}));

/**
 * Хранение состояния пользователя в памяти.
 */
let userState = {
  selectedIds: [],          // Выбранные пользователем элементы
  sortedIds: [],            // Пользовательская сортировка всех элементов
  filteredSortedIds: [],    // Пользовательская сортировка при активном поиске
  offset: 0,                // Текущий сдвиг пагинации для общего списка
  filteredOffset: 0,        // Текущий сдвиг пагинации для списка с поиском
  scrollTop: 0,             // Позиция скролла в общем списке
  filteredScrollTop: 0,     // Позиция скролла в списке с поиском
  lastSearch: '',           // Последний поисковый запрос пользователя
};

/**
 * API: Получить состояние пользователя.
 * Используется для восстановления состояния UI на клиенте.
 */
app.get('/get-state', (req, res) => {
  res.json(userState);
});

/**
 * API: Сохранить состояние пользователя.
 * Принимает частичный объект состояния и обновляет текущее состояние.
 */
app.post('/save-state', (req, res) => {
  const {
    selectedIds,
    sortedIds,
    filteredSortedIds,
    offset,
    filteredOffset,
    scrollTop,
    filteredScrollTop,
    lastSearch,
  } = req.body;

  // Обновляем состояние, если соответствующие поля присутствуют в запросе
  if (selectedIds) userState.selectedIds = Array.from(new Set(selectedIds));
  if (sortedIds) userState.sortedIds = Array.from(new Set(sortedIds));
  if (filteredSortedIds) userState.filteredSortedIds = Array.from(new Set(filteredSortedIds));
  if (typeof offset === 'number') userState.offset = offset;
  if (typeof filteredOffset === 'number') userState.filteredOffset = filteredOffset;
  if (typeof scrollTop === 'number') userState.scrollTop = scrollTop;
  if (typeof filteredScrollTop === 'number') userState.filteredScrollTop = filteredScrollTop;
  if (typeof lastSearch === 'string') userState.lastSearch = lastSearch;

  res.json({ status: 'ok' });
});

/**
 * API: Получить элементы с пагинацией, поиском и сортировкой.
 * Поддерживается:
 * - offset, limit для пагинации
 * - search — фильтрация по подстроке в value
 * - пользовательская сортировка с учётом поиска и без
 */
app.get('/items', (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';

  let filteredIds;

  if (search) {
    // Поиск активен: фильтруем items по подстроке в value
    const filtered = items
      .filter(item => item.value.includes(search))
      .map(item => item.id);

    if (userState.filteredSortedIds.length > 0) {
      // Если есть сохранённая сортировка для фильтра — используем её
      const filteredSet = new Set(filtered);
      // Элементы, отсортированные пользователем, которые есть в фильтре
      const sortedFiltered = userState.filteredSortedIds.filter(id => filteredSet.has(id));
      // Остальные элементы, не включённые в пользовательскую сортировку
      const remaining = filtered.filter(id => !userState.filteredSortedIds.includes(id));
      filteredIds = [...sortedFiltered, ...remaining];
    } else {
      // Если сортировки нет — просто отфильтрованные id
      filteredIds = filtered;
    }
  } else {
    // Поиска нет — возвращаемся к пользовательской сортировке всего списка
    if (userState.sortedIds.length > 0) {
      const allIds = items.map(i => i.id);
      const sortedSet = new Set(userState.sortedIds);
      // Элементы из сортировки пользователя, присутствующие в полном списке
      const sortedPart = userState.sortedIds.filter(id => sortedSet.has(id));
      // Элементы, не вошедшие в сортировку
      const remaining = allIds.filter(id => !sortedSet.has(id));
      filteredIds = [...sortedPart, ...remaining];
    } else {
      // Если сортировки нет, просто все id подряд
      filteredIds = items.map(i => i.id);
    }
  }

  // Формируем страницу элементов с учётом пагинации
  const total = filteredIds.length;
  const pageIds = filteredIds.slice(offset, offset + limit);
  const pageItems = pageIds.map(id => ({ id, value: id.toString() }));

  res.json({ items: pageItems, total });
});

/**
 * API: Получить элементы по массиву id (bulk-запрос).
 * Используется для быстрой загрузки набора элементов по их id.
 */
app.post('/items/bulk', (req, res) => {
  const ids = req.body.ids || [];
  // Фильтруем некорректные id
  const filtered = ids.filter(id => id >= 1 && id <= items.length);
  // Формируем массив элементов по id
  const bulkItems = filtered.map(id => ({ id, value: id.toString() }));
  res.json({ items: bulkItems });
});


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});