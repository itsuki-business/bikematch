// Lightweight localStorage-based repository for Members and Expenses
// Data is namespaced by sessionId and stored as arrays.

const KEY_MEMBERS = (sid) => `members_${sid}`;
const KEY_EXPENSES = (sid) => `expenses_${sid}`;

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Members
export const membersRepo = {
  list(sessionId) {
    return Promise.resolve(read(KEY_MEMBERS(sessionId)));
  },
  create(sessionId, { name }) {
    const list = read(KEY_MEMBERS(sessionId));
    const item = { id: uid(), name };
    list.push(item);
    write(KEY_MEMBERS(sessionId), list);
    return Promise.resolve(item);
  },
  delete(sessionId, id) {
    const list = read(KEY_MEMBERS(sessionId)).filter((m) => m.id !== id);
    write(KEY_MEMBERS(sessionId), list);
    return Promise.resolve();
  },
};

// Expenses
export const expensesRepo = {
  list(sessionId) {
    const list = read(KEY_EXPENSES(sessionId));
    // sort by created_date desc if exists; otherwise id desc
    return Promise.resolve(
      [...list].sort((a, b) => (b.created_date || 0) - (a.created_date || 0))
    );
  },
  create(sessionId, data) {
    const list = read(KEY_EXPENSES(sessionId));
    const item = {
      id: uid(),
      amount: Number(data.amount || 0),
      payer_name: data.payer_name,
      memo: data.memo || "",
      created_date: Date.now(),
    };
    list.push(item);
    write(KEY_EXPENSES(sessionId), list);
    return Promise.resolve(item);
  },
  delete(sessionId, id) {
    const list = read(KEY_EXPENSES(sessionId)).filter((e) => e.id !== id);
    write(KEY_EXPENSES(sessionId), list);
    return Promise.resolve();
  },
  reset(sessionId) {
    write(KEY_EXPENSES(sessionId), []);
    return Promise.resolve();
  },
};
