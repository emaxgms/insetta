import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { createOrUpdateUserProfile } from '../utils/db';
import avatars from '../data/avatars.json';
import { Timestamp } from 'firebase/firestore';

export default function Auth() {
  const { user, signInWithGoogle, signInWithEmail, logout, loading, updateUserProfile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalLoginOpen, setisModalLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isModalNameOpen, setisModalNameOpen] = useState(false);
  const [isModalAvatarOpen, setIsModalAvatarOpen] = useState(false);
  const [avatarSelected, setAvatarSelected] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(Date.now());
  const wrapperRef = useRef(null);
  useEffect(() => {
    console.log('Auth component mounted');
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      console.log('Auth component unmounted');
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (user && !user.displayName) {
      setisModalNameOpen(true);
    }
    setIsExpanded(false);
    console.log('refresh user');
  }, [user]);

  useEffect(() => {
    console.log('expanded:' + isExpanded);
  }, [isExpanded]);

  const notExpanded = () => {
    setIsExpanded(false);
  };

  const handleSignInEmail = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithEmail(email, password);
      if (result.success) {
        setError('');
        setisModalLoginOpen(false);
      } else {
        setError('Errore: ' + result.message);
      }
    } catch (err) {
      setError('Credenziali non valide. Riprova.' + err);
    }
  };

  const handleLogOut = () => {
    console.log('Logout utente:');
    logout();
  }

  const handleSetUsername = async (firstLogin) => {
    if (username.trim() === '') {
      alert('Il nome utente non può essere vuoto.');
      return;
    }

    try {
      await updateUserProfile({displayName: username, lastModifiedDate: Timestamp.now()}); // Aggiorna il displayName
      await createOrUpdateUserProfile(user.uid, { username }); // Aggiorna il profilo nella collezione "users"
      setisModalNameOpen(false); // Chiudi il modal
      if(firstLogin) {
        setIsModalAvatarOpen(true);
        setAvatarSeed(Date.now());
      }
      console.log('Username impostato con successo!');
    } catch (error) {
      console.error('Errore durante l\'impostazione dell\'username:', error);
    }
  };

  const handleUpdateAvatar = async () => {
    if (!avatarSelected) {
      alert('Seleziona un avatar prima di confermare.');
      return;
    }

    try {
      await updateUserProfile({ photoURL: avatarSelected, lastModifiedDate: Timestamp.now() });
      await createOrUpdateUserProfile(user.uid, { photoURL: avatarSelected }); // Aggiorna il profilo nella collezione "users"
      setIsModalAvatarOpen(false);
      console.log('Avatar aggiornato con successo!');
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dell\'avatar:', error);
    }
  };

  if (loading) {
    return <div>Caricamento...</div>;
  }
  // {() => {setAvatarSeed(Date.now());setIsModalAvatarOpen(true);}}    Apertura modal cambio Avatar
  // {() => {setisModalNameOpen(true);}}                  Apertura modal cambio Nome Utente
  return (
    <>
      <div 
        className="auth-container"
        ref={wrapperRef}
      >
        {user ? (
          <div className="user-info" onClick={() => setIsExpanded(true)}>
            {user.photoURL ?
              <img src={user.photoURL} alt="Avatar" className="user-avatar" title='Avatar del profilo'/>
              : <div className="default-avatar" title='Avatar del profilo'></div>
            }  
            <span className="user-name" title='Aggiorna Username'>{user.displayName}</span>
            {isExpanded && <button onClick={handleLogOut} className="sign-out-btn" title='Esci dal tuo account'>
              ESCI
            </button>}
          </div>
        ) : (
          <div className="login-btns" >
            {!isExpanded ? (
              <button onClick={() => setIsExpanded(true)} className="sign-in-btn" title='Accedi o Registrati'>ACCEDI</button>
            ) : (
              <div className="login-options">
                <button onClick={() => {signInWithGoogle();setIsExpanded(false);}} className="google-sign-in-btn" title='Registratio o Accedi con Google'>Google</button>
                <button
                  onClick={() => {
                    setisModalLoginOpen(true);
                    setIsExpanded(false);
                  }}
                  className="google-sign-in-btn"
                  title='Registrati o Accedi con Email'
                >
                  Email
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Modal isOpen={isModalLoginOpen} onNotExpanded={notExpanded} onClose={() => {setisModalLoginOpen(false);}}>
        <h2>Accedi con Email</h2>
        <form onSubmit={handleSignInEmail} className="form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            title='Email del tuo account'
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            title='Password del tuo account'
          />
          <button type="submit" className='profile-button'  title='Accedi o Registrati con Email'>
            Accedi
          </button>
          {error && <p className="error-message" title='Errore di Registrazione o Login'>{error}</p>}
        </form>
      </Modal>
      <Modal isOpen={isModalNameOpen} onClose={() => {setisModalNameOpen(false);}}>
        <h2>Imposta il tuo Nome Utente</h2>
        <div className="form">
          <input
            type="text"
            placeholder="Inserisci il tuo Nome Utente"
            value={username}
            className='username-input'
            onChange={(e) => setUsername(e.target.value)}
            title='Imposta Nome Utente del tuo Account'
          />
          <button className='profile-button' onClick={() => {handleSetUsername(true);}} title='Salva Nome Utente'>Salva</button>
        </div>
      </Modal>
      <Modal isOpen={isModalAvatarOpen} onClose={() => {setIsModalAvatarOpen(false);}}>
        <h2>Scegli il tuo Avatar</h2>
        <div className="form">
          <div className="avatar-grid">
          {avatars.map((avatar) => {
            const fullUrl = avatar.url + avatarSeed + avatar.id;
            return (
              <div
                key={avatar.id}
                title={avatar.name}
                className={`avatar-option ${avatarSelected === fullUrl ? 'selected' : ''}`}
                onClick={() => setAvatarSelected(fullUrl)}
              >
                <img src={fullUrl} alt={avatar.id} />
              </div>
            );
          })}
          </div>
          <button onClick={handleUpdateAvatar} className='profile-button' disabled={!avatarSelected}>
            Conferma
          </button>
        </div>
      </Modal>
    </>
  );
}
