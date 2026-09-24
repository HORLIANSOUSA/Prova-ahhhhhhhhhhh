import React { useEffect, useState } from 'react';

const API_URL = 'https://jsonplaceholder.typicode.com/todos?_limit=15';

export default function BancoIdeias() {
  const [ideias, setIdeias] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const carregarIdeias = async () => {
      setCarregando(true);
      setErro('');

      try {
        const resposta = await fetch(API_URL, { signal: controller.signal });

        if (!resposta.ok) {
          throw new Error('Erro ao carregar ideias');
        }

        const dados = await resposta.json();
        setIdeias(dados);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setErro('Não foi possível conectar à API');
        }
      } finally {
        setCarregando(false);
      }
    };

    carregarIdeias();

    return () => controller.abort();
  }, []);

  const resetarFormulario = () => {
    setTitulo('');
    setEditandoId(null);
  };

  const validarTitulo = (texto) => texto.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const tituloLimpo = validarTitulo(titulo);
    if (!tituloLimpo) return;

    try {
      if (editandoId !== null) {
        const ideiaOriginal = ideias.find((item) => item.id === editandoId);
        if (!ideiaOriginal) {
          resetarFormulario();
          return;
        }

        const resposta = await fetch(`https://jsonplaceholder.typicode.com/todos/${editandoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: ideiaOriginal.userId,
            id: ideiaOriginal.id,
            title: tituloLimpo,
            completed: ideiaOriginal.completed,
          }),
        });

        if (!resposta.ok) {
          throw new Error('Falha ao atualizar a ideia');
        }

        setIdeias((prev) =>
          prev.map((item) =>
            item.id === editandoId ? { ...item, title: tituloLimpo } : item
          )
        );
      } else {
        const novaIdeia = {
          userId: 1,
          title: tituloLimpo,
          completed: false,
        };

        const resposta = await fetch('https://jsonplaceholder.typicode.com/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(novaIdeia),
        });

        if (!resposta.ok) {
          throw new Error('Falha ao criar ideia');
        }

        const ideiaCriada = await resposta.json();

        setIdeias((prev) => [
          {
            ...novaIdeia,
            id: ideiaCriada.id ?? Date.now(),
          },
          ...prev,
        ]);
      }

      resetarFormulario();
    } catch (error) {
      console.error(error);
      setErro('Não foi possível salvar a ideia no momento.');
    }
  };

  const handleExcluir = async (id) => {
    const listaAnterior = ideias;

    setIdeias((prev) => prev.filter((item) => item.id !== id));

    try {
      const resposta = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
        method: 'DELETE',
      });

      if (!resposta.ok) {
        throw new Error('Falha ao excluir ideia');
      }
    } catch (error) {
      console.error(error);
      setIdeias(listaAnterior);
      setErro('Não foi possível remover a ideia.');
    }
  };

  const handleToggleStatus = async (id) => {
    const ideiaAtual = ideias.find((item) => item.id === id);
    if (!ideiaAtual) return;

    const ideiaAtualizada = {
      ...ideiaAtual,
      completed: !ideiaAtual.completed,
    };

    setIdeias((prev) =>
      prev.map((item) => (item.id === id ? ideiaAtualizada : item))
    );

    try {
      const resposta = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ideiaAtualizada),
      });

      if (!resposta.ok) {
        throw new Error('Falha ao atualizar status');
      }
    } catch (error) {
      console.error(error);
      setIdeias((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, completed: ideiaAtual.completed } : item
        )
      );
      setErro('Não foi possível alterar o status da ideia.');
    }
  };

  const iniciarEdicao = (ideia) => {
    setTitulo(ideia.title);
    setEditandoId(ideia.id);
  };

  const contarIdeias = ideias.length;

  return (
    <>
      <style>{`
        .banco-ideias-page {
          background: #eef1f4;
          min-height: 100vh;
          font-family: Arial, sans-serif;
          color: #1f2937;
          padding: 18px 16px 30px;
        }

        .banco-ideias-topbar {
          max-width: 1180px;
          margin: 0 auto 18px;
          background: #f7f7f7;
          border-bottom: 1px solid #d4d9df;
          padding: 0 0 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .banco-ideias-topbar-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .banco-ideias-topbar-meta {
          font-size: 0.9rem;
          color: #4b5563;
        }

        .banco-ideias-container {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        .banco-ideias-form-box,
        .banco-ideias-lista-box {
          background: #f6f7f9;
          border: 1px solid #d5dbe2;
          border-radius: 12px;
          box-sizing: border-box;
        }

        .banco-ideias-form-box {
          padding: 20px 18px 18px;
        }

        .banco-ideias-lista-box {
          padding: 18px 14px 16px;
          min-height: 220px;
        }

        .banco-ideias-section-title {
          margin: 0 0 14px;
          font-size: 1.2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .banco-ideias-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .banco-ideias-label {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.95rem;
        }

        .banco-ideias-input {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.98rem;
          background: #fff;
          color: #111827;
          outline: none;
        }

        .banco-ideias-button-primary,
        .banco-ideias-button-secondary,
        .banco-ideias-button-danger {
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .banco-ideias-button-primary {
          background: #1f2d3d;
          color: #fff;
          border: none;
          padding: 11px 14px;
          font-weight: 700;
          font-size: 0.96rem;
        }

        .banco-ideias-button-secondary {
          background: #e5e7eb;
          color: #1f2937;
          border: 1px solid #d1d5db;
        }

        .banco-ideias-button-danger {
          background: #ef4444;
          color: #fff;
          border: none;
        }

        .banco-ideias-actions-inline {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .banco-ideias-lista-header {
          margin-bottom: 10px;
        }

        .banco-ideias-cards-wrap {
          display: grid;
          gap: 14px;
        }

        .banco-ideias-cartao {
          background: #f3f4f6;
          border: 1px solid #d6d9dd;
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .banco-ideias-cartao.executada {
          background: #eefbf3;
          border-color: #b7e5c4;
        }

        .banco-ideias-cartao-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .banco-ideias-titulo-cartao {
          margin: 0;
          font-weight: 700;
          font-size: 1.08rem;
          color: #111827;
          word-break: break-word;
        }

        .banco-ideias-titulo-cartao.riscado {
          text-decoration: line-through;
          color: #6b7280;
        }

        .banco-ideias-status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: lowercase;
          white-space: nowrap;
        }

        .banco-ideias-status-badge.pendente {
          background: #fef3c7;
          color: #92400e;
        }

        .banco-ideias-status-badge.executada {
          background: #dcfce7;
          color: #166534;
        }

        .banco-ideias-meta-linha {
          display: flex;
          justify-content: space-between;
          color: #6b7280;
          font-size: 0.78rem;
          font-weight: 600;
        }

        .banco-ideias-meta-text {
          text-transform: lowercase;
        }

        .banco-ideias-acoes {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .banco-ideias-mensagem,
        .banco-ideias-vazio {
          margin: 0;
          color: #4b5563;
          font-size: 1rem;
        }

        .banco-ideias-erro {
          margin: 0;
          color: #b91c1c;
          font-weight: 700;
        }
      `}</style>

      <div className="banco-ideias-page">
        <div className="banco-ideias-topbar">
          <span className="banco-ideias-topbar-title">Banco de Ideias</span>
          <span className="banco-ideias-topbar-meta">Projeto P1 — PTAC_4 • anotação de ideias de projetos</span>
        </div>

        <div className="banco-ideias-container">
          <aside className="banco-ideias-form-box">
            <h2 className="banco-ideias-section-title">Nova ideia</h2>

            <form onSubmit={handleSubmit} className="banco-ideias-form">
              <label htmlFor="tituloIdeia" className="banco-ideias-label">Título</label>
              <input
                id="tituloIdeia"
                type="text"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                placeholder="App de receitas da vó"
                className="banco-ideias-input"
              />

              {editandoId !== null ? (
                <div className="banco-ideias-actions-inline">
                  <button type="submit" className="banco-ideias-button-primary">
                    Salvar
                  </button>
                  <button type="button" onClick={resetarFormulario} className="banco-ideias-button-secondary">
                    Cancelar
                  </button>
                </div>
              ) : (
                <button type="submit" className="banco-ideias-button-primary">
                  Adicionar ideia
                </button>
              )}
            </form>
          </aside>

          <section className="banco-ideias-lista-box">
            <div className="banco-ideias-lista-header">
              <h2 className="banco-ideias-section-title">Minhas ideias ({contarIdeias})</h2>
            </div>

            {carregando && <p className="banco-ideias-mensagem">Carregando ideias...</p>}

            {!carregando && erro && <p className="banco-ideias-erro">{erro}</p>}

            {!carregando && !erro && ideias.length === 0 && (
              <p className="banco-ideias-vazio">Nenhuma ideia por aqui — que tal cadastrar a primeira?</p>
            )}

            {!carregando && !erro && ideias.length > 0 && (
              <div className="banco-ideias-cards-wrap">
                {ideias.map((ideia) => (
                  <article
                    key={ideia.id}
                    className={`banco-ideias-cartao ${ideia.completed ? 'executada' : ''}`}
                  >
                    <div className="banco-ideias-cartao-top">
                      <p
                        className={`banco-ideias-titulo-cartao ${ideia.completed ? 'riscado' : ''}`}
                      >
                        {ideia.title}
                      </p>

                      <span
                        className={`banco-ideias-status-badge ${ideia.completed ? 'executada' : 'pendente'}`}
                      >
                        {ideia.completed ? 'executada' : 'pendente'}
                      </span>
                    </div>

                    <div className="banco-ideias-meta-linha">
                      <span className="banco-ideias-meta-text">id {ideia.id}</span>
                      <span className="banco-ideias-meta-text">user {ideia.userId}</span>
                    </div>

                    <div className="banco-ideias-acoes">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(ideia.id)}
                        className="banco-ideias-button-secondary"
                      >
                        {ideia.completed ? 'Reabrir' : 'Marcar executada'}
                      </button>

                      <button
                        type="button"
                        onClick={() => iniciarEdicao(ideia)}
                        className="banco-ideias-button-secondary"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExcluir(ideia.id)}
                        className="banco-ideias-button-danger"
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
