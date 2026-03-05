import { Link } from 'react-router-dom';
import { Wand2, FileJson, BookOpen, Code2, ArrowRight } from 'lucide-react';
import './HomePage.css';

export function HomePage() {
    return (
        <div className="home-page">
            <div className="home-hero">
                <div className="home-logo">
                    <Code2 size={40} />
                </div>
                <h1>
                    Algo<strong>Trace</strong>
                </h1>
                <p className="home-subtitle">
                    Visualize algoritmos passo a passo. Escolha como deseja começar:
                </p>
            </div>

            <div className="home-cards">
                <Link to="/generate" className="home-card card-generate">
                    <div className="card-icon-wrapper card-icon-purple">
                        <Wand2 size={32} />
                    </div>
                    <h2>Gerar do Código</h2>
                    <p>
                        Cole seu código-fonte e deixe a IA gerar automaticamente o passo a passo do algoritmo.
                    </p>
                    <span className="card-cta">
                        Começar <ArrowRight size={16} />
                    </span>
                </Link>

                <Link to="/import" className="home-card card-import">
                    <div className="card-icon-wrapper card-icon-blue">
                        <FileJson size={32} />
                    </div>
                    <h2>Importar JSON</h2>
                    <p>
                        Cole ou carregue um arquivo JSON no formato AlgoTrace para visualizar o passo a passo.
                    </p>
                    <span className="card-cta">
                        Começar <ArrowRight size={16} />
                    </span>
                </Link>
            </div>

            <div className="home-library-link">
                <Link to="/library" className="btn btn-secondary">
                    <BookOpen size={16} />
                    Ver Biblioteca de Algoritmos Salvos
                </Link>
            </div>
        </div>
    );
}
