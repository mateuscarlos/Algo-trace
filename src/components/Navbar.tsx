import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Upload, Code2, Wand2, Home, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

export function Navbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <Code2 size={24} />
        <span className="brand-text">Algo<strong>Trace</strong></span>
      </Link>
      <div className="nav-links">
        <Link
          to="/"
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          <Home size={16} />
          Início
        </Link>
        <Link
          to="/generate"
          className={`nav-link ${location.pathname === '/generate' ? 'active' : ''}`}
        >
          <Wand2 size={16} />
          Gerar
        </Link>
        <Link
          to="/import"
          className={`nav-link ${location.pathname === '/import' ? 'active' : ''}`}
        >
          <Upload size={16} />
          Importar
        </Link>
        <Link
          to="/library"
          className={`nav-link ${location.pathname === '/library' ? 'active' : ''}`}
        >
          <BookOpen size={16} />
          Biblioteca
        </Link>
      </div>
      {user && (
        <div className="nav-user">
          {user.photoURL && (
            <img src={user.photoURL} alt="" className="nav-avatar" referrerPolicy="no-referrer" />
          )}
          <span className="nav-username">{user.displayName?.split(' ')[0]}</span>
          <button className="nav-logout" onClick={signOut} title="Sair">
            <LogOut size={16} />
          </button>
        </div>
      )}
    </nav>
  );
}


