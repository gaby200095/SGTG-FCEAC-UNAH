const authorizeRoles = (allowed = []) => (req, res, next) => {
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  const ok = roles.some(r => allowed.includes(String(r).toLowerCase()));
  if (!ok) return res.status(403).json({ error: 'Permisos insuficientes' });
  next();
};

module.exports = { authorizeRoles };
