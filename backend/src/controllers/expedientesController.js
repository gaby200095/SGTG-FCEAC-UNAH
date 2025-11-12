// Nota: En ausencia de tablas de expedientes/carreras, retornamos datos simulados.
// Integra aquí tu consulta real y filtros por carrera/usuario según tu modelo.

const listByRole = async (req, res) => {
  const roles = req.user?.roles || [];
  const id_usuario = req.user?.id_usuario;

  const data = [
    { id_expediente: 1, id_usuario: 101, nombre: 'Ana', carrera: 'Admin Empresas', estado: 'en revisión' },
    { id_expediente: 2, id_usuario: 102, nombre: 'Luis', carrera: 'Economía', estado: 'aprobado' },
    { id_expediente: 3, id_usuario: 103, nombre: 'Sofía', carrera: 'Contaduría', estado: 'pendiente' },
  ];

  if (roles.includes('secretaria_general') || roles.includes('administrativo')) {
    return res.json(data);
  }
  if (roles.includes('coordinador')) {
    // Simular filtro de carrera del coordinador
    const carreraCoordinador = 'Economía';
    return res.json(data.filter(d => d.carrera === carreraCoordinador));
  }
  // Estudiante: sólo su expediente (simulado por id_usuario)
  return res.json(data.filter(d => d.id_usuario === id_usuario));
};

module.exports = { listByRole };
