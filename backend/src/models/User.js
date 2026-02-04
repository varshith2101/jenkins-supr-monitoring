// Simple in-memory user store
// In production, replace with a real database
let nextId = 3;
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: 'Administrator',
    lead: 'System',
    pipelines: [], // Empty = access to all
  },
  {
    id: 2,
    username: 'viewer',
    password: 'viewer123',
    role: 'viewer',
    displayName: 'Investor View',
    lead: 'System',
    pipelines: [],
  },
];

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

const UserModel = {
  findByUsername(username) {
    return users.find((user) => user.username === username);
  },

  authenticate(username, password) {
    const user = this.findByUsername(username);
    if (!user) return null;

    // Simple password comparison
    // In production, use bcrypt.compare()
    if (user.password === password) {
      return user;
    }

    return null;
  },

  getAllUsers() {
    return users.map((user) => sanitizeUser(user));
  },

  createUser({ username, password, role = 'user', displayName, lead, pipelines = [] }) {
    const existing = this.findByUsername(username);
    if (existing) {
      throw new Error('User already exists');
    }

    const newUser = {
      id: nextId++,
      username,
      password,
      role,
      displayName: displayName || username,
      lead: lead || '',
      pipelines: Array.isArray(pipelines) ? pipelines : [],
    };
    users.push(newUser);
    return sanitizeUser(newUser);
  },

  updateUser(username, updates) {
    const user = this.findByUsername(username);
    if (!user) return null;

    if (updates.password) {
      user.password = updates.password;
    }
    if (updates.role) {
      user.role = updates.role;
    }
    if (updates.displayName) {
      user.displayName = updates.displayName;
    }
    if (updates.pipelines !== undefined) {
      user.pipelines = Array.isArray(updates.pipelines) ? updates.pipelines : [];
    }

    return sanitizeUser(user);
  },

  deleteUser(username) {
    const index = users.findIndex((user) => user.username === username);
    if (index === -1) return false;
    users.splice(index, 1);
    return true;
  },
};

export default UserModel;
