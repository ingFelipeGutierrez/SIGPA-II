import { useState } from "react";
import { Link } from "react-router-dom";
import { usePracticasPorDecidir } from "../../hooks/usePracticasPorDecidir";
import { formatearHoras, formatearNota } from "../../utils/formato";
import ModalResultadoPractica from "../../components/ModalResultadoPractica";

/**
 * src/pages/director/DirectorDecidirResultado.jsx
 * Página "Decidir resultado de la práctica" (CU 1, pasos 18 a 23): la
 * tabla "Prácticas finalizadas por decidir", con el botón "Revisar" que
 * abre el modal compartido "Resultado de la práctica".
 */
export default function DirectorDecidirResultado() {
  const { practicas, cargando, recargar } = usePracticasPorDecidir();
  const [practicaAbierta, setPracticaAbierta] = useState(null);

  if (cargando) return <p className="vacio">Cargando…</p>;

  return (
    <div className="page">
      <div className="page-title">
        <Link to="/director/practicas" className="enlace-volver">← Gestionar prácticas</Link>
        <h1>Decidir resultado de la práctica</h1>
        <p>Revisa las prácticas finalizadas y decide si se aprueban o se rechazan.</p>
      </div>

      <div className="table-container">
        {practicas.length === 0 ? (
          <div className="vacio">No hay prácticas finalizadas por decidir.</div>
        ) : (
          <div className="tabla-scroll">
            <table className="apilable">
              <thead>
                <tr>
                  <th>Estudiante</th><th>Institución</th><th>Docente asesor</th>
                  <th>Horas</th><th>Nota promedio</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {practicas.map((p) => (
                  <tr key={p.id_asignacion}>
                    <td data-label="Estudiante">{p.estudiante}</td>
                    <td data-label="Institución">{p.institucion || "—"}</td>
                    <td data-label="Docente asesor">{p.docente_asesor || "—"}</td>
                    <td data-label="Horas">{formatearHoras(p.horas_cumplidas)} / {p.horas_requeridas}</td>
                    <td data-label="Nota promedio">{formatearNota(p.notaPromedio)}</td>
                    <td data-label="Acciones">
                      <button className="button-secondary" onClick={() => setPracticaAbierta(p)}>Revisar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {practicaAbierta && (
        <ModalResultadoPractica
          practica={practicaAbierta}
          onClose={() => setPracticaAbierta(null)}
          onDecidida={() => {
            setPracticaAbierta(null);
            recargar();
          }}
        />
      )}
    </div>
  );
}