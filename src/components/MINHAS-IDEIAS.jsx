import { useEffect, useState } from 'react';

const API_URL = 'https://jsonplaceholder.typicode.com/todos?_limit=15';

export default function MinhasIdeias() {
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
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
    <div className="banco-ideias-page">
      <div className="banco-ideias-topbar">
        <span className="banco-ideias-topbar-title">Banco de Ideias</span>
        <span className="banco-ideias-topbar-meta">
          Projeto P1 — PTAC_4 • anotação de ideias de projetos
        </span>
      </div>

      <div className="banco-ideias-container">
        <aside className="banco-ideias-form-box">
          <h2 className="banco-ideias-section-title">Nova ideia</h2>

          <form onSubmit={handleSubmit} className="banco-ideias-form">
            <label htmlFor="tituloIdeia" className="banco-ideias-label">
              Título
            </label>

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

                <button
                  type="button"
                  onClick={resetarFormulario}
                  className="banco-ideias-button-secondary"
                >
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
            <p className="banco-ideias-vazio">
              Nenhuma ideia por aqui — que tal cadastrar a primeira?
            </p>
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
  );
}